const { ok, created } = require('../../utils/apiResponse');

function listScheduleRequests(req, res) {
  return ok(res, [], 'Schedule request list stub');
}

function createScheduleRequest(req, res) {
  // TODO: Validate and save to lab_schedule_requests.
  return created(res, {
    request_id: 'demo-request-id',
    status: 'draft',
    ...req.body
  }, 'Schedule request draft created as stub');
}

module.exports = {
  listScheduleRequests,
  createScheduleRequest
};
