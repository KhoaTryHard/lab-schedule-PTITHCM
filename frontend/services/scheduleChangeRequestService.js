import { apiClient } from "../lib/apiClient";

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function appendParam(query, key, value) {
  if (hasValue(value) && value !== "all") {
    query.set(key, String(value).trim());
  }
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  appendParam(query, "status", params.status);
  appendParam(query, "change_type", params.change_type);
  appendParam(query, "lab_schedule_entry_id", params.lab_schedule_entry_id);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function listScheduleChangeRequests(params = {}) {
  return apiClient(`/schedule-change-requests${buildQueryString(params)}`, {
    method: "GET",
  });
}

export function createScheduleChangeRequest(payload) {
  return apiClient("/schedule-change-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reviewScheduleChangeRequest(requestId, payload) {
  return apiClient(`/schedule-change-requests/${requestId}/review`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function implementScheduleChangeRequest(requestId, payload = {}) {
  return apiClient(`/schedule-change-requests/${requestId}/implement`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
