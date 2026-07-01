const express = require('express');
const {
  createRoomByAdmin,
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
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER, ROLES.LECTURER, ROLES.TECHNICIAN),
  asyncHandler(getRooms)
);
router.post(
  '/',
  requireAuth,
  requireRoles(ROLES.ADMIN),
  asyncHandler(createRoomByAdmin)
);
router.get(
  '/:id',
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER, ROLES.LECTURER, ROLES.TECHNICIAN),
  asyncHandler(getRoomById)
);
router.patch(
  '/:id',
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER),
  asyncHandler(updateRoomById)
);

module.exports = router;
