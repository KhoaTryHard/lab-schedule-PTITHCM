import { apiClient } from "../lib/apiClient";

function appendParam(query, key, value) {
  if (value !== undefined && value !== null && String(value).trim() !== "" && value !== "all") {
    query.set(key, String(value).trim());
  }
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    appendParam(query, key, value);
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function listAdminAccounts(params = {}) {
  return apiClient(`/admin/accounts${buildQueryString(params)}`, {
    method: "GET",
  });
}

export function createAdminAccount(payload) {
  return apiClient("/admin/accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminAccount(accountId, payload) {
  return apiClient(`/admin/accounts/${accountId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function disableAdminAccount(accountId) {
  return apiClient(`/admin/accounts/${accountId}/disable`, {
    method: "PATCH",
  });
}

export function listMasterData(resource) {
  return apiClient(`/admin/master-data/${resource}`, {
    method: "GET",
  });
}

export function createMasterData(resource, payload) {
  return apiClient(`/admin/master-data/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMasterData(resource, itemId, payload) {
  return apiClient(`/admin/master-data/${resource}/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listAdminDevices(params = {}) {
  return apiClient(`/admin/devices${buildQueryString(params)}`, {
    method: "GET",
  });
}

export function createAdminDevice(payload) {
  return apiClient("/admin/devices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminDevice(deviceId, payload) {
  return apiClient(`/admin/devices/${deviceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listSoftwarePackages() {
  return apiClient("/admin/software-packages", {
    method: "GET",
  });
}

export function createSoftwarePackage(payload) {
  return apiClient("/admin/software-packages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSoftwarePackage(softwarePackageId, payload) {
  return apiClient(`/admin/software-packages/${softwarePackageId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
