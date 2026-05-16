"use client";

import { useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";

// Mảng dữ liệu mock cho tra cứu lịch thực hành toàn hệ thống, bám gần bảng lab_schedule_entries.
const scheduleLookupMockItems = [
  {
    id: 1,
    schedule_code: "LS_2B11_INT1434_03",
    course_code: "INT1434-3",
    course_name: "Lập trình Web",
    section_code: "INT1434-3_03",
    group_no: "03",
    practice_team_code: "TH03A",
    lecturer_name: "Nguyễn Trọng Khang",
    room_code: "2B11",
    day_of_week: "Thứ 3",
    time_slot_label: "Tiết 7-10",
    start_date: "2026-03-30",
    end_date: "2026-05-18",
    entry_status: "Published",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    notes: "Đã công bố cho sinh viên và kỹ thuật viên.",
  },
  {
    id: 2,
    schedule_code: "LS_2B21_INT14105_01",
    course_code: "INT14105",
    course_name: "An toàn ứng dụng web và cơ sở dữ liệu",
    section_code: "INT14105_01",
    group_no: "01",
    practice_team_code: "TH01B",
    lecturer_name: "Trần Quốc Huy",
    room_code: "2B21",
    day_of_week: "Thứ 5",
    time_slot_label: "Tiết 1-4",
    start_date: "2026-03-30",
    end_date: "2026-05-11",
    entry_status: "Approved",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    notes: "Đang chờ bước công bố lịch cho toàn lớp.",
  },
  {
    id: 3,
    schedule_code: "LS_2B11_INT1332_04",
    course_code: "INT1332",
    course_name: "Lập trình hướng đối tượng",
    section_code: "INT1332_04",
    group_no: "04",
    practice_team_code: "TH04C",
    lecturer_name: "Lê Minh Toàn",
    room_code: "2B11",
    day_of_week: "Thứ 2",
    time_slot_label: "Tiết 7-10",
    start_date: "2025-09-22",
    end_date: "2025-11-24",
    entry_status: "Draft",
    semester_code: "HK1_2025_2026",
    week_no: 6,
    notes: "Chờ xác nhận sĩ số trước khi duyệt.",
  },
  {
    id: 4,
    schedule_code: "LS_2B31_INT1303_03",
    course_code: "INT1303",
    course_name: "An toàn và bảo mật hệ thống thông tin",
    section_code: "INT1303_03",
    group_no: "03",
    practice_team_code: "TH03D",
    lecturer_name: "Phạm Hoàng Dương",
    room_code: "2B31",
    day_of_week: "Thứ 6",
    time_slot_label: "Tiết 7-10",
    start_date: "2026-03-02",
    end_date: "2026-04-20",
    entry_status: "Cancelled",
    semester_code: "HK2_2025_2026",
    week_no: 34,
    notes: "Hủy do phòng bảo trì và thiếu điều kiện phần mềm.",
  },
  {
    id: 5,
    schedule_code: "LS_2B21_INT1332_01",
    course_code: "INT1332",
    course_name: "Lập trình hướng đối tượng",
    section_code: "INT1332_01",
    group_no: "01",
    practice_team_code: "TH01A",
    lecturer_name: "Ngô Hải Yến",
    room_code: "2B21",
    day_of_week: "Thứ 4",
    time_slot_label: "Tiết 1-4",
    start_date: "2025-10-06",
    end_date: "2025-12-08",
    entry_status: "Completed",
    semester_code: "HK1_2025_2026",
    week_no: 8,
    notes: "Lịch đã hoàn tất và có biên bản tổng kết.",
  },
];

// Mảng dữ liệu mock cho tra cứu phòng máy, bám gần bảng rooms.
const roomLookupMockItems = [
  {
    id: 1,
    room_code: "2B11",
    total_computers: 40,
    broken_computers: 2,
    usable_student_computers: 37,
    has_projector: true,
    has_wifi: true,
    has_lan: true,
    room_status: "Đang sử dụng",
    primary_technician_name: "Nguyễn Minh Kỹ Thuật",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 2,
    room_code: "2B21",
    total_computers: 40,
    broken_computers: 3,
    usable_student_computers: 36,
    has_projector: true,
    has_wifi: true,
    has_lan: true,
    room_status: "Khả dụng",
    primary_technician_name: "Lê Hoàng Bảo",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 3,
    room_code: "2B31",
    total_computers: 40,
    broken_computers: 8,
    usable_student_computers: 31,
    has_projector: true,
    has_wifi: false,
    has_lan: true,
    room_status: "Bảo trì",
    primary_technician_name: "Trần Quốc Thiết Bị",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
];

// Mảng dữ liệu mock cho thiết bị, bám gần bảng devices.
const deviceLookupMockItems = [
  {
    id: 1,
    room_id: 1,
    room_code: "2B11",
    device_code: "PC-2B11-01",
    device_name: "Máy trạm 01",
    device_type: "Máy tính",
    spec_or_version: "Core i5 / RAM 8GB / SSD 256GB",
    device_status: "Hoạt động",
    last_updated_at: "2026-05-02",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 2,
    room_id: 1,
    room_code: "2B11",
    device_code: "PROJECTOR-2B11",
    device_name: "Máy chiếu 2B11",
    device_type: "Máy chiếu",
    spec_or_version: "Epson EB-X06",
    device_status: "Hoạt động",
    last_updated_at: "2026-05-01",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 3,
    room_id: 2,
    room_code: "2B21",
    device_code: "LAN-2B21",
    device_name: "Thiết bị mạng 2B21",
    device_type: "Mạng",
    spec_or_version: "Switch 48 port Gigabit",
    device_status: "Lỗi nhẹ",
    last_updated_at: "2026-05-04",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 4,
    room_id: 3,
    room_code: "2B31",
    device_code: "PC-2B31-01",
    device_name: "Máy trạm 01",
    device_type: "Máy tính",
    spec_or_version: "Core i3 / RAM 8GB / SSD 256GB",
    device_status: "Hỏng",
    last_updated_at: "2026-05-05",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 5,
    room_id: 3,
    room_code: "2B31",
    device_code: "WIFI-2B31",
    device_name: "Thiết bị WiFi 2B31",
    device_type: "Mạng",
    spec_or_version: "Access Point chuẩn WiFi 6",
    device_status: "Đang sửa",
    last_updated_at: "2026-05-03",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
];

// Mảng dữ liệu mock cho phần mềm đã cài trong phòng, bám gần room_software_installations và software_packages.
const softwareLookupMockItems = [
  {
    id: 1,
    room_id: 1,
    room_code: "2B11",
    software_name: "Visual Studio Code",
    installed_version: "1.99",
    installed_on: "2026-03-20",
    installation_status: "Đã cài",
    related_course_label: "INT1434-3, INT1332",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 2,
    room_id: 1,
    room_code: "2B11",
    software_name: "Node.js",
    installed_version: "22 LTS",
    installed_on: "2026-03-20",
    installation_status: "Đã cài",
    related_course_label: "INT1434-3",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 3,
    room_id: 2,
    room_code: "2B21",
    software_name: "MySQL Workbench",
    installed_version: "8.0.41",
    installed_on: "2026-03-18",
    installation_status: "Cần cập nhật",
    related_course_label: "INT14105",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 4,
    room_id: 3,
    room_code: "2B31",
    software_name: "XAMPP",
    installed_version: "8.2.12",
    installed_on: "2026-03-15",
    installation_status: "Tạm ngưng",
    related_course_label: "INT1434-3",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 5,
    room_id: 3,
    room_code: "2B31",
    software_name: "Wireshark",
    installed_version: "Thiếu gói",
    installed_on: "",
    installation_status: "Thiếu gói",
    related_course_label: "INT1303",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
];

// Mảng dữ liệu mock cho kiểm tra điều kiện xếp lịch, phục vụ tab tra cứu mạnh.
const constraintLookupMockItems = [
  {
    id: 1,
    course_code: "INT1434-3",
    course_name: "Lập trình Web",
    section_code: "INT1434-3_03",
    room_code: "2B11",
    planned_enrollment: 30,
    usable_student_computers: 37,
    required_software_label: "Node.js, Chrome, VS Code",
    check_status: "Đạt",
    suggestion: "Có thể xếp ngay vào ca chiều thứ 3.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 2,
    course_code: "INT14105",
    course_name: "An toàn ứng dụng web và cơ sở dữ liệu",
    section_code: "INT14105_01",
    room_code: "2B21",
    planned_enrollment: 35,
    usable_student_computers: 36,
    required_software_label: "MySQL Workbench, Chrome",
    check_status: "Đạt",
    suggestion: "Theo dõi thêm việc cập nhật Workbench trước tuần 39.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 3,
    course_code: "INT1303",
    course_name: "An toàn và bảo mật hệ thống thông tin",
    section_code: "INT1303_03",
    room_code: "2B31",
    planned_enrollment: 30,
    usable_student_computers: 31,
    required_software_label: "Wireshark, Chrome, VirtualBox",
    check_status: "Chưa đạt",
    suggestion: "Chuyển sang 2B11 hoặc hoàn tất bảo trì 2B31 trước khi duyệt.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
];

// Mảng dữ liệu mock cho tra cứu người dùng, bám gần bảng users.
const userLookupMockItems = [
  {
    id: 1,
    username: "admin.ptit",
    full_name: "Admin PTIT HCM",
    email: "admin@ptithcm.edu.vn",
    role_code: "QTV",
    account_status: "Active",
    related_summary: "Theo dõi công bố lịch thực hành toàn hệ thống.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "",
  },
  {
    id: 2,
    username: "ntkhang",
    full_name: "Nguyễn Trọng Khang",
    email: "ntkhang@ptithcm.edu.vn",
    role_code: "GIANG_VIEN",
    account_status: "Active",
    related_summary: "Đang phụ trách INT1434-3_03 tại phòng 2B11.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "2B11",
  },
  {
    id: 3,
    username: "nmkythuat",
    full_name: "Nguyễn Minh Kỹ Thuật",
    email: "nmktv@ptithcm.edu.vn",
    role_code: "KTV",
    account_status: "Active",
    related_summary: "Phụ trách phòng 2B11 và hỗ trợ lịch Published.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "2B11",
  },
  {
    id: 4,
    username: "lhbao",
    full_name: "Lê Hoàng Bảo",
    email: "lhbao@ptithcm.edu.vn",
    role_code: "KTV",
    account_status: "Active",
    related_summary: "Phụ trách phòng 2B21, theo dõi thiết bị mạng.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "2B21",
  },
  {
    id: 5,
    username: "tqthietbi",
    full_name: "Trần Quốc Thiết Bị",
    email: "tqthietbi@ptithcm.edu.vn",
    role_code: "KTV",
    account_status: "Locked",
    related_summary: "Đang xử lý sự cố phòng 2B31 và PC-2B31-01.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "2B31",
  },
  {
    id: 6,
    username: "pmdtao",
    full_name: "Phạm Minh Đào Tạo",
    email: "pmdtao@ptithcm.edu.vn",
    role_code: "DAO_TAO",
    account_status: "Tạm ngưng",
    related_summary: "Đang bàn giao dữ liệu học kỳ và tuần học.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "",
  },
];

// Mảng dữ liệu mock tổng hợp cho tab "Tất cả".
const globalLookupMockItems = [
  {
    id: 1,
    lookup_type: "Lịch thực hành",
    lookup_label: "LS_2B11_INT1434_03",
    lookup_description: "INT1434-3 - Lập trình Web / Nhóm 03 / Phòng 2B11",
    lookup_status: "Published",
    related_summary: "Nguyễn Trọng Khang - Tiết 7-10",
    action_label: "Xem chi tiết",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "2B11",
  },
  {
    id: 2,
    lookup_type: "Phòng máy",
    lookup_label: "2B31",
    lookup_description: "Phòng thực hành 40 máy, hiện bảo trì hệ thống mạng.",
    lookup_status: "Bảo trì",
    related_summary: "KTV: Trần Quốc Thiết Bị",
    action_label: "Xem lịch phòng",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "2B31",
  },
  {
    id: 3,
    lookup_type: "Thiết bị",
    lookup_label: "PC-2B31-01",
    lookup_description: "Máy trạm 01 phòng 2B31 / Core i3 / RAM 8GB",
    lookup_status: "Hỏng",
    related_summary: "Liên quan lịch INT1303_03",
    action_label: "Xem chi tiết",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "2B31",
  },
  {
    id: 4,
    lookup_type: "Phần mềm",
    lookup_label: "MySQL Workbench",
    lookup_description: "Đã cài tại 2B21 nhưng cần cập nhật bản mới.",
    lookup_status: "Cần cập nhật",
    related_summary: "Liên quan học phần INT14105",
    action_label: "Xem phần mềm phòng",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "2B21",
  },
  {
    id: 5,
    lookup_type: "Điều kiện xếp lịch",
    lookup_label: "INT1303_03",
    lookup_description: "Kiểm tra điều kiện phòng cho INT1303 - Nhóm 03.",
    lookup_status: "Chưa đạt",
    related_summary: "Phòng đề xuất 2B31 / thiếu Wireshark",
    action_label: "Kiểm tra điều kiện",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "2B31",
  },
  {
    id: 6,
    lookup_type: "Người dùng",
    lookup_label: "admin.ptit",
    lookup_description: "Tài khoản quản trị viên theo dõi toàn hệ thống.",
    lookup_status: "Active",
    related_summary: "QTV / công bố lịch học kỳ 2",
    action_label: "Xem chi tiết",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    room_code: "",
  },
];

// Danh sách tab chính cho màn tra cứu của quản trị viên.
const lookupTabItems = [
  { key: "all", label: "Tất cả" },
  { key: "schedules", label: "Lịch thực hành" },
  { key: "rooms", label: "Phòng máy" },
  { key: "devices", label: "Thiết bị" },
  { key: "software", label: "Phần mềm" },
  { key: "constraints", label: "Điều kiện xếp lịch" },
  { key: "users", label: "Người dùng" },
];

// Placeholder tìm kiếm thay đổi theo tab để phù hợp với ngữ cảnh tra cứu.
const searchPlaceholderMap = {
  all: "Tìm theo mã lịch, mã phòng, mã thiết bị, tên phần mềm, mã học phần...",
  schedules: "Tìm theo mã lịch, học phần, giảng viên hoặc phòng...",
  rooms: "Tìm theo mã phòng, trạng thái hoặc kỹ thuật viên phụ trách...",
  devices: "Tìm theo mã thiết bị, tên thiết bị hoặc loại thiết bị...",
  software: "Tìm theo tên phần mềm, phiên bản hoặc phòng cài đặt...",
  constraints: "Tìm theo học phần, lớp học phần hoặc phòng đề xuất...",
  users: "Tìm theo họ tên, username, email hoặc vai trò...",
};

// Tùy chọn học kỳ cho bộ lọc chung.
const semesterFilterOptions = [
  { value: "all", label: "Tất cả học kỳ" },
  { value: "HK1_2025_2026", label: "HK1 2025-2026" },
  { value: "HK2_2025_2026", label: "HK2 2025-2026" },
];

// Tùy chọn tuần học cho bộ lọc chung.
const weekFilterOptions = [
  { value: "all", label: "Tất cả tuần" },
  { value: "6", label: "Tuần 6" },
  { value: "8", label: "Tuần 8" },
  { value: "34", label: "Tuần 34" },
  { value: "38", label: "Tuần 38" },
];

// Tùy chọn phòng cho bộ lọc chung.
const roomFilterOptions = [
  { value: "all", label: "Tất cả phòng" },
  { value: "2B11", label: "2B11" },
  { value: "2B21", label: "2B21" },
  { value: "2B31", label: "2B31" },
];

// Tùy chọn lọc vai trò cho tab người dùng.
const roleFilterOptions = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "QTV", label: "QTV" },
  { value: "DAO_TAO", label: "Cán bộ đào tạo" },
  { value: "GIANG_VIEN", label: "Giảng viên" },
  { value: "KTV", label: "Kỹ thuật viên" },
];

// Tùy chọn lọc loại thiết bị cho tab thiết bị.
const deviceTypeOptions = [
  { value: "all", label: "Tất cả loại thiết bị" },
  { value: "Máy tính", label: "Máy tính" },
  { value: "Máy chiếu", label: "Máy chiếu" },
  { value: "Mạng", label: "Mạng" },
];

// Tùy chọn trạng thái theo từng tab để select hiển thị đúng nghiệp vụ.
const lookupStatusOptionMap = {
  all: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Published", label: "Published" },
    { value: "Khả dụng", label: "Khả dụng" },
    { value: "Cần cập nhật", label: "Cần cập nhật" },
    { value: "Đạt", label: "Đạt" },
    { value: "Active", label: "Active" },
  ],
  schedules: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Published", label: "Published" },
    { value: "Approved", label: "Approved" },
    { value: "Draft", label: "Draft" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Completed", label: "Completed" },
  ],
  rooms: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Đang sử dụng", label: "Đang sử dụng" },
    { value: "Khả dụng", label: "Khả dụng" },
    { value: "Bảo trì", label: "Bảo trì" },
  ],
  devices: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Hoạt động", label: "Hoạt động" },
    { value: "Lỗi nhẹ", label: "Lỗi nhẹ" },
    { value: "Hỏng", label: "Hỏng" },
    { value: "Đang sửa", label: "Đang sửa" },
  ],
  software: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Đã cài", label: "Đã cài" },
    { value: "Cần cập nhật", label: "Cần cập nhật" },
    { value: "Thiếu gói", label: "Thiếu gói" },
    { value: "Tạm ngưng", label: "Tạm ngưng" },
  ],
  constraints: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Đạt", label: "Đạt" },
    { value: "Đang kiểm tra", label: "Đang kiểm tra" },
    { value: "Chưa đạt", label: "Chưa đạt" },
  ],
  users: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Active", label: "Active" },
    { value: "Locked", label: "Locked" },
    { value: "Tạm ngưng", label: "Tạm ngưng" },
  ],
};

// Cấu hình cột cho từng tab bảng tra cứu.
const lookupColumnMap = {
  all: [
    { key: "lookup_type", label: "Loại dữ liệu" },
    { key: "lookup_label", label: "Mã / Tên" },
    { key: "lookup_description", label: "Mô tả" },
    { key: "lookup_status", label: "Trạng thái" },
    { key: "related_summary", label: "Liên quan" },
    { key: "action", label: "Hành động" },
  ],
  schedules: [
    { key: "schedule_code", label: "Mã lịch" },
    { key: "course_name", label: "Học phần" },
    { key: "section_label", label: "Lớp/Nhóm" },
    { key: "practice_team_code", label: "Tổ thực hành" },
    { key: "lecturer_name", label: "Giảng viên" },
    { key: "room_code", label: "Phòng" },
    { key: "day_of_week", label: "Thứ" },
    { key: "time_slot_label", label: "Ca" },
    { key: "date_range", label: "Thời gian" },
    { key: "entry_status", label: "Trạng thái" },
    { key: "action", label: "Hành động" },
  ],
  rooms: [
    { key: "room_code", label: "Phòng" },
    { key: "total_computers", label: "Tổng máy" },
    { key: "usable_student_computers", label: "Máy dùng được" },
    { key: "broken_computers", label: "Máy hỏng" },
    { key: "has_projector", label: "Máy chiếu" },
    { key: "has_wifi", label: "WiFi" },
    { key: "has_lan", label: "LAN" },
    { key: "room_status", label: "Trạng thái" },
    { key: "primary_technician_name", label: "KTV phụ trách" },
    { key: "action", label: "Hành động" },
  ],
  devices: [
    { key: "device_code", label: "Mã thiết bị" },
    { key: "device_name", label: "Tên thiết bị" },
    { key: "room_code", label: "Phòng" },
    { key: "device_type", label: "Loại" },
    { key: "spec_or_version", label: "Cấu hình / phiên bản" },
    { key: "device_status", label: "Trạng thái" },
    { key: "last_updated_at", label: "Cập nhật lần cuối" },
    { key: "action", label: "Hành động" },
  ],
  software: [
    { key: "room_code", label: "Phòng" },
    { key: "software_name", label: "Phần mềm" },
    { key: "installed_version", label: "Phiên bản đã cài" },
    { key: "installed_on", label: "Ngày cài" },
    { key: "installation_status", label: "Trạng thái cài đặt" },
    { key: "related_course_label", label: "Học phần liên quan" },
    { key: "action", label: "Hành động" },
  ],
  constraints: [
    { key: "course_name", label: "Học phần" },
    { key: "section_code", label: "Lớp học phần" },
    { key: "room_code", label: "Phòng đề xuất" },
    { key: "planned_enrollment", label: "Sĩ số" },
    { key: "usable_student_computers", label: "Máy dùng được" },
    { key: "required_software_label", label: "Phần mềm yêu cầu" },
    { key: "check_status", label: "Kết quả kiểm tra" },
    { key: "suggestion", label: "Gợi ý" },
  ],
  users: [
    { key: "full_name", label: "Họ tên" },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "role_code", label: "Vai trò" },
    { key: "account_status", label: "Trạng thái" },
    { key: "related_summary", label: "Liên quan" },
    { key: "action", label: "Hành động" },
  ],
};

/**
 * Hàm nhận vào: value là chuỗi hoặc giá trị bất kỳ cần chuẩn hóa.
 * Hàm xử lý: bỏ dấu tiếng Việt và chuyển về chữ thường để tìm kiếm mềm trên nhiều cột.
 * Hàm trả về: chuỗi đã chuẩn hóa.
 */
function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Hàm nhận vào: dateValue là chuỗi ngày dạng YYYY-MM-DD.
 * Hàm xử lý: đổi ngày sang định dạng DD/MM/YYYY cho bảng tra cứu.
 * Hàm trả về: chuỗi ngày đã định dạng hoặc dấu gạch ngang nếu trống.
 */
function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const [year, month, day] = String(dateValue).split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  return `${day}/${month}/${year}`;
}

/**
 * Hàm nhận vào: startDate và endDate là hai chuỗi ngày.
 * Hàm xử lý: ghép khoảng thời gian bắt đầu - kết thúc để hiển thị gọn trong bảng.
 * Hàm trả về: chuỗi thời gian đã format.
 */
function formatDateRange(startDate, endDate) {
  return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
}

/**
 * Hàm nhận vào: status là chuỗi trạng thái nghiệp vụ hiện tại.
 * Hàm xử lý: ánh xạ trạng thái sang tone màu badge phù hợp với mức cảnh báo.
 * Hàm trả về: JSX của badge trạng thái.
 */
function buildLookupStatusBadge(status) {
  const toneClassMap = {
    Published: "roomStatusPositive",
    "Khả dụng": "roomStatusPositive",
    "Hoạt động": "roomStatusPositive",
    "Đạt": "roomStatusPositive",
    Active: "roomStatusPositive",
    Approved: "roomStatusNeutral",
    Draft: "roomStatusNeutral",
    "Đang kiểm tra": "roomStatusNeutral",
    Completed: "trainingStatusMuted",
    "Đang sử dụng": "roomStatusNeutral",
    "Bảo trì": "roomStatusWarning",
    "Lỗi nhẹ": "roomStatusWarning",
    "Cần cập nhật": "roomStatusWarning",
    "Chưa đạt": "roomStatusWarning",
    Cancelled: "roomStatusDanger",
    "Hỏng": "roomStatusDanger",
    Locked: "roomStatusDanger",
    "Tạm ngưng": "roomStatusDanger",
    "Thiếu gói": "roomStatusDanger",
    "Đang sửa": "roomStatusWarning",
  };

  const toneClassName = toneClassMap[status] || "roomStatusNeutral";

  return <span className={`roomStatusBadge ${toneClassName}`}>{status}</span>;
}

/**
 * Hàm nhận vào: actionLabel là nhãn nút thao tác cần hiển thị.
 * Hàm xử lý: dựng nút thao tác nhẹ cho các bảng tra cứu, không gắn logic thật.
 * Hàm trả về: JSX của button thao tác.
 */
function buildLookupActionButton(actionLabel) {
  return (
    <ButtonUI type="button" tone="outline" shape="pill" size="sm" className="roomLinkButton">
      {actionLabel}
    </ButtonUI>
  );
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại và item là bản ghi tương ứng.
 * Hàm xử lý: tạo chuỗi mục tiêu để search mềm theo đúng ngữ cảnh của từng tab.
 * Hàm trả về: chuỗi ghép từ các field quan trọng của bản ghi.
 */
function buildLookupSearchTarget(activeTab, item) {
  switch (activeTab) {
    case "all":
      return [
        item.lookup_type,
        item.lookup_label,
        item.lookup_description,
        item.lookup_status,
        item.related_summary,
      ].join(" ");
    case "schedules":
      return [
        item.schedule_code,
        item.course_code,
        item.course_name,
        item.section_code,
        item.lecturer_name,
        item.room_code,
        item.entry_status,
      ].join(" ");
    case "rooms":
      return [
        item.room_code,
        item.room_status,
        item.primary_technician_name,
      ].join(" ");
    case "devices":
      return [
        item.device_code,
        item.device_name,
        item.room_code,
        item.device_type,
        item.spec_or_version,
        item.device_status,
      ].join(" ");
    case "software":
      return [
        item.room_code,
        item.software_name,
        item.installed_version,
        item.installation_status,
        item.related_course_label,
      ].join(" ");
    case "constraints":
      return [
        item.course_code,
        item.course_name,
        item.section_code,
        item.room_code,
        item.required_software_label,
        item.check_status,
      ].join(" ");
    case "users":
      return [
        item.full_name,
        item.username,
        item.email,
        item.role_code,
        item.account_status,
        item.related_summary,
      ].join(" ");
    default:
      return "";
  }
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại.
 * Hàm xử lý: trả về mảng mock data phù hợp với tab đang tra cứu.
 * Hàm trả về: mảng dữ liệu gốc tương ứng.
 */
function getActiveTabItems(activeTab) {
  switch (activeTab) {
    case "all":
      return globalLookupMockItems;
    case "schedules":
      return scheduleLookupMockItems;
    case "rooms":
      return roomLookupMockItems;
    case "devices":
      return deviceLookupMockItems;
    case "software":
      return softwareLookupMockItems;
    case "constraints":
      return constraintLookupMockItems;
    case "users":
      return userLookupMockItems;
    default:
      return [];
  }
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại.
 * Hàm xử lý: lấy ra danh sách cột DataTable tương ứng với tab.
 * Hàm trả về: mảng columns của DataTable.
 */
function getActiveTabColumns(activeTab) {
  return lookupColumnMap[activeTab] || lookupColumnMap.all;
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại và item là bản ghi dữ liệu.
 * Hàm xử lý: trích xuất trạng thái dùng cho bộ lọc status của tab đó.
 * Hàm trả về: chuỗi trạng thái của bản ghi.
 */
function getLookupStatusValue(activeTab, item) {
  switch (activeTab) {
    case "all":
      return item.lookup_status;
    case "schedules":
      return item.entry_status;
    case "rooms":
      return item.room_status;
    case "devices":
      return item.device_status;
    case "software":
      return item.installation_status;
    case "constraints":
      return item.check_status;
    case "users":
      return item.account_status;
    default:
      return "all";
  }
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại và items là danh sách bản ghi sau khi lọc.
 * Hàm xử lý: map dữ liệu gốc sang đúng shape mà DataTable cần hiển thị cho tab đang mở.
 * Hàm trả về: mảng rows đã sẵn sàng render lên bảng.
 */
function getActiveTabRows(activeTab, items) {
  switch (activeTab) {
    case "all":
      return items.map((item) => ({
        id: item.id,
        lookup_type: item.lookup_type,
        lookup_label: item.lookup_label,
        lookup_description: item.lookup_description,
        lookup_status: buildLookupStatusBadge(item.lookup_status),
        related_summary: item.related_summary,
        action: buildLookupActionButton(item.action_label),
      }));
    case "schedules":
      return items.map((item) => ({
        id: item.id,
        schedule_code: item.schedule_code,
        course_name: `${item.course_code} - ${item.course_name}`,
        section_label: `${item.section_code} / Nhóm ${item.group_no}`,
        practice_team_code: item.practice_team_code,
        lecturer_name: item.lecturer_name,
        room_code: item.room_code,
        day_of_week: item.day_of_week,
        time_slot_label: item.time_slot_label,
        date_range: formatDateRange(item.start_date, item.end_date),
        entry_status: buildLookupStatusBadge(item.entry_status),
        action: buildLookupActionButton("Xem chi tiết"),
      }));
    case "rooms":
      return items.map((item) => ({
        id: item.id,
        room_code: item.room_code,
        total_computers: item.total_computers,
        usable_student_computers: item.usable_student_computers,
        broken_computers: item.broken_computers,
        has_projector: item.has_projector ? "Có" : "Không",
        has_wifi: item.has_wifi ? "Có" : "Không",
        has_lan: item.has_lan ? "Có" : "Không",
        room_status: buildLookupStatusBadge(item.room_status),
        primary_technician_name: item.primary_technician_name,
        action: buildLookupActionButton("Xem lịch phòng"),
      }));
    case "devices":
      return items.map((item) => ({
        id: item.id,
        device_code: item.device_code,
        device_name: item.device_name,
        room_code: item.room_code,
        device_type: item.device_type,
        spec_or_version: item.spec_or_version,
        device_status: buildLookupStatusBadge(item.device_status),
        last_updated_at: formatDateLabel(item.last_updated_at),
        action: buildLookupActionButton("Xem chi tiết"),
      }));
    case "software":
      return items.map((item) => ({
        id: item.id,
        room_code: item.room_code,
        software_name: item.software_name,
        installed_version: item.installed_version,
        installed_on: formatDateLabel(item.installed_on),
        installation_status: buildLookupStatusBadge(item.installation_status),
        related_course_label: item.related_course_label,
        action: buildLookupActionButton("Xem phần mềm phòng"),
      }));
    case "constraints":
      return items.map((item) => ({
        id: item.id,
        course_name: `${item.course_code} - ${item.course_name}`,
        section_code: item.section_code,
        room_code: item.room_code,
        planned_enrollment: item.planned_enrollment,
        usable_student_computers: item.usable_student_computers,
        required_software_label: item.required_software_label,
        check_status: buildLookupStatusBadge(item.check_status),
        suggestion: item.suggestion,
      }));
    case "users":
      return items.map((item) => ({
        id: item.id,
        full_name: item.full_name,
        username: item.username,
        email: item.email,
        role_code: item.role_code,
        account_status: buildLookupStatusBadge(item.account_status),
        related_summary: item.related_summary,
        action: buildLookupActionButton("Xem chi tiết"),
      }));
    default:
      return [];
  }
}

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: dựng màn tra cứu quản trị viên gồm tab tra cứu, bộ lọc và bảng kết quả toàn chiều rộng.
 * Hàm trả về: JSX của route /admin/lookups.
 */
export default function LookupsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("all");

  const currentItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return getActiveTabItems(activeTab).filter((item) => {
      const matchedKeyword =
        !normalizedKeyword ||
        normalizeText(buildLookupSearchTarget(activeTab, item)).includes(
          normalizedKeyword,
        );
      const matchedSemester =
        semesterFilter === "all" || item.semester_code === semesterFilter;
      const matchedWeek =
        weekFilter === "all" || String(item.week_no || "") === weekFilter;
      const matchedRoom =
        roomFilter === "all" || item.room_code === roomFilter;
      const matchedStatus =
        statusFilter === "all" ||
        getLookupStatusValue(activeTab, item) === statusFilter;
      const matchedRole =
        activeTab !== "users" ||
        roleFilter === "all" ||
        item.role_code === roleFilter;
      const matchedDeviceType =
        activeTab !== "devices" ||
        deviceTypeFilter === "all" ||
        item.device_type === deviceTypeFilter;

      return (
        matchedKeyword &&
        matchedSemester &&
        matchedWeek &&
        matchedRoom &&
        matchedStatus &&
        matchedRole &&
        matchedDeviceType
      );
    });
  }, [
    activeTab,
    searchKeyword,
    semesterFilter,
    weekFilter,
    roomFilter,
    statusFilter,
    roleFilter,
    deviceTypeFilter,
  ]);

  const currentColumns = useMemo(() => getActiveTabColumns(activeTab), [activeTab]);
  const currentRows = useMemo(
    () => getActiveTabRows(activeTab, currentItems),
    [activeTab, currentItems],
  );

  const currentStatusOptions = lookupStatusOptionMap[activeTab];
  const currentSearchPlaceholder = searchPlaceholderMap[activeTab];

  /**
   * Hàm nhận vào: nextTab là key của tab mà người dùng vừa chọn.
   * Hàm xử lý: chuyển tab hiện tại và reset bộ lọc trạng thái, vai trò, loại thiết bị về mặc định.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setStatusFilter("all");
    setRoleFilter("all");
    setDeviceTypeFilter("all");
  }

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: đưa toàn bộ search và filter của màn tra cứu về trạng thái mặc định.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleResetFilters() {
    setSearchKeyword("");
    setSemesterFilter("all");
    setWeekFilter("all");
    setRoomFilter("all");
    setStatusFilter("all");
    setRoleFilter("all");
    setDeviceTypeFilter("all");
  }

  return (
    <div>
      <section className="card managementAccount">
        <div className="card accountsView accountPrimaryPanel lookupPrimaryPanel">
          <div className="card optionView roomToolbar">
            <div className="buttonsView roomTabList">
              {lookupTabItems.map((tabItem) => {
                const isActive = activeTab === tabItem.key;

                return (
                  <ButtonUI
                    key={tabItem.key}
                    shape="pill"
                    tone={isActive ? "primary" : "outline"}
                    size="sm"
                    active={isActive}
                    className={isActive ? "roomTabButton roomTabButtonActive" : "roomTabButton"}
                    onClick={() => handleTabChange(tabItem.key)}
                  >
                    {tabItem.label}
                  </ButtonUI>
                );
              })}
            </div>

            <div className="inputFind roomSearchGroup">
              <ButtonUI tone="primary" shape="rounded" className="roomSearchButton">
                Tìm kiếm
              </ButtonUI>
              <input
                type="text"
                className="input roomSearchInput"
                placeholder={currentSearchPlaceholder}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </div>
          </div>

          <div className="card option roomFilterBar lookupFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">Kết quả tra cứu</h3>
              <p className="roomSectionText">
                Theo dõi lịch thực hành, phòng máy, phần mềm và dữ liệu liên
                quan theo bộ lọc hiện tại.
              </p>
            </div>

            <div className="lookupFilterGrid">
              <div className="lookupFilterField">
                <span>Học kỳ</span>
                <select
                  className="select"
                  value={semesterFilter}
                  onChange={(event) => setSemesterFilter(event.target.value)}
                >
                  {semesterFilterOptions.map((optionItem) => (
                    <option key={optionItem.value} value={optionItem.value}>
                      {optionItem.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lookupFilterField">
                <span>Tuần học</span>
                <select
                  className="select"
                  value={weekFilter}
                  onChange={(event) => setWeekFilter(event.target.value)}
                >
                  {weekFilterOptions.map((optionItem) => (
                    <option key={optionItem.value} value={optionItem.value}>
                      {optionItem.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lookupFilterField">
                <span>Phòng</span>
                <select
                  className="select"
                  value={roomFilter}
                  onChange={(event) => setRoomFilter(event.target.value)}
                >
                  {roomFilterOptions.map((optionItem) => (
                    <option key={optionItem.value} value={optionItem.value}>
                      {optionItem.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lookupFilterField">
                <span>Trạng thái</span>
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {currentStatusOptions.map((optionItem) => (
                    <option key={optionItem.value} value={optionItem.value}>
                      {optionItem.label}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === "users" ? (
                <div className="lookupFilterField">
                  <span>Vai trò</span>
                  <select
                    className="select"
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                  >
                    {roleFilterOptions.map((optionItem) => (
                      <option key={optionItem.value} value={optionItem.value}>
                        {optionItem.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {activeTab === "devices" ? (
                <div className="lookupFilterField">
                  <span>Loại thiết bị</span>
                  <select
                    className="select"
                    value={deviceTypeFilter}
                    onChange={(event) => setDeviceTypeFilter(event.target.value)}
                  >
                    {deviceTypeOptions.map((optionItem) => (
                      <option key={optionItem.value} value={optionItem.value}>
                        {optionItem.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="lookupFilterActions">
                <ButtonUI
                  tone="secondary"
                  shape="rounded"
                  className="roomRefreshButton"
                  onClick={handleResetFilters}
                >
                  Làm mới
                </ButtonUI>

                <ButtonUI tone="primary" shape="rounded" className="roomSearchButton">
                  Xuất kết quả
                </ButtonUI>

                <ButtonUI
                  tone="secondary"
                  shape="rounded"
                  className="lookupAdvancedButton"
                >
                  Bộ lọc nâng cao
                </ButtonUI>
              </div>
            </div>
          </div>

          <div className="card roomTableCard">
            {currentRows.length > 0 ? (
              <DataTable columns={currentColumns} rows={currentRows} />
            ) : (
              <div className="roomEmptyState">
                <h4>Chưa có kết quả phù hợp</h4>
                <p>
                  Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại. Bạn có thể
                  làm mới bộ lọc hoặc chuyển sang tab tra cứu khác.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
