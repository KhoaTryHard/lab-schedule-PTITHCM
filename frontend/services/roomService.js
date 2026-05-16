import { apiClient } from "../lib/apiClient";

const MVP_ROOM_CODES = ["2B11", "2B21", "2B31"];

export function isMvpRoom(roomCode) {
  return MVP_ROOM_CODES.includes(String(roomCode || "").toUpperCase());
}

export function getMvpRoomCodes() {
  return MVP_ROOM_CODES;
}

/**
 * Hàm xử lý: lấy danh sách mã phòng thuộc scope MVP từ backend.
 * Backend endpoint: GET /api/rooms/scope
 */
export function getRoomScope() {
  return apiClient("/rooms/scope", {
    method: "GET",
  });
}

/**
 * Hàm nhận vào: params lọc phòng.
 * Hàm xử lý: gọi API GET /rooms để lấy danh sách phòng MVP từ DB thật.
 * Hàm trả về: Promise chứa response từ backend, response.data là danh sách phòng.
 */
export function getRooms(params = {}) {
  const query = new URLSearchParams();

  if (params.room_code) {
    query.set("room_code", params.room_code);
  }

  if (params.room_status && params.room_status !== "all") {
    query.set("room_status", params.room_status);
  }

  query.set("scope", "mvp");
  query.set("in_scope", "true");

  const queryString = query.toString();

  return apiClient(`/rooms${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  });
}

/**
 * Hàm nhận vào: roomId là id phòng cần lấy chi tiết.
 * Hàm xử lý: gọi API GET /rooms/:id để lấy chi tiết một phòng trong phạm vi MVP.
 * Hàm trả về: Promise chứa response từ backend, response.data là thông tin phòng.
 */
export function getRoomById(roomId) {
  return apiClient(`/rooms/${roomId}`, {
    method: "GET",
  });
}

/**
 * Hàm nhận vào:
 * - roomId: id phòng cần cập nhật.
 * - payload: object chứa dữ liệu cần gửi lên backend.
 * Hàm xử lý: gọi API PATCH /rooms/:id để cập nhật trạng thái/ghi chú phòng.
 * Hàm trả về: Promise chứa response từ backend, response.data là phòng sau khi cập nhật.
 */
export function updateRoomById(roomId, payload) {
  return apiClient(`/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}