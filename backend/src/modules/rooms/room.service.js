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
  findRoomById,
  getScopeRoomList,
  isValidRoomStatus,
  listRooms,
  updateRoom
};
