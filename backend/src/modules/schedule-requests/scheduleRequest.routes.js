const express = require('express');
const { createScheduleRequest, listScheduleRequests } = require('./scheduleRequest.controller');
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

module.exports = router;
