const express = require('express');
const { 
  createScheduleRequest, 
  listScheduleRequests, 
  getScheduleRequest, 
  submitScheduleRequest 
} = require('./scheduleRequest.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/roles');
const asyncHandler = require('../../utils/asyncHandler');
const { body, param } = require('express-validator');

const router = express.Router();

const createScheduleRequestValidator = [
  body('course_section_id')
    .notEmpty().withMessage('course_section_id là bắt buộc')
    .isInt({ min: 1 }).withMessage('course_section_id phải là số nguyên dương'),
  body('requested_team_count')
    .optional()
    .isInt({ min: 1 }).withMessage('requested_team_count phải lớn hơn 0'),
  body('total_required_sessions')
    .optional()
    .isInt({ min: 1 }).withMessage('total_required_sessions phải lớn hơn 0'),
  body('preferred_day_of_week')
    .optional()
    .isInt({ min: 1, max: 7 }).withMessage('preferred_day_of_week phải từ 1 đến 7'),
  body('max_students_per_team')
    .optional()
    .isInt({ min: 1 }),
];

const idValidator = [
  param('id')
    .notEmpty().withMessage('id là bắt buộc')
    .isInt({ min: 1 }).withMessage('id phải là số nguyên dương')
];

router.get(
  '/',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  asyncHandler(listScheduleRequests)
);

router.post(
  '/',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  createScheduleRequestValidator,
  asyncHandler(createScheduleRequest)
);

router.get(
  '/:id',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  idValidator,
  asyncHandler(getScheduleRequest)
);

router.patch(
  '/:id/submit',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  idValidator,
  asyncHandler(submitScheduleRequest)
);

module.exports = router;