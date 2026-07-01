const { validationResult } = require("express-validator");

const { ok, created, fail } = require("../../utils/apiResponse");
const roomOperationService = require("./roomOperation.service");

function sendServiceFailure(res, result) {
  return fail(
    res,
    result.statusCode || 400,
    result.message,
    result.details || null,
  );
}

async function listRoomIssues(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const items = await roomOperationService.listRoomIssues(
    {
      status: req.query.status,
      issue_type: req.query.issue_type,
      room_code: req.query.room_code,
      lab_schedule_entry_id: req.query.lab_schedule_entry_id,
    },
    req.user,
  );

  return ok(res, { items }, "Successfully fetched room issue reports");
}

async function createRoomIssue(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const result = await roomOperationService.createRoomIssue(req.body, req.user);

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return created(res, result.issue, "Successfully created room issue report");
}

async function updateRoomIssue(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const result = await roomOperationService.updateRoomIssue(
    req.params.id,
    req.body,
    req.user,
  );

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return ok(res, result.issue, "Successfully updated room issue report");
}

async function listRoomBlocks(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const items = await roomOperationService.listRoomBlocks(
    {
      status: req.query.status,
      block_type: req.query.block_type,
      room_code: req.query.room_code,
    },
    req.user,
  );

  return ok(res, { items }, "Successfully fetched room block requests");
}

async function createRoomBlock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const result = await roomOperationService.createRoomBlock(req.body, req.user);

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return created(res, result.block, "Successfully created room block request");
}

async function updateRoomBlock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const result = await roomOperationService.updateRoomBlock(
    req.params.id,
    req.body,
    req.user,
  );

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return ok(res, result.block, "Successfully updated room block request");
}

async function submitRoomBlock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const result = await roomOperationService.submitRoomBlock(
    req.params.id,
    req.body,
    req.user,
  );

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return ok(res, result.block, "Successfully submitted room block request");
}

async function cancelRoomBlock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const result = await roomOperationService.cancelRoomBlock(
    req.params.id,
    req.body,
    req.user,
  );

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return ok(res, result.block, "Successfully cancelled room block request");
}

async function reviewRoomBlock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const result = await roomOperationService.reviewRoomBlock(
    req.params.id,
    req.body,
    req.user,
  );

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return ok(res, result.block, "Successfully reviewed room block request");
}

async function applyRoomBlockStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, "Validation failed", errors.array());
  }

  const result = await roomOperationService.applyRoomBlockStatus(
    req.params.id,
    req.body,
    req.user,
  );

  if (!result.ok) {
    return sendServiceFailure(res, result);
  }

  return ok(
    res,
    {
      block: result.block,
      room: result.room,
    },
    "Successfully updated room status from room block request",
  );
}

module.exports = {
  listRoomIssues,
  createRoomIssue,
  updateRoomIssue,
  listRoomBlocks,
  createRoomBlock,
  reviewRoomBlock,
  applyRoomBlockStatus,
  updateRoomBlock,
  submitRoomBlock,
  cancelRoomBlock,
};
