const express = require('express');

const {
  createAccount,
  createDevice,
  createMasterData,
  createSoftwarePackage,
  disableAccount,
  listAccounts,
  listDevices,
  listMasterData,
  listSoftwarePackages,
  updateAccount,
  updateDevice,
  updateMasterData,
  updateSoftwarePackage
} = require('./admin.controller');
const { ROLES } = require('../../config/roles');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

router.get(
  '/accounts',
  requireRoles(ROLES.ADMIN),
  asyncHandler(listAccounts)
);

router.post(
  '/accounts',
  requireRoles(ROLES.ADMIN),
  asyncHandler(createAccount)
);

router.patch(
  '/accounts/:id',
  requireRoles(ROLES.ADMIN),
  asyncHandler(updateAccount)
);

router.patch(
  '/accounts/:id/disable',
  requireRoles(ROLES.ADMIN),
  asyncHandler(disableAccount)
);

router.get(
  '/master-data/:resource',
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER),
  asyncHandler(listMasterData)
);

router.post(
  '/master-data/:resource',
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER),
  asyncHandler(createMasterData)
);

router.patch(
  '/master-data/:resource/:id',
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER),
  asyncHandler(updateMasterData)
);

router.get(
  '/devices',
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER, ROLES.TECHNICIAN),
  asyncHandler(listDevices)
);

router.post(
  '/devices',
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER),
  asyncHandler(createDevice)
);

router.patch(
  '/devices/:id',
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER),
  asyncHandler(updateDevice)
);

router.get(
  '/software-packages',
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER, ROLES.TECHNICIAN),
  asyncHandler(listSoftwarePackages)
);

router.post(
  '/software-packages',
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER),
  asyncHandler(createSoftwarePackage)
);

router.patch(
  '/software-packages/:id',
  requireRoles(ROLES.ADMIN, ROLES.ACADEMIC_OFFICER),
  asyncHandler(updateSoftwarePackage)
);

module.exports = router;
