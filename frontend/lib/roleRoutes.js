export const ROLE_HOME_PATH = {
  QTV: "/admin",
  CBDT: "/academic/schedule-requests",
  GV: "/lecturer/my-schedule",
  KTV: "/technician/room-schedule",
  SV: "/student/my-schedule",
};

/**
 * Hàm nhận vào: roleCode của user, ví dụ QTV, CBDT, GV, KTV, SV.
 * Hàm xử lý: ánh xạ role sang dashboard mặc định.
 * Hàm trả về: đường dẫn dashboard tương ứng hoặc /unauthorized.
 */
export function getHomePathByRole(roleCode) {
  return ROLE_HOME_PATH[roleCode] || "/unauthorized";
}
