const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

/**
 * Hàm nhận vào: không nhận tham số.
 * Hàm xử lý: lấy token đăng nhập đã lưu trong localStorage.
 * Hàm trả về: token dạng chuỗi hoặc null nếu chưa đăng nhập.
 */
function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
}

/**
 * Hàm nhận vào:
 * - path: đường dẫn API, ví dụ "/auth/login".
 * - options: cấu hình fetch, có thể truyền method, body, headers, requireAuth.
 * Hàm xử lý: gọi API backend, tự gắn Content-Type và Authorization nếu cần.
 * Hàm trả về: dữ liệu JSON backend trả về.
 */
export async function apiClient(path, options = {}) {
  const { requireAuth = true, headers, ...fetchOptions } = options;
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(requireAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    ...fetchOptions,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "API request failed");
    error.status = response.status;
    error.details = data?.details || null;
    throw error;
  }

  return data;
}
