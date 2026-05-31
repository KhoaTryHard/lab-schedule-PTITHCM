const express = require('express');
const { body, param, query } = require('express-validator');

const { ROLES } = require('../../config/roles');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const {
  createScheduleChangeRequest,
  getScheduleChangeRequest,
  implementScheduleChangeRequest,
  listScheduleChangeRequests,
  reviewScheduleChangeRequest
} = require('./scheduleChangeRequest.controller');

const router = express.Router();

const idValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')
];

const listValidator = [
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'approved', 'rejected', 'implemented', 'cancelled'])
    .withMessage('status is not supported'),
  query('change_type')
    .optional()
    .isIn(['reschedule', 'makeup', 'cancel'])
    .withMessage('change_type must be reschedule, makeup, or cancel'),
  query('lab_schedule_entry_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('lab_schedule_entry_id must be a positive integer')
];

const proposedDateRangeValidator = body('proposed_end_date')
  .optional({ nullable: true })
  .isDate().withMessage('proposed_end_date must be a valid date')
  .custom((endDate, { req }) => {
    if (
      req.body.proposed_start_date &&
      endDate &&
      new Date(endDate) < new Date(req.body.proposed_start_date)
    ) {
      throw new Error('proposed_end_date must be greater than or equal to proposed_start_date');
    }

    return true;
  });

const createValidator = [
  body('lab_schedule_entry_id')
    .isInt({ min: 1 })
    .withMessage('lab_schedule_entry_id must be a positive integer'),
  body('change_type')
    .isIn(['reschedule', 'makeup', 'cancel'])
    .withMessage('change_type must be reschedule, makeup, or cancel'),
  body('proposed_day_of_week')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 7 })
    .withMessage('proposed_day_of_week must be between 1 and 7'),
  body('proposed_time_slot_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('proposed_time_slot_id must be a positive integer'),
  body('proposed_room_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('proposed_room_id must be a positive integer'),
  body('proposed_start_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage('proposed_start_date must be a valid date'),
  proposedDateRangeValidator,
  body('reason_text')
    .trim()
    .notEmpty()
    .withMessage('reason_text is required')
];

const reviewValidator = [
  ...idValidator,
  body('request_status')
    .isIn(['approved', 'rejected'])
    .withMessage('request_status must be approved or rejected'),
  body('review_notes')
    .optional({ nullable: true })
    .isLength({ max: 2000 })
    .withMessage('review_notes must not exceed 2000 characters')
];

const implementValidator = [
  ...idValidator,
  body('review_notes')
    .optional({ nullable: true })
    .isLength({ max: 2000 })
    .withMessage('review_notes must not exceed 2000 characters')
];

router.use(requireAuth);

router.get(
  '/',
  requireRoles(ROLES.LECTURER, ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  listValidator,
  asyncHandler(listScheduleChangeRequests)
);

router.post(
  '/',
  requireRoles(ROLES.LECTURER),
  createValidator,
  asyncHandler(createScheduleChangeRequest)
);

router.get(
  '/:id',
  requireRoles(ROLES.LECTURER, ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  idValidator,
  asyncHandler(getScheduleChangeRequest)
);

router.patch(
  '/:id/review',
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  reviewValidator,
  asyncHandler(reviewScheduleChangeRequest)
);

router.patch(
  '/:id/implement',
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  implementValidator,
  asyncHandler(implementScheduleChangeRequest)
);

module.exports = router;
