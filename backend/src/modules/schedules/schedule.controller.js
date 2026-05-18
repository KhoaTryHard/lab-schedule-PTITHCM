const { ok, created, fail } = require('../../utils/apiResponse');
const { validationResult } = require('express-validator');
const {
  checkScheduleConstraints,
  createDraftSchedule,
  autoArrangeScheduleStub,
  getScheduleListStub
} = require('./schedule.service');

function listSchedules(req, res) {
  return ok(res, getScheduleListStub(req.query));
}

async function checkConstraints(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await checkScheduleConstraints(req.body);
  return ok(res, result, 'Constraint check completed');
}

async function createSchedule(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await createDraftSchedule(req.body, req.user.id);

  if (!result.created) {
    return fail(res, 409, 'Schedule constraints failed', result.constraintResult);
  }

  return created(
    res,
    {
      schedule: result.schedule,
      constraints: result.constraintResult
    },
    'Successfully created draft schedule'
  );
}

async function autoArrange(req, res) {
  return ok(res, autoArrangeScheduleStub(req.body), 'Auto arrange preview stub');
}

module.exports = {
  listSchedules,
  checkConstraints,
  createSchedule,
  autoArrange
};
