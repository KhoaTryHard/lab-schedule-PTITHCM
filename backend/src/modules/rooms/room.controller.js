const { ok } = require('../../utils/apiResponse');
const { getScopeRoomList } = require('./room.service');

function getScopeRooms(req, res) {
  return ok(res, getScopeRoomList());
}

module.exports = {
  getScopeRooms
};
