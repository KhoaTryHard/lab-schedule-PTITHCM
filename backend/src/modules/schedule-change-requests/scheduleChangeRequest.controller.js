const { validationResult } = require('express-validator');

const { ok, created, fail } = require('../../utils/apiResponse');
const changeRequestService = require('./scheduleChangeRequest.service');

function sendServiceResult(res, result, successMessage) {
  if (!result.ok) {
    return fail(res, result.statusCode || 400, result.message, result.details || null);
  }

  return ok(res, result.changeRequest, successMessage);
}

async function listScheduleChangeRequests(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const items = await changeRequestService.listChangeRequests(
    {
      status: req.query.status,
      change_type: req.query.change_type,
      lab_schedule_entry_id: req.query.lab_schedule_entry_id
    },
    req.user
  );

  return ok(res, { items }, 'Successfully fetched schedule change requests');
}

async function getScheduleChangeRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const item = await changeRequestService.getChangeRequestById(req.params.id, req.user);

  if (!item) {
    return fail(res, 404, 'Schedule change request not found');
  }

  return ok(res, item, 'Successfully fetched schedule change request');
}

async function createScheduleChangeRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await changeRequestService.createChangeRequest(req.body, req.user);

  if (!result.ok) {
    return fail(res, result.statusCode || 400, result.message, result.details || null);
  }

  return created(res, result.changeRequest, 'Successfully created schedule change request');
}

async function reviewScheduleChangeRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await changeRequestService.reviewChangeRequest(
    req.params.id,
    req.body,
    req.user
  );

  return sendServiceResult(res, result, 'Successfully reviewed schedule change request');
}

async function implementScheduleChangeRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await changeRequestService.implementChangeRequest(
    req.params.id,
    req.body || {},
    req.user
  );

  if (!result.ok) {
    return fail(res, result.statusCode || 400, result.message, result.details || null);
  }

  return ok(
    res,
    {
      change_request: result.changeRequest,
      implemented_schedule: result.implementedSchedule
    },
    'Successfully implemented schedule change request'
  );
}

module.exports = {
  listScheduleChangeRequests,
  getScheduleChangeRequest,
  createScheduleChangeRequest,
  reviewScheduleChangeRequest,
  implementScheduleChangeRequest
};
