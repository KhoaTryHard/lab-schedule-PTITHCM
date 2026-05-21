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
    .isInt({ min: 1 }).withMessage('lab_schedule_request_id phai la so nguyen duong'),
  body('available_slot_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('available_slot_id phai la so nguyen duong'),
  body('practice_team_id').isInt({ min: 1 }).withMessage('practice_team_id phai la so nguyen duong'),
  body('room_code').notEmpty().withMessage('room_code la bat buoc'),
  body('lecturer_user_id').isInt({ min: 1 }).withMessage('lecturer_user_id phai la so nguyen duong'),
  body('day_of_week').isInt({ min: 1, max: 7 }).withMessage('day_of_week phai tu 1 den 7'),
  body('time_slot').notEmpty().withMessage('time_slot la bat buoc'),
  body('start_date').isDate().withMessage('start_date phai la ngay hop le (YYYY-MM-DD)'),
  body('end_date')
    .isDate().withMessage('end_date phai la ngay hop le (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (req.body.start_date && new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('end_date phai lon hon hoac bang start_date');
      }

      return true;
    }),
  body('required_software_ids').optional().isArray().withMessage('required_software_ids phai la mang'),
  body('required_software_ids.*').optional().isInt({ min: 1 }).withMessage('Moi software_id phai la so nguyen duong'),
  body('notes').optional({ nullable: true }).isLength({ max: 255 }).withMessage('notes khong duoc vuot qua 255 ky tu'),
];

const checkConstraintsValidator = [
  body('room_code').notEmpty().withMessage('room_code là bắt buộc'),
  body('lecturer_user_id').isInt({ min: 1 }).withMessage('lecturer_user_id phải là số nguyên dương'),
  body('practice_team_id').isInt({ min: 1 }).withMessage('practice_team_id phải là số nguyên dương'),
  body('day_of_week').isInt({ min: 1, max: 7 }).withMessage('day_of_week phải từ 1 đến 7'),
  body('time_slot').notEmpty().withMessage('time_slot là bắt buộc'),
  body('start_date').isDate().withMessage('start_date phải là ngày hợp lệ (YYYY-MM-DD)'),
  body('end_date')
    .isDate().withMessage('end_date phải là ngày hợp lệ (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (req.body.start_date && new Date(endDate) < new Date(req.body.start_date)) {
        throw new Error('end_date phải lớn hơn hoặc bằng start_date');
      }
      return true;
    }),
  body('required_software_ids').optional().isArray().withMessage('required_software_ids phải là mảng'),
  body('required_software_ids.*').optional().isInt({ min: 1 }).withMessage('Mỗi software_id phải là số nguyên dương'),
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
