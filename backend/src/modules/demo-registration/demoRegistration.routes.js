const express = require("express");
const { ROLES } = require("../../config/roles");
const { requireAuth } = require("../../middlewares/auth.middleware");
const { requireRoles } = require("../../middlewares/role.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  simulateStudentRegistration,
} = require("./demoRegistration.controller");

const router = express.Router();

router.post(
  "/simulate-student-registration",
  requireAuth,
  requireRoles(ROLES.ACADEMIC_OFFICER),
  asyncHandler(simulateStudentRegistration),
);

module.exports = router;
