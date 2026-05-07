import { apiClient } from "../lib/apiClient";

/**
 * Hàm nhận vào:
 * - username: tên đăng nhập của người dùng.
 * - password: mật khẩu của người dùng.
 * Hàm xử lý: gọi API đăng nhập, API này không cần token.
 * Hàm trả về: response gồm token và thông tin user.
 */
export function login(username, password) {
  return apiClient("/auth/login", {
    method: "POST",
    requireAuth: false,
    body: JSON.stringify({ username, password }),
  });
}

/**
 * Hàm nhận vào: không nhận tham số.
 * Hàm xử lý: gọi API lấy thông tin người dùng hiện tại từ token.
 * Hàm trả về: response chứa public user trong data.
 */
export function getMe() {
  return apiClient("/auth/me", {
    method: "GET",
  });
}

/**
 * Hàm nhận vào: không nhận tham số.
 * Hàm xử lý: gọi API đăng xuất phía backend.
 * Hàm trả về: response logout.
 */
export function logout() {
  return apiClient("/auth/logout", {
    method: "POST",
  });
}
