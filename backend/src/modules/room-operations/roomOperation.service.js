const pool = require('../../config/database');
const { ROLES } = require('../../config/roles');
const { isInScopeRoom } = require('../../config/roomScope');

const ISSUE_TYPES = new Set(['computer', 'network', 'projector', 'power', 'software', 'other']);
const ISSUE_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
const ISSUE_STATUSES = new Set(['new', 'in_progress', 'resolved', 'closed']);
const BLOCK_TYPES = new Set(['maintenance', 'repair', 'exam', 'reserved', 'incident', 'other']);
const BLOCK_REVIEW_STATUSES = new Set(['approved', 'rejected']);

const ROOM_ISSUE_SELECT = `
  issue.id,
  issue.room_id,
  room.room_code,
  issue.device_id,
  device.device_code,
  device.device_name,
  issue.lab_schedule_entry_id,
  issue.issue_type,
  issue.severity,
  issue.issue_title,
  issue.issue_description,
  issue.reported_by_user_id,
  reporter.full_name AS reported_by_name,
  issue.assigned_to_user_id,
  assignee.full_name AS assigned_to_name,
  issue.issue_status,
  issue.detected_at,
  issue.resolved_at,
  issue.resolution_notes,
  schedule.entry_status AS schedule_status,
  schedule.day_of_week AS schedule_day_of_week,
  schedule.start_date AS schedule_start_date,
  schedule.end_date AS schedule_end_date,
  time_slot.slot_label AS schedule_time_slot,
  course.course_code,
  course.course_name,
  course_section.group_no,
  practice_team.team_no
`;

const ROOM_BLOCK_SELECT = `
  block.id,
  block.room_id,
  room.room_code,
  block.block_type,
  block.block_title,
  block.block_reason,
  block.day_of_week,
  block.time_slot_id,
  time_slot.slot_label AS slot_label,
  block.start_date,
  block.end_date,
  block.block_status,
  block.requested_by_user_id,
  requester.full_name AS requested_by_name,
  block.reviewed_by_user_id,
  reviewer.full_name AS reviewed_by_name,
  block.reviewed_at,
  block.review_notes,
  block.created_at,
  block.updated_at
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

function normalizeRoomCode(value) {
  return normalizeText(value)?.toUpperCase() || null;
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

function formatRoomIssue(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    room_id: row.room_id,
    room_code: row.room_code,
    device_id: row.device_id,
    device_code: row.device_code,
    device_name: row.device_name,
    lab_schedule_entry_id: row.lab_schedule_entry_id,
    issue_type: row.issue_type,
    severity: row.severity,
    issue_title: row.issue_title,
    issue_description: row.issue_description,
    reported_by_user_id: row.reported_by_user_id,
    reported_by_name: row.reported_by_name,
    assigned_to_user_id: row.assigned_to_user_id,
    assigned_to_name: row.assigned_to_name,
    issue_status: row.issue_status,
    detected_at: row.detected_at,
    resolved_at: row.resolved_at,
    resolution_notes: row.resolution_notes,
    schedule: row.lab_schedule_entry_id
      ? {
          id: row.lab_schedule_entry_id,
          entry_status: row.schedule_status,
          day_of_week: row.schedule_day_of_week,
          time_slot: row.schedule_time_slot,
          start_date: row.schedule_start_date,
          end_date: row.schedule_end_date,
          course_code: row.course_code,
          course_name: row.course_name,
          group_no: row.group_no,
          team_no: row.team_no
        }
      : null
  };
}

function formatRoomBlock(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    room_id: row.room_id,
    room_code: row.room_code,
    block_type: row.block_type,
    block_title: row.block_title,
    block_reason: row.block_reason,
    day_of_week: row.day_of_week,
    time_slot_id: row.time_slot_id,
    slot_label: row.slot_label,
    start_date: row.start_date,
    end_date: row.end_date,
    block_status: row.block_status,
    requested_by_user_id: row.requested_by_user_id,
    requested_by_name: row.requested_by_name,
    reviewed_by_user_id: row.reviewed_by_user_id,
    reviewed_by_name: row.reviewed_by_name,
    reviewed_at: row.reviewed_at,
    review_notes: row.review_notes,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function getRoomByInput(input, connection = pool) {
  const roomId = toPositiveInt(input.room_id);
  const roomCode = normalizeRoomCode(input.room_code);

  if (!roomId && !roomCode) {
    return { ok: false, statusCode: 400, message: 'room_id or room_code is required' };
  }

  const [rows] = await connection.query(
    `SELECT id, room_code, room_status
     FROM rooms
     WHERE ${roomId ? 'id = ?' : 'room_code = ?'}
     LIMIT 1`,
    [roomId || roomCode]
  );

  const room = rows[0] || null;

  if (!room) {
    return { ok: false, statusCode: 404, message: 'Room not found' };
  }

  if (!isInScopeRoom(room.room_code)) {
    return {
      ok: false,
      statusCode: 400,
      message: 'Room is outside MVP room scope',
      details: { room_code: room.room_code }
    };
  }

  return { ok: true, room };
}

async function getScheduleEntryById(id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT entry.*, room.room_code
     FROM lab_schedule_entries entry
     JOIN rooms room ON room.id = entry.room_id
     WHERE entry.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function resolveDevice(input, roomId, connection = pool) {
  const rawDeviceId = input.device_id;
  const deviceId = toPositiveInt(rawDeviceId);
  const deviceCode = normalizeText(input.device_code) || (!deviceId ? normalizeText(rawDeviceId) : null);

  if (!deviceId && !deviceCode) {
    return { ok: true, device: null };
  }

  const [rows] = await connection.query(
    `SELECT id, room_id, device_code, device_name
     FROM devices
     WHERE ${deviceId ? 'id = ?' : 'room_id = ? AND device_code = ?'}
     LIMIT 1`,
    deviceId ? [deviceId] : [roomId, deviceCode]
  );

  const device = rows[0] || null;

  if (!device) {
    return { ok: false, statusCode: 400, message: 'Device does not exist for the selected room' };
  }

  if (Number(device.room_id) !== Number(roomId)) {
    return { ok: false, statusCode: 400, message: 'Device does not belong to the selected room' };
  }

  return { ok: true, device };
}

async function existsById(tableName, id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT id FROM ${tableName} WHERE id = ? LIMIT 1`,
    [id]
  );

  return Boolean(rows[0]);
}

async function getRoomIssueRowById(id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT ${ROOM_ISSUE_SELECT}
     FROM room_issue_reports issue
     JOIN rooms room ON room.id = issue.room_id
     JOIN users reporter ON reporter.id = issue.reported_by_user_id
     LEFT JOIN devices device ON device.id = issue.device_id
     LEFT JOIN users assignee ON assignee.id = issue.assigned_to_user_id
     LEFT JOIN lab_schedule_entries schedule ON schedule.id = issue.lab_schedule_entry_id
     LEFT JOIN time_slots time_slot ON time_slot.id = schedule.time_slot_id
     LEFT JOIN practice_teams practice_team ON practice_team.id = schedule.practice_team_id
     LEFT JOIN course_sections course_section ON course_section.id = practice_team.course_section_id
     LEFT JOIN courses course ON course.id = course_section.course_id
     WHERE issue.id = ?`,
    [id]
  );

  return rows[0] || null;
}

async function getRoomBlockRowById(id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT ${ROOM_BLOCK_SELECT}
     FROM room_block_requests block
     JOIN rooms room ON room.id = block.room_id
     JOIN users requester ON requester.id = block.requested_by_user_id
     LEFT JOIN users reviewer ON reviewer.id = block.reviewed_by_user_id
     LEFT JOIN time_slots time_slot ON time_slot.id = block.time_slot_id
     WHERE block.id = ?`,
    [id]
  );

  return rows[0] || null;
}

function applyRoomIssueFilters(filters, user, conditions, params) {
  if (user.role_code === ROLES.LECTURER) {
    conditions.push('issue.reported_by_user_id = ?');
    params.push(user.id);
  }

  if (filters.status) {
    conditions.push('issue.issue_status = ?');
    params.push(filters.status);
  }

  if (filters.issue_type) {
    conditions.push('issue.issue_type = ?');
    params.push(filters.issue_type);
  }

  if (filters.room_code) {
    conditions.push('room.room_code = ?');
    params.push(normalizeRoomCode(filters.room_code));
  }

  if (filters.lab_schedule_entry_id) {
    conditions.push('issue.lab_schedule_entry_id = ?');
    params.push(filters.lab_schedule_entry_id);
  }
}

async function listRoomIssues(filters, user) {
  const conditions = [];
  const params = [];

  applyRoomIssueFilters(filters, user, conditions, params);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT ${ROOM_ISSUE_SELECT}
     FROM room_issue_reports issue
     JOIN rooms room ON room.id = issue.room_id
     JOIN users reporter ON reporter.id = issue.reported_by_user_id
     LEFT JOIN devices device ON device.id = issue.device_id
     LEFT JOIN users assignee ON assignee.id = issue.assigned_to_user_id
     LEFT JOIN lab_schedule_entries schedule ON schedule.id = issue.lab_schedule_entry_id
     LEFT JOIN time_slots time_slot ON time_slot.id = schedule.time_slot_id
     LEFT JOIN practice_teams practice_team ON practice_team.id = schedule.practice_team_id
     LEFT JOIN course_sections course_section ON course_section.id = practice_team.course_section_id
     LEFT JOIN courses course ON course.id = course_section.course_id
     ${whereClause}
     ORDER BY issue.detected_at DESC, issue.id DESC`,
    params
  );

  return rows.map(formatRoomIssue);
}

async function createRoomIssue(input, user) {
  const issueType = String(input.issue_type || '').trim();
  const severity = String(input.severity || 'medium').trim();
  const issueTitle = normalizeText(input.issue_title);
  const issueDescription = normalizeText(input.issue_description);
  const labScheduleEntryId = toPositiveInt(input.lab_schedule_entry_id);
  const assignedToUserId = toPositiveInt(input.assigned_to_user_id);

  if (!ISSUE_TYPES.has(issueType)) {
    return { ok: false, statusCode: 400, message: 'issue_type is not supported' };
  }

  if (!ISSUE_SEVERITIES.has(severity)) {
    return { ok: false, statusCode: 400, message: 'severity is not supported' };
  }

  if (!issueTitle) {
    return { ok: false, statusCode: 400, message: 'issue_title is required' };
  }

  let scheduleEntry = null;

  if (labScheduleEntryId) {
    scheduleEntry = await getScheduleEntryById(labScheduleEntryId);

    if (!scheduleEntry) {
      return { ok: false, statusCode: 404, message: 'Schedule entry not found' };
    }

    if (
      user.role_code === ROLES.LECTURER &&
      Number(scheduleEntry.lecturer_user_id) !== Number(user.id)
    ) {
      return { ok: false, statusCode: 403, message: 'Lecturers can only report issues for schedules they teach' };
    }
  }

  if (user.role_code === ROLES.LECTURER && !scheduleEntry) {
    return { ok: false, statusCode: 400, message: 'Lecturer issue reports must include lab_schedule_entry_id' };
  }

  const roomResult = scheduleEntry
    ? await getRoomByInput({ room_id: scheduleEntry.room_id })
    : await getRoomByInput(input);

  if (!roomResult.ok) {
    return roomResult;
  }

  const room = roomResult.room;

  if (input.room_id && Number(input.room_id) !== Number(room.id)) {
    return { ok: false, statusCode: 400, message: 'room_id does not match the selected schedule entry' };
  }

  if (input.room_code && normalizeRoomCode(input.room_code) !== normalizeRoomCode(room.room_code)) {
    return { ok: false, statusCode: 400, message: 'room_code does not match the selected schedule entry' };
  }

  const deviceResult = await resolveDevice(input, room.id);

  if (!deviceResult.ok) {
    return deviceResult;
  }

  if (assignedToUserId && !(await existsById('users', assignedToUserId))) {
    return { ok: false, statusCode: 400, message: 'assigned_to_user_id does not exist' };
  }

  const detectedAt = isValidDate(input.detected_at) ? new Date(input.detected_at) : new Date();
  const [result] = await pool.query(
    `INSERT INTO room_issue_reports (
       room_id,
       device_id,
       lab_schedule_entry_id,
       issue_type,
       severity,
       issue_title,
       issue_description,
       reported_by_user_id,
       assigned_to_user_id,
       issue_status,
       detected_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
    [
      room.id,
      deviceResult.device?.id || null,
      labScheduleEntryId,
      issueType,
      severity,
      issueTitle,
      issueDescription,
      user.id,
      assignedToUserId,
      detectedAt
    ]
  );

  const created = await getRoomIssueRowById(result.insertId);
  return { ok: true, issue: formatRoomIssue(created) };
}

async function updateRoomIssue(id, input, user) {
  const current = await getRoomIssueRowById(id);

  if (!current) {
    return { ok: false, statusCode: 404, message: 'Room issue report not found' };
  }

  const setClauses = [];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(input, 'issue_status')) {
    const nextStatus = String(input.issue_status || '').trim();

    if (!ISSUE_STATUSES.has(nextStatus)) {
      return { ok: false, statusCode: 400, message: 'issue_status is not supported' };
    }

    setClauses.push('issue_status = ?');
    params.push(nextStatus);

    if (['resolved', 'closed'].includes(nextStatus) && !current.resolved_at) {
      setClauses.push('resolved_at = CURRENT_TIMESTAMP');
    }
  }

  const assignedToUserId = toPositiveInt(input.assigned_to_user_id);
  if (Object.prototype.hasOwnProperty.call(input, 'assigned_to_user_id')) {
    if (assignedToUserId && !(await existsById('users', assignedToUserId))) {
      return { ok: false, statusCode: 400, message: 'assigned_to_user_id does not exist' };
    }

    setClauses.push('assigned_to_user_id = ?');
    params.push(assignedToUserId);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'resolution_notes')) {
    setClauses.push('resolution_notes = ?');
    params.push(normalizeText(input.resolution_notes));
  }

  if (setClauses.length === 0) {
    return { ok: true, issue: formatRoomIssue(current) };
  }

  await pool.query(
    `UPDATE room_issue_reports
     SET ${setClauses.join(', ')}
     WHERE id = ?`,
    [...params, id]
  );

  const updated = await getRoomIssueRowById(id);
  return { ok: true, issue: formatRoomIssue(updated) };
}

function applyRoomBlockFilters(filters, conditions, params) {
  if (filters.status) {
    conditions.push('block.block_status = ?');
    params.push(filters.status);
  }

  if (filters.block_type) {
    conditions.push('block.block_type = ?');
    params.push(filters.block_type);
  }

  if (filters.room_code) {
    conditions.push('room.room_code = ?');
    params.push(normalizeRoomCode(filters.room_code));
  }
}

async function listRoomBlocks(filters) {
  const conditions = [];
  const params = [];

  applyRoomBlockFilters(filters, conditions, params);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT ${ROOM_BLOCK_SELECT}
     FROM room_block_requests block
     JOIN rooms room ON room.id = block.room_id
     JOIN users requester ON requester.id = block.requested_by_user_id
     LEFT JOIN users reviewer ON reviewer.id = block.reviewed_by_user_id
     LEFT JOIN time_slots time_slot ON time_slot.id = block.time_slot_id
     ${whereClause}
     ORDER BY block.created_at DESC, block.id DESC`,
    params
  );

  return rows.map(formatRoomBlock);
}

async function createRoomBlock(input, user) {
  const blockType = String(input.block_type || 'maintenance').trim();
  const blockTitle = normalizeText(input.block_title);
  const blockReason = normalizeText(input.block_reason);
  const dayOfWeek = toPositiveInt(input.day_of_week);
  const timeSlotId = toPositiveInt(input.time_slot_id);
  const startDate = normalizeText(input.start_date);
  const endDate = normalizeText(input.end_date);

  if (!BLOCK_TYPES.has(blockType)) {
    return { ok: false, statusCode: 400, message: 'block_type is not supported' };
  }

  if (!blockTitle) {
    return { ok: false, statusCode: 400, message: 'block_title is required' };
  }

  if (!blockReason) {
    return { ok: false, statusCode: 400, message: 'block_reason is required' };
  }

  if (dayOfWeek && dayOfWeek > 7) {
    return { ok: false, statusCode: 400, message: 'day_of_week must be between 1 and 7' };
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return { ok: false, statusCode: 400, message: 'start_date and end_date must be valid dates' };
  }

  if (isEndDateBeforeStartDate(startDate, endDate)) {
    return { ok: false, statusCode: 400, message: 'end_date must be greater than or equal to start_date' };
  }

  const roomResult = await getRoomByInput(input);

  if (!roomResult.ok) {
    return roomResult;
  }

  if (timeSlotId && !(await existsById('time_slots', timeSlotId))) {
    return { ok: false, statusCode: 400, message: 'time_slot_id does not exist' };
  }

  const [result] = await pool.query(
    `INSERT INTO room_block_requests (
       room_id,
       block_type,
       block_title,
       block_reason,
       day_of_week,
       time_slot_id,
       start_date,
       end_date,
       block_status,
       requested_by_user_id
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`,
    [
      roomResult.room.id,
      blockType,
      blockTitle,
      blockReason,
      dayOfWeek,
      timeSlotId,
      startDate,
      endDate,
      user.id
    ]
  );

  const created = await getRoomBlockRowById(result.insertId);
  return { ok: true, block: formatRoomBlock(created) };
}

async function reviewRoomBlock(id, input, user) {
  const nextStatus = String(input.block_status || input.status || '').trim();

  if (!BLOCK_REVIEW_STATUSES.has(nextStatus)) {
    return { ok: false, statusCode: 400, message: 'block_status must be approved or rejected' };
  }

  const current = await getRoomBlockRowById(id);

  if (!current) {
    return { ok: false, statusCode: 404, message: 'Room block request not found' };
  }

  if (current.block_status !== 'submitted') {
    return {
      ok: false,
      statusCode: 409,
      message: 'Only submitted room block requests can be reviewed',
      details: { current_status: current.block_status }
    };
  }

  await pool.query(
    `UPDATE room_block_requests
     SET block_status = ?,
         reviewed_by_user_id = ?,
         reviewed_at = CURRENT_TIMESTAMP,
         review_notes = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nextStatus, user.id, normalizeText(input.review_notes), id]
  );

  const updated = await getRoomBlockRowById(id);
  return { ok: true, block: formatRoomBlock(updated) };
}

module.exports = {
  listRoomIssues,
  createRoomIssue,
  updateRoomIssue,
  listRoomBlocks,
  createRoomBlock,
  reviewRoomBlock
};
