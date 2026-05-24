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
        icon: "equipment",
        itemName: "Phòng máy & thiết bị",
        href: "/admin/rooms",
      },
      {
        icon: "school",
        itemName: "Lịch thực hành",
        href: "/admin/schedules",
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
        badge: "Soon",
      },
      {
        icon: "person",
        itemName: "Yêu cầu xếp lịch",
        href: "/academic/schedule-requests",
      },
      {
        icon: "school",
        itemName: "Lịch thực hành",
        href: "/academic/schedules",
      },
      {
        icon: "chart",
        itemName: "Xếp lịch tự động",
        href: "/academic/auto-arrange",
      },
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
      {
        icon: "search",
        itemName: "Lịch giảng viên",
        href: "/lecturer/my-schedule",
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
      {
        icon: "equipment",
        itemName: "Lịch sử dụng phòng",
        href: "/technician/room-schedule",
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
      {
        icon: "school",
        itemName: "Lịch sinh viên",
        href: "/student/my-schedule",
      },
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
