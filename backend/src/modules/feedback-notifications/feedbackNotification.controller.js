const { validationResult } = require('express-validator');

const { ok, created, fail } = require('../../utils/apiResponse');
const service = require('./feedbackNotification.service');

function failFromService(res, result) {
  return fail(res, result.statusCode || 400, result.message, result.details || null);
}

async function listStudentFeedback(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const items = await service.listStudentFeedback(
    {
      status: req.query.status,
      feedback_type: req.query.feedback_type,
      lab_schedule_entry_id: req.query.lab_schedule_entry_id
    },
    req.user
  );

  return ok(res, { items }, 'Successfully fetched student feedback');
}

async function createStudentFeedback(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await service.createStudentFeedback(req.body, req.user);

  if (!result.ok) {
    return failFromService(res, result);
  }

  return created(res, result.feedback, 'Successfully created student feedback');
}

async function updateStudentFeedback(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await service.updateStudentFeedback(req.params.id, req.body, req.user);

  if (!result.ok) {
    return failFromService(res, result);
  }

  return ok(res, result.feedback, 'Successfully updated student feedback');
}

async function listNotifications(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const items = await service.listNotifications(
    {
      status: req.query.status,
      notification_type: req.query.notification_type
    },
    req.user
  );

  return ok(res, { items }, 'Successfully fetched notifications');
}

async function markNotificationRead(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await service.markNotificationRead(req.params.id, req.user);

  if (!result.ok) {
    return failFromService(res, result);
  }

  return ok(res, result.notification, 'Successfully marked notification as read');
}

async function acknowledgeNotification(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, 'Validation failed', errors.array());
  }

  const result = await service.acknowledgeNotification(req.params.id, req.user);

  if (!result.ok) {
    return failFromService(res, result);
  }

  return ok(res, result.notification, 'Successfully acknowledged notification');
}

async function markAllNotificationsRead(req, res) {
  const result = await service.markAllNotificationsRead(req.user);
  return ok(res, result, 'Successfully marked all notifications as read');
}

module.exports = {
  listStudentFeedback,
  createStudentFeedback,
  updateStudentFeedback,
  listNotifications,
  markNotificationRead,
  acknowledgeNotification,
  markAllNotificationsRead
};
