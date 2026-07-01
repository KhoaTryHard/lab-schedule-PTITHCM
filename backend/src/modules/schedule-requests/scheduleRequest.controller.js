const { created, fail, ok } = require('../../utils/apiResponse');
const { validationResult } = require('express-validator');
const scheduleRequestService = require('./scheduleRequest.service');

function validateRequest(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    fail(res, 400, 'Validation failed', errors.array());
    return false;
  }

  return true;
}

async function listScheduleRequests(req, res) {
  const requests = await scheduleRequestService.getRequests(
    req.user.role_code,
    req.user.id
  );

  return ok(res, requests, 'Successfully fetched schedule requests');
}

async function getScheduleRequest(req, res) {
  if (!validateRequest(req, res)) return;

  const request = await scheduleRequestService.getRequestById(
    req.params.id,
    req.user.role_code,
    req.user.id
  );

  if (!request) {
    return fail(res, 404, 'Schedule request not found');
  }

  return ok(res, request, 'Successfully fetched schedule request');
}

async function createScheduleRequest(req, res) {
  if (!validateRequest(req, res)) return;

  const id = await scheduleRequestService.createRequest(req.body, req.user.id);
  const request = await scheduleRequestService.getRequestById(
    id,
    req.user.role_code,
    req.user.id
  );

  return created(res, request, 'Successfully created schedule request');
}

async function updateScheduleRequest(req, res) {
  if (!validateRequest(req, res)) return;

  const request = await scheduleRequestService.updateRequest(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role_code
  );

  return ok(res, request, 'Successfully updated schedule request');
}

async function submitScheduleRequest(req, res) {
  if (!validateRequest(req, res)) return;

  const request = await scheduleRequestService.submitRequest(
    req.params.id,
    req.user.id,
    req.user.role_code
  );

  return ok(res, request, 'Successfully submitted schedule request');
}

async function approveScheduleRequest(req, res) {
  if (!validateRequest(req, res)) return;

  const request = await scheduleRequestService.approveRequest(
    req.params.id,
    req.user.id,
    req.user.role_code
  );

  return ok(res, request, 'Successfully approved schedule request');
}

async function cancelScheduleRequest(req, res) {
  if (!validateRequest(req, res)) return;

  const request = await scheduleRequestService.cancelRequest(
    req.params.id,
    req.user.id,
    req.user.role_code
  );

  return ok(res, request, 'Successfully cancelled schedule request');
}

async function publishScheduleRequest(req, res) {
  if (!validateRequest(req, res)) return;

  const request = await scheduleRequestService.publishRequest(
    req.params.id,
    req.user.id,
    req.user.role_code
  );

  return ok(res, request, 'Successfully published schedule request');
}

module.exports = {
  approveScheduleRequest,
  cancelScheduleRequest,
  createScheduleRequest,
  getScheduleRequest,
  listScheduleRequests,
  publishScheduleRequest,
  submitScheduleRequest,
  updateScheduleRequest
};