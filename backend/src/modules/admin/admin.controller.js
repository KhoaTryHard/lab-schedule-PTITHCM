const { created, fail, ok } = require('../../utils/apiResponse');
const adminService = require('./admin.service');
const { listAuditLogs: listAuditLogEntries } = require('../audit/audit.service');

function handleAdminError(res, error) {
  if (error && error.statusCode) {
    return fail(res, error.statusCode, error.message, error.details || null);
  }

  throw error;
}

async function listAccounts(req, res) {
  try {
    const accounts = await adminService.listAccounts(req.query);
    return ok(res, accounts, 'Success');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function createAccount(req, res) {
  try {
    const account = await adminService.createAccount(req.body || {}, req.user.id);
    return created(res, account, 'Account created');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function updateAccount(req, res) {
  try {
    const account = await adminService.updateAccount(req.params.id, req.body || {}, req.user.id);
    return ok(res, account, 'Account updated');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function disableAccount(req, res) {
  try {
    const account = await adminService.disableAccount(req.params.id, req.user.id);
    return ok(res, account, 'Account disabled');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function listMasterData(req, res) {
  try {
    const items = await adminService.listMasterData(req.params.resource);
    return ok(res, items, 'Success');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function createMasterData(req, res) {
  try {
    const item = await adminService.createMasterData(req.params.resource, req.body || {}, req.user.id);
    return created(res, item, 'Master data item created');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function updateMasterData(req, res) {
  try {
    const item = await adminService.updateMasterData(
      req.params.resource,
      req.params.id,
      req.body || {},
      req.user.id
    );

    return ok(res, item, 'Master data item updated');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function listDevices(req, res) {
  try {
    const devices = await adminService.listDevices(req.query);
    return ok(res, devices, 'Success');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function createDevice(req, res) {
  try {
    const device = await adminService.createDevice(req.body || {}, req.user.id);
    return created(res, device, 'Device created');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function updateDevice(req, res) {
  try {
    const device = await adminService.updateDevice(req.params.id, req.body || {}, req.user.id);
    return ok(res, device, 'Device updated');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function listSoftwarePackages(req, res) {
  try {
    const softwarePackages = await adminService.listSoftwarePackages();
    return ok(res, softwarePackages, 'Success');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function createSoftwarePackage(req, res) {
  try {
    const softwarePackage = await adminService.createSoftwarePackage(req.body || {}, req.user.id);
    return created(res, softwarePackage, 'Software package created');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function updateSoftwarePackage(req, res) {
  try {
    const softwarePackage = await adminService.updateSoftwarePackage(
      req.params.id,
      req.body || {},
      req.user.id
    );

    return ok(res, softwarePackage, 'Software package updated');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

async function listAuditLogs(req, res) {
  try {
    const auditLogs = await listAuditLogEntries(req.query);
    return ok(res, auditLogs, 'Success');
  } catch (error) {
    return handleAdminError(res, error);
  }
}

module.exports = {
  createAccount,
  createDevice,
  createMasterData,
  createSoftwarePackage,
  disableAccount,
  listAuditLogs,
  listAccounts,
  listDevices,
  listMasterData,
  listSoftwarePackages,
  updateAccount,
  updateDevice,
  updateMasterData,
  updateSoftwarePackage
};
