import { apiClient } from "../lib/apiClient";

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function appendParam(query, key, value) {
  if (hasValue(value) && value !== "all") {
    query.set(key, String(value).trim());
  }
}

export function buildScheduleQueryString(params = {}) {
  const query = new URLSearchParams();

  appendParam(query, "status", params.status);
  appendParam(query, "room_code", params.room_code);
  appendParam(query, "lecturer_user_id", params.lecturer_user_id);
  appendParam(query, "schedule_request_id", params.schedule_request_id);
  appendParam(query, "student_user_id", params.student_user_id);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function buildPublishedScheduleQueryString(params = {}) {
  const query = new URLSearchParams();

  appendParam(query, "schedule_request_id", params.schedule_request_id);
  appendParam(query, "room_code", params.room_code);
  appendParam(query, "lecturer_user_id", params.lecturer_user_id);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * GET /api/schedules
 * Backend-supported filters:
 * status, room_code, lecturer_user_id, schedule_request_id, student_user_id.
 */
export function listSchedules(params = {}) {
  return apiClient(`/schedules${buildScheduleQueryString(params)}`, {
    method: "GET",
  });
}

/**
 * GET /api/schedules/published
 * Dùng cho GV/SV/KTV khi chỉ cần lịch đã công bố.
 */
export function listPublishedSchedules(params = {}) {
  return apiClient(
    `/schedules/published${buildPublishedScheduleQueryString(params)}`,
    {
      method: "GET",
    },
  );
}

/**
 * POST /api/schedules/check-constraints
 */
export function checkScheduleConstraints(payload) {
  return apiClient("/schedules/check-constraints", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/schedules/auto-arrange
 * Lưu ý: backend hiện tại vẫn là preview stub.
 */
export function autoArrange(input) {
  return apiClient("/schedules/auto-arrange", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * POST /api/schedules
 */
export function createScheduleFromOption(option, requestId) {
  return apiClient("/schedules", {
    method: "POST",
    body: JSON.stringify({
      lab_schedule_request_id: requestId,
      ...option,
    }),
  });
}

/**
 * PATCH /api/schedules/:id/approve
 */
export function approveSchedule(scheduleId) {
  return apiClient(`/schedules/${scheduleId}/approve`, {
    method: "PATCH",
  });
}

/**
 * PATCH /api/schedules/:id/publish
 */
export function publishSchedule(scheduleId) {
  return apiClient(`/schedules/${scheduleId}/publish`, {
    method: "PATCH",
  });
}
