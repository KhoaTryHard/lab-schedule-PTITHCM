const express = require('express');
const {
  getRoomById,
  getRooms,
  getScopeRooms,
  updateRoomById
} = require('./room.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/roles');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/scope', requireAuth, getScopeRooms);
router.get(
  '/',
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER, ROLES.TECHNICIAN),
  asyncHandler(getRooms)
);
router.get(
  '/:id',
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER, ROLES.TECHNICIAN),
  asyncHandler(getRoomById)
);
router.patch(
  '/:id',
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER),
  asyncHandler(updateRoomById)
);

module.exports = router;
