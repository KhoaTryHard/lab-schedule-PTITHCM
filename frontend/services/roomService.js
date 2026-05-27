import { apiClient } from "../lib/apiClient";

export const DEFAULT_MVP_ROOM_CODES = ["2B11", "2B21", "2B31"];

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function appendParam(query, key, value) {
  if (hasValue(value) && value !== "all") {
    query.set(key, String(value).trim());
  }
}

function normalizeRoomCode(roomCode) {
  return String(roomCode || "")
    .trim()
    .toUpperCase();
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

export function extractRoomScope(response) {
  const data = response?.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizeRoomCode).filter(Boolean);
}

export function getMvpRoomCodes() {
  return [...DEFAULT_MVP_ROOM_CODES];
}

export function isMvpRoom(roomCode, roomScopeCodes = DEFAULT_MVP_ROOM_CODES) {
  const normalizedRoomCode = normalizeRoomCode(roomCode);
  const normalizedScope = Array.isArray(roomScopeCodes)
    ? roomScopeCodes.map(normalizeRoomCode)
    : DEFAULT_MVP_ROOM_CODES;

  return normalizedScope.includes(normalizedRoomCode);
}

/**
 * Hàm nhận vào: không nhận tham số.
 * Hàm xử lý: gọi GET /api/rooms/scope để lấy danh sách mã phòng do backend trả về.
 * Hàm trả về: response backend, response.data là mảng mã phòng.
 */
export function listScopeRooms() {
  return apiClient("/rooms/scope", {
    method: "GET",
  });
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
 * Backward-compatible alias cho /admin/rooms/page.jsx.
 * Giữ tên cũ để không làm vỡ trang quản lý phòng.
 */
export function getRooms(params = {}) {
  return listRooms({
    scope: "mvp",
    ...params,
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
 * Backward-compatible alias cho /admin/rooms/page.jsx.
 */
export function updateRoomById(roomId, payload) {
  return updateRoom(roomId, payload);
}
