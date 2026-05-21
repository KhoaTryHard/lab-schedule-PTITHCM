import { apiClient } from "../lib/apiClient";

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Hàm nhận vào: params lọc danh sách yêu cầu.
 * Hàm xử lý: gọi API GET /schedule-requests.
 * Hàm trả về: Promise chứa response, response.data là danh sách yêu cầu xếp lịch.
 */
export function listScheduleRequests(params = {}) {
  return apiClient(`/schedule-requests${buildQueryString(params)}`, {
    method: "GET",
  });
}

/**
 * Hàm nhận vào: requestId.
 * Hàm xử lý: gọi API GET /schedule-requests/:id.
 * Hàm trả về: Promise chứa response, response.data là chi tiết yêu cầu.
 */
export function getScheduleRequestById(requestId) {
  return apiClient(`/schedule-requests/${requestId}`, {
    method: "GET",
  });
}

/**
 * Hàm nhận vào: payload tạo yêu cầu xếp lịch.
 * Hàm xử lý: gọi API POST /schedule-requests.
 * Hàm trả về: Promise chứa response, response.data là yêu cầu vừa tạo.
 */
export function createScheduleRequest(payload) {
  return apiClient("/schedule-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Hàm nhận vào: requestId.
 * Hàm xử lý: gọi API PATCH /schedule-requests/:id/submit.
 * Hàm trả về: Promise chứa response, response.data là yêu cầu sau khi submit.
 */
export function submitScheduleRequest(requestId) {
  return apiClient(`/schedule-requests/${requestId}/submit`, {
    method: "PATCH",
  });
}
