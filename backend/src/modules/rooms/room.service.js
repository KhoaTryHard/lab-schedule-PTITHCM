const pool = require('../../config/database');
const { ROOM_SCOPE, isInScopeRoom } = require('../../config/roomScope');

const ROOM_STATUSES = ['available', 'maintenance', 'out_of_order', 'locked'];

const ROOM_COLUMNS = `
  id,
  room_code,
  total_computers,
  broken_computers,
  reserved_teacher_computers,
  usable_student_computers,
  has_projector,
  has_wifi,
  has_lan,
  room_status,
  primary_technician_user_id,
  last_status_updated_at,
  last_condition_report_at,
  notes,
  created_at,
  updated_at
`;

function getScopePlaceholders() {
  return ROOM_SCOPE.map(() => '?').join(', ');
}

function getScopeRoomList() {
  return [...ROOM_SCOPE];
}

function isValidRoomStatus(status) {
  return ROOM_STATUSES.includes(status);
}

function normalizeRoomCode(roomCode) {
  return String(roomCode || '').trim().toUpperCase();
}

function toOptionalPositiveInteger(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

function toBoolean(value) {
  return Boolean(Number(value));
}

function toRoomResponse(row) {
  const totalComputers = Number(row.total_computers || 0);
  const brokenComputers = Number(row.broken_computers || 0);
  const reservedTeacherComputers = Number(row.reserved_teacher_computers || 0);
  const usableComputers = Math.max(totalComputers - brokenComputers, 0);
  const usableStudentComputers = row.usable_student_computers == null
    ? Math.max(usableComputers - reservedTeacherComputers, 0)
    : Number(row.usable_student_computers);

  return {
    id: row.id,
    room_code: row.room_code,
    total_computers: totalComputers,
    broken_computers: brokenComputers,
    reserved_teacher_computers: reservedTeacherComputers,
    usable_computers: usableComputers,
    usable_student_computers: usableStudentComputers,
    has_projector: toBoolean(row.has_projector),
    has_wifi: toBoolean(row.has_wifi),
    has_lan: toBoolean(row.has_lan),
    room_status: row.room_status,
    primary_technician_user_id: row.primary_technician_user_id,
    last_status_updated_at: row.last_status_updated_at,
    last_condition_report_at: row.last_condition_report_at,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function listRooms(filters = {}) {
  const where = [`room_code IN (${getScopePlaceholders()})`];
  const params = [...ROOM_SCOPE];

  if (filters.room_code) {
    const roomCode = String(filters.room_code).trim().toUpperCase();

    if (!isInScopeRoom(roomCode)) {
      return [];
    }

    where.push('room_code = ?');
    params.push(roomCode);
  }

  if (filters.room_status) {
    where.push('room_status = ?');
    params.push(filters.room_status);
  }

  const [rows] = await pool.query(
    `SELECT ${ROOM_COLUMNS}
     FROM rooms
     WHERE ${where.join(' AND ')}
     ORDER BY FIELD(room_code, ${getScopePlaceholders()}), room_code`,
    [...params, ...ROOM_SCOPE]
  );

  return rows.map(toRoomResponse);
}

async function findRoomById(id) {
  const [rows] = await pool.query(
    `SELECT ${ROOM_COLUMNS} FROM rooms WHERE id = ? LIMIT 1`,
    [id]
  );

  if (!rows[0]) {
    return null;
  }

  return toRoomResponse(rows[0]);
}

async function createRoom(input = {}) {
  const roomCode = normalizeRoomCode(input.room_code);
  const totalComputers = Number(input.total_computers);
  const brokenComputers = Number(input.broken_computers || 0);
  const reservedTeacherComputers = Number(input.reserved_teacher_computers || 1);
  const hasProjector = Object.prototype.hasOwnProperty.call(input, 'has_projector')
    ? Number(input.has_projector)
    : 1;
  const hasWifi = Object.prototype.hasOwnProperty.call(input, 'has_wifi')
    ? Number(input.has_wifi)
    : 1;
  const hasLan = Object.prototype.hasOwnProperty.call(input, 'has_lan')
    ? Number(input.has_lan)
    : 1;
  const roomStatus = input.room_status || 'available';
  const primaryTechnicianUserId = toOptionalPositiveInteger(
    input.primary_technician_user_id
  );

  if (!roomCode) {
    const error = new Error('Room code is required');
    error.statusCode = 400;
    throw error;
  }

  if (roomCode.length > 20) {
    const error = new Error('Room code must be at most 20 characters');
    error.statusCode = 400;
    throw error;
  }

  if (!isInScopeRoom(roomCode)) {
    const error = new Error('Room is outside MVP scope');
    error.statusCode = 403;
    throw error;
  }

  if (!Number.isInteger(totalComputers) || totalComputers <= 0) {
    const error = new Error('Total computers must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  if (
    !Number.isInteger(brokenComputers) ||
    brokenComputers < 0 ||
    brokenComputers > totalComputers
  ) {
    const error = new Error('Broken computers must be between 0 and total computers');
    error.statusCode = 400;
    throw error;
  }

  if (
    !Number.isInteger(reservedTeacherComputers) ||
    reservedTeacherComputers < 0 ||
    reservedTeacherComputers > totalComputers
  ) {
    const error = new Error(
      'Reserved teacher computers must be between 0 and total computers'
    );
    error.statusCode = 400;
    throw error;
  }

  if (!isValidRoomStatus(roomStatus)) {
    const error = new Error('Invalid room_status');
    error.statusCode = 400;
    throw error;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO rooms (
        room_code,
        total_computers,
        broken_computers,
        reserved_teacher_computers,
        has_projector,
        has_wifi,
        has_lan,
        room_status,
        primary_technician_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomCode,
        totalComputers,
        brokenComputers,
        reservedTeacherComputers,
        hasProjector,
        hasWifi,
        hasLan,
        roomStatus,
        primaryTechnicianUserId
      ]
    );

    return findRoomById(result.insertId);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      error.statusCode = 409;
      error.message = 'Room code already exists';
    }

    throw error;
  }
}

async function updateRoom(id, updates, currentRoom) {
  const setClauses = [];
  const params = [];

  if (Object.prototype.hasOwnProperty.call(updates, 'room_status')) {
    setClauses.push('room_status = ?');
    params.push(updates.room_status);

    if (!currentRoom || currentRoom.room_status !== updates.room_status) {
      setClauses.push('last_status_updated_at = NOW()');
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'notes')) {
    setClauses.push('notes = ?');
    params.push(updates.notes);
  }

  if (setClauses.length === 0) {
    return currentRoom;
  }

  await pool.query(
    `UPDATE rooms SET ${setClauses.join(', ')} WHERE id = ?`,
    [...params, id]
  );

  return findRoomById(id);
}

module.exports = {
  ROOM_STATUSES,
  createRoom,
  findRoomById,
  getScopeRoomList,
  isValidRoomStatus,
  listRooms,
  updateRoom
};
