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

const router = express.Router();

router.get(
  '/',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  listScheduleRequests
);

router.post(
  '/',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  createScheduleRequest
);

router.get(
  '/:id',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  getScheduleRequest
);

router.patch(
  '/:id/submit',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  submitScheduleRequest
);

module.exports = router;
