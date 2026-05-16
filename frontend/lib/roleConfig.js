export const ROLE_ALIASES = {
  ADMIN: "QTV",
  ACADEMIC_OFFICER: "CBDT",
  LECTURER: "GV",
  TECHNICIAN: "KTV",
  STUDENT: "SV",
};

export const ALIASES_NAME = {
  QTV: "Quản trị viên",
  CBDT: "Cán bộ đào tạo",
  GV: "Giảng viên",
  KTV: "Kỹ thuật viên",
  SV: "Sinh viên",
};

export const ROLE_HOME_PATH = {
  QTV: "/admin",
  CBDT: "/academic",
  GV: "/lecturer/my-schedule",
  KTV: "/technician/room-schedule",
  SV: "/student/my-schedule",
};

export const ROLE_LAYOUT_CONFIG = {
  QTV: {
    roleCode: "QTV",
    brandTitle: "Quản trị viên",
    brandSubtitle: "Quản trị hệ thống",
    defaultUserName: "Admin PTIT HCM",
    defaultUserRole: "Quản trị hệ thống",
    topBarBadge: "QTV",
    allowedRoles: ["QTV"],
    navItems: [
      { icon: "dashboard", itemName: "Tổng quan", href: "/admin" },
      {
        icon: "person",
        itemName: "Quản lý tài khoản",
        href: "/admin/accounts",
      },
      {
        icon: "equipment",
        itemName: "Phòng máy & thiết bị",
        href: "/admin/rooms",
      },
      {
        icon: "school",
        itemName: "Dữ liệu đào tạo",
        href: "/admin/trainingData",
      },
      {
        icon: "search",
        itemName: "Tra cứu toàn hệ thống",
        href: "/admin/lookups",
      },
      { icon: "chart", itemName: "Thống kê & báo cáo", href: "/admin/reports" },
      {
        icon: "settings",
        itemName: "Hướng dẫn sử dụng",
        href: "/admin/settings",
      },
    ],
  },
  CBDT: {
    roleCode: "CBDT",
    brandTitle: "Cán bộ đào tạo",
    brandSubtitle: "Điều phối lịch thực hành",
    defaultUserName: "Cán bộ đào tạo",
    defaultUserRole: "CBDT",
    topBarBadge: "CBDT",
    allowedRoles: ["CBDT"],
    navItems: [
      { icon: "dashboard", itemName: "Tổng quan", href: "/academic" },
      {
        icon: "school",
        itemName: "Dữ liệu đào tạo",
        href: "/academic/trainingData",
      },
      {
        icon: "person",
        itemName: "Yêu cầu xếp lịch",
        href: "/academic/schedule-requests",
      },
      {
        icon: "chart",
        itemName: "Xếp lịch tự động",
        href: "/academic/auto-arrange",
      },
      {
        icon: "school",
        itemName: "Lịch thực hành",
        href: "/academic/schedules",
      },
      {
        icon: "search",
        itemName: "Yêu cầu đổi/hủy/bù",
        href: "/academic/change-requests",
      },
      {
        icon: "settings",
        itemName: "Thông báo",
        href: "/academic/notifications",
      },
      { icon: "chart", itemName: "Báo cáo", href: "/academic/reports" },
    ],
  },
  GV: {
    roleCode: "GV",
    brandTitle: "Giảng viên",
    brandSubtitle: "Theo dõi lịch giảng dạy",
    defaultUserName: "Giảng viên",
    defaultUserRole: "GV",
    topBarBadge: "GV",
    allowedRoles: ["GV"],
    navItems: [
      { icon: "dashboard", itemName: "Tổng quan", href: "/lecturer" },
      {
        icon: "search",
        itemName: "Lịch giảng viên",
        href: "/lecturer/my-schedule",
      },
      {
        icon: "chart",
        itemName: "Đổi / bù / hủy lịch",
        href: "/lecturer/change-requests",
      },
      {
        icon: "equipment",
        itemName: "Báo cáo sự cố",
        href: "/lecturer/room-issues",
      },
      {
        icon: "settings",
        itemName: "Thông báo",
        href: "/lecturer/notifications",
      },
    ],
  },
  KTV: {
    roleCode: "KTV",
    brandTitle: "Kỹ thuật viên",
    brandSubtitle: "Theo dõi phòng máy",
    defaultUserName: "Kỹ thuật viên",
    defaultUserRole: "KTV",
    topBarBadge: "KTV",
    allowedRoles: ["KTV"],
    navItems: [
      { icon: "dashboard", itemName: "Tổng quan", href: "/technician" },
      {
        icon: "equipment",
        itemName: "Lịch sử dụng phòng",
        href: "/technician/room-schedule",
      },
      {
        icon: "settings",
        itemName: "Tình trạng phòng",
        href: "/technician/room-status",
      },
      {
        icon: "person",
        itemName: "Sự cố phòng máy",
        href: "/technician/issues",
      },
      {
        icon: "search",
        itemName: "Thông báo",
        href: "/technician/notifications",
      },
    ],
  },
  SV: {
    roleCode: "SV",
    brandTitle: "Sinh viên",
    brandSubtitle: "Tra cứu lịch thực hành",
    defaultUserName: "Sinh viên",
    defaultUserRole: "SV",
    topBarBadge: "SV",
    allowedRoles: ["SV"],
    navItems: [
      { icon: "dashboard", itemName: "Tổng quan", href: "/student" },
      {
        icon: "school",
        itemName: "Lịch sinh viên",
        href: "/student/my-schedule",
      },
      {
        icon: "settings",
        itemName: "Thông báo",
        href: "/student/notifications",
      },
      { icon: "person", itemName: "Gửi phản ánh", href: "/student/feedback" },
    ],
  },
};

export function normalizeRoleCode(roleCode) {
  if (!roleCode) {
    return "";
  }

  const normalized = String(roleCode).trim().toUpperCase();
  return ROLE_ALIASES[normalized] || normalized;
}

export function getHomePathByRole(roleCode) {
  return ROLE_HOME_PATH[normalizeRoleCode(roleCode)] || "/unauthorized";
}

export function getLayoutConfigByRole(roleCode) {
  return ROLE_LAYOUT_CONFIG[normalizeRoleCode(roleCode)] || null;
}
