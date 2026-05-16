import { apiClient } from "../lib/apiClient";

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Hàm nhận vào: params lọc lịch.
 * Hàm xử lý: gọi API GET /schedules.
 * Hàm trả về: Promise chứa response từ backend.
 */
export function listSchedules(params = {}) {
  return apiClient(`/schedules${buildQueryString(params)}`, {
    method: "GET",
  });
}

/**
 * Hàm nhận vào: payload kiểm tra ràng buộc.
 * Hàm xử lý: gọi API POST /schedules/check-constraints.
 * Hàm trả về: Promise chứa kết quả kiểm tra ràng buộc.
 */
export function checkScheduleConstraints(payload) {
  return apiClient("/schedules/check-constraints", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Hàm nhận vào: payload chạy thuật toán xếp lịch tự động.
 * Hàm xử lý: gọi API POST /schedules/auto-arrange.
 * Hàm trả về: Promise chứa phương án xếp lịch được backend đề xuất.
 */
export function autoArrangeSchedule(payload) {
  return apiClient("/schedules/auto-arrange", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
