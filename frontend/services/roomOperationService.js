import { apiClient } from "../lib/apiClient";

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function appendParam(query, key, value) {
  if (hasValue(value) && value !== "all") {
    query.set(key, String(value).trim());
  }
}

function buildRoomIssueQueryString(params = {}) {
  const query = new URLSearchParams();

  appendParam(query, "status", params.status);
  appendParam(query, "issue_type", params.issue_type);
  appendParam(query, "room_code", params.room_code);
  appendParam(query, "lab_schedule_entry_id", params.lab_schedule_entry_id);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function buildRoomBlockQueryString(params = {}) {
  const query = new URLSearchParams();

  appendParam(query, "status", params.status);
  appendParam(query, "block_type", params.block_type);
  appendParam(query, "room_code", params.room_code);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function listRoomIssues(params = {}) {
  return apiClient(`/room-issues${buildRoomIssueQueryString(params)}`, {
    method: "GET",
  });
}

export function createRoomIssue(payload) {
  return apiClient("/room-issues", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRoomIssue(issueId, payload) {
  return apiClient(`/room-issues/${issueId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listRoomBlockRequests(params = {}) {
  return apiClient(`/room-block-requests${buildRoomBlockQueryString(params)}`, {
    method: "GET",
  });
}

export function createRoomBlockRequest(payload) {
  return apiClient("/room-block-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reviewRoomBlockRequest(blockId, payload) {
  return apiClient(`/room-block-requests/${blockId}/review`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
