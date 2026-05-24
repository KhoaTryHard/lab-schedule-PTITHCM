const express = require('express');
const { body } = require('express-validator');
const {
  checkConstraints,
  createSchedule,
  autoArrange,
  listSchedules,
  approveScheduleEntry,
  publishScheduleEntry,
  listPublishedSchedules
} = require('./schedule.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/roles');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

const scheduleDraftValidator = [
  body('lab_schedule_request_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('lab_schedule_request_id must be a positive integer'),
  body('available_slot_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('available_slot_id must be a positive integer'),
  body('practice_team_id').isInt({ min: 1 }).withMessage('practice_team_id must be a positive integer'),
  body('room_code').notEmpty().withMessage('room_code is required'),
  body('lecturer_user_id').isInt({ min: 1 }).withMessage('lecturer_user_id must be a positive integer'),
  body('day_of_week').isInt({ min: 1, max: 7 }).withMessage('day_of_week must be between 1 and 7'),
  body('time_slot').notEmpty().withMessage('time_slot is required'),
  body('start_date').isDate().withMessage('start_date must be a valid date (YYYY-MM-DD)'),
  body('end_date')
    .isDate().withMessage('end_date must be a valid date (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (req.body.start_date && new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('end_date must be greater than or equal to start_date');
      }

      return true;
    }),
  body('required_software_ids').optional().isArray().withMessage('required_software_ids must be an array'),
  body('required_software_ids.*').optional().isInt({ min: 1 }).withMessage('Each software_id must be a positive integer'),
  body('notes').optional({ nullable: true }).isLength({ max: 255 }).withMessage('notes must not exceed 255 characters'),
];

const checkConstraintsValidator = [
  body('room_code').notEmpty().withMessage('room_code is required'),
  body('lecturer_user_id').isInt({ min: 1 }).withMessage('lecturer_user_id must be a positive integer'),
  body('practice_team_id').isInt({ min: 1 }).withMessage('practice_team_id must be a positive integer'),
  body('day_of_week').isInt({ min: 1, max: 7 }).withMessage('day_of_week must be between 1 and 7'),
  body('time_slot').notEmpty().withMessage('time_slot is required'),
  body('start_date').isDate().withMessage('start_date must be a valid date (YYYY-MM-DD)'),
  body('end_date')
    .isDate().withMessage('end_date must be a valid date (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (req.body.start_date && new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('end_date must be greater than or equal to start_date');
      }
      return true;
    }),
  body('required_software_ids').optional().isArray().withMessage('required_software_ids must be an array'),
  body('required_software_ids.*').optional().isInt({ min: 1 }).withMessage('Each software_id must be a positive integer'),
];

router.get('/', requireAuth, asyncHandler(listSchedules));

router.get('/published', requireAuth, asyncHandler(listPublishedSchedules));

router.patch(
  '/:id/approve',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  asyncHandler(approveScheduleEntry)
);

router.patch(
  '/:id/publish',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  asyncHandler(publishScheduleEntry)
);

router.post(
  '/',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  scheduleDraftValidator,
  asyncHandler(createSchedule)
);

router.post(
  '/check-constraints',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  checkConstraintsValidator,
  asyncHandler(checkConstraints)
);

router.post(
  '/auto-arrange',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  asyncHandler(autoArrange)
);

module.exports = router;
