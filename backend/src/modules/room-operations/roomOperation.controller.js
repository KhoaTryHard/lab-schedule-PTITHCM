const { validationResult } = require('express-validator');

const { ok, created, fail } = require('../../utils/apiResponse');
const roomOperationService = require('./roomOperation.service');

function sendServiceFailure(res, result) {
  return fail(res, result.statusCode || 400, result.message, result.details || null);
}

async function listRoomIssues(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const items = await roomOperationService.listRoomIssues(
    {
      status: req.query.status,
      issue_type: req.query.issue_type,
      room_code: req.query.room_code,
      lab_schedule_entry_id: req.query.lab_schedule_entry_id
    },
    req.user
  );

  return ok(res, { items }, 'Successfully fetched room issue reports');
}

async function createRoomIssue(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await roomOperationService.createRoomIssue(req.body, req.user);

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return created(res, result.issue, 'Successfully created room issue report');
}

async function updateRoomIssue(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await roomOperationService.updateRoomIssue(req.params.id, req.body, req.user);

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return ok(res, result.issue, 'Successfully updated room issue report');
}

async function listRoomBlocks(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const items = await roomOperationService.listRoomBlocks({
    status: req.query.status,
    block_type: req.query.block_type,
    room_code: req.query.room_code
  });

  return ok(res, { items }, 'Successfully fetched room block requests');
}

async function createRoomBlock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await roomOperationService.createRoomBlock(req.body, req.user);

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return created(res, result.block, 'Successfully created room block request');
}

async function reviewRoomBlock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await roomOperationService.reviewRoomBlock(req.params.id, req.body, req.user);

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return ok(res, result.block, 'Successfully reviewed room block request');
}

module.exports = {
  listRoomIssues,
  createRoomIssue,
  updateRoomIssue,
  listRoomBlocks,
  createRoomBlock,
  reviewRoomBlock
};
