const { ok, created, fail } = require('../../utils/apiResponse');
const scheduleRequestService = require('./scheduleRequest.service');
const { validationResult } = require('express-validator');

async function listScheduleRequests(req, res) {
  const requests = await scheduleRequestService.getRequests(req.user.role_code, req.user.id);
  return ok(res, requests, 'Successfully fetched schedule requests');
}

async function getScheduleRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, { errors: errors.array() });
  }

  const request = await scheduleRequestService.getRequestById(req.params.id, req.user.role_code, req.user.id);
  if (!request) {
    return fail(res, 404, 'Schedule request not found');
  }
  return ok(res, request, 'Successfully fetched schedule request');
}

async function createScheduleRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, { errors: errors.array() });
  }

  const insertId = await scheduleRequestService.createRequest(req.body, req.user.id);
  const newRequest = await scheduleRequestService.getRequestById(insertId, req.user.role_code, req.user.id);

  return created(res, newRequest, 'Successfully created schedule request');
}

async function submitScheduleRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, { errors: errors.array() });
  }

  try {
    const success = await scheduleRequestService.submitRequest(req.params.id, req.user.id, req.user.role_code);
    if (!success) {
      return fail(res, 404, 'Schedule request not found or you do not have permission');
    }
    
    const request = await scheduleRequestService.getRequestById(req.params.id, req.user.role_code, req.user.id);
    return ok(res, request, 'Successfully submitted schedule request');
  } catch (error) {
    if (error.message === 'Chỉ có thể gửi yêu cầu ở trạng thái draft') {
      return fail(res, 400, error.message);
    }
    throw error; // Các lỗi khác vẫn throw lên để error middleware xử lý (500)
  }
}
module.exports = {
  listScheduleRequests,
  getScheduleRequest,
  createScheduleRequest,
  submitScheduleRequest
};