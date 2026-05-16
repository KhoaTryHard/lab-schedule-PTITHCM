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

  if (hasValue(params.week_no) && params.week_no !== "all") {
    query.set("week_no", String(params.week_no).trim());
    query.set("week", String(params.week_no).trim());
  }

  if (hasValue(params.room_code) && params.room_code !== "all") {
    query.set("room_code", String(params.room_code).trim());
    query.set("room", String(params.room_code).trim());
  }

  appendParam(query, "course_section_id", params.course_section_id);
  appendParam(query, "lecturer_user_id", params.lecturer_user_id);
  appendParam(query, "student_user_id", params.student_user_id);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Hàm nhận vào: params lọc lịch thực hành.
 * Hàm xử lý: gọi GET /api/schedules với query param tương ứng.
 * Hàm trả về: response backend, hiện expected shape là response.data.schedules.
 */
export function listSchedules(params = {}) {
  return apiClient(`/schedules${buildScheduleQueryString(params)}`, {
    method: "GET",
  });
}
