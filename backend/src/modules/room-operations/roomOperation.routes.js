const express = require('express');
const { body, param, query } = require('express-validator');

const { ROLES } = require('../../config/roles');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const {
  createRoomBlock,
  createRoomIssue,
  listRoomBlocks,
  listRoomIssues,
  reviewRoomBlock,
  updateRoomIssue
} = require('./roomOperation.controller');

const router = express.Router();

const idValidator = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')
];

const roomIssueListValidator = [
  query('status')
    .optional()
    .isIn(['new', 'in_progress', 'resolved', 'closed'])
    .withMessage('status is not supported'),
  query('issue_type')
    .optional()
    .isIn(['computer', 'network', 'projector', 'power', 'software', 'other'])
    .withMessage('issue_type is not supported'),
  query('lab_schedule_entry_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('lab_schedule_entry_id must be a positive integer')
];

const createRoomIssueValidator = [
  body('room_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('room_id must be a positive integer'),
  body('room_code')
    .optional({ nullable: true })
    .isString()
    .withMessage('room_code must be a string'),
  body('device_id')
    .optional({ nullable: true })
    .custom(() => true),
  body('device_code')
    .optional({ nullable: true })
    .isString()
    .withMessage('device_code must be a string'),
  body('lab_schedule_entry_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('lab_schedule_entry_id must be a positive integer'),
  body('issue_type')
    .isIn(['computer', 'network', 'projector', 'power', 'software', 'other'])
    .withMessage('issue_type is not supported'),
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('severity is not supported'),
  body('issue_title')
    .trim()
    .notEmpty()
    .withMessage('issue_title is required')
    .isLength({ max: 150 })
    .withMessage('issue_title must not exceed 150 characters'),
  body('issue_description')
    .optional({ nullable: true })
    .isString()
    .withMessage('issue_description must be a string'),
  body('assigned_to_user_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('assigned_to_user_id must be a positive integer'),
  body('detected_at')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('detected_at must be a valid datetime')
];

const updateRoomIssueValidator = [
  ...idValidator,
  body('issue_status')
    .optional()
    .isIn(['new', 'in_progress', 'resolved', 'closed'])
    .withMessage('issue_status is not supported'),
  body('assigned_to_user_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('assigned_to_user_id must be a positive integer'),
  body('resolution_notes')
    .optional({ nullable: true })
    .isString()
    .withMessage('resolution_notes must be a string')
];

const roomBlockListValidator = [
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'approved', 'rejected', 'cancelled', 'expired'])
    .withMessage('status is not supported'),
  query('block_type')
    .optional()
    .isIn(['maintenance', 'repair', 'exam', 'reserved', 'incident', 'other'])
    .withMessage('block_type is not supported')
];

const createRoomBlockValidator = [
  body('room_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('room_id must be a positive integer'),
  body('room_code')
    .optional({ nullable: true })
    .isString()
    .withMessage('room_code must be a string'),
  body('block_type')
    .optional()
    .isIn(['maintenance', 'repair', 'exam', 'reserved', 'incident', 'other'])
    .withMessage('block_type is not supported'),
  body('block_title')
    .trim()
    .notEmpty()
    .withMessage('block_title is required')
    .isLength({ max: 150 })
    .withMessage('block_title must not exceed 150 characters'),
  body('block_reason')
    .trim()
    .notEmpty()
    .withMessage('block_reason is required'),
  body('day_of_week')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 7 })
    .withMessage('day_of_week must be between 1 and 7'),
  body('time_slot_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('time_slot_id must be a positive integer'),
  body('start_date')
    .isDate()
    .withMessage('start_date must be a valid date'),
  body('end_date')
    .isDate()
    .withMessage('end_date must be a valid date')
    .custom((endDate, { req }) => {
      if (req.body.start_date && new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('end_date must be greater than or equal to start_date');
      }

      return true;
    })
];

const reviewRoomBlockValidator = [
  ...idValidator,
  body('block_status')
    .isIn(['approved', 'rejected'])
    .withMessage('block_status must be approved or rejected'),
  body('review_notes')
    .optional({ nullable: true })
    .isString()
    .withMessage('review_notes must be a string')
];

router.use(requireAuth);

router.get(
  '/room-issues',
  requireRoles(ROLES.LECTURER, ROLES.TECHNICIAN, ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  roomIssueListValidator,
  asyncHandler(listRoomIssues)
);

router.post(
  '/room-issues',
  requireRoles(ROLES.LECTURER, ROLES.TECHNICIAN),
  createRoomIssueValidator,
  asyncHandler(createRoomIssue)
);

router.patch(
  '/room-issues/:id',
  requireRoles(ROLES.TECHNICIAN, ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  updateRoomIssueValidator,
  asyncHandler(updateRoomIssue)
);

router.get(
  '/room-block-requests',
  requireRoles(ROLES.TECHNICIAN, ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  roomBlockListValidator,
  asyncHandler(listRoomBlocks)
);

router.post(
  '/room-block-requests',
  requireRoles(ROLES.TECHNICIAN, ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  createRoomBlockValidator,
  asyncHandler(createRoomBlock)
);

router.patch(
  '/room-block-requests/:id/review',
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  reviewRoomBlockValidator,
  asyncHandler(reviewRoomBlock)
);

module.exports = router;
