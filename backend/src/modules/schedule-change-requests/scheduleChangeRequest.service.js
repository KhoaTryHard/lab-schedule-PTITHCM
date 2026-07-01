const pool = require("../../config/database");
const { ROLES } = require("../../config/roles");
const { ROOM_SCOPE } = require("../../config/roomScope");
const { recordAuditLog } = require("../audit/audit.service");

const CHANGE_TYPES = new Set(["reschedule", "makeup", "cancel"]);
const REVIEW_STATUSES = new Set(["approved", "rejected"]);
const ACTIVE_REQUEST_STATUSES = ["submitted", "approved"];
const CHANGEABLE_ENTRY_STATUSES = new Set(["approved", "published"]);

const CHANGE_REQUEST_SELECT = `
  cr.id,
  cr.lab_schedule_entry_id,
  cr.change_type,
  cr.proposed_day_of_week,
  cr.proposed_time_slot_id,
  cr.proposed_room_id,
  DATE_FORMAT(cr.proposed_start_date, '%Y-%m-%d') AS proposed_start_date,
  DATE_FORMAT(cr.proposed_end_date, '%Y-%m-%d') AS proposed_end_date,
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
  DATE_FORMAT(entry.start_date, '%Y-%m-%d') AS original_start_date,
  DATE_FORMAT(entry.end_date, '%Y-%m-%d') AS original_end_date,
  entry.entry_status AS original_entry_status,
  entry.notes AS original_notes,
  original_room.room_code AS original_room_code,
  original_slot.slot_label AS original_time_slot,
  lecturer.full_name AS lecturer_name,
  pt.team_no,
  pt.planned_size,
  cs.group_no,
  c.id AS course_id,
  c.course_code,
  c.course_name
`;

function toPositiveInt(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
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
  if (!value || typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isEndDateBeforeStartDate(startDate, endDate) {
  return new Date(endDate) < new Date(startDate);
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

function getBackendDayOfWeek(date) {
  const day = date.getDay();
  return day === 0 ? 1 : day + 1;
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
    course_id: row.course_id,
    course_code: row.course_code,
    course_name: row.course_name,
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
    schedule: formatSchedule(row),
  };
}

function applyRoleVisibility(conditions, params, user) {
  if (user.role_code === ROLES.LECTURER) {
    conditions.push(
      "(cr.requested_by_user_id = ? OR entry.lecturer_user_id = ?)",
    );
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
     ${options.forUpdate ? "FOR UPDATE" : ""}`,
    [id],
  );

  return rows[0] || null;
}

async function getScheduleEntryById(id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT
       entry.*,
       DATE_FORMAT(entry.start_date, '%Y-%m-%d') AS start_date,
       DATE_FORMAT(entry.end_date, '%Y-%m-%d') AS end_date,
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
    [id],
  );

  return rows[0] || null;
}

async function existsById(tableName, id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT id FROM ${tableName} WHERE id = ? LIMIT 1`,
    [id],
  );

  return Boolean(rows[0]);
}

function normalizeCreateInput(input) {
  const changeType = String(input.change_type || "").trim();

  if (!CHANGE_TYPES.has(changeType)) {
    return {
      ok: false,
      statusCode: 400,
      message: "change_type must be reschedule, makeup, or cancel",
    };
  }

  const reasonText = normalizeOptionalText(input.reason_text);

  if (!reasonText) {
    return { ok: false, statusCode: 400, message: "reason_text is required" };
  }

  const normalized = {
    lab_schedule_entry_id: toPositiveInt(input.lab_schedule_entry_id),
    change_type: changeType,
    reason_text: reasonText,
    proposed_day_of_week: null,
    proposed_time_slot_id: null,
    proposed_room_id: null,
    proposed_start_date: null,
    proposed_end_date: null,
  };

  if (!normalized.lab_schedule_entry_id) {
    return {
      ok: false,
      statusCode: 400,
      message: "lab_schedule_entry_id must be a positive integer",
    };
  }

  if (changeType === "cancel") {
    return { ok: true, data: normalized };
  }

  normalized.proposed_day_of_week = toPositiveInt(input.proposed_day_of_week);
  normalized.proposed_time_slot_id = toPositiveInt(input.proposed_time_slot_id);
  normalized.proposed_room_id = toPositiveInt(input.proposed_room_id);
  normalized.proposed_start_date = normalizeOptionalText(
    input.proposed_start_date,
  );
  normalized.proposed_end_date = normalizeOptionalText(input.proposed_end_date);

  if (!normalized.proposed_day_of_week || normalized.proposed_day_of_week > 7) {
    return {
      ok: false,
      statusCode: 400,
      message: "proposed_day_of_week must be between 1 and 7",
    };
  }

  if (!normalized.proposed_time_slot_id) {
    return {
      ok: false,
      statusCode: 400,
      message: "proposed_time_slot_id is required for reschedule/makeup",
    };
  }

  if (
    !isValidDate(normalized.proposed_start_date) ||
    !isValidDate(normalized.proposed_end_date)
  ) {
    return {
      ok: false,
      statusCode: 400,
      message: "proposed_start_date and proposed_end_date must be valid dates",
    };
  }

  if (
    isEndDateBeforeStartDate(
      normalized.proposed_start_date,
      normalized.proposed_end_date,
    )
  ) {
    return {
      ok: false,
      statusCode: 400,
      message:
        "proposed_end_date must be greater than or equal to proposed_start_date",
    };
  }

  const proposedStartDate = parseDateOnly(normalized.proposed_start_date);
  const proposedEndDate = parseDateOnly(normalized.proposed_end_date);
  const proposedStartKey = formatDateOnly(proposedStartDate);
  const proposedEndKey = formatDateOnly(proposedEndDate);

  if (proposedStartKey !== proposedEndKey) {
    return {
      ok: false,
      statusCode: 400,
      message:
        "proposed_start_date and proposed_end_date must be the same date for one-session change requests",
    };
  }

  if (
    getBackendDayOfWeek(proposedStartDate) !== normalized.proposed_day_of_week
  ) {
    return {
      ok: false,
      statusCode: 400,
      message: "proposed_day_of_week must match proposed_start_date",
    };
  }

  return { ok: true, data: normalized };
}

async function listChangeRequests(filters, user) {
  const conditions = [];
  const params = [];

  applyRoleVisibility(conditions, params, user);

  if (filters.status) {
    conditions.push("cr.request_status = ?");
    params.push(filters.status);
  }

  if (filters.change_type) {
    conditions.push("cr.change_type = ?");
    params.push(filters.change_type);
  }

  if (filters.lab_schedule_entry_id) {
    conditions.push("cr.lab_schedule_entry_id = ?");
    params.push(filters.lab_schedule_entry_id);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
    params,
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
    return { ok: false, statusCode: 404, message: "Schedule entry not found" };
  }

  if (Number(entry.lecturer_user_id) !== Number(user.id)) {
    return {
      ok: false,
      statusCode: 403,
      message: "Lecturers can only request changes for schedules they teach",
    };
  }

  if (!CHANGEABLE_ENTRY_STATUSES.has(entry.entry_status)) {
    return {
      ok: false,
      statusCode: 409,
      message: "Only approved or published schedule entries can be changed",
      details: { current_status: entry.entry_status },
    };
  }

  const [activeRows] = await pool.query(
    `SELECT id, request_status
     FROM lab_schedule_change_requests
     WHERE lab_schedule_entry_id = ?
       AND request_status IN (?, ?)
     LIMIT 1`,
    [data.lab_schedule_entry_id, ...ACTIVE_REQUEST_STATUSES],
  );

  if (activeRows[0]) {
    return {
      ok: false,
      statusCode: 409,
      message: "This schedule entry already has an active change request",
      details: activeRows[0],
    };
  }

  if (
    data.proposed_time_slot_id &&
    !(await existsById("time_slots", data.proposed_time_slot_id))
  ) {
    return {
      ok: false,
      statusCode: 400,
      message: "proposed_time_slot_id does not exist",
    };
  }

  if (
    data.proposed_room_id &&
    !(await existsById("rooms", data.proposed_room_id))
  ) {
    return {
      ok: false,
      statusCode: 400,
      message: "proposed_room_id does not exist",
    };
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
      user.id,
    ],
  );

  const created = await getChangeRequestRowById(result.insertId);
  await recordAuditLog({
    entity_type: "lab_schedule_change_requests",
    entity_id: result.insertId,
    action_type: "create",
    new_status: "submitted",
    action_by_user_id: user.id,
    action_notes: {
      change_type: data.change_type,
      lab_schedule_entry_id: data.lab_schedule_entry_id,
    },
  });

  return { ok: true, changeRequest: formatChangeRequest(created) };
}

function normalizeReviewStatus(input) {
  const status = String(input.request_status || input.status || "").trim();

  if (!REVIEW_STATUSES.has(status)) {
    return null;
  }

  return status;
}

async function reviewChangeRequest(id, input, user) {
  const nextStatus = normalizeReviewStatus(input);
  let selectedScheduleInput = null;

  if (!nextStatus) {
    return {
      ok: false,
      statusCode: 400,
      message: "request_status must be approved or rejected",
    };
  }

  const row = await getChangeRequestRowById(id);

  if (!row) {
    return { ok: false, statusCode: 404, message: "Change request not found" };
  }

  if (row.request_status !== "submitted") {
    return {
      ok: false,
      statusCode: 409,
      message: "Only submitted change requests can be reviewed",
      details: { current_status: row.request_status },
    };
  }
  if (nextStatus === "approved") {
    const optionResult = await getChangeRequestOptions(id, user);
    const hasValidOption =
      optionResult.ok &&
      Array.isArray(optionResult.options?.ranked_options) &&
      optionResult.options.ranked_options.length > 0;

    if (!hasValidOption) {
      return {
        ok: false,
        statusCode: 409,
        message:
          "No valid implementation option is available for this change request",
        details: optionResult.options?.failed_reasons?.[0] || null,
      };
    }

    const selectedOption =
      Object.keys(getSelectedImplementationOption(input)).length > 0
        ? getSelectedImplementationOption(input)
        : optionResult.options.selected_option;

    selectedScheduleInput = {
      ...getImplementationScheduleInput(row, selectedOption),
      excludeEntryId:
        row.change_type === "reschedule" ? row.lab_schedule_entry_id : null,
    };

    const validationIssue = validateImplementationScheduleInput(
      selectedScheduleInput,
    );

    if (validationIssue) {
      return {
        ok: false,
        statusCode: 400,
        message: "Invalid implementation option",
        details: validationIssue,
      };
    }

    const conflict = await findChangeOptionIssue(
      pool,
      row,
      selectedScheduleInput,
    );

    if (conflict) {
      return {
        ok: false,
        statusCode: 409,
        message: "Selected implementation option is no longer valid",
        details: conflict,
      };
    }
  }

  if (nextStatus === "approved") {
    await pool.query(
      `UPDATE lab_schedule_change_requests
       SET request_status = ?,
           proposed_day_of_week = ?,
           proposed_time_slot_id = ?,
           proposed_room_id = ?,
           proposed_start_date = ?,
           proposed_end_date = ?,
           reviewed_by_user_id = ?,
           reviewed_at = CURRENT_TIMESTAMP,
           review_notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nextStatus,
        selectedScheduleInput.dayOfWeek,
        selectedScheduleInput.timeSlotId,
        selectedScheduleInput.roomId,
        selectedScheduleInput.startDate,
        selectedScheduleInput.endDate,
        user.id,
        normalizeOptionalText(input.review_notes),
        id,
      ],
    );
  } else {
    await pool.query(
      `UPDATE lab_schedule_change_requests
       SET request_status = ?,
           reviewed_by_user_id = ?,
           reviewed_at = CURRENT_TIMESTAMP,
           review_notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextStatus, user.id, normalizeOptionalText(input.review_notes), id],
    );
  }

  const updated = await getChangeRequestRowById(id);
  await recordAuditLog({
    entity_type: "lab_schedule_change_requests",
    entity_id: id,
    action_type: "review",
    old_status: row.request_status,
    new_status: nextStatus,
    action_by_user_id: user.id,
    action_notes: {
      review_notes: normalizeOptionalText(input.review_notes),
      implementation_option: selectedScheduleInput
        ? {
            room_id: selectedScheduleInput.roomId,
            day_of_week: selectedScheduleInput.dayOfWeek,
            time_slot_id: selectedScheduleInput.timeSlotId,
            start_date: selectedScheduleInput.startDate,
            end_date: selectedScheduleInput.endDate,
          }
        : null,
    },
  });

  return { ok: true, changeRequest: formatChangeRequest(updated) };
}

async function findImplementationConflicts(connection, input) {
  const excludeClause = input.excludeEntryId ? "AND id <> ?" : "";
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
      ...excludeParams,
    ],
  );

  if (roomRows.length > 0) {
    return {
      code: "ROOM_CONFLICT",
      message:
        "Proposed schedule conflicts with existing room schedule entries",
      conflicting_entry_ids: roomRows.map((row) => row.id),
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
      ...excludeParams,
    ],
  );

  if (lecturerRows.length > 0) {
    return {
      code: "LECTURER_CONFLICT",
      message:
        "Proposed schedule conflicts with existing lecturer schedule entries",
      conflicting_entry_ids: lecturerRows.map((row) => row.id),
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
    [
      input.roomId,
      input.endDate,
      input.startDate,
      input.dayOfWeek,
      input.timeSlotId,
    ],
  );

  if (blockRows.length > 0) {
    return {
      code: "ROOM_BLOCKED",
      message: "Proposed schedule overlaps with approved room block requests",
      conflicting_block_ids: blockRows.map((row) => row.id),
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
    [input.startDate, input.endDate, (input.dayOfWeek + 5) % 7],
  );

  if (holidayRows.length > 0) {
    return {
      code: "HOLIDAY_BLOCKED",
      message: "Proposed schedule overlaps with blocked holidays",
      holidays: holidayRows,
    };
  }

  return null;
}

async function getCandidateRooms(row, connection = pool) {
  if (row.proposed_room_id) {
    const [rows] = await connection.query(
      "SELECT id, room_code FROM rooms WHERE id = ? LIMIT 1",
      [row.proposed_room_id],
    );

    return rows;
  }

  const placeholders = ROOM_SCOPE.map(() => "?").join(", ");
  const [rows] = await connection.query(
    `SELECT id, room_code
     FROM rooms
     WHERE room_code IN (${placeholders})
     ORDER BY FIELD(room_code, ${placeholders})`,
    [...ROOM_SCOPE, ...ROOM_SCOPE],
  );

  return rows;
}

async function getCandidateTimeSlots(row, connection = pool) {
  if (row.proposed_time_slot_id) {
    const [rows] = await connection.query(
      "SELECT id, slot_label FROM time_slots WHERE id = ? LIMIT 1",
      [row.proposed_time_slot_id],
    );

    return rows;
  }

  const [rows] = await connection.query(
    `SELECT id, slot_label
     FROM time_slots
     WHERE is_active = 1
     ORDER BY start_period ASC`,
  );

  return rows;
}

async function findChangeOptionIssue(connection, row, input) {
  const [roomRows] = await connection.query(
    `SELECT room_status, usable_student_computers
     FROM rooms
     WHERE id = ?
     LIMIT 1`,
    [input.roomId],
  );

  const room = roomRows[0];

  if (!room) {
    return { code: "ROOM_STATUS", message: "Proposed room does not exist" };
  }

  if (room.room_status !== "available") {
    return {
      code: "ROOM_STATUS",
      message: `Proposed room is not available (status: ${room.room_status})`,
    };
  }

  const teamSize = Number(row.planned_size || 0);

  if (teamSize > 0 && Number(room.usable_student_computers || 0) < teamSize) {
    return {
      code: "CAPACITY_OK",
      message: `Proposed room only has ${room.usable_student_computers} usable computers but team size is ${teamSize}`,
    };
  }

  return findImplementationConflicts(connection, input);
}

function scoreChangeCandidate(row, candidate) {
  let score = 60;

  if (
    row.proposed_room_id &&
    Number(candidate.room_id) === Number(row.proposed_room_id)
  ) {
    score += 15;
  }

  if (
    row.proposed_day_of_week &&
    Number(candidate.day_of_week) === Number(row.proposed_day_of_week)
  ) {
    score += 15;
  }

  if (
    row.proposed_time_slot_id &&
    Number(candidate.time_slot_id) === Number(row.proposed_time_slot_id)
  ) {
    score += 10;
  }

  return Math.min(score, 100);
}

async function getChangeRequestOptions(id, user) {
  const connection = await pool.getConnection();

  try {
    const row = await getChangeRequestRowById(id, connection);

    if (!row) {
      return {
        ok: false,
        statusCode: 404,
        message: "Change request not found",
      };
    }

    if (!["submitted", "approved"].includes(row.request_status)) {
      return {
        ok: false,
        statusCode: 409,
        message: "Only submitted or approved change requests can be checked",
        details: { current_status: row.request_status },
      };
    }

    if (row.change_type === "cancel") {
      return {
        ok: true,
        options: {
          request_id: Number(id),
          option_status: "no_valid_option",
          selected_option: null,
          ranked_options: [],
          failed_reasons: [
            {
              code: "CANCEL_NOT_SUPPORTED",
              message:
                "Cancel requests should be handled as reschedule or makeup requests",
            },
          ],
        },
      };
    }

    const [rooms, timeSlots] = await Promise.all([
      getCandidateRooms(row, connection),
      getCandidateTimeSlots(row, connection),
    ]);

    const days = row.proposed_day_of_week
      ? [row.proposed_day_of_week]
      : [row.original_day_of_week];

    const startDate = row.proposed_start_date || row.original_start_date;
    const endDate = row.proposed_end_date || row.original_end_date;

    const candidates = [];

    for (const room of rooms) {
      for (const timeSlot of timeSlots) {
        for (const day of days) {
          candidates.push({
            room_id: room.id,
            room_code: room.room_code,
            day_of_week: day,
            time_slot_id: timeSlot.id,
            time_slot: timeSlot.slot_label,
            start_date: startDate,
            end_date: endDate,
            lecturer_user_id: row.schedule_lecturer_user_id,
          });
        }
      }
    }

    const valid = [];
    const failed = [];

    for (const candidate of candidates) {
      const scheduleInput = {
        roomId: candidate.room_id,
        dayOfWeek: candidate.day_of_week,
        timeSlotId: candidate.time_slot_id,
        startDate: candidate.start_date,
        endDate: candidate.end_date,
        lecturerUserId: candidate.lecturer_user_id,
        excludeEntryId:
          row.change_type === "reschedule" ? row.lab_schedule_entry_id : null,
      };

      const issue = await findChangeOptionIssue(connection, row, scheduleInput);

      if (issue) {
        failed.push({
          ...candidate,
          failed_rules: [issue],
        });
      } else {
        valid.push({
          ...candidate,
          score: scoreChangeCandidate(row, candidate),
          reasons: [
            "Room is available",
            "No room conflict detected",
            "No lecturer conflict detected",
            "Schedule option is valid",
          ],
        });
      }
    }

    valid.sort((a, b) => b.score - a.score);

    const rankedOptions = valid.slice(0, 3).map((option, index) => ({
      option_key: `${option.room_id}-${option.day_of_week}-${option.time_slot_id}-${option.start_date}-${index}`,
      room_id: option.room_id,
      room_code: option.room_code,
      day_of_week: option.day_of_week,
      time_slot_id: option.time_slot_id,
      time_slot: option.time_slot,
      start_date: option.start_date,
      end_date: option.end_date,
      score: option.score,
      reasons: option.reasons,
    }));

    return {
      ok: true,
      options: {
        request_id: Number(id),
        option_status: rankedOptions.length > 0 ? "success" : "no_valid_option",
        selected_option: rankedOptions[0] || null,
        ranked_options: rankedOptions,
        failed_reasons:
          rankedOptions.length === 0
            ? failed.slice(0, 5).map((item) => ({
                room_code: item.room_code,
                day_of_week: item.day_of_week,
                time_slot: item.time_slot,
                failed_rules: item.failed_rules,
              }))
            : [],
      },
    };
  } finally {
    connection.release();
  }
}

function getSelectedImplementationOption(input = {}) {
  return input.implementation_option || input.option || {};
}

function validateImplementationScheduleInput(input) {
  if (!input.roomId) {
    return {
      code: "ROOM_STATUS",
      message: "room_id is required for implementation",
    };
  }

  if (!input.dayOfWeek || input.dayOfWeek < 1 || input.dayOfWeek > 7) {
    return {
      code: "DAY_INVALID",
      message: "day_of_week must be between 1 and 7",
    };
  }

  if (!input.timeSlotId) {
    return {
      code: "TIME_SLOT_INVALID",
      message: "time_slot_id is required for implementation",
    };
  }

  if (!isValidDate(input.startDate) || !isValidDate(input.endDate)) {
    return {
      code: "DATE_INVALID",
      message: "start_date and end_date must be valid dates",
    };
  }

  if (isEndDateBeforeStartDate(input.startDate, input.endDate)) {
    return {
      code: "DATE_INVALID",
      message: "end_date must be greater than or equal to start_date",
    };
  }

  return null;
}

function getImplementationScheduleInput(row, option = {}) {
  return {
    roomId:
      toPositiveInt(option.room_id) ||
      row.proposed_room_id ||
      row.original_room_id,
    dayOfWeek: toPositiveInt(option.day_of_week) || row.proposed_day_of_week,
    timeSlotId: toPositiveInt(option.time_slot_id) || row.proposed_time_slot_id,
    startDate:
      normalizeOptionalText(option.start_date) || row.proposed_start_date,
    endDate: normalizeOptionalText(option.end_date) || row.proposed_end_date,
    lecturerUserId: row.schedule_lecturer_user_id,
  };
}

function getImplementationNote(row) {
  const nextNote = `Change request #${row.id} implemented (${row.change_type})`;
  return truncate(
    [row.original_notes, nextNote].filter(Boolean).join(" | "),
    255,
  );
}

async function implementReschedule(connection, row, user, option = {}) {
  const scheduleInput = {
    ...getImplementationScheduleInput(row, option),
    excludeEntryId: row.lab_schedule_entry_id,
  };
  const validationIssue = validateImplementationScheduleInput(scheduleInput);

  if (validationIssue) {
    return { ok: false, conflict: validationIssue };
  }

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
      row.lab_schedule_entry_id,
    ],
  );

  return { ok: true, scheduleEntryId: row.lab_schedule_entry_id };
}

async function implementMakeup(connection, row, user, option = {}) {
  const scheduleInput = getImplementationScheduleInput(row, option);
  const validationIssue = validateImplementationScheduleInput(scheduleInput);

  if (validationIssue) {
    return { ok: false, conflict: validationIssue };
  }

  const conflict = await findImplementationConflicts(connection, scheduleInput);

  if (conflict) {
    return { ok: false, conflict };
  }

  const nextStatus =
    row.original_entry_status === "published" ? "published" : "approved";
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
      nextStatus === "published" ? user.id : null,
      nextStatus === "published" ? new Date() : null,
      truncate(
        `Makeup for schedule entry #${row.lab_schedule_entry_id} via change request #${row.id}`,
        255,
      ),
    ],
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
      row.lab_schedule_entry_id,
    ],
  );

  return { ok: true, scheduleEntryId: row.lab_schedule_entry_id };
}

async function implementChangeRequest(id, input, user) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const row = await getChangeRequestRowById(id, connection, {
      forUpdate: true,
    });

    if (!row) {
      await connection.rollback();
      return {
        ok: false,
        statusCode: 404,
        message: "Change request not found",
      };
    }

    if (row.request_status !== "approved") {
      await connection.rollback();
      return {
        ok: false,
        statusCode: 409,
        message: "Only approved change requests can be implemented",
        details: { current_status: row.request_status },
      };
    }
    const selectedOption = getSelectedImplementationOption(input);

    let implementationResult;

    if (row.change_type === "cancel") {
      implementationResult = await implementCancel(connection, row, user);
    } else if (row.change_type === "makeup") {
      implementationResult = await implementMakeup(
        connection,
        row,
        user,
        selectedOption,
      );
    } else {
      implementationResult = await implementReschedule(
        connection,
        row,
        user,
        selectedOption,
      );
    }

    if (!implementationResult.ok) {
      await connection.rollback();
      return {
        ok: false,
        statusCode: 409,
        message:
          "Cannot implement change request because proposed schedule is blocked",
        details: implementationResult.conflict,
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
      [user.id, nextReviewNotes, id],
    );

    await recordAuditLog(connection, {
      entity_type: "lab_schedule_change_requests",
      entity_id: id,
      action_type: "implement",
      old_status: row.request_status,
      new_status: "implemented",
      action_by_user_id: user.id,
      action_notes: {
        change_type: row.change_type,
        implemented_schedule_entry_id: implementationResult.scheduleEntryId,
        review_notes: nextReviewNotes,
      },
    });

    await recordAuditLog(connection, {
      entity_type: "lab_schedule_entries",
      entity_id: implementationResult.scheduleEntryId,
      action_type: `implement_${row.change_type}`,
      old_status: row.original_entry_status,
      new_status:
        row.change_type === "cancel" ? "cancelled" : row.original_entry_status,
      action_by_user_id: user.id,
      action_notes: {
        change_request_id: id,
        original_schedule_entry_id: row.lab_schedule_entry_id,
      },
    });

    await connection.commit();

    const [updatedRequestRow, implementedEntry] = await Promise.all([
      getChangeRequestRowById(id),
      getScheduleEntryById(implementationResult.scheduleEntryId),
    ]);

    return {
      ok: true,
      changeRequest: formatChangeRequest(updatedRequestRow),
      implementedSchedule: implementedEntry,
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
  implementChangeRequest,
  getChangeRequestOptions,
};
