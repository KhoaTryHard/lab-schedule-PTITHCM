const { ok, created, fail } = require('../../utils/apiResponse');
const scheduleRequestService = require('./scheduleRequest.service');

async function listScheduleRequests(req, res) {
  try {
    const requests = await scheduleRequestService.getRequests(req.user.role_code, req.user.id);
    return ok(res, requests, 'Successfully fetched schedule requests');
  } catch (error) {
    console.error('listScheduleRequests error:', error);
    return fail(res, 500, 'Failed to fetch schedule requests');
  }
}

async function getScheduleRequest(req, res) {
  try {
    const request = await scheduleRequestService.getRequestById(req.params.id, req.user.role_code, req.user.id);
    if (!request) {
      return fail(res, 404, 'Schedule request not found');
    }
    return ok(res, request, 'Successfully fetched schedule request');
  } catch (error) {
    console.error('getScheduleRequest error:', error);
    return fail(res, 500, 'Failed to fetch schedule request');
  }
}

async function createScheduleRequest(req, res) {
  try {
    const { course_section_id, requested_team_count, total_required_sessions } = req.body;
    
    if (!course_section_id) {
      return fail(res, 400, 'Missing required field: course_section_id');
    }

    const insertId = await scheduleRequestService.createRequest(req.body, req.user.id);
    const newRequest = await scheduleRequestService.getRequestById(insertId, req.user.role_code, req.user.id);

    return created(res, newRequest, 'Successfully created schedule request');
  } catch (error) {
    console.error('createScheduleRequest error:', error);
    return fail(res, 500, 'Failed to create schedule request');
  }
}

async function submitScheduleRequest(req, res) {
  try {
    const success = await scheduleRequestService.submitRequest(req.params.id, req.user.id, req.user.role_code);
    if (!success) {
      return fail(res, 404, 'Schedule request not found or you do not have permission');
    }
    
    const request = await scheduleRequestService.getRequestById(req.params.id, req.user.role_code, req.user.id);
    return ok(res, request, 'Successfully submitted schedule request');
  } catch (error) {
    console.error('submitScheduleRequest error:', error);
    if (error.message === 'Chỉ có thể gửi yêu cầu ở trạng thái draft') {
      return fail(res, 400, error.message);
    }
    return fail(res, 500, 'Failed to submit schedule request');
  }
}

module.exports = {
  listScheduleRequests,
  getScheduleRequest,
  createScheduleRequest,
  submitScheduleRequest
};
