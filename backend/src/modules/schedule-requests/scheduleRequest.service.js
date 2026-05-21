const pool = require('../../config/database');
const { ROLES } = require('../../config/roles');

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

  return true;
}

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  submitRequest
};
