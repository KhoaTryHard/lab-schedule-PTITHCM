const pool = require('../../config/database');
const { ROOM_SCOPE, isInScopeRoom } = require('../../config/roomScope');

async function getTimeSlotId(slotLabel) {
  const [rows] = await pool.query('SELECT id FROM time_slots WHERE slot_label = ?', [slotLabel]);
  if (rows[0]) {
    return rows[0].id;
  }

  const periodRange = String(slotLabel || '').match(/(\d+)\s*-\s*(\d+)/);
  if (!periodRange) {
    return null;
  }

  const [, startPeriod, endPeriod] = periodRange;
  const [periodRows] = await pool.query(
    'SELECT id FROM time_slots WHERE start_period = ? AND end_period = ?',
    [startPeriod, endPeriod]
  );

  return periodRows[0] ? periodRows[0].id : null;
}

async function getRoomId(roomCode) {
  const [rows] = await pool.query('SELECT id FROM rooms WHERE room_code = ?', [roomCode]);
  return rows[0] ? rows[0].id : null;
}

async function getScheduleById(id) {
  const [rows] = await pool.query(
    `SELECT
       entry.*,
       r.room_code,
       ts.slot_label as time_slot,
       u.full_name as lecturer_name,
       pt.team_no,
       pt.planned_size,
       cs.group_no,
       c.course_code,
       c.course_name
     FROM lab_schedule_entries entry
     JOIN rooms r ON entry.room_id = r.id
     JOIN time_slots ts ON entry.time_slot_id = ts.id
     JOIN users u ON entry.lecturer_user_id = u.id
     JOIN practice_teams pt ON entry.practice_team_id = pt.id
     JOIN course_sections cs ON pt.course_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     WHERE entry.id = ?`,
    [id]
  );

  return rows[0] || null;
}

const SCHEDULE_LIST_SELECT = `
  entry.id,
  entry.lab_schedule_request_id,
  entry.practice_team_id,
  entry.room_id,
  entry.lecturer_user_id,
  entry.day_of_week,
  entry.time_slot_id,
  entry.start_date,
  entry.end_date,
  entry.entry_status,
  entry.approved_by_user_id,
  entry.published_by_user_id,
  entry.approved_at,
  entry.published_at,
  entry.notes,
  entry.created_at,
  entry.updated_at,
  r.room_code,
  ts.slot_label as time_slot,
  u.full_name as lecturer_name,
  pt.team_no,
  pt.planned_size,
  cs.group_no,
  c.course_code,
  c.course_name
`;

function formatScheduleResponse(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    lab_schedule_request_id: row.lab_schedule_request_id,
    practice_team_id: row.practice_team_id,
    room_code: row.room_code,
    lecturer_user_id: row.lecturer_user_id,
    lecturer_name: row.lecturer_name,
    day_of_week: row.day_of_week,
    time_slot: row.time_slot,
    start_date: row.start_date,
    end_date: row.end_date,
    entry_status: row.entry_status,
    status: row.entry_status,
    team_no: row.team_no,
    planned_size: row.planned_size,
    group_no: row.group_no,
    course_code: row.course_code,
    course_name: row.course_name,
    approved_by_user_id: row.approved_by_user_id,
    published_by_user_id: row.published_by_user_id,
    approved_at: row.approved_at,
    published_at: row.published_at,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function approveSchedule(id, userId) {
  const schedule = await getScheduleById(id);
  if (!schedule) {
    return { ok: false, statusCode: 404, message: 'Schedule not found' };
  }

  if (schedule.entry_status !== 'draft') {
    return {
      ok: false,
      statusCode: 409,
      message: 'Chỉ có thể duyệt lịch ở trạng thái draft',
      current_status: schedule.entry_status
    };
  }

  await pool.query(
    `UPDATE lab_schedule_entries
     SET entry_status = 'approved',
         approved_by_user_id = ?,
         approved_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, id]
  );

  const updated = await getScheduleById(id);
  return { ok: true, schedule: formatScheduleResponse(updated) };
}

async function publishSchedule(id, userId) {
  const schedule = await getScheduleById(id);
  if (!schedule) {
    return { ok: false, statusCode: 404, message: 'Schedule not found' };
  }

  if (schedule.entry_status === 'draft') {
    return {
      ok: false,
      statusCode: 409,
      message: 'Không thể công bố lịch chưa được duyệt',
      current_status: schedule.entry_status
    };
  }

  if (schedule.entry_status !== 'approved') {
    return {
      ok: false,
      statusCode: 409,
      message: 'Chỉ có thể công bố lịch ở trạng thái approved',
      current_status: schedule.entry_status
    };
  }

  await pool.query(
    `UPDATE lab_schedule_entries
     SET entry_status = 'published',
         published_by_user_id = ?,
         published_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, id]
  );

  const updated = await getScheduleById(id);
  return { ok: true, schedule: formatScheduleResponse(updated) };
}

async function getPublishedSchedules(filters = {}) {
  const { schedule_request_id, room_code, lecturer_user_id } = filters;
  const conditions = ["entry.entry_status = 'published'"];
  const params = [];

  if (schedule_request_id) {
    conditions.push('entry.lab_schedule_request_id = ?');
    params.push(schedule_request_id);
  }

  if (room_code) {
    conditions.push('r.room_code = ?');
    params.push(room_code);
  }

  if (lecturer_user_id) {
    conditions.push('entry.lecturer_user_id = ?');
    params.push(lecturer_user_id);
  }

  const [rows] = await pool.query(
    `SELECT ${SCHEDULE_LIST_SELECT}
     FROM lab_schedule_entries entry
     JOIN rooms r ON entry.room_id = r.id
     JOIN time_slots ts ON entry.time_slot_id = ts.id
     JOIN users u ON entry.lecturer_user_id = u.id
     JOIN practice_teams pt ON entry.practice_team_id = pt.id
     JOIN course_sections cs ON pt.course_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY entry.start_date ASC, entry.day_of_week ASC, ts.start_period ASC`,
    params
  );

  return rows.map(formatScheduleResponse);
}

function checkRoomScope(roomCode) {
  const passed = isInScopeRoom(roomCode);
  return {
    code: 'ROOM_SCOPE',
    passed,
    message: passed
      ? `Room ${roomCode} is in MVP scope`
      : `Room ${roomCode} is outside MVP scope (allowed: ${ROOM_SCOPE.join(', ')})`
  };
}

async function checkRoomStatus(roomCode) {
  const [rows] = await pool.query(
    'SELECT room_status FROM rooms WHERE room_code = ?',
    [roomCode]
  );
  if (!rows[0]) {
    return { code: 'ROOM_STATUS', passed: false, message: 'Room not found in database' };
  }
  const passed = rows[0].room_status === 'available';
  return {
    code: 'ROOM_STATUS',
    passed,
    message: passed
      ? `Room ${roomCode} is available`
      : `Room ${roomCode} is not available (status: ${rows[0].room_status})`
  };
}

async function checkRoomBlocked(roomId, dayOfWeek, timeSlotId, startDate, endDate) {
  if (!roomId) {
    return { code: 'ROOM_BLOCKED', passed: false, message: 'Room not found in database' };
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM room_block_requests
     WHERE room_id = ?
       AND block_status = 'approved'
       AND start_date <= ? AND end_date >= ?
       AND (day_of_week IS NULL OR day_of_week = ?)
       AND (time_slot_id IS NULL OR time_slot_id = ?)`,
    [roomId, endDate, startDate, dayOfWeek, timeSlotId]
  );

  const passed = rows[0].count === 0;
  return {
    code: 'ROOM_BLOCKED',
    passed,
    message: passed
      ? 'Room is not blocked for this period'
      : `Room has ${rows[0].count} approved block(s) overlapping this schedule`
  };
}

async function checkHolidayBlocked(dayOfWeek, startDate, endDate) {
  // WEEKDAY(): 0=Mon...6=Sun; day_of_week 1=Mon...7=Sun → WEEKDAY = day_of_week - 1
  const [rows] = await pool.query(
    `SELECT holiday_date, holiday_name FROM calendar_holidays
     WHERE holiday_date BETWEEN ? AND ?
       AND is_lab_scheduling_blocked = 1
       AND holiday_status = 'active'
       AND WEEKDAY(holiday_date) = ?`,
    [startDate, endDate, dayOfWeek - 1]
  );

  const passed = rows.length === 0;
  return {
    code: 'HOLIDAY_BLOCKED',
    passed,
    message: passed
      ? 'No blocked holidays on the selected schedule'
      : `Blocked by holiday: ${rows.map((r) => `${r.holiday_name} (${r.holiday_date})`).join(', ')}`
  };
}

async function checkRoomConflict(roomId, dayOfWeek, timeSlotId, startDate, endDate) {
  if (!roomId) {
    return { code: 'ROOM_CONFLICT', passed: false, message: 'Room not found in database' };
  }
  if (!timeSlotId) {
    return { code: 'ROOM_CONFLICT', passed: false, message: 'Time slot not found in database' };
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM lab_schedule_entries
     WHERE room_id = ?
       AND day_of_week = ?
       AND time_slot_id = ?
       AND entry_status IN ('draft', 'approved', 'published')
       AND start_date <= ? AND end_date >= ?`,
    [roomId, dayOfWeek, timeSlotId, endDate, startDate]
  );

  const passed = rows[0].count === 0;
  return {
    code: 'ROOM_CONFLICT',
    passed,
    message: passed
      ? 'No room conflict detected'
      : `Room is already booked for ${rows[0].count} session(s) overlapping this period`
  };
}

async function checkLecturerConflict(lecturerUserId, dayOfWeek, timeSlotId, startDate, endDate) {
  if (!timeSlotId) {
    return { code: 'LECTURER_CONFLICT', passed: false, message: 'Time slot not found in database' };
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM lab_schedule_entries
     WHERE lecturer_user_id = ?
       AND day_of_week = ?
       AND time_slot_id = ?
       AND entry_status IN ('draft', 'approved', 'published')
       AND start_date <= ? AND end_date >= ?`,
    [lecturerUserId, dayOfWeek, timeSlotId, endDate, startDate]
  );

  const passed = rows[0].count === 0;
  return {
    code: 'LECTURER_CONFLICT',
    passed,
    message: passed
      ? 'No lecturer conflict detected'
      : `Lecturer has ${rows[0].count} conflicting session(s) in this period`
  };
}

async function checkCapacity(roomCode, practiceTeamId) {
  const [roomRows] = await pool.query(
    'SELECT usable_student_computers FROM rooms WHERE room_code = ?',
    [roomCode]
  );

  if (!roomRows[0]) {
    return { code: 'CAPACITY_OK', passed: false, message: 'Room not found in database' };
  }

  const usable = roomRows[0].usable_student_computers;

  const [teamRows] = await pool.query(
    'SELECT planned_size FROM practice_teams WHERE id = ?',
    [practiceTeamId]
  );

  if (!teamRows[0]) {
    return { code: 'CAPACITY_OK', passed: false, message: 'Practice team not found in database' };
  }

  const teamSize = teamRows[0].planned_size;
  const passed = usable >= teamSize;

  return {
    code: 'CAPACITY_OK',
    passed,
    message: passed
      ? `Room has ${usable} usable computers, team size is ${teamSize}`
      : `Room only has ${usable} usable computers but team size is ${teamSize}`
  };
}

async function checkSoftware(roomCode, requiredSoftwareIds) {
  if (!requiredSoftwareIds || requiredSoftwareIds.length === 0) {
    return { code: 'SOFTWARE_OK', passed: true, message: 'No specific software requirements' };
  }

  const placeholders = requiredSoftwareIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT rsi.software_id FROM room_software_installations rsi
     JOIN rooms r ON rsi.room_id = r.id
     WHERE r.room_code = ?
       AND rsi.software_id IN (${placeholders})`,
    [roomCode, ...requiredSoftwareIds]
  );

  const installedIds = rows.map((r) => r.software_id);
  const missing = requiredSoftwareIds.filter((id) => !installedIds.includes(id));
  const passed = missing.length === 0;

  return {
    code: 'SOFTWARE_OK',
    passed,
    message: passed
      ? `All ${requiredSoftwareIds.length} required software package(s) are installed`
      : `Missing software package ID(s): ${missing.join(', ')}`
  };
}

async function checkScheduleConstraints(input) {
  const {
    room_code,
    lecturer_user_id,
    practice_team_id,
    day_of_week,
    time_slot,
    start_date,
    end_date,
    required_software_ids = []
  } = input;

  const [roomId, timeSlotId] = await Promise.all([getRoomId(room_code), getTimeSlotId(time_slot)]);

  const results = await Promise.all([
    checkRoomScope(room_code),
    checkRoomStatus(room_code),
    checkRoomBlocked(roomId, day_of_week, timeSlotId, start_date, end_date),
    checkHolidayBlocked(day_of_week, start_date, end_date),
    checkRoomConflict(roomId, day_of_week, timeSlotId, start_date, end_date),
    checkLecturerConflict(lecturer_user_id, day_of_week, timeSlotId, start_date, end_date),
    checkCapacity(room_code, practice_team_id),
    checkSoftware(room_code, required_software_ids)
  ]);

  return {
    passed: results.every((r) => r.passed),
    results
  };
}

async function createDraftSchedule(input, createdByUserId) {
  const constraintResult = await checkScheduleConstraints(input);

  if (!constraintResult.passed) {
    return {
      created: false,
      constraintResult
    };
  }

  const {
    lab_schedule_request_id = null,
    available_slot_id = null,
    practice_team_id,
    room_code,
    lecturer_user_id,
    day_of_week,
    time_slot,
    start_date,
    end_date,
    notes = null
  } = input;

  const [roomId, timeSlotId] = await Promise.all([getRoomId(room_code), getTimeSlotId(time_slot)]);

  const [result] = await pool.query(
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
       notes
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
    [
      lab_schedule_request_id,
      available_slot_id,
      practice_team_id,
      roomId,
      lecturer_user_id,
      day_of_week,
      timeSlotId,
      start_date,
      end_date,
      createdByUserId,
      notes
    ]
  );

  const schedule = await getScheduleById(result.insertId);

  return {
    created: true,
    schedule,
    constraintResult
  };
}

async function getScheduleList(filters = {}) {
  const { status, room_code, lecturer_user_id, schedule_request_id } = filters;
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('entry.entry_status = ?');
    params.push(status);
  }
  if (schedule_request_id) {
    conditions.push('entry.lab_schedule_request_id = ?');
    params.push(parseInt(schedule_request_id, 10));
  }
  if (room_code) {
    conditions.push('r.room_code = ?');
    params.push(room_code);
  }
  if (lecturer_user_id) {
    conditions.push('entry.lecturer_user_id = ?');
    params.push(parseInt(lecturer_user_id, 10));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT ${SCHEDULE_LIST_SELECT}
     FROM lab_schedule_entries entry
     JOIN rooms r ON entry.room_id = r.id
     JOIN time_slots ts ON entry.time_slot_id = ts.id
     JOIN users u ON entry.lecturer_user_id = u.id
     JOIN practice_teams pt ON entry.practice_team_id = pt.id
     JOIN course_sections cs ON pt.course_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     ${whereClause}
     ORDER BY entry.start_date ASC, entry.day_of_week ASC, ts.start_period ASC`,
    params
  );

  return rows.map(formatScheduleResponse);
}

function autoArrangeScheduleStub(input) {
  const preferredDay = input.preferred_day_of_week || 3;
  const preferredTimeSlot = input.preferred_time_slot || '7-10';
  const startDate = input.start_date || '2026-04-28';
  const endDate = input.end_date || startDate;

  const rankedOptions = ROOM_SCOPE.map((roomCode, index) => ({
    room_code: roomCode,
    day_of_week: preferredDay,
    time_slot: preferredTimeSlot,
    start_date: startDate,
    end_date: endDate,
    score: 90 - index * 5,
    reasons: [
      'In MVP room scope',
      'Passes demo hard constraints',
      'Ranked by simple rule-based scoring stub'
    ]
  }));

  return {
    request_id: input.request_id || null,
    auto_arrange_status: 'success',
    selected_option: rankedOptions[0],
    ranked_options: rankedOptions,
    failed_reasons: []
  };
}

module.exports = {
  checkScheduleConstraints,
  createDraftSchedule,
  getScheduleById,
  approveSchedule,
  publishSchedule,
  getPublishedSchedules,
  getScheduleList,
  autoArrangeScheduleStub
};
