const { ok } = require('../../utils/apiResponse');
const {
  checkScheduleConstraintsStub,
  autoArrangeScheduleStub,
  getScheduleListStub
} = require('./schedule.service');

function listSchedules(req, res) {
  return ok(res, getScheduleListStub(req.query));
}

function checkConstraints(req, res) {
  return ok(res, checkScheduleConstraintsStub(req.body), 'Constraint check stub');
}

function autoArrange(req, res) {
  return ok(res, autoArrangeScheduleStub(req.body), 'Auto arrange preview stub');
}

module.exports = {
  listSchedules,
  checkConstraints,
  autoArrange
};
