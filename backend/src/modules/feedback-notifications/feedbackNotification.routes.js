const express = require('express');
const { body, param, query } = require('express-validator');

const { ROLES } = require('../../config/roles');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const {
  acknowledgeNotification,
  createStudentFeedback,
  listNotifications,
  listStudentFeedback,
  markAllNotificationsRead,
  markNotificationRead,
  updateStudentFeedback
} = require('./feedbackNotification.controller');

const router = express.Router();

const idValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')
];

const feedbackListValidator = [
  query('status')
    .optional()
    .isIn(['submitted', 'under_review', 'responded', 'closed'])
    .withMessage('status is not supported'),
  query('feedback_type')
    .optional()
    .isIn(['schedule_error', 'room_error', 'other'])
    .withMessage('feedback_type is not supported'),
  query('lab_schedule_entry_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('lab_schedule_entry_id must be a positive integer')
];

const createFeedbackValidator = [
  body('lab_schedule_entry_id')
    .isInt({ min: 1 })
    .withMessage('lab_schedule_entry_id must be a positive integer'),
  body('feedback_type')
    .optional()
    .isIn(['schedule_error', 'room_error', 'other'])
    .withMessage('feedback_type is not supported'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('content is required'),
  body('contact_info')
    .optional({ nullable: true })
    .isLength({ max: 150 })
    .withMessage('contact_info must not exceed 150 characters')
];

const updateFeedbackValidator = [
  ...idValidator,
  body('feedback_status')
    .isIn(['submitted', 'under_review', 'responded', 'closed'])
    .withMessage('feedback_status is not supported'),
  body('response_text')
    .optional({ nullable: true })
    .isString()
    .withMessage('response_text must be a string')
];

const notificationListValidator = [
  query('status')
    .optional()
    .isIn(['unread', 'read', 'acknowledged'])
    .withMessage('status is not supported'),
  query('notification_type')
    .optional()
    .isLength({ min: 1, max: 60 })
    .withMessage('notification_type must not exceed 60 characters')
];

router.use(requireAuth);

router.get(
  '/student-feedback',
  requireRoles(ROLES.STUDENT, ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  feedbackListValidator,
  asyncHandler(listStudentFeedback)
);

router.post(
  '/student-feedback',
  requireRoles(ROLES.STUDENT),
  createFeedbackValidator,
  asyncHandler(createStudentFeedback)
);

router.patch(
  '/student-feedback/:id',
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  updateFeedbackValidator,
  asyncHandler(updateStudentFeedback)
);

router.get(
  '/notifications',
  notificationListValidator,
  asyncHandler(listNotifications)
);

router.patch(
  '/notifications/read-all',
  asyncHandler(markAllNotificationsRead)
);

router.patch(
  '/notifications/:id/read',
  idValidator,
  asyncHandler(markNotificationRead)
);

router.patch(
  '/notifications/:id/acknowledge',
  idValidator,
  asyncHandler(acknowledgeNotification)
);

module.exports = router;
