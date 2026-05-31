const pool = require('../../config/database');
const { ROLES } = require('../../config/roles');
const { recordAuditLog } = require('../audit/audit.service');

function makeServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function assertSchedulingReadiness(courseSectionId, input) {
  const [rows] = await pool.query(
    `SELECT
       cs.id,
       cs.section_status,
       s.is_active AS semester_is_active,
       s.start_date AS semester_start_date,
       s.end_date AS semester_end_date,
       c.course_status,
       (SELECT COUNT(*) FROM academic_weeks aw WHERE aw.semester_id = s.id) AS academic_week_count,
       (SELECT COUNT(*) FROM time_slots ts WHERE ts.is_active = 1) AS active_time_slot_count
     FROM course_sections cs
     JOIN semesters s ON s.id = cs.semester_id
     JOIN courses c ON c.id = cs.course_id
     WHERE cs.id = ?
     LIMIT 1`,
    [courseSectionId]
  );
  const readiness = rows[0];

  if (!readiness) {
    throw makeServiceError(400, 'course_section_id does not exist');
  }

  if (!Number(readiness.semester_is_active)) {
    throw makeServiceError(409, 'The selected course section is not in an active semester');
  }

  if (['closed', 'cancelled'].includes(readiness.section_status)) {
    throw makeServiceError(409, 'The selected course section is not open for scheduling');
  }

  if (readiness.course_status !== 'active') {
    throw makeServiceError(409, 'The selected course is not active');
  }

  if (!Number(readiness.academic_week_count)) {
    throw makeServiceError(409, 'The selected semester has no academic weeks configured');
  }

  if (!Number(readiness.active_time_slot_count)) {
    throw makeServiceError(409, 'No active time slots are configured');
  }

  const preferredStart = input.preferred_week_start ? new Date(input.preferred_week_start) : null;
  const preferredEnd = input.preferred_week_end ? new Date(input.preferred_week_end) : null;
  const semesterStart = new Date(readiness.semester_start_date);
  const semesterEnd = new Date(readiness.semester_end_date);

  if (preferredStart && Number.isNaN(preferredStart.getTime())) {
    throw makeServiceError(400, 'preferred_week_start must be a valid date');
  }

  if (preferredEnd && Number.isNaN(preferredEnd.getTime())) {
    throw makeServiceError(400, 'preferred_week_end must be a valid date');
  }

  if (preferredStart && preferredEnd && preferredEnd < preferredStart) {
    throw makeServiceError(400, 'preferred_week_end must be greater than or equal to preferred_week_start');
  }

  if (
    (preferredStart && (preferredStart < semesterStart || preferredStart > semesterEnd)) ||
    (preferredEnd && (preferredEnd < semesterStart || preferredEnd > semesterEnd))
  ) {
    throw makeServiceError(409, 'Preferred week range must be inside the selected semester');
  }
}

async function createRequest(data, userId) {
  const {
    course_section_id,
    requested_team_count = 1,
    max_students_per_team = null,
    total_required_sessions = 1,
    preferred_week_start = null,
    preferred_week_end = null,
    preferred_day_of_week = null,
    preferred_time_slot_id = null,
    notes = null
  } = data;

  await assertSchedulingReadiness(course_section_id, data);

  const [result] = await pool.query(
    `INSERT INTO lab_schedule_requests (
      course_section_id,
      requested_team_count,
      max_students_per_team,
      total_required_sessions,
      preferred_week_start,
      preferred_week_end,
      preferred_day_of_week,
      preferred_time_slot_id,
      request_status,
      requested_by_user_id,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
    [
      course_section_id,
      requested_team_count,
      max_students_per_team,
      total_required_sessions,
      preferred_week_start,
      preferred_week_end,
      preferred_day_of_week,
      preferred_time_slot_id,
      userId,
      notes
    ]
  );

  await recordAuditLog({
    entity_type: 'lab_schedule_requests',
    entity_id: result.insertId,
    action_type: 'create',
    new_status: 'draft',
    action_by_user_id: userId,
    action_notes: {
      course_section_id,
      requested_team_count,
      total_required_sessions
    }
  });

  return result.insertId;
}

async function getRequests(userRole, userId) {
  let query = `
    SELECT 
      req.*,
      cs.group_no,
      c.course_code,
      c.course_name,
      u.full_name as requested_by_name
    FROM lab_schedule_requests req
    JOIN course_sections cs ON req.course_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    LEFT JOIN users u ON req.requested_by_user_id = u.id
  `;
  const params = [];

  // CBDT only sees their own requests. Admin/QTV sees all.
  if (userRole === ROLES.ACADEMIC_OFFICER) {
    query += ' WHERE req.requested_by_user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY req.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getRequestById(id, userRole, userId) {
  const [rows] = await pool.query(
    `SELECT 
      req.*,
      cs.group_no,
      c.course_code,
      c.course_name,
      u.full_name as requested_by_name
    FROM lab_schedule_requests req
    JOIN course_sections cs ON req.course_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    LEFT JOIN users u ON req.requested_by_user_id = u.id
    WHERE req.id = ?`,
    [id]
  );

  const request = rows[0] || null;

  if (request && userRole === ROLES.ACADEMIC_OFFICER && Number(request.requested_by_user_id) !== Number(userId)) {
    return null; // Don't allow viewing others' requests if CBDT
  }

  return request;
}

async function submitRequest(id, userId, userRole) {
  // First, get the request to check if it's draft and belongs to the user (if CBDT)
  const req = await getRequestById(id, userRole, userId);
  if (!req) return false;

  if (req.request_status !== 'draft') {
    throw new Error('Chỉ có thể gửi yêu cầu ở trạng thái draft');
  }

  await pool.query(
    `UPDATE lab_schedule_requests 
     SET request_status = 'pending_review', updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id]
  );

  await recordAuditLog({
    entity_type: 'lab_schedule_requests',
    entity_id: id,
    action_type: 'submit',
    old_status: req.request_status,
    new_status: 'pending_review',
    action_by_user_id: userId
  });

  return true;
}

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  submitRequest
};
