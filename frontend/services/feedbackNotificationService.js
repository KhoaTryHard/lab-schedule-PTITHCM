import { apiClient } from "../lib/apiClient";

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function appendParam(query, key, value) {
  if (hasValue(value) && value !== "all") {
    query.set(key, String(value).trim());
  }
}

function buildFeedbackQueryString(params = {}) {
  const query = new URLSearchParams();

  appendParam(query, "status", params.status);
  appendParam(query, "feedback_type", params.feedback_type);
  appendParam(query, "lab_schedule_entry_id", params.lab_schedule_entry_id);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function buildNotificationQueryString(params = {}) {
  const query = new URLSearchParams();

  appendParam(query, "status", params.status);
  appendParam(query, "notification_type", params.notification_type);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function listStudentFeedback(params = {}) {
  return apiClient(`/student-feedback${buildFeedbackQueryString(params)}`, {
    method: "GET",
  });
}

export function createStudentFeedback(payload) {
  return apiClient("/student-feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudentFeedback(feedbackId, payload) {
  return apiClient(`/student-feedback/${feedbackId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function listNotifications(params = {}) {
  return apiClient(`/notifications${buildNotificationQueryString(params)}`, {
    method: "GET",
  });
}

export function markNotificationRead(notificationId) {
  return apiClient(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export function acknowledgeNotification(notificationId) {
  return apiClient(`/notifications/${notificationId}/acknowledge`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiClient("/notifications/read-all", {
    method: "PATCH",
  });
}
