const { ok } = require('../../utils/apiResponse');
const { ROOM_SCOPE } = require('../../config/roomScope');

function getHealth(req, res) {
  return ok(res, {
    service: 'lab-schedule-ptit-backend',
    status: 'running',
    room_scope: ROOM_SCOPE
  });
}

module.exports = {
  getHealth
};
