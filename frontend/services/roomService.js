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