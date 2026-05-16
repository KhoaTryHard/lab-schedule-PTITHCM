import { apiClient } from "../lib/apiClient";

const MVP_ROOM_CODES = ["2B11", "2B21", "2B31"];

export function isMvpRoom(roomCode) {
  return MVP_ROOM_CODES.includes(String(roomCode || "").toUpperCase());
}

export function getMvpRoomCodes() {
  return MVP_ROOM_CODES;
}

/**
 * Lấy danh sách phòng MVP từ DB thật.
 * Backend endpoint đúng: GET /api/rooms
 */
export function getRooms(params = {}) {
  const query = new URLSearchParams();

  if (params.room_code) {
    query.set("room_code", params.room_code);
  }

  if (params.room_status && params.room_status !== "all") {
    query.set("room_status", params.room_status);
  }

  // Backend có hỗ trợ scope=mvp và in_scope=true.
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
 * Hàm trả về: Promise chứa response từ backend, trong đó response.data là thông tin phòng.
 */

export function getRoomById(roomId) {
  return apiClient('/rooms${roomId}', {method: "GET",});
}

/**
 * Hàm nhận vào:
 * - roomId: id phòng cần cập nhật.
 * - payload: object chứa dữ liệu cần gửi lên backend, ví dụ { room_status: "locked", notes: "..." }.
 * Hàm xử lý: gọi API PATCH /rooms/:id để cập nhật trạng thái/ghi chú phòng.
 * Hàm trả về: Promise chứa response từ backend, trong đó response.data là phòng sau khi cập nhật.
 */
export function updateRoomById(roomId, payload) {
  return apiClient(`/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}