const pool = require("../../config/database");
const { ROOM_SCOPE, isInScopeRoom } = require("../../config/roomScope");
const { ROLES } = require("../../config/roles");
const { recordAuditLog } = require("../audit/audit.service");

async function getTimeSlotId(slotLabel) {
  const [rows] = await pool.query(
    "SELECT id FROM time_slots WHERE slot_label = ?",
    [slotLabel],
  );
  if (rows[0]) {
    return rows[0].id;
  }

  const periodRange = String(slotLabel || "").match(/(\d+)\s*-\s*(\d+)/);
  if (!periodRange) {
    return null;
  }

  const [, startPeriod, endPeriod] = periodRange;
  const [periodRows] = await pool.query(
    "SELECT id FROM time_slots WHERE start_period = ? AND end_period = ?",
    [startPeriod, endPeriod],
  );

  return periodRows[0] ? periodRows[0].id : null;
}

async function getRoomId(roomCode) {
  const [rows] = await pool.query("SELECT id FROM rooms WHERE room_code = ?", [
    roomCode,
  ]);
  return rows[0] ? rows[0].id : null;
}

async function getScheduleById(id) {
  const [rows] = await pool.query(
    `SELECT
       entry.*,
       DATE_FORMAT(entry.start_date, '%Y-%m-%d') AS start_date,
       DATE_FORMAT(entry.end_date, '%Y-%m-%d') AS end_date,
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
    [id],
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
  DATE_FORMAT(entry.start_date, '%Y-%m-%d') AS start_date,
  DATE_FORMAT(entry.end_date, '%Y-%m-%d') AS end_date,
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
  cs.id as course_section_id,
  cs.semester_id,
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
    time_slot_id: row.time_slot_id,
    time_slot: row.time_slot,
    start_date: row.start_date,
    end_date: row.end_date,
    entry_status: row.entry_status,
    status: row.entry_status,
    team_no: row.team_no,
    planned_size: row.planned_size,
    course_section_id: row.course_section_id,
    semester_id: row.semester_id,
    group_no: row.group_no,
    course_code: row.course_code,
    course_name: row.course_name,
    approved_by_user_id: row.approved_by_user_id,
    published_by_user_id: row.published_by_user_id,
    approved_at: row.approved_at,
    published_at: row.published_at,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function approveSchedule(id, userId) {
  const schedule = await getScheduleById(id);
  if (!schedule) {
    return { ok: false, statusCode: 404, message: "Schedule not found" };
  }

  if (schedule.entry_status !== "draft") {
    return {
      ok: false,
      statusCode: 409,
      message: "Only draft schedules can be approved",
      current_status: schedule.entry_status,
    };
  }

  await pool.query(
    `UPDATE lab_schedule_entries
     SET entry_status = 'approved',
         approved_by_user_id = ?,
         approved_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, id],
  );

  await recordAuditLog({
    entity_type: "lab_schedule_entries",
    entity_id: id,
    action_type: "approve",
    old_status: schedule.entry_status,
    new_status: "approved",
    action_by_user_id: userId,
  });

  const updated = await getScheduleById(id);
  return { ok: true, schedule: formatScheduleResponse(updated) };
}

async function publishSchedule(id, userId) {
  const schedule = await getScheduleById(id);
  if (!schedule) {
    return { ok: false, statusCode: 404, message: "Schedule not found" };
  }

  if (schedule.entry_status === "draft") {
    return {
      ok: false,
      statusCode: 409,
      message: "Cannot publish a schedule before it is approved",
      current_status: schedule.entry_status,
    };
  }

  if (schedule.entry_status !== "approved") {
    return {
      ok: false,
      statusCode: 409,
      message: "Only approved schedules can be published",
      current_status: schedule.entry_status,
    };
  }

  await pool.query(
    `UPDATE lab_schedule_entries
     SET entry_status = 'published',
         published_by_user_id = ?,
         published_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [userId, id],
  );

  await recordAuditLog({
    entity_type: "lab_schedule_entries",
    entity_id: id,
    action_type: "publish",
    old_status: schedule.entry_status,
    new_status: "published",
    action_by_user_id: userId,
  });

  const updated = await getScheduleById(id);
  return { ok: true, schedule: formatScheduleResponse(updated) };
}

function toPositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseDateOnly(value) {
  if (!value) {
    return null;
  }

  const text = String(value).trim();
  const matched = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!matched) {
    return null;
  }

  const [, year, month, day] = matched.map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getBackendDayOfWeek(date) {
  const day = date.getDay();
  return day === 0 ? 1 : day + 1;
}

function buildScheduleSessionDates({
  start_date,
  end_date,
  day_of_week,
  total_required_sessions,
}) {
  const startDate = parseDateOnly(start_date);
  const endDate = parseDateOnly(end_date || start_date);
  const targetDay = toPositiveInt(day_of_week);
  const sessionLimit = toPositiveInt(total_required_sessions);

  if (!startDate || !endDate || !targetDay || startDate > endDate) {
    return [];
  }

  const dates = [];
  let cursor = new Date(startDate);

  while (cursor.getTime() <= endDate.getTime()) {
    if (getBackendDayOfWeek(cursor) === targetDay) {
      dates.push(formatDateOnly(cursor));
    }

    cursor = addDays(cursor, 1);
  }

  return sessionLimit ? dates.slice(0, sessionLimit) : dates;
}

function buildSessionDateConstraintResult(message) {
  return {
    passed: false,
    results: [
      {
        code: "SESSION_DATES",
        passed: false,
        message,
      },
    ],
  };
}

function addPositiveIntFilter(conditions, params, value, sql) {
  if (!value) {
    return;
  }

  const parsed = toPositiveInt(value);

  if (!parsed) {
    conditions.push("1 = 0");
    return;
  }

  conditions.push(sql);
  params.push(parsed);
}

function applyScheduleFilters(conditions, params, filters = {}) {
  if (filters.status) {
    conditions.push("entry.entry_status = ?");
    params.push(filters.status);
  }

  addPositiveIntFilter(
    conditions,
    params,
    filters.schedule_request_id,
    "entry.lab_schedule_request_id = ?",
  );

  if (filters.room_code) {
    conditions.push("r.room_code = ?");
    params.push(filters.room_code);
  }

  addPositiveIntFilter(
    conditions,
    params,
    filters.lecturer_user_id,
    "entry.lecturer_user_id = ?",
  );
  addPositiveIntFilter(
    conditions,
    params,
    filters.course_section_id,
    "cs.id = ?",
  );
  addPositiveIntFilter(
    conditions,
    params,
    filters.semester_id,
    "cs.semester_id = ?",
  );

  if (filters.week_no) {
    const weekNo = toPositiveInt(filters.week_no);

    if (!weekNo) {
      conditions.push("1 = 0");
    } else {
      conditions.push(
        `EXISTS (
           SELECT 1
           FROM academic_weeks aw
           WHERE aw.semester_id = cs.semester_id
             AND aw.week_no = ?
             AND entry.start_date <= aw.end_date
             AND entry.end_date >= aw.start_date
         )`,
      );
      params.push(weekNo);
    }
  }

  addPositiveIntFilter(
    conditions,
    params,
    filters.student_user_id,
    `entry.practice_team_id IN (
       SELECT ptm.practice_team_id
       FROM practice_team_members ptm
       WHERE ptm.student_user_id = ?
     )`,
  );
}

function applyRoleScheduleScope(
  conditions,
  params,
  user,
  { publishedOnly = false } = {},
) {
  if (!user) {
    conditions.push("1 = 0");
    return;
  }

  if (
    publishedOnly ||
    [ROLES.LECTURER, ROLES.TECHNICIAN, ROLES.STUDENT].includes(user.role_code)
  ) {
    conditions.push("entry.entry_status = 'published'");
  }

  if (user.role_code === ROLES.LECTURER) {
    conditions.push("entry.lecturer_user_id = ?");
    params.push(user.id);
  }

  if (user.role_code === ROLES.STUDENT) {
    conditions.push(
      `entry.practice_team_id IN (
         SELECT ptm.practice_team_id
         FROM practice_team_members ptm
         WHERE ptm.student_user_id = ?
       )`,
    );
    params.push(user.id);
  }
}

async function getPublishedSchedules(filters = {}, user = null) {
  const conditions = ["entry.entry_status = 'published'"];
  const params = [];

  applyScheduleFilters(conditions, params, filters);
  applyRoleScheduleScope(conditions, params, user);

  const [rows] = await pool.query(
    `SELECT ${SCHEDULE_LIST_SELECT}
     FROM lab_schedule_entries entry
     JOIN rooms r ON entry.room_id = r.id
     JOIN time_slots ts ON entry.time_slot_id = ts.id
     JOIN users u ON entry.lecturer_user_id = u.id
     JOIN practice_teams pt ON entry.practice_team_id = pt.id
     JOIN course_sections cs ON pt.course_section_id = cs.id
     JOIN courses c ON cs.course_id = c.id
     WHERE ${conditions.join(" AND ")}
     ORDER BY entry.start_date ASC, entry.day_of_week ASC, ts.start_period ASC`,
    params,
  );

  return rows.map(formatScheduleResponse);
}

async function getScheduleWeeks(filters = {}) {
  const conditions = [];
  const params = [];
  const semesterId = toPositiveInt(filters.semester_id);
  const includeAll =
    filters.all === true ||
    filters.all === 1 ||
    String(filters.all || "").trim() === "1";

  if (filters.semester_id && !semesterId) {
    return [];
  }

  if (semesterId) {
    conditions.push("aw.semester_id = ?");
    params.push(semesterId);
  } else if (!includeAll) {
    conditions.push(
      `aw.semester_id = COALESCE(
         (
           SELECT s.id
           FROM semesters s
           WHERE s.is_active = 1
             AND EXISTS (
               SELECT 1
               FROM academic_weeks existing_weeks
               WHERE existing_weeks.semester_id = s.id
             )
           ORDER BY s.start_date DESC
           LIMIT 1
         ),
         (
           SELECT s.id
           FROM semesters s
           WHERE EXISTS (
             SELECT 1
             FROM academic_weeks existing_weeks
             WHERE existing_weeks.semester_id = s.id
           )
           ORDER BY s.start_date DESC
           LIMIT 1
         )
       )`,
    );
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const [rows] = await pool.query(
    `SELECT
       aw.id,
       aw.semester_id,
       aw.week_no,
       DATE_FORMAT(aw.start_date, '%Y-%m-%d') AS start_date,
       DATE_FORMAT(aw.end_date, '%Y-%m-%d') AS end_date,
       s.academic_year,
       s.semester_no,
       s.semester_name
     FROM academic_weeks aw
     JOIN semesters s ON s.id = aw.semester_id
     ${whereClause}
     ORDER BY aw.start_date ASC, aw.week_no ASC`,
    params,
  );

  return rows.map((row) => ({
    ...row,
    semester_code: `HK${row.semester_no}_${String(row.academic_year).replace("-", "_")}`,
  }));
}

function checkRoomScope(roomCode) {
  const passed = isInScopeRoom(roomCode);
  return {
    code: "ROOM_SCOPE",
    passed,
    message: passed
      ? `Phòng ${roomCode} thuộc phạm vi cho phép.`
      : `Phòng ${roomCode} nằm ngoài phạm vi cho phép (${ROOM_SCOPE.join(", ")}).`,
  };
}

async function checkRoomStatus(roomCode) {
  const [rows] = await pool.query(
    "SELECT room_status FROM rooms WHERE room_code = ?",
    [roomCode],
  );

  if (!rows[0]) {
    return {
      code: "ROOM_STATUS",
      passed: false,
      message: "Không tìm thấy phòng trong cơ sở dữ liệu.",
    };
  }

  const passed = rows[0].room_status === "available";

  return {
    code: "ROOM_STATUS",
    passed,
    message: passed
      ? `Phòng ${roomCode} đang khả dụng.`
      : `Phòng ${roomCode} không khả dụng, trạng thái hiện tại: ${rows[0].room_status}.`,
  };
}

async function checkRoomBlocked(
  roomId,
  dayOfWeek,
  timeSlotId,
  startDate,
  endDate,
) {
  if (!roomId) {
    return {
      code: "ROOM_BLOCKED",
      passed: false,
      message: "Không tìm thấy phòng trong cơ sở dữ liệu.",
    };
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM room_block_requests
     WHERE room_id = ?
       AND block_status = 'approved'
       AND start_date <= ? AND end_date >= ?
       AND (day_of_week IS NULL OR day_of_week = ?)
       AND (time_slot_id IS NULL OR time_slot_id = ?)`,
    [roomId, endDate, startDate, dayOfWeek, timeSlotId],
  );

  const passed = rows[0].count === 0;

  return {
    code: "ROOM_BLOCKED",
    passed,
    message: passed
      ? "Phòng không bị khóa trong khoảng thời gian đã chọn."
      : `Phòng có ${rows[0].count} yêu cầu khóa phòng đã duyệt bị trùng thời gian.`,
  };
}

async function checkHolidayBlocked(dayOfWeek, startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date,
            holiday_name
     FROM calendar_holidays
     WHERE holiday_date BETWEEN ? AND ?
       AND is_lab_scheduling_blocked = 1
       AND holiday_status = 'active'
       AND WEEKDAY(holiday_date) = ?`,
    [startDate, endDate, (dayOfWeek + 5) % 7],
  );

  const passed = rows.length === 0;

  return {
    code: "HOLIDAY_BLOCKED",
    passed,
    message: passed
      ? "Không có ngày nghỉ bị chặn trong lịch đã chọn."
      : `Bị chặn bởi ngày nghỉ: ${rows
          .map((row) => `${row.holiday_name} (${row.holiday_date})`)
          .join(", ")}.`,
  };
}

async function checkRoomConflict(
  roomId,
  dayOfWeek,
  timeSlotId,
  startDate,
  endDate,
) {
  if (!roomId) {
    return {
      code: "ROOM_CONFLICT",
      passed: false,
      message: "Không tìm thấy phòng trong cơ sở dữ liệu.",
    };
  }

  if (!timeSlotId) {
    return {
      code: "ROOM_CONFLICT",
      passed: false,
      message: "Không tìm thấy ca học trong cơ sở dữ liệu.",
    };
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM lab_schedule_entries
     WHERE room_id = ?
       AND day_of_week = ?
       AND time_slot_id = ?
       AND entry_status IN ('draft', 'approved', 'published')
       AND start_date <= ? AND end_date >= ?`,
    [roomId, dayOfWeek, timeSlotId, endDate, startDate],
  );

  const passed = rows[0].count === 0;

  return {
    code: "ROOM_CONFLICT",
    passed,
    message: passed
      ? "Không phát hiện trùng phòng."
      : `Phòng đã có ${rows[0].count} lịch thực hành trùng thời gian.`,
  };
}

async function checkLecturerConflict(
  lecturerUserId,
  dayOfWeek,
  timeSlotId,
  startDate,
  endDate,
) {
  if (!timeSlotId) {
    return {
      code: "LECTURER_CONFLICT",
      passed: false,
      message: "Không tìm thấy ca học trong cơ sở dữ liệu.",
    };
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM lab_schedule_entries
     WHERE lecturer_user_id = ?
       AND day_of_week = ?
       AND time_slot_id = ?
       AND entry_status IN ('draft', 'approved', 'published')
       AND start_date <= ? AND end_date >= ?`,
    [lecturerUserId, dayOfWeek, timeSlotId, endDate, startDate],
  );

  const passed = rows[0].count === 0;

  return {
    code: "LECTURER_CONFLICT",
    passed,
    message: passed
      ? "Không phát hiện trùng lịch giảng viên."
      : `Giảng viên có ${rows[0].count} lịch thực hành trùng thời gian.`,
  };
}

async function checkCapacity(roomCode, practiceTeamId) {
  const [roomRows] = await pool.query(
    "SELECT usable_student_computers FROM rooms WHERE room_code = ?",
    [roomCode],
  );

  if (!roomRows[0]) {
    return {
      code: "CAPACITY_OK",
      passed: false,
      message: "Không tìm thấy phòng trong cơ sở dữ liệu.",
    };
  }

  const usable = roomRows[0].usable_student_computers;

  const [teamRows] = await pool.query(
    "SELECT planned_size FROM practice_teams WHERE id = ?",
    [practiceTeamId],
  );

  if (!teamRows[0]) {
    return {
      code: "CAPACITY_OK",
      passed: false,
      message: "Không tìm thấy tổ thực hành trong cơ sở dữ liệu.",
    };
  }

  const teamSize = teamRows[0].planned_size;
  const passed = usable >= teamSize;

  return {
    code: "CAPACITY_OK",
    passed,
    message: passed
      ? `Phòng có ${usable} máy khả dụng, sĩ số tổ là ${teamSize}.`
      : `Phòng chỉ có ${usable} máy khả dụng, không đủ cho sĩ số tổ ${teamSize}.`,
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
  } = input;

  const [roomId, timeSlotId] = await Promise.all([
    getRoomId(room_code),
    getTimeSlotId(time_slot),
  ]);

  const results = await Promise.all([
    checkRoomScope(room_code),
    checkRoomStatus(room_code),
    checkRoomBlocked(roomId, day_of_week, timeSlotId, start_date, end_date),
    checkHolidayBlocked(day_of_week, start_date, end_date),
    checkRoomConflict(roomId, day_of_week, timeSlotId, start_date, end_date),
    checkLecturerConflict(
      lecturer_user_id,
      day_of_week,
      timeSlotId,
      start_date,
      end_date,
    ),
    checkCapacity(room_code, practice_team_id),
  ]);

  return {
    passed: results.every((result) => result.passed),
    results,
  };
}

function buildScheduleItemsFromInput(input) {
  if (
    !Array.isArray(input.schedule_items) ||
    input.schedule_items.length === 0
  ) {
    return [];
  }

  return input.schedule_items.map((item) => ({
    lab_schedule_request_id:
      item.lab_schedule_request_id || input.lab_schedule_request_id || null,
    available_slot_id:
      item.available_slot_id || input.available_slot_id || null,
    practice_team_id: item.practice_team_id,
    room_code: item.room_code || input.room_code,
    lecturer_user_id: item.lecturer_user_id || input.lecturer_user_id,
    day_of_week: item.day_of_week || input.day_of_week,
    time_slot: item.time_slot || input.time_slot,
    start_date: item.start_date || input.start_date,
    end_date:
      item.end_date || input.end_date || item.start_date || input.start_date,
    total_required_sessions:
      item.total_required_sessions || input.total_required_sessions,
    notes: item.notes || input.notes || null,
  }));
}

function buildBatchConstraintResult(message, code = "BATCH_SCHEDULE") {
  return {
    passed: false,
    results: [
      {
        code,
        passed: false,
        message,
      },
    ],
  };
}

function assertNoInternalRoomConflict(itemContexts) {
  const occupied = new Set();

  for (const itemContext of itemContexts) {
    for (const sessionDate of itemContext.sessionDates) {
      const key = [
        itemContext.item.room_code,
        itemContext.item.time_slot,
        sessionDate,
      ].join("|");

      if (occupied.has(key)) {
        return buildBatchConstraintResult(
          "Các tổ trong cùng gói xếp lịch đang bị trùng phòng, trùng ca và trùng ngày.",
          "INTERNAL_ROOM_CONFLICT",
        );
      }

      occupied.add(key);
    }
  }

  return null;
}

async function createDraftScheduleBatch(input, user, scheduleItems) {
  const itemContexts = [];

  for (const item of scheduleItems) {
    const constraintResult = await checkScheduleConstraints(item);

    if (!constraintResult.passed) {
      return { created: false, constraintResult };
    }

    const requestedSessionCount = toPositiveInt(item.total_required_sessions);
    const sessionDates = buildScheduleSessionDates({
      start_date: item.start_date,
      end_date: item.end_date,
      day_of_week: item.day_of_week,
      total_required_sessions: requestedSessionCount,
    });

    if (sessionDates.length === 0) {
      return {
        created: false,
        constraintResult: buildSessionDateConstraintResult(
          "No actual session date matches day_of_week inside the selected range",
        ),
      };
    }

    if (requestedSessionCount && sessionDates.length < requestedSessionCount) {
      return {
        created: false,
        constraintResult: buildSessionDateConstraintResult(
          `Only ${sessionDates.length} session date(s) match day_of_week inside the selected range, expected ${requestedSessionCount}`,
        ),
      };
    }

    itemContexts.push({ item, sessionDates, constraintResult });
  }

  const internalConflict = assertNoInternalRoomConflict(itemContexts);
  if (internalConflict) {
    return { created: false, constraintResult: internalConflict };
  }

  const createdByUserId = Number(user?.id || user);
  const requestId = itemContexts[0]?.item.lab_schedule_request_id || null;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let request = null;

    if (requestId) {
      const [requestRows] = await connection.query(
        `SELECT id, course_section_id, request_status, requested_by_user_id
         FROM lab_schedule_requests
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [requestId],
      );

      request = requestRows[0];

      if (!request) {
        const error = new Error("Schedule request not found");
        error.statusCode = 404;
        throw error;
      }

      if (
        user?.role_code === ROLES.ACADEMIC_OFFICER &&
        Number(request.requested_by_user_id) !== createdByUserId
      ) {
        const error = new Error("Schedule request not found");
        error.statusCode = 404;
        throw error;
      }

      if (!["pending_review", "scheduled"].includes(request.request_status)) {
        const error = new Error(
          "Only submitted schedule requests can be scheduled",
        );
        error.statusCode = 409;
        throw error;
      }

      const teamIds = [
        ...new Set(
          itemContexts.map(({ item }) => Number(item.practice_team_id)),
        ),
      ];
      const placeholders = teamIds.map(() => "?").join(", ");

      const [teamRows] = await connection.query(
        `SELECT id, course_section_id
         FROM practice_teams
         WHERE id IN (${placeholders})`,
        teamIds,
      );

      const teamMap = new Map(teamRows.map((team) => [Number(team.id), team]));

      for (const teamId of teamIds) {
        const team = teamMap.get(teamId);

        if (
          !team ||
          Number(team.course_section_id) !== Number(request.course_section_id)
        ) {
          const error = new Error(
            "Practice team does not belong to the schedule request",
          );
          error.statusCode = 409;
          throw error;
        }
      }
    }

    const createdScheduleIds = [];
    const createdScheduleMeta = [];

    for (const { item, sessionDates } of itemContexts) {
      const [roomId, timeSlotId] = await Promise.all([
        getRoomId(item.room_code),
        getTimeSlotId(item.time_slot),
      ]);

      for (const sessionDate of sessionDates) {
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
             notes
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
          [
            item.lab_schedule_request_id,
            item.available_slot_id,
            item.practice_team_id,
            roomId,
            item.lecturer_user_id,
            item.day_of_week,
            timeSlotId,
            sessionDate,
            sessionDate,
            createdByUserId,
            item.notes,
          ],
        );

        createdScheduleIds.push(result.insertId);
        createdScheduleMeta.push(item);
      }
    }

    if (request?.request_status === "pending_review") {
      await connection.query(
        `UPDATE lab_schedule_requests
         SET request_status = 'scheduled',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [request.id],
      );

      await recordAuditLog(connection, {
        entity_type: "lab_schedule_requests",
        entity_id: request.id,
        action_type: "schedule",
        old_status: "pending_review",
        new_status: "scheduled",
        action_by_user_id: createdByUserId,
      });
    }

    for (const [index, scheduleId] of createdScheduleIds.entries()) {
      const item = createdScheduleMeta[index];

      await recordAuditLog(connection, {
        entity_type: "lab_schedule_entries",
        entity_id: scheduleId,
        action_type: "create_draft",
        new_status: "draft",
        action_by_user_id: createdByUserId,
        action_notes: {
          room_code: item.room_code,
          practice_team_id: item.practice_team_id,
          lab_schedule_request_id: item.lab_schedule_request_id,
        },
      });
    }

    await connection.commit();

    const schedules = await Promise.all(
      createdScheduleIds.map((scheduleId) => getScheduleById(scheduleId)),
    );

    return {
      created: true,
      schedule: schedules[0] || null,
      schedules,
      created_count: createdScheduleIds.length,
      session_dates: [
        ...new Set(itemContexts.flatMap((item) => item.sessionDates)),
      ],
      constraintResult: { passed: true, results: [] },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createDraftSchedule(input, user) {
  const scheduleItems = buildScheduleItemsFromInput(input);

  if (scheduleItems.length > 0) {
    return createDraftScheduleBatch(input, user, scheduleItems);
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
    notes = null,
  } = input;
  const requestedSessionCount = toPositiveInt(input.total_required_sessions);
  const sessionDates = buildScheduleSessionDates({
    start_date,
    end_date,
    day_of_week,
    total_required_sessions: requestedSessionCount,
  });

  if (sessionDates.length === 0) {
    return {
      created: false,
      constraintResult: buildSessionDateConstraintResult(
        "No actual session date matches day_of_week inside the selected range",
      ),
    };
  }

  if (requestedSessionCount && sessionDates.length < requestedSessionCount) {
    return {
      created: false,
      constraintResult: buildSessionDateConstraintResult(
        `Only ${sessionDates.length} session date(s) match day_of_week inside the selected range, expected ${requestedSessionCount}`,
      ),
    };
  }

  const createdByUserId = Number(user?.id || user);
  const [roomId, timeSlotId] = await Promise.all([
    getRoomId(room_code),
    getTimeSlotId(time_slot),
  ]);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let request = null;

    if (lab_schedule_request_id) {
      const [requestRows] = await connection.query(
        `SELECT id, course_section_id, request_status, requested_by_user_id
         FROM lab_schedule_requests
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [lab_schedule_request_id],
      );

      request = requestRows[0];

      if (!request) {
        const error = new Error("Schedule request not found");
        error.statusCode = 404;
        throw error;
      }

      if (
        user?.role_code === ROLES.ACADEMIC_OFFICER &&
        Number(request.requested_by_user_id) !== createdByUserId
      ) {
        const error = new Error("Schedule request not found");
        error.statusCode = 404;
        throw error;
      }

      if (!["pending_review", "scheduled"].includes(request.request_status)) {
        const error = new Error(
          "Only submitted schedule requests can be scheduled",
        );
        error.statusCode = 409;
        throw error;
      }

      const [teamRows] = await connection.query(
        `SELECT course_section_id
         FROM practice_teams
         WHERE id = ?
         LIMIT 1`,
        [practice_team_id],
      );

      if (
        !teamRows[0] ||
        Number(teamRows[0].course_section_id) !==
          Number(request.course_section_id)
      ) {
        const error = new Error(
          "Practice team does not belong to the schedule request",
        );
        error.statusCode = 409;
        throw error;
      }
    }

    const createdScheduleIds = [];

    for (const sessionDate of sessionDates) {
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
          sessionDate,
          sessionDate,
          createdByUserId,
          notes,
        ],
      );

      createdScheduleIds.push(result.insertId);
    }

    if (request?.request_status === "pending_review") {
      await connection.query(
        `UPDATE lab_schedule_requests
         SET request_status = 'scheduled',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [request.id],
      );

      await recordAuditLog(connection, {
        entity_type: "lab_schedule_requests",
        entity_id: request.id,
        action_type: "schedule",
        old_status: "pending_review",
        new_status: "scheduled",
        action_by_user_id: createdByUserId,
      });
    }

    for (const scheduleId of createdScheduleIds) {
      await recordAuditLog(connection, {
        entity_type: "lab_schedule_entries",
        entity_id: scheduleId,
        action_type: "create_draft",
        new_status: "draft",
        action_by_user_id: createdByUserId,
        action_notes: {
          room_code,
          practice_team_id,
          lab_schedule_request_id,
        },
      });
    }

    await connection.commit();

    const schedules = await Promise.all(
      createdScheduleIds.map((scheduleId) => getScheduleById(scheduleId)),
    );

    return {
      created: true,
      schedule: schedules[0] || null,
      schedules,
      created_count: createdScheduleIds.length,
      session_dates: sessionDates,
      constraintResult,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getScheduleList(filters = {}, user = null) {
  const conditions = [];
  const params = [];

  applyScheduleFilters(conditions, params, filters);
  applyRoleScheduleScope(conditions, params, user);

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
    params,
  );

  return rows.map(formatScheduleResponse);
}

async function getRoomEntryCount(room_code, start_date, end_date) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM lab_schedule_entries entry
     JOIN rooms r ON entry.room_id = r.id
     WHERE r.room_code = ?
       AND entry.entry_status IN ('draft', 'approved', 'published')
       AND entry.start_date <= ? AND entry.end_date >= ?`,
    [room_code, end_date, start_date],
  );
  return rows[0].count;
}

async function hasCourseInRoom(room_code, course_section_id) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM lab_schedule_entries entry
     JOIN rooms r ON entry.room_id = r.id
     JOIN practice_teams pt ON entry.practice_team_id = pt.id
     WHERE r.room_code = ?
       AND pt.course_section_id = ?
       AND entry.entry_status IN ('approved', 'published')`,
    [room_code, course_section_id],
  );
  return rows[0].count > 0;
}

function normalizeTimeSlotValue(value) {
  const periodRange = String(value || "").match(/(\d+)\s*-\s*(\d+)/);
  return periodRange ? `${periodRange[1]}-${periodRange[2]}` : value;
}

async function getAutoArrangeContext(input) {
  const requestId =
    toPositiveInt(input.schedule_request_id) || toPositiveInt(input.request_id);

  if (!requestId) {
    return {
      request_id: null,
      semester_id: null,
      total_required_sessions:
        toPositiveInt(input.total_required_sessions) || 1,
      range_start: input.start_date,
      range_end: input.end_date,
      preferred_day_of_week: toPositiveInt(input.preferred_day_of_week),
      preferred_time_slot: normalizeTimeSlotValue(input.preferred_time_slot),
      lecturer_user_id: toPositiveInt(input.lecturer_user_id),
    };
  }

  const [rows] = await pool.query(
    `SELECT
       req.id,
       req.course_section_id,
       req.total_required_sessions,
       req.preferred_day_of_week,
       req.preferred_time_slot_id,
       DATE_FORMAT(req.preferred_week_start, '%Y-%m-%d') AS preferred_week_start,
       DATE_FORMAT(req.preferred_week_end, '%Y-%m-%d') AS preferred_week_end,
       cs.semester_id,
       ts.slot_label AS preferred_time_slot
     FROM lab_schedule_requests req
     JOIN course_sections cs ON cs.id = req.course_section_id
     LEFT JOIN time_slots ts ON ts.id = req.preferred_time_slot_id
     WHERE req.id = ?
     LIMIT 1`,
    [requestId],
  );

  const request = rows[0];

  if (!request) {
    const error = new Error("Schedule request not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    request_id: request.id,
    semester_id: request.semester_id,
    course_section_id: request.course_section_id,
    total_required_sessions:
      toPositiveInt(request.total_required_sessions) || 1,
    range_start: input.start_date || request.preferred_week_start,
    range_end:
      input.end_date ||
      request.preferred_week_end ||
      input.start_date ||
      request.preferred_week_start,
    preferred_day_of_week:
      toPositiveInt(input.preferred_day_of_week) ||
      toPositiveInt(request.preferred_day_of_week),
    preferred_time_slot: normalizeTimeSlotValue(
      input.preferred_time_slot || request.preferred_time_slot,
    ),
    lecturer_user_id: toPositiveInt(input.lecturer_user_id),
  };
}

async function buildAcademicWeekWindows(context) {
  const sessionCount = Math.max(
    1,
    toPositiveInt(context.total_required_sessions) || 1,
  );

  if (!context.semester_id) {
    return [
      {
        start_date: context.range_start,
        end_date: context.range_end,
        start_week_no: null,
        end_week_no: null,
        week_window_index: 0,
      },
    ];
  }

  const [weeks] = await pool.query(
    `SELECT
       week_no,
       DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
       DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
     FROM academic_weeks
     WHERE semester_id = ?
       AND start_date >= ?
       AND end_date <= ?
     ORDER BY week_no`,
    [context.semester_id, context.range_start, context.range_end],
  );

  const windows = [];

  for (let index = 0; index <= weeks.length - sessionCount; index += 1) {
    const slice = weeks.slice(index, index + sessionCount);
    const firstWeek = slice[0];
    const lastWeek = slice[slice.length - 1];

    const isConsecutive = slice.every(
      (week, offset) =>
        Number(week.week_no) === Number(firstWeek.week_no) + offset,
    );

    if (!isConsecutive) continue;

    windows.push({
      start_date: firstWeek.start_date,
      end_date: lastWeek.end_date,
      start_week_no: firstWeek.week_no,
      end_week_no: lastWeek.week_no,
      week_window_index: index,
    });
  }

  return windows;
}

async function getAutoArrangePracticeTeams(context, input) {
  const fallbackTeamId = toPositiveInt(input.practice_team_id);

  if (!context.course_section_id) {
    return fallbackTeamId
      ? [{ id: fallbackTeamId, team_no: null, planned_size: null }]
      : [];
  }

  const [teams] = await pool.query(
    `SELECT id, team_no, planned_size
     FROM practice_teams
     WHERE course_section_id = ?
       AND (team_status IS NULL OR team_status <> 'cancelled')
     ORDER BY team_no`,
    [context.course_section_id],
  );

  if (teams.length > 0) {
    return teams;
  }

  return fallbackTeamId
    ? [{ id: fallbackTeamId, team_no: null, planned_size: null }]
    : [];
}

function scoreAutoCandidate(candidate, context) {
  let score = 50;

  if (
    context.preferred_day_of_week &&
    candidate.day_of_week === context.preferred_day_of_week
  ) {
    score += 30;
  }

  if (
    context.preferred_time_slot &&
    candidate.time_slot === context.preferred_time_slot
  ) {
    score += 20;
  }

  score += Math.max(0, 10 - candidate.week_window_index);

  return Math.min(score, 100);
}

function hasSharedSessionDate(firstCandidate, secondCandidate) {
  const firstDates = new Set(firstCandidate.session_dates || []);
  return (secondCandidate.session_dates || []).some((date) =>
    firstDates.has(date),
  );
}

function hasInternalRoomConflict(firstCandidate, secondCandidate) {
  return (
    firstCandidate.room_code === secondCandidate.room_code &&
    firstCandidate.time_slot === secondCandidate.time_slot &&
    hasSharedSessionDate(firstCandidate, secondCandidate)
  );
}

function hasInternalLecturerConflict(firstCandidate, secondCandidate) {
  return (
    Number(firstCandidate.lecturer_user_id) ===
      Number(secondCandidate.lecturer_user_id) &&
    firstCandidate.time_slot === secondCandidate.time_slot &&
    hasSharedSessionDate(firstCandidate, secondCandidate)
  );
}

function hasInternalScheduleConflict(firstCandidate, secondCandidate) {
  return (
    hasInternalRoomConflict(firstCandidate, secondCandidate) ||
    hasInternalLecturerConflict(firstCandidate, secondCandidate)
  );
}

function buildScheduleItemFromCandidate(candidate) {
  return {
    room_code: candidate.room_code,
    day_of_week: candidate.day_of_week,
    time_slot: candidate.time_slot,
    start_date: candidate.start_date,
    end_date: candidate.end_date,
    session_dates: candidate.session_dates,
    start_week_no: candidate.start_week_no,
    end_week_no: candidate.end_week_no,
    total_required_sessions: candidate.total_required_sessions,
    practice_team_id: candidate.practice_team_id,
    team_no: candidate.team_no,
    planned_size: candidate.planned_size,
    lecturer_user_id: candidate.lecturer_user_id,
  };
}

function buildAutoPackage(selectedCandidates) {
  const scheduleItems = selectedCandidates.map(buildScheduleItemFromCandidate);
  const rooms = [...new Set(scheduleItems.map((item) => item.room_code))];
  const firstCandidate = selectedCandidates[0];

  const score = Math.round(
    selectedCandidates.reduce((sum, candidate) => sum + candidate.score, 0) /
      selectedCandidates.length,
  );

  return {
    room_code: rooms.join(", "),
    day_of_week: firstCandidate.day_of_week,
    time_slot: firstCandidate.time_slot,
    start_date: firstCandidate.start_date,
    end_date: firstCandidate.end_date,
    session_dates: firstCandidate.session_dates,
    start_week_no: firstCandidate.start_week_no,
    end_week_no: firstCandidate.end_week_no,
    total_required_sessions: firstCandidate.total_required_sessions,
    practice_team_id: firstCandidate.practice_team_id,
    lecturer_user_id: firstCandidate.lecturer_user_id,
    team_count: scheduleItems.length,
    schedule_items: scheduleItems,
    score,
    reasons: firstCandidate.constraintResult.results
      .filter((result) => result.passed)
      .map((result) => result.message),
  };
}

function buildAutoPackageKey(packageOption) {
  return packageOption.schedule_items
    .map((item) =>
      [
        item.practice_team_id,
        item.room_code,
        item.day_of_week,
        item.time_slot,
        item.start_date,
        item.end_date,
      ].join(":"),
    )
    .join("|");
}

function selectAutoPackages(scoredByTeam) {
  const teamCandidateLists = Array.from(scoredByTeam.values());

  if (
    teamCandidateLists.length === 0 ||
    teamCandidateLists.some((candidates) => candidates.length === 0)
  ) {
    return [];
  }

  const firstTeamSeeds = teamCandidateLists[0].slice(0, 12);
  const packageMap = new Map();

  for (const seed of firstTeamSeeds) {
    const selectedCandidates = [seed];

    for (
      let teamIndex = 1;
      teamIndex < teamCandidateLists.length;
      teamIndex += 1
    ) {
      const nextCandidate = teamCandidateLists[teamIndex].find((candidate) =>
        selectedCandidates.every(
          (selectedCandidate) =>
            !hasInternalScheduleConflict(selectedCandidate, candidate),
        ),
      );

      if (!nextCandidate) {
        selectedCandidates.length = 0;
        break;
      }

      selectedCandidates.push(nextCandidate);
    }

    if (selectedCandidates.length !== teamCandidateLists.length) {
      continue;
    }

    const packageOption = buildAutoPackage(selectedCandidates);
    const packageKey = buildAutoPackageKey(packageOption);

    if (!packageMap.has(packageKey)) {
      packageMap.set(packageKey, packageOption);
    }
  }

  return Array.from(packageMap.values())
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);
}

/**
 * Thuật toán Auto-Arrange (Rule-based Filter + Scoring)
 *
 * Thuật toán hoạt động tuần tự qua 6 bước:
 * Bước 1. Khởi tạo & Tham số hóa: Phân tích đầu vào (phòng, ca, ngày ưu tiên, cấu hình).
 * Bước 2. Sinh Candidate Matrix: Tạo ra danh sách tất cả phương án khả thi bằng tổ hợp (Phòng x Ca x Ngày).
 * Bước 3. Lọc Ràng buộc (Constraint Filtering): Chạy checkScheduleConstraints đánh giá các rule cứng (Sức chứa, Xung đột lịch, Lịch nghỉ lễ, v.v.). Tách thành 2 mảng `valid` và `failed`.
 * Bước 4. Chấm điểm ưu tiên (Scoring): Đánh giá trọng số cho các candidates hợp lệ:
 *    - Điểm sàn (Base) = 50.
 *    - Trùng ngày ưu tiên = +30.
 *    - Trùng ca ưu tiên = +20.
 * Bước 5. Sắp xếp & Chọn lọc (Sorting): Xếp hạng các candidates theo điểm số giảm dần, cắt ra Top 3 lựa chọn tối ưu nhất (`slice(0, 3)`).
 * Bước 6. Trả về Response chuẩn: Xuất ra danh sách gợi ý, hoặc xuất mảng 5 lý do lỗi (`failed_reasons`) phổ biến nhất nếu không có option nào hợp lệ.
 *
 * @param {Object} input Dữ liệu yêu cầu từ client.
 * @returns {Object} JSON chứa kết quả auto-arrange.
 */

async function autoArrangeSchedule(input) {
  console.time("auto-arrange");

  const context = await getAutoArrangeContext(input);
  const weekWindows = await buildAcademicWeekWindows(context);
  const teams = await getAutoArrangePracticeTeams(context, input);

  if (!weekWindows.length || !teams.length) {
    console.timeEnd("auto-arrange");

    return {
      request_id: context.request_id || input.request_id || null,
      auto_arrange_status: "no_valid_option",
      selected_option: null,
      ranked_options: [],
      failed_reasons: [
        {
          code: !teams.length ? "NO_PRACTICE_TEAM" : "NO_WEEK_WINDOW",
          message: !teams.length
            ? "Không tìm thấy tổ thực hành thuộc yêu cầu xếp lịch."
            : "Không có khoảng tuần học liên tiếp phù hợp với số buổi cần xếp.",
        },
      ],
    };
  }

  const rooms = ROOM_SCOPE;
  const timeSlots = ["1-4", "7-10"];
  const days = context.preferred_day_of_week
    ? [context.preferred_day_of_week]
    : [2, 3, 4, 5, 6, 7];

  const failed = [];
  const scoredByTeam = new Map();

  for (const team of teams) {
    const validCandidates = [];

    for (const room of rooms) {
      for (const slot of timeSlots) {
        for (const day of days) {
          for (const weekWindow of weekWindows) {
            const sessionDates = buildScheduleSessionDates({
              start_date: weekWindow.start_date,
              end_date: weekWindow.end_date,
              day_of_week: day,
              total_required_sessions: context.total_required_sessions,
            });

            const candidate = {
              room_code: room,
              time_slot: slot,
              day_of_week: day,
              start_date: weekWindow.start_date,
              end_date: weekWindow.end_date,
              session_dates: sessionDates,
              start_week_no: weekWindow.start_week_no,
              end_week_no: weekWindow.end_week_no,
              week_window_index: weekWindow.week_window_index,
              total_required_sessions: context.total_required_sessions,
              lecturer_user_id: context.lecturer_user_id,
              practice_team_id: team.id,
              team_no: team.team_no,
              planned_size: team.planned_size,
            };

            if (sessionDates.length < context.total_required_sessions) {
              failed.push({
                ...candidate,
                failed_rules: [
                  {
                    code: "SESSION_DATES",
                    message:
                      "Không đủ ngày học thực tế trong khoảng tuần đã chọn.",
                  },
                ],
              });
              continue;
            }

            const result = await checkScheduleConstraints(candidate);

            if (result.passed) {
              validCandidates.push({
                ...candidate,
                score: scoreAutoCandidate(candidate, context),
                constraintResult: result,
              });
            } else {
              failed.push({
                ...candidate,
                failed_rules: result.results
                  .filter((rule) => !rule.passed)
                  .map((rule) => ({
                    code: rule.code,
                    message: rule.message,
                  })),
              });
            }
          }
        }
      }
    }

    validCandidates.sort((first, second) => second.score - first.score);
    scoredByTeam.set(Number(team.id), validCandidates);
  }

  const ranked_options = selectAutoPackages(scoredByTeam);

  console.log(
    `Auto-arrange: ${teams.length} team(s), ${ranked_options.length} package option(s)`,
  );
  console.timeEnd("auto-arrange");

  return {
    request_id: context.request_id || input.request_id || null,
    auto_arrange_status:
      ranked_options.length > 0 ? "success" : "no_valid_option",
    selected_option: ranked_options[0] || null,
    ranked_options,
    failed_reasons:
      ranked_options.length === 0
        ? failed.slice(0, 5).map((failedItem) => ({
            code: failedItem.failed_rules?.[0]?.code || "CONSTRAINT_FAILED",
            message:
              failedItem.failed_rules?.[0]?.message ||
              "Không có phương án xếp lịch hợp lệ.",
            room_code: failedItem.room_code,
            day_of_week: failedItem.day_of_week,
            time_slot: failedItem.time_slot,
            start_week_no: failedItem.start_week_no,
            end_week_no: failedItem.end_week_no,
            practice_team_id: failedItem.practice_team_id,
            failed_rules: failedItem.failed_rules,
          }))
        : [],
  };
}

async function getActiveTimeSlots() {
  const [rows] = await pool.query(
    `SELECT
       id,
       slot_label,
       start_period,
       end_period,
       start_time,
       end_time,
       is_active,
       created_at,
       updated_at
     FROM time_slots
     WHERE is_active = 1
     ORDER BY start_period ASC, end_period ASC, id ASC`,
  );

  return rows.map((row) => ({
    id: row.id,
    slot_label: row.slot_label,
    start_period: row.start_period,
    end_period: row.end_period,
    start_time: row.start_time,
    end_time: row.end_time,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

module.exports = {
  checkScheduleConstraints,
  createDraftSchedule,
  getScheduleById,
  approveSchedule,
  publishSchedule,
  getPublishedSchedules,
  getScheduleWeeks,
  getScheduleList,
  autoArrangeSchedule,
  getActiveTimeSlots,
};
