const express = require('express');

const { ROLES } = require('../../config/roles');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const { getBasicReport } = require('./report.controller');

const router = express.Router();

router.use(requireAuth);

router.get(
  '/basic',
  requireRoles(ROLES.ACADEMIC_OFFICER, ROLES.ADMIN),
  asyncHandler(getBasicReport)
);

module.exports = router;
