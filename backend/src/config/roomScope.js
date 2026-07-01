const ROOM_SCOPE = ['2B11', '2B21', '2B31'];

function isInScopeRoom(roomCode) {
  return ROOM_SCOPE.includes(String(roomCode || '').trim().toUpperCase());
}

module.exports = {
  ROOM_SCOPE,
  isInScopeRoom
};
