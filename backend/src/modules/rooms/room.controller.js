const { isInScopeRoom } = require('../../config/roomScope');
const { ok, fail } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../audit/audit.service');
const {
  findRoomById,
  getScopeRoomList,
  isValidRoomStatus,
  listRooms,
  updateRoom
} = require('./room.service');

function parseRoomId(idParam) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function validateScopeQuery(req, res) {
  const { in_scope: inScope, scope } = req.query;

  if (scope && scope !== 'mvp') {
    fail(res, 400, 'Only MVP room scope is supported');
    return false;
  }

  if (inScope && inScope !== 'true') {
    fail(res, 400, 'Only in_scope=true is supported');
    return false;
  }

  return true;
}

function getScopeRooms(req, res) {
  return ok(res, getScopeRoomList(), 'Success');
}

async function getRooms(req, res) {
  if (!validateScopeQuery(req, res)) {
    return null;
  }

  const roomStatus = req.query.room_status;

  if (roomStatus && !isValidRoomStatus(roomStatus)) {
    return fail(res, 400, 'Invalid room_status');
  }

  const rooms = await listRooms({
    room_code: req.query.room_code,
    room_status: roomStatus
  });

  return ok(res, rooms, 'Success');
}

async function getRoomById(req, res) {
  const id = parseRoomId(req.params.id);

  if (!id) {
    return fail(res, 400, 'Invalid room id');
  }

  const room = await findRoomById(id);

  if (!room) {
    return fail(res, 404, 'Room not found');
  }

  if (!isInScopeRoom(room.room_code)) {
    return fail(res, 403, 'Room is outside MVP scope');
  }

  return ok(res, room, 'Success');
}

async function updateRoomById(req, res) {
  const id = parseRoomId(req.params.id);

  if (!id) {
    return fail(res, 400, 'Invalid room id');
  }

  const body = req.body || {};
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, 'room_status')) {
    if (typeof body.room_status !== 'string' || !isValidRoomStatus(body.room_status)) {
      return fail(res, 400, 'Invalid room_status');
    }

    updates.room_status = body.room_status;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
    if (body.notes !== null && typeof body.notes !== 'string') {
      return fail(res, 400, 'Invalid notes');
    }

    if (typeof body.notes === 'string' && body.notes.length > 255) {
      return fail(res, 400, 'Notes must be at most 255 characters');
    }

    updates.notes = body.notes;
  }

  if (Object.keys(updates).length === 0) {
    return fail(res, 400, 'No supported room fields to update');
  }

  const room = await findRoomById(id);

  if (!room) {
    return fail(res, 404, 'Room not found');
  }

  if (!isInScopeRoom(room.room_code)) {
    return fail(res, 403, 'Room is outside MVP scope');
  }

  const updatedRoom = await updateRoom(id, updates, room);

  await recordAuditLog({
    entity_type: 'rooms',
    entity_id: id,
    action_type: 'update',
    old_status: room.room_status,
    new_status: updatedRoom.room_status,
    action_by_user_id: req.user.id,
    action_notes: {
      room_code: updatedRoom.room_code,
      changed_fields: Object.keys(updates)
    }
  });

  return ok(res, updatedRoom, 'Success');
}

module.exports = {
  getRoomById,
  getRooms,
  getScopeRooms,
  updateRoomById
};
