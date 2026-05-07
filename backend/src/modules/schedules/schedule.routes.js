const express = require('express');
const {
  checkConstraints,
  autoArrange,
  listSchedules
} = require('./schedule.controller');

const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/roles');

const router = express.Router();

router.get('/', requireAuth, listSchedules);

router.post(
  '/check-constraints',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  checkConstraints
);

router.post(
  '/auto-arrange',
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  autoArrange
);

module.exports = router;
