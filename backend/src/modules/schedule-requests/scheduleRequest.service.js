const pool = require("../../config/database");
const { ROLES } = require("../../config/roles");
const { recordAuditLog } = require("../audit/audit.service");

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
       DATE_FORMAT(s.start_date, '%Y-%m-%d') AS semester_start_date,
       DATE_FORMAT(s.end_date, '%Y-%m-%d') AS semester_end_date,
       c.course_status,
       (SELECT COUNT(*) FROM academic_weeks aw WHERE aw.semester_id = s.id) AS academic_week_count,
       (SELECT COUNT(*) FROM time_slots ts WHERE ts.is_active = 1) AS active_time_slot_count
     FROM course_sections cs
     JOIN semesters s ON s.id = cs.semester_id
     JOIN courses c ON c.id = cs.course_id
     WHERE cs.id = ?
     LIMIT 1`,
    [courseSectionId],
  );
  const readiness = rows[0];

  if (!readiness) {
    throw makeServiceError(400, "Lớp học phần không tồn tại.");
  }

  if (!Number(readiness.semester_is_active)) {
    throw makeServiceError(
      409,
      "Lớp học phần đã chọn không thuộc học kỳ đang hoạt động.",
    );
  }

  if (["closed", "cancelled"].includes(readiness.section_status)) {
    throw makeServiceError(
      409,
      "Lớp học phần đã chọn không còn mở để xếp lịch.",
    );
  }

  if (readiness.course_status !== "active") {
    throw makeServiceError(409, "Học phần đã chọn không còn hoạt động.");
  }

  if (!Number(readiness.academic_week_count)) {
    throw makeServiceError(
      409,
      "Học kỳ của lớp học phần đã chọn chưa có tuần học.",
    );
  }

  if (!Number(readiness.active_time_slot_count)) {
    throw makeServiceError(409, "Chưa có ca học đang hoạt động.");
  }

  const preferredStart = input.preferred_week_start || null;
  const preferredEnd = input.preferred_week_end || null;
  const semesterStart = readiness.semester_start_date;
  const semesterEnd = readiness.semester_end_date;

  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (preferredStart && !dateOnlyPattern.test(preferredStart)) {
    throw makeServiceError(400, "Tuần bắt đầu ưu tiên không hợp lệ.");
  }

  if (preferredEnd && !dateOnlyPattern.test(preferredEnd)) {
    throw makeServiceError(400, "Tuần kết thúc ưu tiên không hợp lệ.");
  }

  if (preferredStart && preferredEnd && preferredEnd < preferredStart) {
    throw makeServiceError(
      400,
      "Tuần kết thúc phải sau hoặc bằng tuần bắt đầu.",
    );
  }

  if (
    (preferredStart &&
      (preferredStart < semesterStart || preferredStart > semesterEnd)) ||
    (preferredEnd &&
      (preferredEnd < semesterStart || preferredEnd > semesterEnd))
  ) {
    throw makeServiceError(
      409,
      "Khoảng tuần ưu tiên phải nằm trong học kỳ của lớp học phần đã chọn.",
    );
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
    notes = null,
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
      notes,
    ],
  );

  await recordAuditLog({
    entity_type: "lab_schedule_requests",
    entity_id: result.insertId,
    action_type: "create",
    new_status: "draft",
    action_by_user_id: userId,
    action_notes: {
      course_section_id,
      requested_team_count,
      total_required_sessions,
    },
  });

  return result.insertId;
}

async function getRequests(userRole, userId) {
  let query = `
    SELECT 
      req.*,
      DATE_FORMAT(req.preferred_week_start, '%Y-%m-%d') AS preferred_week_start,
      DATE_FORMAT(req.preferred_week_end, '%Y-%m-%d') AS preferred_week_end,
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
    query += " WHERE req.requested_by_user_id = ?";
    params.push(userId);
  }

  query += " ORDER BY req.created_at DESC";

  const [rows] = await pool.query(query, params);
  return attachPracticeTeams(rows);
}

async function getRequestById(id, userRole, userId) {
  const [rows] = await pool.query(
    `SELECT 
      req.*,
      DATE_FORMAT(req.preferred_week_start, '%Y-%m-%d') AS preferred_week_start,
      DATE_FORMAT(req.preferred_week_end, '%Y-%m-%d') AS preferred_week_end,
      cs.group_no,
      c.course_code,
      c.course_name,
      u.full_name as requested_by_name
    FROM lab_schedule_requests req
    JOIN course_sections cs ON req.course_section_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    LEFT JOIN users u ON req.requested_by_user_id = u.id
    WHERE req.id = ?`,
    [id],
  );

  const request = rows[0] || null;

  if (
    request &&
    userRole === ROLES.ACADEMIC_OFFICER &&
    Number(request.requested_by_user_id) !== Number(userId)
  ) {
    return null; // Don't allow viewing others' requests if CBDT
  }

  if (!request) {
    return null;
  }

  const [requestWithTeams] = await attachPracticeTeams([request]);
  return requestWithTeams;
}

function assertRequestAccess(request, userRole, userId) {
  if (!request) {
    throw makeServiceError(404, "Schedule request not found");
  }

  if (
    userRole === ROLES.ACADEMIC_OFFICER &&
    Number(request.requested_by_user_id) !== Number(userId)
  ) {
    throw makeServiceError(404, "Schedule request not found");
  }
}

async function findRequestForUpdate(id, connection) {
  const [rows] = await connection.query(
    `SELECT *
     FROM lab_schedule_requests
     WHERE id = ?
     LIMIT 1
     FOR UPDATE`,
    [id],
  );

  return rows[0] || null;
}

async function getLinkedEntriesForUpdate(id, connection) {
  const [rows] = await connection.query(
    `SELECT id, entry_status
     FROM lab_schedule_entries
     WHERE lab_schedule_request_id = ?
     FOR UPDATE`,
    [id],
  );

  return rows;
}

async function attachPracticeTeams(requests) {
  if (!Array.isArray(requests) || requests.length === 0) {
    return [];
  }

  const courseSectionIds = [
    ...new Set(
      requests
        .map((request) => Number(request.course_section_id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  if (courseSectionIds.length === 0) {
    return requests.map((request) => ({
      ...request,
      practice_teams: [],
    }));
  }

  const placeholders = courseSectionIds.map(() => "?").join(", ");

  const [teams] = await pool.query(
    `SELECT
       id,
       course_section_id,
       team_no,
       planned_size,
       team_status,
       notes,
       created_by_user_id,
       created_at,
       updated_at
     FROM practice_teams
     WHERE course_section_id IN (${placeholders})
     ORDER BY course_section_id, team_no`,
    courseSectionIds,
  );

  const teamsBySection = new Map();

  teams.forEach((team) => {
    const sectionId = Number(team.course_section_id);
    const currentTeams = teamsBySection.get(sectionId) || [];

    currentTeams.push(team);
    teamsBySection.set(sectionId, currentTeams);
  });

  return requests.map((request) => ({
    ...request,
    practice_teams: teamsBySection.get(Number(request.course_section_id)) || [],
  }));
}

async function synchronizePracticeTeams(request, userId, connection) {
  const [sectionRows] = await connection.query(
    `SELECT id, planned_enrollment, registered_enrollment
     FROM course_sections
     WHERE id = ?
     LIMIT 1
     FOR UPDATE`,
    [request.course_section_id],
  );

  const section = sectionRows[0];

  if (!section) {
    throw makeServiceError(400, "course_section_id does not exist");
  }

  const plannedEnrollment = Number(section.planned_enrollment);
  const registeredEnrollment = Number(section.registered_enrollment);
  const totalStudents =
    registeredEnrollment > 0 ? registeredEnrollment : plannedEnrollment;

  const teamCount = Number(request.requested_team_count);
  const maxStudentsPerTeam = request.max_students_per_team
    ? Number(request.max_students_per_team)
    : null;

  if (!Number.isInteger(totalStudents) || totalStudents <= 0) {
    throw makeServiceError(
      409,
      "Lớp học phần đã chọn chưa có số sinh viên đăng ký hoặc số sinh viên dự kiến.",
    );
  }

  if (!Number.isInteger(teamCount) || teamCount <= 0) {
    throw makeServiceError(
      400,
      "requested_team_count must be a positive integer",
    );
  }

  const baseSize = Math.floor(totalStudents / teamCount);
  const remainder = totalStudents % teamCount;

  const expectedTeams = Array.from({ length: teamCount }, (_, index) => ({
    team_no: index + 1,
    planned_size: baseSize + (index < remainder ? 1 : 0),
  }));

  const largestTeamSize = expectedTeams[0]?.planned_size || 0;

  if (maxStudentsPerTeam && largestTeamSize > maxStudentsPerTeam) {
    throw makeServiceError(
      409,
      `Each practice team would have ${largestTeamSize} students, exceeding the configured maximum of ${maxStudentsPerTeam}`,
    );
  }

  const [existingTeams] = await connection.query(
    `SELECT id, team_no, planned_size, team_status
     FROM practice_teams
     WHERE course_section_id = ?
     ORDER BY team_no
     FOR UPDATE`,
    [request.course_section_id],
  );

  const existingTeamIds = existingTeams.map((team) => Number(team.id));

  if (existingTeamIds.length > 0) {
    const placeholders = existingTeamIds.map(() => "?").join(", ");

    const [memberRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM practice_team_members
       WHERE practice_team_id IN (${placeholders})`,
      existingTeamIds,
    );

    const [scheduleRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM lab_schedule_entries
       WHERE practice_team_id IN (${placeholders})`,
      existingTeamIds,
    );

    const hasDependencies =
      Number(memberRows[0].total) > 0 || Number(scheduleRows[0].total) > 0;

    const structureMatches =
      existingTeams.length === expectedTeams.length &&
      expectedTeams.every((expectedTeam) =>
        existingTeams.some(
          (existingTeam) =>
            Number(existingTeam.team_no) === expectedTeam.team_no &&
            Number(existingTeam.planned_size) === expectedTeam.planned_size,
        ),
      );

    if (hasDependencies && !structureMatches) {
      throw makeServiceError(
        409,
        "Practice teams already have members or schedules and cannot be regenerated",
      );
    }

    if (hasDependencies) {
      return existingTeams;
    }
  }

  await connection.query(
    `DELETE FROM practice_teams
     WHERE course_section_id = ?
       AND team_no > ?`,
    [request.course_section_id, teamCount],
  );

  for (const team of expectedTeams) {
    await connection.query(
      `INSERT INTO practice_teams (
         course_section_id,
         team_no,
         planned_size,
         team_status,
         notes,
         created_by_user_id
       ) VALUES (?, ?, ?, 'planned', ?, ?)
       ON DUPLICATE KEY UPDATE
         planned_size = VALUES(planned_size),
         team_status = 'planned',
         notes = VALUES(notes),
         updated_at = CURRENT_TIMESTAMP`,
      [
        request.course_section_id,
        team.team_no,
        team.planned_size,
        `Tự động tạo từ yêu cầu xếp lịch #${request.id}`,
        userId,
      ],
    );
  }

  const [practiceTeams] = await connection.query(
    `SELECT
       id,
       course_section_id,
       team_no,
       planned_size,
       team_status,
       notes,
       created_by_user_id,
       created_at,
       updated_at
     FROM practice_teams
     WHERE course_section_id = ?
     ORDER BY team_no`,
    [request.course_section_id],
  );

  return practiceTeams;
}

function resolveValue(data, current, field) {
  return Object.prototype.hasOwnProperty.call(data, field)
    ? data[field]
    : current[field];
}

async function updateRequest(id, data, userId, userRole) {
  const current = await getRequestById(id, userRole, userId);
  assertRequestAccess(current, userRole, userId);

  if (current.request_status !== "draft") {
    throw makeServiceError(409, "Only draft schedule requests can be edited");
  }

  const values = {
    course_section_id: resolveValue(data, current, "course_section_id"),
    requested_team_count: resolveValue(data, current, "requested_team_count"),
    max_students_per_team: resolveValue(data, current, "max_students_per_team"),
    total_required_sessions: resolveValue(
      data,
      current,
      "total_required_sessions",
    ),
    preferred_week_start: resolveValue(data, current, "preferred_week_start"),
    preferred_week_end: resolveValue(data, current, "preferred_week_end"),
    preferred_day_of_week: resolveValue(data, current, "preferred_day_of_week"),
    preferred_time_slot_id: resolveValue(
      data,
      current,
      "preferred_time_slot_id",
    ),
    notes: resolveValue(data, current, "notes"),
  };

  await assertSchedulingReadiness(values.course_section_id, values);

  await pool.query(
    `UPDATE lab_schedule_requests
     SET course_section_id = ?,
         requested_team_count = ?,
         max_students_per_team = ?,
         total_required_sessions = ?,
         preferred_week_start = ?,
         preferred_week_end = ?,
         preferred_day_of_week = ?,
         preferred_time_slot_id = ?,
         notes = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      values.course_section_id,
      values.requested_team_count,
      values.max_students_per_team,
      values.total_required_sessions,
      values.preferred_week_start,
      values.preferred_week_end,
      values.preferred_day_of_week,
      values.preferred_time_slot_id,
      values.notes,
      id,
    ],
  );

  await recordAuditLog({
    entity_type: "lab_schedule_requests",
    entity_id: id,
    action_type: "update",
    old_status: "draft",
    new_status: "draft",
    action_by_user_id: userId,
  });

  return getRequestById(id, userRole, userId);
}

async function submitRequest(id, userId, userRole) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const request = await findRequestForUpdate(id, connection);
    assertRequestAccess(request, userRole, userId);

    if (request.request_status !== "draft") {
      throw makeServiceError(
        409,
        "Only draft schedule requests can be submitted",
      );
    }
    const practiceTeams = await synchronizePracticeTeams(
      request,
      userId,
      connection,
    );

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM lab_schedule_entries
       WHERE lab_schedule_request_id = ?`,
      [id],
    );

    // Hỗ trợ sửa dữ liệu cũ đã có lịch nhưng yêu cầu vẫn còn draft.
    const nextStatus =
      Number(countRows[0].total) > 0 ? "scheduled" : "pending_review";

    await connection.query(
      `UPDATE lab_schedule_requests
       SET request_status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextStatus, id],
    );

    await recordAuditLog(connection, {
      entity_type: "lab_schedule_requests",
      entity_id: id,
      action_type: "submit",
      old_status: request.request_status,
      new_status: nextStatus,
      action_by_user_id: userId,
      action_notes: {
        practice_team_ids: practiceTeams.map((team) => team.id),
        practice_team_count: practiceTeams.length,
      },
    });

    await connection.commit();
    return getRequestById(id, userRole, userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function transitionRequest(id, action, userId, userRole) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const request = await findRequestForUpdate(id, connection);
    assertRequestAccess(request, userRole, userId);

    const entries = await getLinkedEntriesForUpdate(id, connection);

    if (action === "approve") {
      if (!["scheduled", "pending_review"].includes(request.request_status)) {
        throw makeServiceError(409, "Only scheduled requests can be approved");
      }

      if (!entries.length) {
        throw makeServiceError(
          409,
          "The schedule request has no schedule entries",
        );
      }

      if (
        entries.some(
          (entry) => !["draft", "approved"].includes(entry.entry_status),
        )
      ) {
        throw makeServiceError(409, "The linked schedules cannot be approved");
      }

      await connection.query(
        `UPDATE lab_schedule_entries
         SET entry_status = 'approved',
             approved_by_user_id = ?,
             approved_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE lab_schedule_request_id = ?
           AND entry_status = 'draft'`,
        [userId, id],
      );

      await connection.query(
        `UPDATE lab_schedule_requests
         SET request_status = 'approved',
             reviewed_by_user_id = ?,
             reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [userId, id],
      );
    }

    if (action === "publish") {
      if (request.request_status !== "approved") {
        throw makeServiceError(409, "Only approved requests can be published");
      }

      if (!entries.length) {
        throw makeServiceError(
          409,
          "The schedule request has no schedule entries",
        );
      }

      if (
        entries.some(
          (entry) => !["approved", "published"].includes(entry.entry_status),
        )
      ) {
        throw makeServiceError(
          409,
          "All linked schedules must be approved first",
        );
      }

      await connection.query(
        `UPDATE lab_schedule_entries
         SET entry_status = 'published',
             published_by_user_id = ?,
             published_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE lab_schedule_request_id = ?
           AND entry_status = 'approved'`,
        [userId, id],
      );

      await connection.query(
        `UPDATE lab_schedule_requests
         SET request_status = 'published',
             published_by_user_id = ?,
             published_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [userId, id],
      );
    }

    if (action === "cancel") {
      if (["published", "cancelled"].includes(request.request_status)) {
        throw makeServiceError(
          409,
          "Published or cancelled requests cannot be cancelled",
        );
      }

      if (
        entries.some((entry) =>
          ["published", "completed"].includes(entry.entry_status),
        )
      ) {
        throw makeServiceError(
          409,
          "Published or completed schedules cannot be cancelled directly",
        );
      }

      await connection.query(
        `UPDATE lab_schedule_entries
         SET entry_status = 'cancelled',
             cancelled_by_user_id = ?,
             cancelled_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE lab_schedule_request_id = ?
           AND entry_status IN ('draft', 'approved')`,
        [userId, id],
      );

      await connection.query(
        `UPDATE lab_schedule_requests
         SET request_status = 'cancelled',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id],
      );
    }

    const targetStatus = {
      approve: "approved",
      publish: "published",
      cancel: "cancelled",
    }[action];

    for (const entry of entries) {
      if (entry.entry_status === targetStatus) continue;

      await recordAuditLog(connection, {
        entity_type: "lab_schedule_entries",
        entity_id: entry.id,
        action_type: action,
        old_status: entry.entry_status,
        new_status: targetStatus,
        action_by_user_id: userId,
        action_notes: { lab_schedule_request_id: Number(id) },
      });
    }

    await recordAuditLog(connection, {
      entity_type: "lab_schedule_requests",
      entity_id: Number(id),
      action_type: action,
      old_status: request.request_status,
      new_status: targetStatus,
      action_by_user_id: userId,
    });

    await connection.commit();
    return getRequestById(id, userRole, userId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function approveRequest(id, userId, userRole) {
  return transitionRequest(id, "approve", userId, userRole);
}

function cancelRequest(id, userId, userRole) {
  return transitionRequest(id, "cancel", userId, userRole);
}

function publishRequest(id, userId, userRole) {
  return transitionRequest(id, "publish", userId, userRole);
}

module.exports = {
  approveRequest,
  cancelRequest,
  createRequest,
  getRequestById,
  getRequests,
  publishRequest,
  submitRequest,
  updateRequest,
};
