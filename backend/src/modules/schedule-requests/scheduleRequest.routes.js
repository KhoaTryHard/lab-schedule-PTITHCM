const express = require('express');
const { body, param } = require('express-validator');

const {
  approveScheduleRequest,
  cancelScheduleRequest,
  createScheduleRequest,
  getScheduleRequest,
  listScheduleRequests,
  publishScheduleRequest,
  submitScheduleRequest,
  updateScheduleRequest
} = require('./scheduleRequest.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/roles');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

const requestPayloadValidator = [
  body('course_section_id')
    .notEmpty()
    .isInt({ min: 1 })
    .withMessage('course_section_id must be a positive integer'),
  body('requested_team_count')
    .optional()
    .isInt({ min: 1 }),
  body('max_students_per_team')
    .optional({ nullable: true })
    .isInt({ min: 1 }),
  body('total_required_sessions')
    .optional()
    .isInt({ min: 1 }),
  body('preferred_week_start')
    .optional({ nullable: true })
    .isISO8601(),
  body('preferred_week_end')
    .optional({ nullable: true })
    .isISO8601(),
  body('preferred_day_of_week')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 7 }),
  body('preferred_time_slot_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }),
  body('notes')
    .optional({ nullable: true })
    .isLength({ max: 2000 })
];

const idValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('id must be a positive integer')
];

const manageRoles = requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN);

router.get('/', requireAuth, manageRoles, asyncHandler(listScheduleRequests));

router.post(
  '/',
  requireAuth,
  manageRoles,
  requestPayloadValidator,
  asyncHandler(createScheduleRequest)
);

router.get(
  '/:id',
  requireAuth,
  manageRoles,
  idValidator,
  asyncHandler(getScheduleRequest)
);

router.patch(
  '/:id',
  requireAuth,
  manageRoles,
  idValidator,
  requestPayloadValidator,
  asyncHandler(updateScheduleRequest)
);

router.patch(
  '/:id/submit',
  requireAuth,
  manageRoles,
  idValidator,
  asyncHandler(submitScheduleRequest)
);

router.patch(
  '/:id/approve',
  requireAuth,
  manageRoles,
  idValidator,
  asyncHandler(approveScheduleRequest)
);

router.patch(
  '/:id/cancel',
  requireAuth,
  manageRoles,
  idValidator,
  asyncHandler(cancelScheduleRequest)
);

router.patch(
  '/:id/publish',
  requireAuth,
  manageRoles,
  idValidator,
  asyncHandler(publishScheduleRequest)
);

module.exports = router;