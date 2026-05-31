const pool = require('../../config/database');
const { ROLES } = require('../../config/roles');

const CHANGE_TYPES = new Set(['reschedule', 'makeup', 'cancel']);
const REVIEW_STATUSES = new Set(['approved', 'rejected']);
const ACTIVE_REQUEST_STATUSES = ['submitted', 'approved'];
const CHANGEABLE_ENTRY_STATUSES = new Set(['approved', 'published']);

const CHANGE_REQUEST_SELECT = `
  cr.id,
  cr.lab_schedule_entry_id,
  cr.change_type,
  cr.proposed_day_of_week,
  cr.proposed_time_slot_id,
  cr.proposed_room_id,
  cr.proposed_start_date,
  cr.proposed_end_date,
  cr.reason_text,
  cr.request_status,
  cr.requested_by_user_id,
  cr.reviewed_by_user_id,
  cr.implemented_by_user_id,
  cr.reviewed_at,
  cr.implemented_at,
  cr.review_notes,
  cr.created_at,
  cr.updated_at,
  requester.full_name AS requested_by_name,
  reviewer.full_name AS reviewed_by_name,
  implementer.full_name AS implemented_by_name,
  proposed_room.room_code AS proposed_room_code,
  proposed_slot.slot_label AS proposed_time_slot,
  entry.id AS schedule_id,
  entry.lab_schedule_request_id AS schedule_request_id,
  entry.available_slot_id AS schedule_available_slot_id,
  entry.practice_team_id AS schedule_practice_team_id,
  entry.room_id AS original_room_id,
  entry.lecturer_user_id AS schedule_lecturer_user_id,
  entry.day_of_week AS original_day_of_week,
  entry.time_slot_id AS original_time_slot_id,
  entry.start_date AS original_start_date,
  entry.end_date AS original_end_date,
  entry.entry_status AS original_entry_status,
  entry.notes AS original_notes,
  original_room.room_code AS original_room_code,
  original_slot.slot_label AS original_time_slot,
  lecturer.full_name AS lecturer_name,
  pt.team_no,
  pt.planned_size,
  cs.group_no,
  c.course_code,
  c.course_name
`;

function toPositiveInt(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeOptionalText(value) {
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

function isValidDate(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isEndDateBeforeStartDate(startDate, endDate) {
  return new Date(endDate) < new Date(startDate);
}

function formatSchedule(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.schedule_id,
    lab_schedule_request_id: row.schedule_request_id,
    available_slot_id: row.schedule_available_slot_id,
    practice_team_id: row.schedule_practice_team_id,
    room_id: row.original_room_id,
    room_code: row.original_room_code,
    lecturer_user_id: row.schedule_lecturer_user_id,
    lecturer_name: row.lecturer_name,
    day_of_week: row.original_day_of_week,
    time_slot_id: row.original_time_slot_id,
    time_slot: row.original_time_slot,
    start_date: row.original_start_date,
    end_date: row.original_end_date,
    entry_status: row.original_entry_status,
    notes: row.original_notes,
    team_no: row.team_no,
    planned_size: row.planned_size,
    group_no: row.group_no,
    course_code: row.course_code,
    course_name: row.course_name
  };
}

function formatChangeRequest(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    lab_schedule_entry_id: row.lab_schedule_entry_id,
    change_type: row.change_type,
    proposed_day_of_week: row.proposed_day_of_week,
    proposed_time_slot_id: row.proposed_time_slot_id,
    proposed_time_slot: row.proposed_time_slot,
    proposed_room_id: row.proposed_room_id,
    proposed_room_code: row.proposed_room_code,
    proposed_start_date: row.proposed_start_date,
    proposed_end_date: row.proposed_end_date,
    reason_text: row.reason_text,
    request_status: row.request_status,
    requested_by_user_id: row.requested_by_user_id,
    requested_by_name: row.requested_by_name,
    reviewed_by_user_id: row.reviewed_by_user_id,
    reviewed_by_name: row.reviewed_by_name,
    implemented_by_user_id: row.implemented_by_user_id,
    implemented_by_name: row.implemented_by_name,
    reviewed_at: row.reviewed_at,
    implemented_at: row.implemented_at,
    review_notes: row.review_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    schedule: formatSchedule(row)
  };
}

function applyRoleVisibility(conditions, params, user) {
  if (user.role_code === ROLES.LECTURER) {
    conditions.push('(cr.requested_by_user_id = ? OR entry.lecturer_user_id = ?)');
    params.push(user.id, user.id);
  }
}

async function getChangeRequestRowById(id, connection = pool, options = {}) {
  const [rows] = await connection.query(
    `SELECT ${CHANGE_REQUEST_SELECT}
     FROM lab_schedule_change_requests cr
     JOIN lab_schedule_entries entry ON entry.id = cr.lab_schedule_entry_id
     JOIN rooms original_room ON original_room.id = entry.room_id
     JOIN time_slots original_slot ON original_slot.id = entry.time_slot_id
     JOIN users lecturer ON lecturer.id = entry.lecturer_user_id
     JOIN practice_teams pt ON pt.id = entry.practice_team_id
     JOIN course_sections cs ON cs.id = pt.course_section_id
     JOIN courses c ON c.id = cs.course_id
     JOIN users requester ON requester.id = cr.requested_by_user_id
     LEFT JOIN users reviewer ON reviewer.id = cr.reviewed_by_user_id
     LEFT JOIN users implementer ON implementer.id = cr.implemented_by_user_id
     LEFT JOIN rooms proposed_room ON proposed_room.id = cr.proposed_room_id
     LEFT JOIN time_slots proposed_slot ON proposed_slot.id = cr.proposed_time_slot_id
     WHERE cr.id = ?
     ${options.forUpdate ? 'FOR UPDATE' : ''}`,
    [id]
  );

  return rows[0] || null;
}

async function getScheduleEntryById(id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT
       entry.*,
       r.room_code,
       ts.slot_label AS time_slot,
       u.full_name AS lecturer_name,
       pt.team_no,
       pt.planned_size,
       cs.group_no,
       c.course_code,
       c.course_name
     FROM lab_schedule_entries entry
     JOIN rooms r ON r.id = entry.room_id
     JOIN time_slots ts ON ts.id = entry.time_slot_id
     JOIN users u ON u.id = entry.lecturer_user_id
     JOIN practice_teams pt ON pt.id = entry.practice_team_id
     JOIN course_sections cs ON cs.id = pt.course_section_id
     JOIN courses c ON c.id = cs.course_id
     WHERE entry.id = ?`,
    [id]
  );

  return rows[0] || null;
}

async function existsById(tableName, id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT id FROM ${tableName} WHERE id = ? LIMIT 1`,
    [id]
  );

  return Boolean(rows[0]);
}

function normalizeCreateInput(input) {
  const changeType = String(input.change_type || '').trim();

  if (!CHANGE_TYPES.has(changeType)) {
    return { ok: false, statusCode: 400, message: 'change_type must be reschedule, makeup, or cancel' };
  }

  const reasonText = normalizeOptionalText(input.reason_text);

  if (!reasonText) {
    return { ok: false, statusCode: 400, message: 'reason_text is required' };
  }

  const normalized = {
    lab_schedule_entry_id: toPositiveInt(input.lab_schedule_entry_id),
    change_type: changeType,
    reason_text: reasonText,
    proposed_day_of_week: null,
    proposed_time_slot_id: null,
    proposed_room_id: null,
    proposed_start_date: null,
    proposed_end_date: null
  };

  if (!normalized.lab_schedule_entry_id) {
    return { ok: false, statusCode: 400, message: 'lab_schedule_entry_id must be a positive integer' };
  }

  if (changeType === 'cancel') {
    return { ok: true, data: normalized };
  }

  normalized.proposed_day_of_week = toPositiveInt(input.proposed_day_of_week);
  normalized.proposed_time_slot_id = toPositiveInt(input.proposed_time_slot_id);
  normalized.proposed_room_id = toPositiveInt(input.proposed_room_id);
  normalized.proposed_start_date = normalizeOptionalText(input.proposed_start_date);
  normalized.proposed_end_date = normalizeOptionalText(input.proposed_end_date);

  if (!normalized.proposed_day_of_week || normalized.proposed_day_of_week > 7) {
    return { ok: false, statusCode: 400, message: 'proposed_day_of_week must be between 1 and 7' };
  }

  if (!normalized.proposed_time_slot_id) {
    return { ok: false, statusCode: 400, message: 'proposed_time_slot_id is required for reschedule/makeup' };
  }

  if (!isValidDate(normalized.proposed_start_date) || !isValidDate(normalized.proposed_end_date)) {
    return { ok: false, statusCode: 400, message: 'proposed_start_date and proposed_end_date must be valid dates' };
  }

  if (isEndDateBeforeStartDate(normalized.proposed_start_date, normalized.proposed_end_date)) {
    return { ok: false, statusCode: 400, message: 'proposed_end_date must be greater than or equal to proposed_start_date' };
  }

  return { ok: true, data: normalized };
}

async function listChangeRequests(filters, user) {
  const conditions = [];
  const params = [];

  applyRoleVisibility(conditions, params, user);

  if (filters.status) {
    conditions.push('cr.request_status = ?');
    params.push(filters.status);
  }

  if (filters.change_type) {
    conditions.push('cr.change_type = ?');
    params.push(filters.change_type);
  }

  if (filters.lab_schedule_entry_id) {
    conditions.push('cr.lab_schedule_entry_id = ?');
    params.push(filters.lab_schedule_entry_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT ${CHANGE_REQUEST_SELECT}
     FROM lab_schedule_change_requests cr
     JOIN lab_schedule_entries entry ON entry.id = cr.lab_schedule_entry_id
     JOIN rooms original_room ON original_room.id = entry.room_id
     JOIN time_slots original_slot ON original_slot.id = entry.time_slot_id
     JOIN users lecturer ON lecturer.id = entry.lecturer_user_id
     JOIN practice_teams pt ON pt.id = entry.practice_team_id
     JOIN course_sections cs ON cs.id = pt.course_section_id
     JOIN courses c ON c.id = cs.course_id
     JOIN users requester ON requester.id = cr.requested_by_user_id
     LEFT JOIN users reviewer ON reviewer.id = cr.reviewed_by_user_id
     LEFT JOIN users implementer ON implementer.id = cr.implemented_by_user_id
     LEFT JOIN rooms proposed_room ON proposed_room.id = cr.proposed_room_id
     LEFT JOIN time_slots proposed_slot ON proposed_slot.id = cr.proposed_time_slot_id
     ${whereClause}
     ORDER BY cr.created_at DESC, cr.id DESC`,
    params
  );

  return rows.map(formatChangeRequest);
}

async function getChangeRequestById(id, user) {
  const row = await getChangeRequestRowById(id);

  if (!row) {
    return null;
  }

  if (
    user.role_code === ROLES.LECTURER &&
    Number(row.requested_by_user_id) !== Number(user.id) &&
    Number(row.schedule_lecturer_user_id) !== Number(user.id)
  ) {
    return null;
  }

  return formatChangeRequest(row);
}

async function createChangeRequest(input, user) {
  const normalizedResult = normalizeCreateInput(input);

  if (!normalizedResult.ok) {
    return normalizedResult;
  }

  const data = normalizedResult.data;
  const entry = await getScheduleEntryById(data.lab_schedule_entry_id);

  if (!entry) {
    return { ok: false, statusCode: 404, message: 'Schedule entry not found' };
  }

  if (Number(entry.lecturer_user_id) !== Number(user.id)) {
    return { ok: false, statusCode: 403, message: 'Lecturers can only request changes for schedules they teach' };
  }

  if (!CHANGEABLE_ENTRY_STATUSES.has(entry.entry_status)) {
    return {
      ok: false,
      statusCode: 409,
      message: 'Only approved or published schedule entries can be changed',
      details: { current_status: entry.entry_status }
    };
  }

  const [activeRows] = await pool.query(
    `SELECT id, request_status
     FROM lab_schedule_change_requests
     WHERE lab_schedule_entry_id = ?
       AND request_status IN (?, ?)
     LIMIT 1`,
    [data.lab_schedule_entry_id, ...ACTIVE_REQUEST_STATUSES]
  );

  if (activeRows[0]) {
    return {
      ok: false,
      statusCode: 409,
      message: 'This schedule entry already has an active change request',
      details: activeRows[0]
    };
  }

  if (data.proposed_time_slot_id && !(await existsById('time_slots', data.proposed_time_slot_id))) {
    return { ok: false, statusCode: 400, message: 'proposed_time_slot_id does not exist' };
  }

  if (data.proposed_room_id && !(await existsById('rooms', data.proposed_room_id))) {
    return { ok: false, statusCode: 400, message: 'proposed_room_id does not exist' };
  }

  const [result] = await pool.query(
    `INSERT INTO lab_schedule_change_requests (
       lab_schedule_entry_id,
       change_type,
       proposed_day_of_week,
       proposed_time_slot_id,
       proposed_room_id,
       proposed_start_date,
       proposed_end_date,
       reason_text,
       request_status,
       requested_by_user_id
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`,
    [
      data.lab_schedule_entry_id,
      data.change_type,
      data.proposed_day_of_week,
      data.proposed_time_slot_id,
      data.proposed_room_id,
      data.proposed_start_date,
      data.proposed_end_date,
      data.reason_text,
      user.id
    ]
  );

  const created = await getChangeRequestRowById(result.insertId);
  return { ok: true, changeRequest: formatChangeRequest(created) };
}

function normalizeReviewStatus(input) {
  const status = String(input.request_status || input.status || '').trim();

  if (!REVIEW_STATUSES.has(status)) {
    return null;
  }

  return status;
}

async function reviewChangeRequest(id, input, user) {
  const nextStatus = normalizeReviewStatus(input);

  if (!nextStatus) {
    return { ok: false, statusCode: 400, message: 'request_status must be approved or rejected' };
  }

  const row = await getChangeRequestRowById(id);

  if (!row) {
    return { ok: false, statusCode: 404, message: 'Change request not found' };
  }

  if (row.request_status !== 'submitted') {
    return {
      ok: false,
      statusCode: 409,
      message: 'Only submitted change requests can be reviewed',
      details: { current_status: row.request_status }
    };
  }

  await pool.query(
    `UPDATE lab_schedule_change_requests
     SET request_status = ?,
         reviewed_by_user_id = ?,
         reviewed_at = CURRENT_TIMESTAMP,
         review_notes = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nextStatus, user.id, normalizeOptionalText(input.review_notes), id]
  );

  const updated = await getChangeRequestRowById(id);
  return { ok: true, changeRequest: formatChangeRequest(updated) };
}

async function findImplementationConflicts(connection, input) {
  const excludeClause = input.excludeEntryId ? 'AND id <> ?' : '';
  const excludeParams = input.excludeEntryId ? [input.excludeEntryId] : [];

  const [roomRows] = await connection.query(
    `SELECT id
     FROM lab_schedule_entries
     WHERE room_id = ?
       AND day_of_week = ?
       AND time_slot_id = ?
       AND entry_status IN ('draft', 'approved', 'published')
       AND start_date <= ?
       AND end_date >= ?
       ${excludeClause}
     LIMIT 5`,
    [
      input.roomId,
      input.dayOfWeek,
      input.timeSlotId,
      input.endDate,
      input.startDate,
      ...excludeParams
    ]
  );

  if (roomRows.length > 0) {
    return {
      code: 'ROOM_CONFLICT',
      message: 'Proposed schedule conflicts with existing room schedule entries',
      conflicting_entry_ids: roomRows.map((row) => row.id)
    };
  }

  const [lecturerRows] = await connection.query(
    `SELECT id
     FROM lab_schedule_entries
     WHERE lecturer_user_id = ?
       AND day_of_week = ?
       AND time_slot_id = ?
       AND entry_status IN ('draft', 'approved', 'published')
       AND start_date <= ?
       AND end_date >= ?
       ${excludeClause}
     LIMIT 5`,
    [
      input.lecturerUserId,
      input.dayOfWeek,
      input.timeSlotId,
      input.endDate,
      input.startDate,
      ...excludeParams
    ]
  );

  if (lecturerRows.length > 0) {
    return {
      code: 'LECTURER_CONFLICT',
      message: 'Proposed schedule conflicts with existing lecturer schedule entries',
      conflicting_entry_ids: lecturerRows.map((row) => row.id)
    };
  }

  const [blockRows] = await connection.query(
    `SELECT id
     FROM room_block_requests
     WHERE room_id = ?
       AND block_status = 'approved'
       AND start_date <= ?
       AND end_date >= ?
       AND (day_of_week IS NULL OR day_of_week = ?)
       AND (time_slot_id IS NULL OR time_slot_id = ?)
     LIMIT 5`,
    [input.roomId, input.endDate, input.startDate, input.dayOfWeek, input.timeSlotId]
  );

  if (blockRows.length > 0) {
    return {
      code: 'ROOM_BLOCKED',
      message: 'Proposed schedule overlaps with approved room block requests',
      conflicting_block_ids: blockRows.map((row) => row.id)
    };
  }

  const [holidayRows] = await connection.query(
    `SELECT id, holiday_name
     FROM calendar_holidays
     WHERE holiday_date BETWEEN ? AND ?
       AND is_lab_scheduling_blocked = 1
       AND holiday_status = 'active'
       AND WEEKDAY(holiday_date) = ?
     LIMIT 5`,
    [input.startDate, input.endDate, (input.dayOfWeek + 5) % 7]
  );

  if (holidayRows.length > 0) {
    return {
      code: 'HOLIDAY_BLOCKED',
      message: 'Proposed schedule overlaps with blocked holidays',
      holidays: holidayRows
    };
  }

  return null;
}

function getImplementationScheduleInput(row) {
  return {
    roomId: row.proposed_room_id || row.original_room_id,
    dayOfWeek: row.proposed_day_of_week,
    timeSlotId: row.proposed_time_slot_id,
    startDate: row.proposed_start_date,
    endDate: row.proposed_end_date,
    lecturerUserId: row.schedule_lecturer_user_id
  };
}

function getImplementationNote(row) {
  const nextNote = `Change request #${row.id} implemented (${row.change_type})`;
  return truncate([row.original_notes, nextNote].filter(Boolean).join(' | '), 255);
}

async function implementReschedule(connection, row, user) {
  const scheduleInput = {
    ...getImplementationScheduleInput(row),
    excludeEntryId: row.lab_schedule_entry_id
  };
  const conflict = await findImplementationConflicts(connection, scheduleInput);

  if (conflict) {
    return { ok: false, conflict };
  }

  await connection.query(
    `UPDATE lab_schedule_entries
     SET room_id = ?,
         day_of_week = ?,
         time_slot_id = ?,
         start_date = ?,
         end_date = ?,
         notes = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      scheduleInput.roomId,
      scheduleInput.dayOfWeek,
      scheduleInput.timeSlotId,
      scheduleInput.startDate,
      scheduleInput.endDate,
      getImplementationNote(row),
      row.lab_schedule_entry_id
    ]
  );

  return { ok: true, scheduleEntryId: row.lab_schedule_entry_id };
}

async function implementMakeup(connection, row, user) {
  const scheduleInput = getImplementationScheduleInput(row);
  const conflict = await findImplementationConflicts(connection, scheduleInput);

  if (conflict) {
    return { ok: false, conflict };
  }

  const nextStatus = row.original_entry_status === 'published' ? 'published' : 'approved';
  const [result] = await connection.query(
    `INSERT INTO lab_schedule_entries (
       lab_schedule_request_id,
       available_slot_id,
       practice_team_id,
       room_id,
       lecturer_user_id,
       day_of_week,
       time_slot_id,
       start_date,
       end_date,
       entry_status,
       created_by_user_id,
       approved_by_user_id,
       published_by_user_id,
       approved_at,
       published_at,
       notes
     ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
    [
      row.schedule_request_id,
      row.schedule_practice_team_id,
      scheduleInput.roomId,
      row.schedule_lecturer_user_id,
      scheduleInput.dayOfWeek,
      scheduleInput.timeSlotId,
      scheduleInput.startDate,
      scheduleInput.endDate,
      nextStatus,
      user.id,
      user.id,
      nextStatus === 'published' ? user.id : null,
      nextStatus === 'published' ? new Date() : null,
      truncate(`Makeup for schedule entry #${row.lab_schedule_entry_id} via change request #${row.id}`, 255)
    ]
  );

  return { ok: true, scheduleEntryId: result.insertId };
}

async function implementCancel(connection, row, user) {
  await connection.query(
    `UPDATE lab_schedule_entries
     SET entry_status = 'cancelled',
         cancelled_by_user_id = ?,
         cancelled_at = CURRENT_TIMESTAMP,
         cancellation_reason = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      user.id,
      truncate(row.review_notes || row.reason_text, 255),
      row.lab_schedule_entry_id
    ]
  );

  return { ok: true, scheduleEntryId: row.lab_schedule_entry_id };
}

async function implementChangeRequest(id, input, user) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const row = await getChangeRequestRowById(id, connection, { forUpdate: true });

    if (!row) {
      await connection.rollback();
      return { ok: false, statusCode: 404, message: 'Change request not found' };
    }

    if (row.request_status !== 'approved') {
      await connection.rollback();
      return {
        ok: false,
        statusCode: 409,
        message: 'Only approved change requests can be implemented',
        details: { current_status: row.request_status }
      };
    }

    let implementationResult;

    if (row.change_type === 'cancel') {
      implementationResult = await implementCancel(connection, row, user);
    } else if (row.change_type === 'makeup') {
      implementationResult = await implementMakeup(connection, row, user);
    } else {
      implementationResult = await implementReschedule(connection, row, user);
    }

    if (!implementationResult.ok) {
      await connection.rollback();
      return {
        ok: false,
        statusCode: 409,
        message: 'Cannot implement change request because proposed schedule is blocked',
        details: implementationResult.conflict
      };
    }

    const nextReviewNotes = normalizeOptionalText(input.review_notes);

    await connection.query(
      `UPDATE lab_schedule_change_requests
       SET request_status = 'implemented',
           implemented_by_user_id = ?,
           implemented_at = CURRENT_TIMESTAMP,
           review_notes = COALESCE(?, review_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [user.id, nextReviewNotes, id]
    );

    await connection.commit();

    const [updatedRequestRow, implementedEntry] = await Promise.all([
      getChangeRequestRowById(id),
      getScheduleEntryById(implementationResult.scheduleEntryId)
    ]);

    return {
      ok: true,
      changeRequest: formatChangeRequest(updatedRequestRow),
      implementedSchedule: implementedEntry
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listChangeRequests,
  getChangeRequestById,
  createChangeRequest,
  reviewChangeRequest,
  implementChangeRequest
};
