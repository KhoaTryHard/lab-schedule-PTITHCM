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
        icon: "account",
        itemName: "Quản lý tài khoản",
        href: "/admin/accounts",
      },
      { icon: "lab", itemName: "Phòng máy & thiết bị", href: "/admin/rooms" },
      { icon: "device", itemName: "Danh mục thiết bị", href: "/admin/devices" },
      {
        icon: "training",
        itemName: "Dữ liệu đào tạo",
        href: "/admin/trainingData",
      },
      {
        icon: "schedule",
        itemName: "Lịch thực hành",
        href: "/admin/schedules",
      },
      {
        icon: "lookup",
        itemName: "Tra cứu toàn hệ thống",
        href: "/admin/lookups",
      },
      {
        icon: "audit",
        itemName: "Nhật ký thao tác",
        href: "/admin/audit-logs",
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
      {
        icon: "academicOverview",
        itemName: "Tổng quan",
        href: "/academic",
      },
      {
        icon: "trainingData",
        itemName: "Dữ liệu đào tạo",
        href: "/academic/trainingData",
      },
      {
        icon: "scheduleRequest",
        itemName: "Yêu cầu xếp lịch",
        href: "/academic/schedule-requests",
      },
      {
        icon: "autoArrange",
        itemName: "Xếp lịch tự động",
        href: "/academic/auto-arrange",
      },
      {
        icon: "publishedSchedule",
        itemName: "Lịch thực hành",
        href: "/academic/schedules",
      },
      {
        icon: "changeRequest",
        itemName: "Yêu cầu đổi lịch",
        href: "/academic/change-requests",
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
      { icon: "lecturerOverview", itemName: "Tổng quan", href: "/lecturer" },
      {
        icon: "lecturerSchedule",
        itemName: "Lịch giảng viên",
        href: "/lecturer/my-schedule",
      },
      {
        icon: "lecturerChangeRequest",
        itemName: "Yêu cầu đổi lịch",
        href: "/lecturer/change-requests",
      },
      {
        icon: "lecturerIssueReport",
        itemName: "Báo cáo sự cố",
        href: "/lecturer/room-issues",
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
        icon: "technicianOverview",
        itemName: "Tổng quan",
        href: "/technician",
      },
      {
        icon: "technicianRoomSchedule",
        itemName: "Lịch sử dụng phòng",
        href: "/technician/room-schedule",
      },
      {
        icon: "technicianRoomStatus",
        itemName: "Tình trạng phòng",
        href: "/technician/room-status",
      },
      {
        icon: "technicianIssueReport",
        itemName: "Sự cố phòng máy",
        href: "/technician/issues",
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
      { icon: "studentOverview", itemName: "Tổng quan", href: "/student" },
      {
        icon: "studentSchedule",
        itemName: "Lịch sinh viên",
        href: "/student/my-schedule",
      },
      {
        icon: "studentNotification",
        itemName: "Thông báo",
        href: "/student/notifications",
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
