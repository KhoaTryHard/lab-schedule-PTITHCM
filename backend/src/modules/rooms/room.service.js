const { ROOM_SCOPE } = require('../../config/roomScope');

function getScopeRoomList() {
  return ROOM_SCOPE.map((roomCode) => ({
    room_code: roomCode,
    in_scope: true
  }));
}

module.exports = {
  getScopeRoomList
};
