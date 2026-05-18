import { apiClient } from "../lib/apiClient";

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function appendParam(query, key, value) {
  if (hasValue(value) && value !== "all") {
    query.set(key, String(value).trim());
  }
}

function buildRoomQueryString(params = {}) {
  const query = new URLSearchParams();

  appendParam(query, "room_code", params.room_code);
  appendParam(query, "room_status", params.room_status);
  appendParam(query, "scope", params.scope);
  appendParam(query, "in_scope", params.in_scope);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Hàm nhận vào: params lọc phòng máy.
 * Hàm xử lý: gọi GET /api/rooms.
 * Hàm trả về: response backend, response.data là danh sách phòng trong MVP scope.
 */
export function listRooms(params = {}) {
  return apiClient(`/rooms${buildRoomQueryString(params)}`, {
    method: "GET",
  });
}

/**
 * Hàm nhận vào: roomId.
 * Hàm xử lý: gọi GET /api/rooms/:id.
 * Hàm trả về: response chi tiết phòng.
 */
export function getRoomById(roomId) {
  return apiClient(`/rooms/${roomId}`, {
    method: "GET",
  });
}

/**
 * Hàm nhận vào: roomId và payload update.
 * Hàm xử lý: gọi PATCH /api/rooms/:id.
 * Hàm trả về: response phòng sau khi cập nhật.
 */
export function updateRoom(roomId, payload) {
  return apiClient(`/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Hàm nhận vào: không nhận tham số.
 * Hàm xử lý: gọi GET /api/rooms/scope.
 * Hàm trả về: danh sách mã phòng thuộc MVP scope.
 */
export function listScopeRooms() {
  return apiClient("/rooms/scope", {
    method: "GET",
  });
}
