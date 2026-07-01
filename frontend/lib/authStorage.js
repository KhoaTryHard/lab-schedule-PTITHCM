const TOKEN_KEY = "accessToken";
const USER_KEY = "currentUser";

/**
 * Hàm nhận vào: token JWT.
 * Hàm xử lý: lưu token vào localStorage để các lần gọi API sau dùng lại.
 * Hàm trả về: không trả về dữ liệu.
 */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Hàm nhận vào: không nhận tham số.
 * Hàm xử lý: lấy token từ localStorage.
 * Hàm trả về: token hoặc null.
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Hàm nhận vào: object user public.
 * Hàm xử lý: lưu thông tin user vào localStorage để sidebar và guard dùng nhanh.
 * Hàm trả về: không trả về dữ liệu.
 */
export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Hàm nhận vào: không nhận tham số.
 * Hàm xử lý: đọc user đã lưu trong localStorage.
 * Hàm trả về: object user hoặc null.
 */
export function getUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

/**
 * Hàm nhận vào: không nhận tham số.
 * Hàm xử lý: xóa token và user khỏi localStorage.
 * Hàm trả về: không trả về dữ liệu.
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
