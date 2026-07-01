const bcrypt = require("bcryptjs");

const pool = require("../../config/database");
const { recordAuditLog } = require("../audit/audit.service");

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const ROLE_CODES = ["QTV", "CBDT", "GV", "KTV", "SV"];
const ACCOUNT_STATUSES = ["active", "locked", "inactive"];
const COURSE_STATUSES = ["active", "inactive", "archived"];
const SECTION_STATUSES = ["draft", "open", "closed", "cancelled"];
const COHORT_STATUSES = ["active", "inactive", "archived"];
const DEVICE_TYPES = ["computer", "projector", "network", "other"];
const DEVICE_STATUSES = [
  "working",
  "minor_issue",
  "broken",
  "under_repair",
  "replaced",
];

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function makeValidationError(errors) {
  return new ApiError(400, "Validation failed", errors);
}

function parseId(value, field = "id") {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw makeValidationError([
      { field, message: `${field} must be a positive integer` },
    ]);
  }

  return id;
}

function normalizeString(value, field, options = {}) {
  const { required = false, maxLength = 255, nullable = false } = options;

  if (value === undefined) {
    if (required) {
      return { error: `${field} is required` };
    }

    return { skip: true };
  }

  if (value === null) {
    if (nullable) {
      return { value: null };
    }

    return { error: `${field} cannot be null` };
  }

  if (typeof value !== "string") {
    return { error: `${field} must be a string` };
  }

  const trimmed = value.trim();

  if (required && !trimmed) {
    return { error: `${field} is required` };
  }

  if (trimmed.length > maxLength) {
    return { error: `${field} must be at most ${maxLength} characters` };
  }

  if (!required && !trimmed && nullable) {
    return { value: null };
  }

  return { value: trimmed };
}

function normalizeInteger(value, field, options = {}) {
  const {
    required = false,
    min = null,
    max = null,
    nullable = false,
  } = options;

  if (value === undefined) {
    if (required) {
      return { error: `${field} is required` };
    }

    return { skip: true };
  }

  if (value === null || value === "") {
    if (nullable) {
      return { value: null };
    }

    return { error: `${field} is required` };
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue)) {
    return { error: `${field} must be an integer` };
  }

  if (min !== null && numberValue < min) {
    return { error: `${field} must be at least ${min}` };
  }

  if (max !== null && numberValue > max) {
    return { error: `${field} must be at most ${max}` };
  }

  return { value: numberValue };
}

function normalizeBoolean(value, field, options = {}) {
  const { required = false } = options;

  if (value === undefined) {
    if (required) {
      return { error: `${field} is required` };
    }

    return { skip: true };
  }

  if (value === true || value === 1 || value === "1" || value === "true") {
    return { value: 1 };
  }

  if (value === false || value === 0 || value === "0" || value === "false") {
    return { value: 0 };
  }

  return { error: `${field} must be a boolean` };
}

function normalizeEnum(value, field, values, options = {}) {
  const { required = false } = options;

  if (value === undefined) {
    if (required) {
      return { error: `${field} is required` };
    }

    return { skip: true };
  }

  if (typeof value !== "string") {
    return { error: `${field} must be a string` };
  }

  const normalized = value.trim();

  if (!values.includes(normalized)) {
    return { error: `${field} must be one of: ${values.join(", ")}` };
  }

  return { value: normalized };
}

function normalizeDate(value, field, options = {}) {
  const { required = false, nullable = false } = options;

  if (value === undefined) {
    if (required) {
      return { error: `${field} is required` };
    }

    return { skip: true };
  }

  if (value === null || value === "") {
    if (nullable) {
      return { value: null };
    }

    return { error: `${field} is required` };
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: `${field} must use YYYY-MM-DD format` };
  }

  const timestamp = Date.parse(`${value}T00:00:00Z`);

  if (Number.isNaN(timestamp)) {
    return { error: `${field} must be a valid date` };
  }

  return { value };
}

function normalizeTime(value, field, options = {}) {
  const { required = false, nullable = false } = options;

  if (value === undefined) {
    if (required) {
      return { error: `${field} is required` };
    }

    return { skip: true };
  }

  if (value === null || value === "") {
    if (nullable) {
      return { value: null };
    }

    return { error: `${field} is required` };
  }

  if (
    typeof value !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
  ) {
    return { error: `${field} must use HH:MM or HH:MM:SS format` };
  }

  return { value };
}

function normalizeField(body, fieldConfig, isCreate) {
  const value = body[fieldConfig.name];
  const required = Boolean(isCreate && fieldConfig.required);

  switch (fieldConfig.type) {
    case "string":
      return normalizeString(value, fieldConfig.name, {
        required,
        maxLength: fieldConfig.maxLength,
        nullable: fieldConfig.nullable,
      });
    case "int":
      return normalizeInteger(value, fieldConfig.name, {
        required,
        min: fieldConfig.min,
        max: fieldConfig.max,
        nullable: fieldConfig.nullable,
      });
    case "boolean":
      return normalizeBoolean(value, fieldConfig.name, { required });
    case "enum":
      return normalizeEnum(value, fieldConfig.name, fieldConfig.values, {
        required,
      });
    case "date":
      return normalizeDate(value, fieldConfig.name, {
        required,
        nullable: fieldConfig.nullable,
      });
    case "time":
      return normalizeTime(value, fieldConfig.name, {
        required,
        nullable: fieldConfig.nullable,
      });
    default:
      return { error: `Unsupported field type for ${fieldConfig.name}` };
  }
}

function normalizePayload(body, fields, isCreate, options = {}) {
  const errors = [];
  const values = {};

  fields.forEach((fieldConfig) => {
    if (!isCreate && !hasOwn(body, fieldConfig.name)) {
      return;
    }

    const normalized = normalizeField(body, fieldConfig, isCreate);

    if (normalized.error) {
      errors.push({ field: fieldConfig.name, message: normalized.error });
      return;
    }

    if (!normalized.skip) {
      values[fieldConfig.name] = normalized.value;
    }
  });

  if (errors.length) {
    throw makeValidationError(errors);
  }

  if (
    !isCreate &&
    Object.keys(values).length === 0 &&
    !options.allowEmptyUpdate
  ) {
    throw new ApiError(400, "No supported fields to update");
  }

  return values;
}

function assertDateRange(values, startField, endField) {
  if (
    values[startField] &&
    values[endField] &&
    values[endField] < values[startField]
  ) {
    throw makeValidationError([
      {
        field: endField,
        message: `${endField} must be greater than or equal to ${startField}`,
      },
    ]);
  }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateOnly(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDateOnlyString(value) {
  const text = String(value || "");

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (value instanceof Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const getPart = (type) =>
      parts.find((part) => part.type === type)?.value || "";

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
  }

  return text.slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function normalizeAcademicYear(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4})\s*-\s*(\d{4})$/);

  if (!match) {
    throw makeValidationError([
      {
        field: "academic_year",
        message: "academic_year must use YYYY - YYYY format",
      },
    ]);
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);

  if (endYear !== startYear + 1) {
    throw makeValidationError([
      {
        field: "academic_year",
        message: "academic_year end year must be the next year",
      },
    ]);
  }

  return {
    value: `${startYear} - ${endYear}`,
    startYear,
    endYear,
  };
}

function buildSemesterName(values) {
  return `Học kỳ ${values.semester_no} - Năm học ${values.academic_year}`;
}

function assertSemesterWeekPlan(values) {
  const startDate = parseDateOnly(values.start_date);
  const endDate = parseDateOnly(values.end_date);
  const errors = [];

  if (startDate.getUTCDay() !== 1) {
    errors.push({
      field: "start_date",
      message: "start_date must be a Monday",
    });
  }

  if (endDate.getUTCDay() !== 0) {
    errors.push({
      field: "end_date",
      message: "end_date must be a Sunday",
    });
  }

  const dayCount =
    Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;

  if (dayCount <= 0 || dayCount % 7 !== 0) {
    errors.push({
      field: "end_date",
      message: "semester date range must contain full weeks",
    });
  }

  if (errors.length) {
    throw makeValidationError(errors);
  }

  return {
    startDate,
    endDate,
    weekCount: dayCount / 7,
  };
}

function assertSemesterInsideAcademicYear(values, academicYear) {
  const startYear = parseDateOnly(values.start_date).getUTCFullYear();
  const endYear = parseDateOnly(values.end_date).getUTCFullYear();
  const allowedYears = [academicYear.startYear, academicYear.endYear];

  if (!allowedYears.includes(startYear) || !allowedYears.includes(endYear)) {
    throw makeValidationError([
      {
        field: "academic_year",
        message: "semester dates must be inside the selected academic year",
      },
    ]);
  }
}

function assertPeriodRange(values) {
  if (
    values.start_period !== undefined &&
    values.end_period !== undefined &&
    values.end_period < values.start_period
  ) {
    throw makeValidationError([
      {
        field: "end_period",
        message: "end_period must be greater than or equal to start_period",
      },
    ]);
  }
}

function mapDatabaseError(error) {
  if (error && error.code === "ER_DUP_ENTRY") {
    throw new ApiError(409, "Duplicate value violates a unique constraint");
  }

  if (
    error &&
    [
      "ER_NO_REFERENCED_ROW_2",
      "ER_ROW_IS_REFERENCED_2",
      "ER_CHECK_CONSTRAINT_VIOLATED",
    ].includes(error.code)
  ) {
    throw new ApiError(400, "Database constraint violation");
  }

  throw error;
}

async function runQuery(callback) {
  try {
    return await callback();
  } catch (error) {
    mapDatabaseError(error);
    return null;
  }
}

function toBoolean(value) {
  return Boolean(Number(value));
}

function toAccountResponse(row) {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    email: row.email,
    phone_number: row.phone_number,
    role_code: row.role_code,
    account_status: row.account_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function getMasterStatus(resource, item) {
  if (!item) {
    return null;
  }

  switch (resource) {
    case "semesters":
    case "time-slots":
      return item.is_active ? "active" : "inactive";
    case "courses":
      return item.course_status || null;
    case "course-sections":
      return item.section_status || null;
    case "student-cohorts":
      return item.cohort_status || null;
    default:
      return null;
  }
}

async function listAccounts(filters = {}) {
  const where = [];
  const params = [];

  if (filters.role_code) {
    if (!ROLE_CODES.includes(filters.role_code)) {
      throw makeValidationError([
        { field: "role_code", message: "Invalid role_code" },
      ]);
    }

    where.push("role_code = ?");
    params.push(filters.role_code);
  }

  if (filters.account_status) {
    if (!ACCOUNT_STATUSES.includes(filters.account_status)) {
      throw makeValidationError([
        { field: "account_status", message: "Invalid account_status" },
      ]);
    }

    where.push("account_status = ?");
    params.push(filters.account_status);
  }

  if (filters.search) {
    where.push("(username LIKE ? OR full_name LIKE ? OR email LIKE ?)");
    const searchValue = `%${String(filters.search).trim()}%`;
    params.push(searchValue, searchValue, searchValue);
  }

  const [rows] = await pool.query(
    `SELECT id, username, full_name, email, phone_number, role_code, account_status, created_at, updated_at
     FROM users
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY FIELD(role_code, 'QTV', 'CBDT', 'GV', 'KTV', 'SV'), username`,
    params,
  );

  return rows.map(toAccountResponse);
}

function normalizeAccountPayload(body, isCreate) {
  const fields = [
    { name: "username", type: "string", required: true, maxLength: 50 },
    { name: "full_name", type: "string", required: true, maxLength: 150 },
    { name: "email", type: "string", required: true, maxLength: 150 },
    { name: "phone_number", type: "string", maxLength: 20, nullable: true },
    { name: "role_code", type: "enum", required: true, values: ROLE_CODES },
    { name: "account_status", type: "enum", values: ACCOUNT_STATUSES },
  ];

  const values = normalizePayload(body, fields, isCreate, {
    allowEmptyUpdate: hasOwn(body, "password"),
  });

  if (isCreate) {
    const password = normalizeString(body.password, "password", {
      required: true,
      maxLength: 72,
    });

    if (password.error) {
      throw makeValidationError([
        { field: "password", message: password.error },
      ]);
    }

    values.password_hash = bcrypt.hashSync(password.value, 10);
  } else if (hasOwn(body, "password")) {
    const password = normalizeString(body.password, "password", {
      required: true,
      maxLength: 72,
    });

    if (password.error) {
      throw makeValidationError([
        { field: "password", message: password.error },
      ]);
    }

    values.password_hash = bcrypt.hashSync(password.value, 10);
  }

  return values;
}

async function findAccountById(id) {
  const [rows] = await pool.query(
    `SELECT id, username, full_name, email, phone_number, role_code, account_status, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] ? toAccountResponse(rows[0]) : null;
}

async function createAccount(body, actorUserId = null) {
  const values = normalizeAccountPayload(body, true);
  const columns = Object.keys(values);
  const placeholders = columns.map(() => "?").join(", ");
  const params = columns.map((column) => values[column]);

  const [result] = await runQuery(() =>
    pool.query(
      `INSERT INTO users (${columns.map((column) => `\`${column}\``).join(", ")})
     VALUES (${placeholders})`,
      params,
    ),
  );

  const account = await findAccountById(result.insertId);

  await recordAuditLog({
    entity_type: "users",
    entity_id: account.id,
    action_type: "create",
    new_status: account.account_status,
    action_by_user_id: actorUserId,
    action_notes: {
      username: account.username,
      role_code: account.role_code,
    },
  });

  return account;
}

async function updateAccount(idParam, body, actorUserId = null) {
  const id = parseId(idParam);
  const before = await findAccountById(id);

  if (!before) {
    throw new ApiError(404, "Account not found");
  }

  const values = normalizeAccountPayload(body, false);

  if (
    Number(actorUserId) === Number(id) &&
    ((hasOwn(values, "account_status") && values.account_status !== "active") ||
      (hasOwn(values, "role_code") && values.role_code !== "QTV"))
  ) {
    throw new ApiError(
      400,
      "Cannot remove access from the current admin account",
    );
  }

  const setClauses = Object.keys(values).map((column) => `\`${column}\` = ?`);
  const params = Object.keys(values).map((column) => values[column]);

  const [result] = await runQuery(() =>
    pool.query(`UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]),
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, "Account not found");
  }

  const account = await findAccountById(id);

  await recordAuditLog({
    entity_type: "users",
    entity_id: account.id,
    action_type: "update",
    old_status: before.account_status,
    new_status: account.account_status,
    action_by_user_id: actorUserId,
    action_notes: {
      username: account.username,
      changed_fields: Object.keys(values).filter(
        (field) => field !== "password_hash",
      ),
    },
  });

  return account;
}

async function disableAccount(idParam, actorUserId) {
  const id = parseId(idParam);

  if (Number(actorUserId) === Number(id)) {
    throw new ApiError(400, "Cannot disable the current account");
  }

  const before = await findAccountById(id);

  if (!before) {
    throw new ApiError(404, "Account not found");
  }

  const [result] = await pool.query(
    `UPDATE users SET account_status = 'inactive' WHERE id = ?`,
    [id],
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, "Account not found");
  }

  const account = await findAccountById(id);

  await recordAuditLog({
    entity_type: "users",
    entity_id: account.id,
    action_type: "disable",
    old_status: before.account_status,
    new_status: account.account_status,
    action_by_user_id: actorUserId,
    action_notes: {
      username: account.username,
    },
  });

  return account;
}

const MASTER_RESOURCES = {
  semesters: {
    table: "semesters",
    writable: true,
    fields: [
      { name: "academic_year", type: "string", required: true, maxLength: 20 },
      { name: "semester_no", type: "int", required: true, min: 1, max: 3 },
      { name: "semester_name", type: "string", required: true, maxLength: 80 },
      { name: "start_date", type: "date", required: true },
      { name: "end_date", type: "date", required: true },
      { name: "is_active", type: "boolean" },
    ],
    afterNormalize(values) {
      assertDateRange(values, "start_date", "end_date");
    },
  },
  "academic-weeks": {
    table: "academic_weeks",
    writable: true,
    fields: [
      { name: "semester_id", type: "int", required: true, min: 1 },
      { name: "week_no", type: "int", required: true, min: 1 },
      { name: "start_date", type: "date", required: true },
      { name: "end_date", type: "date", required: true },
    ],
    afterNormalize(values) {
      assertDateRange(values, "start_date", "end_date");
    },
  },
  "time-slots": {
    table: "time_slots",
    writable: true,
    fields: [
      { name: "slot_label", type: "string", required: true, maxLength: 50 },
      { name: "start_period", type: "int", required: true, min: 1, max: 20 },
      { name: "end_period", type: "int", required: true, min: 1, max: 20 },
      { name: "start_time", type: "time", nullable: true },
      { name: "end_time", type: "time", nullable: true },
      { name: "is_active", type: "boolean" },
    ],
    afterNormalize(values) {
      assertPeriodRange(values);
    },
  },
  courses: {
    table: "courses",
    writable: true,
    fields: [
      { name: "course_code", type: "string", required: true, maxLength: 20 },
      { name: "course_name", type: "string", required: true, maxLength: 200 },
      { name: "credits", type: "int", min: 0, max: 20 },
      { name: "lecture_periods", type: "int", min: 0, max: 255 },
      { name: "lab_periods", type: "int", min: 0, max: 255 },
      { name: "course_status", type: "enum", values: COURSE_STATUSES },
      { name: "description", type: "string", maxLength: 10000, nullable: true },
    ],
  },
  "student-cohorts": {
    table: "student_cohorts",
    writable: true,
    fields: [
      { name: "cohort_code", type: "string", required: true, maxLength: 30 },
      { name: "faculty_name", type: "string", maxLength: 120, nullable: true },
      { name: "major_name", type: "string", maxLength: 120, nullable: true },
      { name: "intake_year", type: "string", maxLength: 20, nullable: true },
      { name: "cohort_status", type: "enum", values: COHORT_STATUSES },
    ],
  },
  "course-sections": {
    table: "course_sections",
    writable: true,
    fields: [
      { name: "course_id", type: "int", required: true, min: 1 },
      { name: "semester_id", type: "int", required: true, min: 1 },
      { name: "group_no", type: "string", maxLength: 20 },
      { name: "registered_enrollment", type: "int", min: 0 },
      { name: "planned_enrollment", type: "int", min: 0, nullable: true },
      { name: "class_start_date", type: "date", nullable: true },
      { name: "class_end_date", type: "date", nullable: true },
      { name: "section_status", type: "enum", values: SECTION_STATUSES },
      { name: "notes", type: "string", maxLength: 255, nullable: true },
    ],
    afterNormalize(values) {
      assertDateRange(values, "class_start_date", "class_end_date");
    },
  },
  lecturers: {
    writable: false,
  },
  "lecturer-assignments": {
    writable: false,
  },
};

function getMasterResource(resource) {
  const config = MASTER_RESOURCES[resource];

  if (!config) {
    throw new ApiError(404, "Master data resource not found");
  }

  return config;
}

async function listMasterData(resource) {
  getMasterResource(resource);

  switch (resource) {
    case "semesters":
      return listSemesters();
    case "academic-weeks":
      return listAcademicWeeks();
    case "time-slots":
      return listTimeSlots();
    case "courses":
      return listCourses();
    case "course-sections":
      return listCourseSections();
    case "student-cohorts":
      return listStudentCohorts();
    case "lecturers":
      return listLecturers();
    case "lecturer-assignments":
      return listLecturerAssignments();
    default:
      throw new ApiError(404, "Master data resource not found");
  }
}

async function listSemesters() {
  const [rows] = await pool.query(
    `SELECT id,
            academic_year,
            semester_no,
            semester_name,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
            is_active,
            created_at,
            updated_at
     FROM semesters
     ORDER BY is_active DESC, start_date DESC, semester_no DESC`,
  );

  return rows.map((row) => ({
    ...row,
    semester_code: `HK${row.semester_no}_${String(row.academic_year).replace("-", "_")}`,
    is_active: toBoolean(row.is_active),
  }));
}

async function listAcademicWeeks() {
  const [rows] = await pool.query(
    `SELECT
       aw.id,
       aw.semester_id,
       aw.week_no,
       DATE_FORMAT(aw.start_date, '%Y-%m-%d') AS start_date,
       DATE_FORMAT(aw.end_date, '%Y-%m-%d') AS end_date,
       aw.created_at,
       s.academic_year,
       s.semester_no,
       s.semester_name
     FROM academic_weeks aw
     JOIN semesters s ON s.id = aw.semester_id
     ORDER BY s.start_date DESC, aw.week_no`,
  );

  return rows.map((row) => ({
    ...row,
    semester_code: `HK${row.semester_no}_${String(row.academic_year).replace("-", "_")}`,
    notes: null,
  }));
}

async function listTimeSlots() {
  const [rows] = await pool.query(
    `SELECT id, slot_label, start_period, end_period, start_time, end_time, is_active, created_at, updated_at
     FROM time_slots
     ORDER BY start_period, end_period`,
  );

  return rows.map((row) => ({
    ...row,
    slot_code: `CA_${row.start_period}_${row.end_period}`,
    is_active: toBoolean(row.is_active),
  }));
}

async function listCourses() {
  const [rows] = await pool.query(
    `SELECT id, course_code, course_name, credits, lecture_periods, lab_periods, is_lab_required,
            course_status, description, created_at, updated_at
     FROM courses
     ORDER BY course_code`,
  );

  return rows.map((row) => ({
    ...row,
    is_lab_required: toBoolean(row.is_lab_required),
  }));
}

function formatCourseSectionGroupNo(value) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return "";
  }

  return String(numberValue).padStart(2, "0");
}

async function resolveNextCourseSectionGroupNo(
  courseId,
  semesterId,
  excludedSectionId = null,
) {
  const where = [
    "course_id = ?",
    "semester_id = ?",
    "group_no REGEXP '^[0-9]+$'",
  ];
  const params = [courseId, semesterId];

  if (excludedSectionId) {
    where.push("id <> ?");
    params.push(excludedSectionId);
  }

  const [rows] = await pool.query(
    `SELECT COALESCE(MAX(CAST(group_no AS UNSIGNED)), 0) AS max_group_no
     FROM course_sections
     WHERE ${where.join(" AND ")}`,
    params,
  );

  return formatCourseSectionGroupNo(Number(rows[0]?.max_group_no || 0) + 1);
}

async function listCourseSections() {
  const [rows] = await pool.query(
    `SELECT
       cs.id,
       cs.course_id,
       c.course_code,
       c.course_name,
       cs.semester_id,
       s.academic_year,
       s.semester_no,
       s.semester_name,
       cs.group_no,
       cs.registered_enrollment,
       cs.planned_enrollment,
       DATE_FORMAT(cs.class_start_date, '%Y-%m-%d') AS class_start_date,
       DATE_FORMAT(cs.class_end_date, '%Y-%m-%d') AS class_end_date,
       cs.section_status,
       cs.notes,
       cs.created_at,
       cs.updated_at,
       lecturer.full_name AS lecturer_name
     FROM course_sections cs
     JOIN courses c ON c.id = cs.course_id
     JOIN semesters s ON s.id = cs.semester_id
     LEFT JOIN course_section_lecturers csl
       ON csl.course_section_id = cs.id
      AND csl.lecturer_role = 'primary'
     LEFT JOIN users lecturer ON lecturer.id = csl.lecturer_user_id
     ORDER BY s.start_date DESC, c.course_code, cs.group_no`,
  );

  return rows.map((row) => ({
    ...row,
    semester_code: `HK${row.semester_no}_${String(row.academic_year).replace("-", "_")}`,
    section_code: `${row.course_code}_${row.group_no}`,
    read_only: false,
  }));
}

async function listStudentCohorts() {
  const [rows] = await pool.query(
    `SELECT id, cohort_code, faculty_name, major_name, intake_year, cohort_status, created_at, updated_at
     FROM student_cohorts
     ORDER BY cohort_code`,
  );

  return rows;
}

async function listLecturerAssignments() {
  const [rows] = await pool.query(
    `SELECT
       csl.course_section_id,
       csl.lecturer_user_id,
       csl.lecturer_role,
       csl.assigned_at,
       u.full_name AS lecturer_name,
       c.course_code,
       c.course_name,
       cs.group_no
     FROM course_section_lecturers csl
     JOIN users u ON u.id = csl.lecturer_user_id
     JOIN course_sections cs ON cs.id = csl.course_section_id
     JOIN courses c ON c.id = cs.course_id
     ORDER BY c.course_code, cs.group_no, csl.lecturer_role`,
  );

  return rows.map((row) => ({
    id: `${row.course_section_id}-${row.lecturer_user_id}-${row.lecturer_role}`,
    ...row,
    course_section_code: `${row.course_code}_${row.group_no}`,
    course_section_label: `${row.course_code} - Nhom ${row.group_no}`,
    read_only: true,
  }));
}

async function listLecturers() {
  const [rows] = await pool.query(
    `SELECT id, username, full_name, email
     FROM users
     WHERE role_code = 'GV'
       AND account_status = 'active'
     ORDER BY full_name, username`,
  );

  return rows;
}

const LECTURER_ASSIGNMENT_FIELDS = [
  {
    name: "course_section_id",
    type: "int",
    required: true,
    min: 1,
  },
  {
    name: "lecturer_name",
    type: "string",
    required: true,
    maxLength: 150,
  },
];

async function findLecturerAssignment(
  courseSectionId,
  lecturerUserId,
  connection = pool,
) {
  const [rows] = await connection.query(
    `SELECT
       csl.course_section_id,
       csl.lecturer_user_id,
       csl.lecturer_role,
       csl.assigned_at,
       u.full_name AS lecturer_name,
       c.course_code,
       c.course_name,
       cs.group_no
     FROM course_section_lecturers csl
     JOIN users u ON u.id = csl.lecturer_user_id
     JOIN course_sections cs ON cs.id = csl.course_section_id
     JOIN courses c ON c.id = cs.course_id
     WHERE csl.course_section_id = ?
       AND csl.lecturer_user_id = ?
       AND csl.lecturer_role = 'primary'
     LIMIT 1`,
    [courseSectionId, lecturerUserId],
  );

  if (!rows[0]) {
    throw new ApiError(404, "Lecturer assignment not found");
  }

  return {
    id: `${rows[0].course_section_id}-${rows[0].lecturer_user_id}-${rows[0].lecturer_role}`,
    ...rows[0],
    course_section_code: `${rows[0].course_code}_${rows[0].group_no}`,
    course_section_label: `${rows[0].course_code} - Nhom ${rows[0].group_no}`,
    read_only: true,
  };
}

async function createLecturerAssignment(body, actorUserId = null) {
  const values = normalizePayload(body, LECTURER_ASSIGNMENT_FIELDS, true);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [sectionRows] = await connection.query(
      `SELECT id, section_status
       FROM course_sections
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [values.course_section_id],
    );

    const courseSection = sectionRows[0];

    if (!courseSection) {
      throw new ApiError(404, "Course section not found");
    }

    if (courseSection.section_status !== "open") {
      throw new ApiError(
        409,
        "Only open course sections can receive lecturer assignments",
      );
    }

    const [existingAssignments] = await connection.query(
      `SELECT lecturer_user_id
       FROM course_section_lecturers
       WHERE course_section_id = ?
       LIMIT 1`,
      [values.course_section_id],
    );

    if (existingAssignments.length > 0) {
      throw new ApiError(
        409,
        "The selected course section already has a lecturer assignment",
      );
    }

    const [lecturerRows] = await connection.query(
      `SELECT id, username, full_name
       FROM users
       WHERE full_name = ?
         AND role_code = 'GV'
         AND account_status = 'active'
       ORDER BY id
       LIMIT 2`,
      [values.lecturer_name],
    );

    if (lecturerRows.length === 0) {
      throw new ApiError(
        404,
        "Active lecturer account not found for the provided lecturer_name",
      );
    }

    if (lecturerRows.length > 1) {
      throw new ApiError(
        409,
        "Multiple lecturer accounts have the provided lecturer_name",
        {
          lecturer_name: values.lecturer_name,
          matched_usernames: lecturerRows.map((item) => item.username),
        },
      );
    }

    const lecturer = lecturerRows[0];

    await connection.query(
      `INSERT INTO course_section_lecturers (
         course_section_id,
         lecturer_user_id
       ) VALUES (?, ?)`,
      [values.course_section_id, lecturer.id],
    );

    await recordAuditLog(connection, {
      entity_type: "course_section_lecturers",
      entity_id: values.course_section_id,
      action_type: "create",
      new_status: "primary",
      action_by_user_id: actorUserId,
      action_notes: {
        course_section_id: values.course_section_id,
        lecturer_user_id: lecturer.id,
        lecturer_name: lecturer.full_name,
        lecturer_role: "primary",
      },
    });

    await connection.commit();

    return findLecturerAssignment(values.course_section_id, lecturer.id);
  } catch (error) {
    await connection.rollback();
    mapDatabaseError(error);
  } finally {
    connection.release();
  }
}

async function createSemesterWithWeeks(values, actorUserId = null) {
  const academicYear = normalizeAcademicYear(values.academic_year);

  values.academic_year = academicYear.value;
  values.semester_name = buildSemesterName(values);

  const { startDate, weekCount } = assertSemesterWeekPlan(values);
  assertSemesterInsideAcademicYear(values, academicYear);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingSemesters] = await connection.query(
      `SELECT id,
              semester_no,
              DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
       FROM semesters
       WHERE academic_year = ?
       ORDER BY semester_no`,
      [values.academic_year],
    );

    if (
      existingSemesters.some(
        (semester) =>
          Number(semester.semester_no) === Number(values.semester_no),
      )
    ) {
      throw new ApiError(409, "Semester already exists for this academic year");
    }

    const previousSemester = existingSemesters.find(
      (semester) =>
        Number(semester.semester_no) === Number(values.semester_no) - 1,
    );
    const laterSemester = existingSemesters.find(
      (semester) => Number(semester.semester_no) > Number(values.semester_no),
    );
    const validationErrors = [];

    if (Number(values.semester_no) > 1 && !previousSemester) {
      validationErrors.push({
        field: "semester_no",
        message: "previous semester must be created first",
      });
    }

    if (laterSemester) {
      validationErrors.push({
        field: "semester_no",
        message: "semesters must be created in chronological order",
      });
    }

    if (
      previousSemester &&
      values.start_date <= toDateOnlyString(previousSemester.end_date)
    ) {
      validationErrors.push({
        field: "start_date",
        message: "start_date must be after the previous semester end_date",
      });
    }

    existingSemesters.forEach((semester) => {
      const existingStart = toDateOnlyString(semester.start_date);
      const existingEnd = toDateOnlyString(semester.end_date);

      if (
        !(values.end_date < existingStart || values.start_date > existingEnd)
      ) {
        validationErrors.push({
          field: "start_date",
          message: "semester date range overlaps an existing semester",
        });
      }
    });

    if (validationErrors.length) {
      throw makeValidationError(validationErrors);
    }

    const columns = Object.keys(values);
    const placeholders = columns.map(() => "?").join(", ");
    const params = columns.map((column) => values[column]);

    const [semesterResult] = await connection.query(
      `INSERT INTO semesters (${columns.map((column) => `\`${column}\``).join(", ")})
       VALUES (${placeholders})`,
      params,
    );

    const semesterId = semesterResult.insertId;

    const [weekNoRows] = await connection.query(
      `SELECT COALESCE(MAX(aw.week_no), 0) AS max_week_no
       FROM academic_weeks aw
       JOIN semesters s ON s.id = aw.semester_id
       WHERE s.academic_year = ?`,
      [values.academic_year],
    );

    const startWeekNo = Number(weekNoRows[0]?.max_week_no || 0) + 1;
    const weekRows = Array.from({ length: weekCount }, (_, index) => {
      const weekStart = addDays(startDate, index * 7);
      const weekEnd = addDays(weekStart, 6);

      return [
        semesterId,
        startWeekNo + index,
        formatDateOnly(weekStart),
        formatDateOnly(weekEnd),
      ];
    });

    await connection.query(
      `INSERT INTO academic_weeks (semester_id, week_no, start_date, end_date)
       VALUES ?`,
      [weekRows],
    );

    await recordAuditLog(connection, {
      entity_type: "semesters",
      entity_id: semesterId,
      action_type: "create",
      new_status: values.is_active === 0 ? "inactive" : "active",
      action_by_user_id: actorUserId,
      action_notes: {
        resource: "semesters",
        code: `HK${values.semester_no}_${String(values.academic_year).replace("-", "_")}`,
        generated_week_count: weekCount,
        start_week_no: startWeekNo,
        end_week_no: startWeekNo + weekCount - 1,
      },
    });

    await connection.commit();

    return findMasterDataItem("semesters", semesterId);
  } catch (error) {
    await connection.rollback();
    mapDatabaseError(error);
  } finally {
    connection.release();
  }
}

async function createMasterData(resource, body, actorUserId = null) {
  const config = getMasterResource(resource);
  if (resource === "lecturer-assignments") {
    return createLecturerAssignment(body, actorUserId);
  }
  if (!config.writable) {
    throw new ApiError(
      405,
      "This master data resource is read-only in issue #48",
    );
  }

  if (resource === "academic-weeks") {
    throw new ApiError(
      405,
      "Academic weeks are generated automatically from semesters",
    );
  }

  const values = normalizePayload(body, config.fields, true);

  if (resource === "course-sections") {
    values.group_no = await resolveNextCourseSectionGroupNo(
      values.course_id,
      values.semester_id,
    );
  }

  if (config.afterNormalize) {
    config.afterNormalize(values);
  }

  if (resource === "semesters") {
    return createSemesterWithWeeks(values, actorUserId);
  }

  const columns = Object.keys(values);
  const placeholders = columns.map(() => "?").join(", ");
  const params = columns.map((column) => values[column]);

  const [result] = await runQuery(() =>
    pool.query(
      `INSERT INTO ${config.table} (${columns.map((column) => `\`${column}\``).join(", ")})
     VALUES (${placeholders})`,
      params,
    ),
  );

  const item = await findMasterDataItem(resource, result.insertId);

  await recordAuditLog({
    entity_type: config.table,
    entity_id: item.id,
    action_type: "create",
    new_status: getMasterStatus(resource, item),
    action_by_user_id: actorUserId,
    action_notes: {
      resource,
      code:
        item.semester_code ||
        item.slot_code ||
        item.course_code ||
        item.section_code ||
        item.cohort_code ||
        null,
    },
  });

  return item;
}

async function updateMasterData(resource, idParam, body, actorUserId = null) {
  const config = getMasterResource(resource);

  if (!config.writable) {
    throw new ApiError(
      405,
      "This master data resource is read-only in issue #48",
    );
  }

  const id = parseId(idParam);
  const before = await findMasterDataItem(resource, id);
  const values = normalizePayload(body, config.fields, false);

  if (
    resource === "course-sections" &&
    (hasOwn(values, "course_id") || hasOwn(values, "semester_id"))
  ) {
    const nextCourseId = values.course_id || before.course_id;
    const nextSemesterId = values.semester_id || before.semester_id;
    const changedCourseOrSemester =
      Number(nextCourseId) !== Number(before.course_id) ||
      Number(nextSemesterId) !== Number(before.semester_id);

    if (changedCourseOrSemester) {
      values.group_no = await resolveNextCourseSectionGroupNo(
        nextCourseId,
        nextSemesterId,
        id,
      );
    }
  }

  if (config.afterNormalize) {
    config.afterNormalize(values);
  }

  const columns = Object.keys(values);
  const setClauses = columns.map((column) => `\`${column}\` = ?`);
  const params = columns.map((column) => values[column]);

  const [result] = await runQuery(() =>
    pool.query(
      `UPDATE ${config.table} SET ${setClauses.join(", ")} WHERE id = ?`,
      [...params, id],
    ),
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, "Master data item not found");
  }

  const item = await findMasterDataItem(resource, id);

  await recordAuditLog({
    entity_type: config.table,
    entity_id: item.id,
    action_type: "update",
    old_status: getMasterStatus(resource, before),
    new_status: getMasterStatus(resource, item),
    action_by_user_id: actorUserId,
    action_notes: {
      resource,
      changed_fields: columns,
    },
  });

  return item;
}

async function findMasterDataItem(resource, id) {
  const items = await listMasterData(resource);
  const item = items.find((candidate) => Number(candidate.id) === Number(id));

  if (!item) {
    throw new ApiError(404, "Master data item not found");
  }

  return item;
}

const DEVICE_FIELDS = [
  { name: "room_id", type: "int", required: true, min: 1 },
  { name: "device_code", type: "string", required: true, maxLength: 40 },
  { name: "device_name", type: "string", required: true, maxLength: 120 },
  { name: "device_type", type: "enum", values: DEVICE_TYPES },
  { name: "spec_or_version", type: "string", maxLength: 255, nullable: true },
  { name: "device_status", type: "enum", values: DEVICE_STATUSES },
  { name: "notes", type: "string", maxLength: 255, nullable: true },
];

async function listDevices(filters = {}) {
  const where = [];
  const params = [];

  if (filters.room_id) {
    where.push("d.room_id = ?");
    params.push(parseId(filters.room_id, "room_id"));
  }

  if (filters.device_type) {
    if (!DEVICE_TYPES.includes(filters.device_type)) {
      throw makeValidationError([
        { field: "device_type", message: "Invalid device_type" },
      ]);
    }

    where.push("d.device_type = ?");
    params.push(filters.device_type);
  }

  if (filters.device_status) {
    if (!DEVICE_STATUSES.includes(filters.device_status)) {
      throw makeValidationError([
        { field: "device_status", message: "Invalid device_status" },
      ]);
    }

    where.push("d.device_status = ?");
    params.push(filters.device_status);
  }

  const [rows] = await pool.query(
    `SELECT
       d.id,
       d.room_id,
       r.room_code,
       d.device_code,
       d.device_name,
       d.device_type,
       d.spec_or_version,
       d.device_status,
       d.last_updated_at,
       d.notes,
       d.created_at,
       d.updated_at
     FROM devices d
     JOIN rooms r ON r.id = d.room_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY r.room_code, d.device_code`,
    params,
  );

  return rows;
}

async function createDevice(body, actorUserId = null) {
  const values = normalizePayload(body, DEVICE_FIELDS, true);
  const columns = Object.keys(values);
  const params = columns.map((column) => values[column]);

  const [result] = await runQuery(() =>
    pool.query(
      `INSERT INTO devices (${columns.map((column) => `\`${column}\``).join(", ")}, last_updated_at)
     VALUES (${columns.map(() => "?").join(", ")}, NOW())`,
      params,
    ),
  );

  const device = await findDeviceById(result.insertId);

  await recordAuditLog({
    entity_type: "devices",
    entity_id: device.id,
    action_type: "create",
    new_status: device.device_status,
    action_by_user_id: actorUserId,
    action_notes: {
      device_code: device.device_code,
      room_code: device.room_code,
    },
  });

  return device;
}

async function updateDevice(idParam, body, actorUserId = null) {
  const id = parseId(idParam);
  const before = await findDeviceById(id);
  const values = normalizePayload(body, DEVICE_FIELDS, false);
  const columns = Object.keys(values);
  const setClauses = columns.map((column) => `\`${column}\` = ?`);
  const params = columns.map((column) => values[column]);

  if (hasOwn(values, "device_status")) {
    setClauses.push("last_updated_at = NOW()");
  }

  const [result] = await runQuery(() =>
    pool.query(`UPDATE devices SET ${setClauses.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]),
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, "Device not found");
  }

  const device = await findDeviceById(id);

  await recordAuditLog({
    entity_type: "devices",
    entity_id: device.id,
    action_type: "update",
    old_status: before.device_status,
    new_status: device.device_status,
    action_by_user_id: actorUserId,
    action_notes: {
      device_code: device.device_code,
      changed_fields: columns,
    },
  });

  return device;
}

async function findDeviceById(id) {
  const [rows] = await pool.query(
    `SELECT
       d.id,
       d.room_id,
       r.room_code,
       d.device_code,
       d.device_name,
       d.device_type,
       d.spec_or_version,
       d.device_status,
       d.last_updated_at,
       d.notes,
       d.created_at,
       d.updated_at
     FROM devices d
     JOIN rooms r ON r.id = d.room_id
     WHERE d.id = ?
     LIMIT 1`,
    [id],
  );

  if (!rows[0]) {
    throw new ApiError(404, "Device not found");
  }

  return rows[0];
}

module.exports = {
  ApiError,
  createAccount,
  createDevice,
  createMasterData,
  disableAccount,
  listAccounts,
  listDevices,
  listMasterData,
  updateAccount,
  updateDevice,
  updateMasterData,
};
