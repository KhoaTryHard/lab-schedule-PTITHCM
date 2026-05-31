const pool = require('../../config/database');
const { ROLES } = require('../../config/roles');
const { recordAuditLog } = require('../audit/audit.service');

const FEEDBACK_TYPES = new Set(['schedule_error', 'room_error', 'other']);
const FEEDBACK_STATUSES = new Set(['submitted', 'under_review', 'responded', 'closed']);
const RECIPIENT_STATUSES = new Set(['unread', 'read', 'acknowledged']);

const FEEDBACK_SELECT = `
  feedback.id,
  feedback.student_user_id,
  student.full_name AS student_name,
  student.email AS student_email,
  feedback.lab_schedule_entry_id,
  feedback.feedback_type,
  feedback.content,
  feedback.contact_info,
  feedback.feedback_status,
  feedback.handled_by_user_id,
  handler.full_name AS handled_by_name,
  feedback.handled_at,
  feedback.response_text,
  feedback.created_at,
  feedback.updated_at,
  schedule.entry_status AS schedule_status,
  schedule.day_of_week,
  schedule.start_date,
  schedule.end_date,
  room.room_code,
  time_slot.slot_label AS time_slot,
  lecturer.full_name AS lecturer_name,
  practice_team.team_no,
  course_section.group_no,
  course.course_code,
  course.course_name
`;

const NOTIFICATION_SELECT = `
  notification.id,
  notification.notification_type,
  notification.title,
  notification.message_body,
  notification.related_entity_type,
  notification.related_entity_id,
  notification.created_by_user_id,
  creator.full_name AS created_by_name,
  notification.created_at,
  recipient.user_id,
  recipient.recipient_status,
  recipient.read_at,
  recipient.acknowledged_at
`;

function toPositiveInt(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
}

function truncate(value, maxLength) {
  if (!value) {
    return value;
  }

  return String(value).slice(0, maxLength);
}

function formatFeedback(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    student_user_id: row.student_user_id,
    student_name: row.student_name,
    student_email: row.student_email,
    lab_schedule_entry_id: row.lab_schedule_entry_id,
    feedback_type: row.feedback_type,
    content: row.content,
    contact_info: row.contact_info,
    feedback_status: row.feedback_status,
    handled_by_user_id: row.handled_by_user_id,
    handled_by_name: row.handled_by_name,
    handled_at: row.handled_at,
    response_text: row.response_text,
    created_at: row.created_at,
    updated_at: row.updated_at,
    schedule: {
      id: row.lab_schedule_entry_id,
      entry_status: row.schedule_status,
      day_of_week: row.day_of_week,
      time_slot: row.time_slot,
      start_date: row.start_date,
      end_date: row.end_date,
      room_code: row.room_code,
      lecturer_name: row.lecturer_name,
      team_no: row.team_no,
      group_no: row.group_no,
      course_code: row.course_code,
      course_name: row.course_name
    }
  };
}

function formatNotification(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    notification_type: row.notification_type,
    title: row.title,
    message_body: row.message_body,
    related_entity_type: row.related_entity_type,
    related_entity_id: row.related_entity_id,
    created_by_user_id: row.created_by_user_id,
    created_by_name: row.created_by_name,
    created_at: row.created_at,
    user_id: row.user_id,
    recipient_status: row.recipient_status,
    read_at: row.read_at,
    acknowledged_at: row.acknowledged_at
  };
}

async function getFeedbackRowById(id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT ${FEEDBACK_SELECT}
     FROM student_feedback feedback
     JOIN users student ON student.id = feedback.student_user_id
     JOIN lab_schedule_entries schedule ON schedule.id = feedback.lab_schedule_entry_id
     JOIN rooms room ON room.id = schedule.room_id
     JOIN time_slots time_slot ON time_slot.id = schedule.time_slot_id
     JOIN users lecturer ON lecturer.id = schedule.lecturer_user_id
     JOIN practice_teams practice_team ON practice_team.id = schedule.practice_team_id
     JOIN course_sections course_section ON course_section.id = practice_team.course_section_id
     JOIN courses course ON course.id = course_section.course_id
     LEFT JOIN users handler ON handler.id = feedback.handled_by_user_id
     WHERE feedback.id = ?`,
    [id]
  );

  return rows[0] || null;
}

async function getNotificationRowByIdForUser(notificationId, userId, connection = pool) {
  const [rows] = await connection.query(
    `SELECT ${NOTIFICATION_SELECT}
     FROM notification_recipients recipient
     JOIN notifications notification ON notification.id = recipient.notification_id
     LEFT JOIN users creator ON creator.id = notification.created_by_user_id
     WHERE recipient.notification_id = ?
       AND recipient.user_id = ?`,
    [notificationId, userId]
  );

  return rows[0] || null;
}

async function getActiveUsersByRoles(roleCodes, connection = pool) {
  if (!roleCodes || roleCodes.length === 0) {
    return [];
  }

  const placeholders = roleCodes.map(() => '?').join(', ');
  const [rows] = await connection.query(
    `SELECT id
     FROM users
     WHERE role_code IN (${placeholders})
       AND account_status = 'active'`,
    roleCodes
  );

  return rows.map((row) => row.id);
}

async function createNotification(connection, input) {
  const recipientUserIds = [...new Set((input.recipient_user_ids || []).filter(Boolean))];

  if (recipientUserIds.length === 0) {
    return null;
  }

  const [result] = await connection.query(
    `INSERT INTO notifications (
       notification_type,
       title,
       message_body,
       related_entity_type,
       related_entity_id,
       created_by_user_id
     ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.notification_type,
      truncate(input.title, 200),
      input.message_body,
      input.related_entity_type || null,
      input.related_entity_id || null,
      input.created_by_user_id || null
    ]
  );

  const values = recipientUserIds.map((userId) => [result.insertId, userId]);
  await connection.query(
    'INSERT INTO notification_recipients (notification_id, user_id) VALUES ?',
    [values]
  );

  return result.insertId;
}

async function getStudentPublishedSchedule(entryId, studentUserId, connection = pool) {
  const [rows] = await connection.query(
    `SELECT entry.id, entry.entry_status, entry.practice_team_id
     FROM lab_schedule_entries entry
     JOIN practice_team_members member ON member.practice_team_id = entry.practice_team_id
     WHERE entry.id = ?
       AND member.student_user_id = ?
     LIMIT 1`,
    [entryId, studentUserId]
  );

  return rows[0] || null;
}

async function listStudentFeedback(filters, user) {
  const conditions = [];
  const params = [];

  if (user.role_code === ROLES.STUDENT) {
    conditions.push('feedback.student_user_id = ?');
    params.push(user.id);
  }

  if (filters.status) {
    conditions.push('feedback.feedback_status = ?');
    params.push(filters.status);
  }

  if (filters.feedback_type) {
    conditions.push('feedback.feedback_type = ?');
    params.push(filters.feedback_type);
  }

  if (filters.lab_schedule_entry_id) {
    conditions.push('feedback.lab_schedule_entry_id = ?');
    params.push(filters.lab_schedule_entry_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT ${FEEDBACK_SELECT}
     FROM student_feedback feedback
     JOIN users student ON student.id = feedback.student_user_id
     JOIN lab_schedule_entries schedule ON schedule.id = feedback.lab_schedule_entry_id
     JOIN rooms room ON room.id = schedule.room_id
     JOIN time_slots time_slot ON time_slot.id = schedule.time_slot_id
     JOIN users lecturer ON lecturer.id = schedule.lecturer_user_id
     JOIN practice_teams practice_team ON practice_team.id = schedule.practice_team_id
     JOIN course_sections course_section ON course_section.id = practice_team.course_section_id
     JOIN courses course ON course.id = course_section.course_id
     LEFT JOIN users handler ON handler.id = feedback.handled_by_user_id
     ${whereClause}
     ORDER BY feedback.created_at DESC, feedback.id DESC`,
    params
  );

  return rows.map(formatFeedback);
}

async function createStudentFeedback(input, user) {
  const entryId = toPositiveInt(input.lab_schedule_entry_id);
  const feedbackType = String(input.feedback_type || 'schedule_error').trim();
  const content = normalizeText(input.content);
  const contactInfo = normalizeText(input.contact_info);

  if (!entryId) {
    return { ok: false, statusCode: 400, message: 'lab_schedule_entry_id is required' };
  }

  if (!FEEDBACK_TYPES.has(feedbackType)) {
    return { ok: false, statusCode: 400, message: 'feedback_type is not supported' };
  }

  if (!content) {
    return { ok: false, statusCode: 400, message: 'content is required' };
  }

  const schedule = await getStudentPublishedSchedule(entryId, user.id);

  if (!schedule) {
    return { ok: false, statusCode: 403, message: 'Student cannot submit feedback for this schedule entry' };
  }

  if (schedule.entry_status !== 'published') {
    return { ok: false, statusCode: 409, message: 'Feedback can only be submitted for published schedules' };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO student_feedback (
         student_user_id,
         lab_schedule_entry_id,
         feedback_type,
         content,
         contact_info,
         feedback_status
       ) VALUES (?, ?, ?, ?, ?, 'submitted')`,
      [user.id, entryId, feedbackType, content, contactInfo]
    );

    const reviewerIds = await getActiveUsersByRoles([ROLES.ADMIN, ROLES.ACADEMIC_OFFICER], connection);
    await createNotification(connection, {
      notification_type: 'student_feedback_submitted',
      title: `New student feedback #${result.insertId}`,
      message_body: truncate(content, 500),
      related_entity_type: 'student_feedback',
      related_entity_id: result.insertId,
      created_by_user_id: user.id,
      recipient_user_ids: reviewerIds
    });

    await recordAuditLog(connection, {
      entity_type: 'student_feedback',
      entity_id: result.insertId,
      action_type: 'create',
      new_status: 'submitted',
      action_by_user_id: user.id,
      action_notes: {
        feedback_type: feedbackType,
        lab_schedule_entry_id: entryId
      }
    });

    await connection.commit();

    const created = await getFeedbackRowById(result.insertId);
    return { ok: true, feedback: formatFeedback(created) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateStudentFeedback(id, input, user) {
  const current = await getFeedbackRowById(id);

  if (!current) {
    return { ok: false, statusCode: 404, message: 'Student feedback not found' };
  }

  const nextStatus = String(input.feedback_status || input.status || '').trim();
  const responseText = normalizeText(input.response_text);

  if (!FEEDBACK_STATUSES.has(nextStatus)) {
    return { ok: false, statusCode: 400, message: 'feedback_status is not supported' };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE student_feedback
       SET feedback_status = ?,
           handled_by_user_id = ?,
           handled_at = CURRENT_TIMESTAMP,
           response_text = COALESCE(?, response_text),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextStatus, user.id, responseText, id]
    );

    if (nextStatus === 'responded' || nextStatus === 'closed') {
      await createNotification(connection, {
        notification_type: 'student_feedback_responded',
        title: `Feedback #${id} has been updated`,
        message_body: responseText || 'Your feedback status has been updated.',
        related_entity_type: 'student_feedback',
        related_entity_id: id,
        created_by_user_id: user.id,
        recipient_user_ids: [current.student_user_id]
      });
    }

    await recordAuditLog(connection, {
      entity_type: 'student_feedback',
      entity_id: id,
      action_type: 'update',
      old_status: current.feedback_status,
      new_status: nextStatus,
      action_by_user_id: user.id,
      action_notes: {
        response_text: responseText
      }
    });

    await connection.commit();

    const updated = await getFeedbackRowById(id);
    return { ok: true, feedback: formatFeedback(updated) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listNotifications(filters, user) {
  const conditions = ['recipient.user_id = ?'];
  const params = [user.id];

  if (filters.status) {
    conditions.push('recipient.recipient_status = ?');
    params.push(filters.status);
  }

  if (filters.notification_type) {
    conditions.push('notification.notification_type = ?');
    params.push(filters.notification_type);
  }

  const [rows] = await pool.query(
    `SELECT ${NOTIFICATION_SELECT}
     FROM notification_recipients recipient
     JOIN notifications notification ON notification.id = recipient.notification_id
     LEFT JOIN users creator ON creator.id = notification.created_by_user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY notification.created_at DESC, notification.id DESC`,
    params
  );

  return rows.map(formatNotification);
}

async function markNotificationRead(notificationId, user) {
  const current = await getNotificationRowByIdForUser(notificationId, user.id);

  if (!current) {
    return { ok: false, statusCode: 404, message: 'Notification not found for current user' };
  }

  if (current.recipient_status === 'unread') {
    await pool.query(
      `UPDATE notification_recipients
       SET recipient_status = 'read',
           read_at = CURRENT_TIMESTAMP
       WHERE notification_id = ?
         AND user_id = ?`,
      [notificationId, user.id]
    );

    await recordAuditLog({
      entity_type: 'notifications',
      entity_id: notificationId,
      action_type: 'read',
      old_status: current.recipient_status,
      new_status: 'read',
      action_by_user_id: user.id
    });
  }

  const updated = await getNotificationRowByIdForUser(notificationId, user.id);
  return { ok: true, notification: formatNotification(updated) };
}

async function acknowledgeNotification(notificationId, user) {
  const current = await getNotificationRowByIdForUser(notificationId, user.id);

  if (!current) {
    return { ok: false, statusCode: 404, message: 'Notification not found for current user' };
  }

  await pool.query(
    `UPDATE notification_recipients
     SET recipient_status = 'acknowledged',
         read_at = COALESCE(read_at, CURRENT_TIMESTAMP),
         acknowledged_at = CURRENT_TIMESTAMP
     WHERE notification_id = ?
       AND user_id = ?`,
    [notificationId, user.id]
  );

  await recordAuditLog({
    entity_type: 'notifications',
    entity_id: notificationId,
    action_type: 'acknowledge',
    old_status: current.recipient_status,
    new_status: 'acknowledged',
    action_by_user_id: user.id
  });

  const updated = await getNotificationRowByIdForUser(notificationId, user.id);
  return { ok: true, notification: formatNotification(updated) };
}

async function markAllNotificationsRead(user) {
  const [result] = await pool.query(
    `UPDATE notification_recipients
     SET recipient_status = 'read',
         read_at = CURRENT_TIMESTAMP
     WHERE user_id = ?
       AND recipient_status = 'unread'`,
    [user.id]
  );

  if (result.affectedRows > 0) {
    await recordAuditLog({
      entity_type: 'notification_recipients',
      entity_id: user.id,
      action_type: 'read_all',
      old_status: 'unread',
      new_status: 'read',
      action_by_user_id: user.id,
      action_notes: {
        updated_count: result.affectedRows
      }
    });
  }

  return { updated_count: result.affectedRows };
}

module.exports = {
  listStudentFeedback,
  createStudentFeedback,
  updateStudentFeedback,
  listNotifications,
  markNotificationRead,
  acknowledgeNotification,
  markAllNotificationsRead
};
