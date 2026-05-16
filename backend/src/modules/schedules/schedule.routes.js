const express = require('express');
const { body } = require('express-validator');
const { checkConstraints, autoArrange, listSchedules } = require('./schedule.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/roles');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

const checkConstraintsValidator = [
  body('room_code').notEmpty().withMessage('room_code là bắt buộc'),
  body('lecturer_user_id').isInt({ min: 1 }).withMessage('lecturer_user_id phải là số nguyên dương'),
  body('practice_team_id').isInt({ min: 1 }).withMessage('practice_team_id phải là số nguyên dương'),
  body('day_of_week').isInt({ min: 1, max: 7 }).withMessage('day_of_week phải từ 1 đến 7'),
  body('time_slot').notEmpty().withMessage('time_slot là bắt buộc'),
  body('start_date').isDate().withMessage('start_date phải là ngày hợp lệ (YYYY-MM-DD)'),
  body('end_date').isDate().withMessage('end_date phải là ngày hợp lệ (YYYY-MM-DD)'),
  body('required_software_ids').optional().isArray().withMessage('required_software_ids phải là mảng'),
  body('required_software_ids.*').optional().isInt({ min: 1 }).withMessage('Mỗi software_id phải là số nguyên dương'),
];

router.get('/', requireAuth, listSchedules);

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
