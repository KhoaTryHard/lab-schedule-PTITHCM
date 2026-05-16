const pool = require('../../config/database');
const { ROOM_SCOPE, isInScopeRoom } = require('../../config/roomScope');

async function getTimeSlotId(slotLabel) {
  const [rows] = await pool.query('SELECT id FROM time_slots WHERE slot_label = ?', [slotLabel]);
  return rows[0] ? rows[0].id : null;
}

async function getRoomId(roomCode) {
  const [rows] = await pool.query('SELECT id FROM rooms WHERE room_code = ?', [roomCode]);
  return rows[0] ? rows[0].id : null;
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
       AND entry_status IN ('approved', 'published')
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
       AND entry_status IN ('approved', 'published')
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

function getScheduleListStub(query) {
  return {
    filters: query,
    schedules: []
  };
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
  getScheduleListStub,
  autoArrangeScheduleStub
};
