"use client";

import { useMemo, useState } from "react";

import { CardUI } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";

// Mảng dữ liệu mock cho lịch thực hành, bám gần bảng lab_schedule_entries để nối API sau dễ hơn.
const reportScheduleMockItems = [
  {
    id: 1,
    schedule_code: "LS_2B11_INT1434_03_A",
    course_code: "INT1434-3",
    course_name: "Lập trình Web",
    section_code: "INT1434-3_03",
    group_no: "03",
    lecturer_name: "Nguyễn Trọng Khang",
    room_code: "2B11",
    time_slot_label: "Tiết 7-10",
    start_date: "2026-03-30",
    end_date: "2026-05-18",
    entry_status: "Published",
    approved_at: "2026-03-25",
    published_at: "2026-03-27",
    cancelled_at: "",
    cancellation_reason: "",
    notes: "Đã công bố cho sinh viên và kỹ thuật viên phụ trách phòng.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 2,
    schedule_code: "LS_2B21_INT14105_01_A",
    course_code: "INT14105",
    course_name: "An toàn ứng dụng web và cơ sở dữ liệu",
    section_code: "INT14105_01",
    group_no: "01",
    lecturer_name: "Trần Quốc Huy",
    room_code: "2B21",
    time_slot_label: "Tiết 1-4",
    start_date: "2026-03-30",
    end_date: "2026-05-11",
    entry_status: "Approved",
    approved_at: "2026-03-26",
    published_at: "",
    cancelled_at: "",
    cancellation_reason: "",
    notes: "Đang chờ bước công bố chính thức theo workflow của khoa.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 3,
    schedule_code: "LS_2B11_INT1332_04_A",
    course_code: "INT1332",
    course_name: "Lập trình hướng đối tượng",
    section_code: "INT1332_04",
    group_no: "04",
    lecturer_name: "Lê Minh Toàn",
    room_code: "2B11",
    time_slot_label: "Tiết 7-10",
    start_date: "2025-09-22",
    end_date: "2025-11-24",
    entry_status: "Draft",
    approved_at: "",
    published_at: "",
    cancelled_at: "",
    cancellation_reason: "",
    notes: "Chờ chốt sĩ số trước khi trình duyệt.",
    semester_code: "HK1_2025_2026",
    week_no: 6,
  },
  {
    id: 4,
    schedule_code: "LS_2B31_INT1303_03_A",
    course_code: "INT1303",
    course_name: "An toàn và bảo mật hệ thống thông tin",
    section_code: "INT1303_03",
    group_no: "03",
    lecturer_name: "Phạm Hoàng Dương",
    room_code: "2B31",
    time_slot_label: "Tiết 7-10",
    start_date: "2026-03-02",
    end_date: "2026-04-20",
    entry_status: "Cancelled",
    approved_at: "2026-02-26",
    published_at: "",
    cancelled_at: "2026-03-01",
    cancellation_reason: "Phòng 2B31 bảo trì và thiếu phần mềm Wireshark.",
    notes: "Chuyển sang diện cần theo dõi bù lịch.",
    semester_code: "HK2_2025_2026",
    week_no: 34,
  },
  {
    id: 5,
    schedule_code: "LS_2B21_INT1332_01_A",
    course_code: "INT1332",
    course_name: "Lập trình hướng đối tượng",
    section_code: "INT1332_01",
    group_no: "01",
    lecturer_name: "Ngô Hải Yến",
    room_code: "2B21",
    time_slot_label: "Tiết 1-4",
    start_date: "2025-10-06",
    end_date: "2025-12-08",
    entry_status: "Completed",
    approved_at: "2025-09-30",
    published_at: "2025-10-01",
    cancelled_at: "",
    cancellation_reason: "",
    notes: "Đã hoàn tất và có biên bản tổng kết thực hành.",
    semester_code: "HK1_2025_2026",
    week_no: 8,
  },
  {
    id: 6,
    schedule_code: "LS_2B11_INT1434_03_B",
    course_code: "INT1434-3",
    course_name: "Lập trình Web",
    section_code: "INT1434-3_03",
    group_no: "03",
    lecturer_name: "Nguyễn Trọng Khang",
    room_code: "2B11",
    time_slot_label: "Tiết 1-4",
    start_date: "2026-04-06",
    end_date: "2026-05-25",
    entry_status: "Published",
    approved_at: "2026-04-01",
    published_at: "2026-04-03",
    cancelled_at: "",
    cancellation_reason: "",
    notes: "Tổ thực hành bù thêm 1 ca do nội dung triển khai backend.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 7,
    schedule_code: "LS_2B21_INT14105_01_B",
    course_code: "INT14105",
    course_name: "An toàn ứng dụng web và cơ sở dữ liệu",
    section_code: "INT14105_01",
    group_no: "01",
    lecturer_name: "Trần Quốc Huy",
    room_code: "2B21",
    time_slot_label: "Tiết 7-10",
    start_date: "2026-03-02",
    end_date: "2026-04-27",
    entry_status: "Published",
    approved_at: "2026-02-26",
    published_at: "2026-02-28",
    cancelled_at: "",
    cancellation_reason: "",
    notes: "Ca chiều dùng cho các buổi thực hành tấn công web và SQL injection.",
    semester_code: "HK2_2025_2026",
    week_no: 34,
  },
  {
    id: 8,
    schedule_code: "LS_2B21_INT1332_03_A",
    course_code: "INT1332",
    course_name: "Lập trình hướng đối tượng",
    section_code: "INT1332_03",
    group_no: "03",
    lecturer_name: "Lê Minh Toàn",
    room_code: "2B21",
    time_slot_label: "Tiết 1-4",
    start_date: "2026-03-16",
    end_date: "2026-05-04",
    entry_status: "Completed",
    approved_at: "2026-03-11",
    published_at: "2026-03-13",
    cancelled_at: "",
    cancellation_reason: "",
    notes: "Hoàn tất đủ số buổi, không phát sinh đổi lịch.",
    semester_code: "HK2_2025_2026",
    week_no: 36,
  },
];

// Mảng dữ liệu mock cho sử dụng phòng, gần với rooms và số liệu tổng hợp giữa kỳ.
const roomUsageMockItems = [
  {
    id: 1,
    room_code: "2B11",
    total_sessions: 18,
    published_sessions: 11,
    cancelled_sessions: 1,
    completed_sessions: 5,
    usage_rate: 82,
    usable_student_computers: 37,
    issue_count: 1,
    usage_status: "Bình thường",
    notes: "Ưu tiên cho các lớp Web và OOP ở học kỳ 2.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    start_date: "2026-01-12",
    end_date: "2026-05-24",
  },
  {
    id: 2,
    room_code: "2B21",
    total_sessions: 16,
    published_sessions: 9,
    cancelled_sessions: 0,
    completed_sessions: 4,
    usage_rate: 74,
    usable_student_computers: 36,
    issue_count: 1,
    usage_status: "Bình thường",
    notes: "Phù hợp cho các lớp cơ sở dữ liệu và an toàn web.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    start_date: "2026-01-12",
    end_date: "2026-05-24",
  },
  {
    id: 3,
    room_code: "2B31",
    total_sessions: 8,
    published_sessions: 1,
    cancelled_sessions: 2,
    completed_sessions: 1,
    usage_rate: 34,
    usable_student_computers: 31,
    issue_count: 3,
    usage_status: "Bảo trì",
    notes: "Đang bảo trì mạng và kiểm tra dàn máy đầu ca.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    start_date: "2026-01-12",
    end_date: "2026-05-24",
  },
];

// Mảng dữ liệu mock cho sự cố phòng máy, bám gần room_issue_reports.
const roomIssueMockItems = [
  {
    id: 1,
    issue_code: "ISSUE-2B31-001",
    room_code: "2B31",
    device_code: "PC-2B31-01",
    device_name: "Máy trạm 01",
    issue_type: "Máy tính",
    priority_level: "Cao",
    issue_status: "Đang xử lý",
    reported_by_name: "Trần Quốc Thiết Bị",
    created_at: "2026-04-01",
    notes: "Máy không lên nguồn, cần thay bộ nguồn và kiểm tra mainboard.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    start_date: "2026-04-01",
    end_date: "2026-04-01",
  },
  {
    id: 2,
    issue_code: "ISSUE-2B21-002",
    room_code: "2B21",
    device_code: "LAN-2B21",
    device_name: "Thiết bị mạng 2B21",
    issue_type: "Mạng",
    priority_level: "Trung bình",
    issue_status: "Đang kiểm tra",
    reported_by_name: "Lê Hoàng Bảo",
    created_at: "2026-04-03",
    notes: "Cổng uplink chập chờn khi tải đồng thời nhiều máy.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    start_date: "2026-04-03",
    end_date: "2026-04-03",
  },
  {
    id: 3,
    issue_code: "ISSUE-2B31-003",
    room_code: "2B31",
    device_code: "WIFI-2B31",
    device_name: "Thiết bị WiFi 2B31",
    issue_type: "Mạng",
    priority_level: "Cao",
    issue_status: "Đang xử lý",
    reported_by_name: "Trần Quốc Thiết Bị",
    created_at: "2026-04-05",
    notes: "Access Point cần thay nguồn PoE và cập nhật firmware.",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    start_date: "2026-04-05",
    end_date: "2026-04-05",
  },
  {
    id: 4,
    issue_code: "ISSUE-2B11-004",
    room_code: "2B11",
    device_code: "PROJECTOR-2B11",
    device_name: "Máy chiếu 2B11",
    issue_type: "Máy chiếu",
    priority_level: "Thấp",
    issue_status: "Completed",
    reported_by_name: "Nguyễn Minh Kỹ Thuật",
    created_at: "2026-03-18",
    notes: "Đã vệ sinh lọc bụi và cân lại màu chiếu.",
    semester_code: "HK2_2025_2026",
    week_no: 36,
    start_date: "2026-03-18",
    end_date: "2026-03-18",
  },
];

// Mảng dữ liệu mock cho trạng thái thiết bị, dùng cho biểu đồ thiết bị theo trạng thái.
const deviceStatusMockItems = [
  {
    id: 1,
    room_code: "2B11",
    device_code: "PC-2B11-01",
    device_name: "Máy trạm 01",
    device_type: "Máy tính",
    device_status: "Hoạt động",
    last_updated_at: "2026-04-10",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 2,
    room_code: "2B11",
    device_code: "PROJECTOR-2B11",
    device_name: "Máy chiếu 2B11",
    device_type: "Máy chiếu",
    device_status: "Hoạt động",
    last_updated_at: "2026-03-18",
    semester_code: "HK2_2025_2026",
    week_no: 36,
  },
  {
    id: 3,
    room_code: "2B21",
    device_code: "LAN-2B21",
    device_name: "Thiết bị mạng 2B21",
    device_type: "Mạng",
    device_status: "Lỗi nhẹ",
    last_updated_at: "2026-04-03",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 4,
    room_code: "2B31",
    device_code: "PC-2B31-01",
    device_name: "Máy trạm 01",
    device_type: "Máy tính",
    device_status: "Hỏng",
    last_updated_at: "2026-04-01",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 5,
    room_code: "2B31",
    device_code: "WIFI-2B31",
    device_name: "Thiết bị WiFi 2B31",
    device_type: "Mạng",
    device_status: "Đang sửa",
    last_updated_at: "2026-04-05",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 6,
    room_code: "2B21",
    device_code: "PC-2B21-12",
    device_name: "Máy trạm 12",
    device_type: "Máy tính",
    device_status: "Đã thay",
    last_updated_at: "2026-03-12",
    semester_code: "HK2_2025_2026",
    week_no: 34,
  },
];

// Mảng dữ liệu mock cho phần mềm theo phòng, bám gần software_packages và room_software_installations.
const softwareReportMockItems = [
  {
    id: 1,
    room_code: "2B11",
    software_name: "Visual Studio Code",
    installed_version: "1.99",
    required_course_label: "INT1434-3, INT1332",
    software_status: "Đã cài đủ",
    notes: "Đúng bản cần dùng cho Web và OOP.",
    installed_on: "2026-03-20",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 2,
    room_code: "2B11",
    software_name: "Node.js",
    installed_version: "22 LTS",
    required_course_label: "INT1434-3",
    software_status: "Đã cài đủ",
    notes: "Khớp bộ runtime cần cho các buổi lập trình Web.",
    installed_on: "2026-03-20",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 3,
    room_code: "2B21",
    software_name: "MySQL Workbench",
    installed_version: "8.0.41",
    required_course_label: "INT14105",
    software_status: "Cần cập nhật",
    notes: "Cần đồng bộ bản mới trước tuần 39.",
    installed_on: "2026-03-18",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 4,
    room_code: "2B31",
    software_name: "XAMPP",
    installed_version: "8.2.12",
    required_course_label: "INT1434-3",
    software_status: "Tạm ngưng",
    notes: "Tạm ngưng khai thác do phòng đang bảo trì.",
    installed_on: "2026-03-15",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
  {
    id: 5,
    room_code: "2B31",
    software_name: "Wireshark",
    installed_version: "Thiếu gói",
    required_course_label: "INT1303",
    software_status: "Thiếu gói",
    notes: "Cần cài trước khi mở lại các buổi an toàn hệ thống.",
    installed_on: "2026-03-15",
    semester_code: "HK2_2025_2026",
    week_no: 38,
  },
];

// Mảng dữ liệu mock cho đổi lịch, hủy lịch và học bù, bám gần lab_schedule_change_requests.
const changeRequestReportMockItems = [
  {
    id: 1,
    request_code: "CR-2026-001",
    change_type: "Đổi lịch",
    schedule_code: "LS_2B11_INT1434_03_A",
    proposed_room_code: "2B21",
    proposed_time_slot_label: "Tiết 1-4",
    requested_by_name: "Nguyễn Trọng Khang",
    request_status: "Approved",
    reason_text: "Đổi ca để tránh trùng seminar khoa vào chiều thứ 3.",
    created_at: "2026-04-02",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    start_date: "2026-04-02",
    end_date: "2026-04-02",
  },
  {
    id: 2,
    request_code: "CR-2026-002",
    change_type: "Hủy lịch",
    schedule_code: "LS_2B31_INT1303_03_A",
    proposed_room_code: "2B31",
    proposed_time_slot_label: "Tiết 7-10",
    requested_by_name: "Phạm Hoàng Dương",
    request_status: "Draft",
    reason_text: "Phòng 2B31 bảo trì, chờ xác nhận phương án học bù.",
    created_at: "2026-03-01",
    semester_code: "HK2_2025_2026",
    week_no: 34,
    start_date: "2026-03-01",
    end_date: "2026-03-01",
  },
  {
    id: 3,
    request_code: "CR-2026-003",
    change_type: "Học bù",
    schedule_code: "LS_2B21_INT14105_01_A",
    proposed_room_code: "2B11",
    proposed_time_slot_label: "Tiết 7-10",
    requested_by_name: "Trần Quốc Huy",
    request_status: "Completed",
    reason_text: "Bù thêm 1 buổi kiểm thử bảo mật sau tuần 38.",
    created_at: "2026-04-08",
    semester_code: "HK2_2025_2026",
    week_no: 38,
    start_date: "2026-04-08",
    end_date: "2026-04-08",
  },
  {
    id: 4,
    request_code: "CR-2026-004",
    change_type: "Đổi lịch",
    schedule_code: "LS_2B21_INT1332_01_A",
    proposed_room_code: "2B31",
    proposed_time_slot_label: "Tiết 1-4",
    requested_by_name: "Ngô Hải Yến",
    request_status: "Cancelled",
    reason_text: "Đề xuất bị bác do phòng 2B31 thiếu điều kiện phần mềm.",
    created_at: "2025-10-10",
    semester_code: "HK1_2025_2026",
    week_no: 8,
    start_date: "2025-10-10",
    end_date: "2025-10-10",
  },
];

// Mảng dữ liệu mock cho xu hướng theo tuần, dùng cho biểu đồ tiến độ giữa kỳ.
const weeklyTrendMockItems = [
  {
    id: 1,
    week_no: 34,
    week_label: "Tuần 34",
    total_sessions: 5,
    semester_code: "HK2_2025_2026",
    start_date: "2026-03-02",
    end_date: "2026-03-08",
  },
  {
    id: 2,
    week_no: 35,
    week_label: "Tuần 35",
    total_sessions: 7,
    semester_code: "HK2_2025_2026",
    start_date: "2026-03-09",
    end_date: "2026-03-15",
  },
  {
    id: 3,
    week_no: 36,
    week_label: "Tuần 36",
    total_sessions: 8,
    semester_code: "HK2_2025_2026",
    start_date: "2026-03-16",
    end_date: "2026-03-22",
  },
  {
    id: 4,
    week_no: 37,
    week_label: "Tuần 37",
    total_sessions: 9,
    semester_code: "HK2_2025_2026",
    start_date: "2026-03-23",
    end_date: "2026-03-29",
  },
  {
    id: 5,
    week_no: 38,
    week_label: "Tuần 38",
    total_sessions: 11,
    semester_code: "HK2_2025_2026",
    start_date: "2026-03-30",
    end_date: "2026-04-05",
  },
];

// Mảng chỉ tiêu mock cho mẫu báo cáo QTV, bám gần nội dung báo cáo giữa kỳ.
const reportTemplateIndicatorItems = [
  {
    id: 1,
    indicator_key: "totalScheduled",
    indicator_label: "Tổng số buổi đã xếp",
    notes: "Tổng hợp từ lịch thực hành trong phạm vi lọc.",
  },
  {
    id: 2,
    indicator_key: "publishedSessions",
    indicator_label: "Số buổi đã công bố",
    notes: "Các lịch đã thông báo đến giảng viên và sinh viên.",
  },
  {
    id: 3,
    indicator_key: "cancelledSessions",
    indicator_label: "Số buổi bị hủy",
    notes: "Bao gồm các buổi hủy do phòng bảo trì hoặc đổi kế hoạch.",
  },
  {
    id: 4,
    indicator_key: "peakRoomUsage",
    indicator_label: "Tần suất sử dụng cao nhất",
    notes: "Phòng có tổng số buổi lớn nhất trong giai đoạn báo cáo.",
  },
  {
    id: 5,
    indicator_key: "issueRelatedCount",
    indicator_label: "Số thiết bị lỗi liên quan",
    notes: "Gắn với các sự cố còn mở hoặc đang theo dõi xử lý.",
  },
];

// Danh sách tab chính của màn báo cáo quản trị.
const reportTabItems = [
  { key: "overview", label: "Tổng quan" },
  { key: "roomUsage", label: "Sử dụng phòng" },
  { key: "schedules", label: "Lịch thực hành" },
  { key: "issues", label: "Thiết bị & sự cố" },
  { key: "software", label: "Phần mềm" },
  { key: "changes", label: "Đổi/Hủy/Học bù" },
  { key: "template", label: "Mẫu báo cáo" },
];

// Danh sách loại báo cáo dùng cho bộ lọc và sidebar tạo báo cáo.
const reportTypeOptions = [
  { value: "overview", label: "Tổng quan" },
  { value: "roomUsage", label: "Sử dụng phòng" },
  { value: "schedules", label: "Lịch thực hành" },
  { value: "issues", label: "Thiết bị & sự cố" },
  { value: "software", label: "Phần mềm" },
  { value: "changes", label: "Đổi/Hủy/Học bù" },
  { value: "template", label: "Mẫu báo cáo" },
];

// Tùy chọn học kỳ chung cho bộ lọc báo cáo.
const semesterFilterOptions = [
  { value: "all", label: "Tất cả học kỳ" },
  { value: "HK1_2025_2026", label: "HK1 2025-2026" },
  { value: "HK2_2025_2026", label: "HK2 2025-2026" },
];

// Tùy chọn tuần học chung cho bộ lọc báo cáo.
const weekFilterOptions = [
  { value: "all", label: "Tất cả tuần" },
  { value: "6", label: "Tuần 6" },
  { value: "8", label: "Tuần 8" },
  { value: "34", label: "Tuần 34" },
  { value: "35", label: "Tuần 35" },
  { value: "36", label: "Tuần 36" },
  { value: "37", label: "Tuần 37" },
  { value: "38", label: "Tuần 38" },
];

// Tùy chọn phòng cho bộ lọc báo cáo.
const roomFilterOptions = [
  { value: "all", label: "Tất cả phòng" },
  { value: "2B11", label: "2B11" },
  { value: "2B21", label: "2B21" },
  { value: "2B31", label: "2B31" },
];

// Placeholder tìm kiếm theo từng tab báo cáo.
const searchPlaceholderMap = {
  overview: "Tìm theo học phần, phòng, giảng viên hoặc trạng thái lịch...",
  roomUsage: "Tìm theo mã phòng hoặc ghi chú sử dụng...",
  schedules: "Tìm theo mã lịch, học phần, giảng viên hoặc phòng...",
  issues: "Tìm theo mã sự cố, thiết bị, loại sự cố hoặc phòng...",
  software: "Tìm theo tên phần mềm, học phần yêu cầu hoặc phòng...",
  changes: "Tìm theo mã yêu cầu, loại yêu cầu, lịch gốc hoặc người yêu cầu...",
  template: "Tìm theo chỉ tiêu, ghi chú hoặc nội dung mẫu báo cáo...",
};

// Tùy chọn trạng thái theo từng tab để hiển thị đúng nghiệp vụ.
const reportStatusOptionMap = {
  overview: [
    { value: "all", label: "Tất cả trạng thái lịch" },
    { value: "Published", label: "Published" },
    { value: "Approved", label: "Approved" },
    { value: "Draft", label: "Draft" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Completed", label: "Completed" },
  ],
  roomUsage: [
    { value: "all", label: "Tất cả trạng thái phòng" },
    { value: "Bình thường", label: "Bình thường" },
    { value: "Cảnh báo", label: "Cảnh báo" },
    { value: "Bảo trì", label: "Bảo trì" },
  ],
  schedules: [
    { value: "all", label: "Tất cả trạng thái lịch" },
    { value: "Published", label: "Published" },
    { value: "Approved", label: "Approved" },
    { value: "Draft", label: "Draft" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Completed", label: "Completed" },
  ],
  issues: [
    { value: "all", label: "Tất cả trạng thái xử lý" },
    { value: "Đang xử lý", label: "Đang xử lý" },
    { value: "Đang kiểm tra", label: "Đang kiểm tra" },
    { value: "Completed", label: "Đã xử lý" },
  ],
  software: [
    { value: "all", label: "Tất cả trạng thái phần mềm" },
    { value: "Đã cài đủ", label: "Đã cài đủ" },
    { value: "Cần cập nhật", label: "Cần cập nhật" },
    { value: "Thiếu gói", label: "Thiếu gói" },
    { value: "Tạm ngưng", label: "Tạm ngưng" },
  ],
  changes: [
    { value: "all", label: "Tất cả trạng thái yêu cầu" },
    { value: "Approved", label: "Approved" },
    { value: "Draft", label: "Draft" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
  ],
  template: [{ value: "all", label: "Không lọc trạng thái" }],
};

// Cấu hình cột DataTable theo từng tab báo cáo chi tiết.
const reportColumnMap = {
  roomUsage: [
    { key: "room_code", label: "Phòng" },
    { key: "total_sessions", label: "Tổng buổi" },
    { key: "published_sessions", label: "Đã công bố" },
    { key: "cancelled_sessions", label: "Đã hủy" },
    { key: "completed_sessions", label: "Hoàn thành" },
    { key: "usage_rate", label: "Tỷ lệ sử dụng" },
    { key: "usable_student_computers", label: "Máy dùng được" },
    { key: "issue_count", label: "Sự cố" },
    { key: "notes", label: "Ghi chú" },
  ],
  schedules: [
    { key: "schedule_code", label: "Mã lịch" },
    { key: "course_label", label: "Học phần" },
    { key: "section_label", label: "Lớp/Nhóm" },
    { key: "lecturer_name", label: "Giảng viên" },
    { key: "room_code", label: "Phòng" },
    { key: "time_slot_label", label: "Ca" },
    { key: "date_range", label: "Thời gian" },
    { key: "entry_status", label: "Trạng thái" },
    { key: "notes", label: "Ghi chú" },
  ],
  issues: [
    { key: "issue_code", label: "Mã sự cố" },
    { key: "room_code", label: "Phòng" },
    { key: "device_label", label: "Thiết bị" },
    { key: "issue_type", label: "Loại sự cố" },
    { key: "priority_level", label: "Mức độ ưu tiên" },
    { key: "issue_status", label: "Trạng thái xử lý" },
    { key: "reported_by_name", label: "Người báo cáo" },
    { key: "created_at", label: "Ngày ghi nhận" },
    { key: "notes", label: "Ghi chú" },
  ],
  software: [
    { key: "room_code", label: "Phòng" },
    { key: "software_name", label: "Phần mềm" },
    { key: "installed_version", label: "Phiên bản đã cài" },
    { key: "required_course_label", label: "Học phần yêu cầu" },
    { key: "software_status", label: "Trạng thái" },
    { key: "notes", label: "Ghi chú" },
  ],
  changes: [
    { key: "request_code", label: "Mã yêu cầu" },
    { key: "change_type", label: "Loại yêu cầu" },
    { key: "schedule_code", label: "Lịch gốc" },
    { key: "proposed_room_code", label: "Phòng đề xuất" },
    { key: "proposed_time_slot_label", label: "Ca đề xuất" },
    { key: "requested_by_name", label: "Người yêu cầu" },
    { key: "request_status", label: "Trạng thái" },
    { key: "reason_text", label: "Lý do" },
    { key: "created_at", label: "Ngày tạo" },
  ],
  template: [
    { key: "stt", label: "STT" },
    { key: "indicator_label", label: "Chỉ tiêu" },
    { key: "indicator_value", label: "Số liệu" },
    { key: "notes", label: "Ghi chú" },
  ],
};

/**
 * Hàm nhận vào: value là chuỗi hoặc giá trị bất kỳ cần chuẩn hóa.
 * Hàm xử lý: loại bỏ dấu tiếng Việt và chuyển về chữ thường để hỗ trợ tìm kiếm mềm.
 * Hàm trả về: chuỗi đã chuẩn hóa.
 */
function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Hàm nhận vào: dateValue là chuỗi ngày ở dạng YYYY-MM-DD.
 * Hàm xử lý: đổi chuỗi ngày sang định dạng DD/MM/YYYY để hiển thị trên UI.
 * Hàm trả về: chuỗi ngày đã format hoặc dấu gạch ngang nếu không có dữ liệu.
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
 * Hàm nhận vào: startDate là ngày bắt đầu và endDate là ngày kết thúc của một bản ghi.
 * Hàm xử lý: ghép khoảng ngày để hiển thị gọn trên bảng báo cáo.
 * Hàm trả về: chuỗi khoảng thời gian đã format.
 */
function formatDateRange(startDate, endDate) {
  return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
}

/**
 * Hàm nhận vào: startDate, endDate là khoảng ngày của bản ghi; fromDate, toDate là bộ lọc ngày hiện tại.
 * Hàm xử lý: kiểm tra bản ghi có giao nhau với khoảng ngày đang lọc hay không.
 * Hàm trả về: true nếu bản ghi hợp lệ với bộ lọc ngày, ngược lại trả về false.
 */
function matchesDateRange(startDate, endDate, fromDate, toDate) {
  if (!fromDate && !toDate) {
    return true;
  }

  const safeStartDate = startDate || endDate || "";
  const safeEndDate = endDate || startDate || "";

  if (fromDate && safeEndDate && safeEndDate < fromDate) {
    return false;
  }

  if (toDate && safeStartDate && safeStartDate > toDate) {
    return false;
  }

  return true;
}

/**
 * Hàm nhận vào: value là ô dữ liệu bất kỳ cần xuất CSV.
 * Hàm xử lý: escape dấu nháy kép và bọc giá trị trong cặp nháy để Excel/CSV đọc đúng.
 * Hàm trả về: chuỗi an toàn để ghi vào file CSV.
 */
function buildCsvValue(value) {
  const safeValue = String(value ?? "").replace(/"/g, '""');
  return `"${safeValue}"`;
}

/**
 * Hàm nhận vào: fileName là tên file, rows là mảng dữ liệu thô, columns là cấu hình cột cần xuất.
 * Hàm xử lý: ghép dữ liệu thành nội dung CSV, tạo Blob và kích hoạt tải file về máy người dùng.
 * Hàm trả về: không trả về dữ liệu.
 */
function exportRowsToCsv(fileName, rows, columns) {
  const csvHeader = columns.map((column) => buildCsvValue(column.label)).join(",");
  const csvBody = rows.map((row) =>
    columns
      .map((column) => buildCsvValue(row[column.key]))
      .join(","),
  );
  const csvContent = `\uFEFF${[csvHeader, ...csvBody].join("\r\n")}`;
  const csvBlob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const downloadUrl = URL.createObjectURL(csvBlob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;
  downloadLink.click();
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Hàm nhận vào: iconName là mã icon, className là class CSS bổ sung và size là kích thước SVG.
 * Hàm xử lý: chọn icon SVG phù hợp cho card thống kê, chart và khu tạo báo cáo.
 * Hàm trả về: JSX của icon SVG tương ứng.
 */
function renderReportIcon(iconName, className = "", size = 24) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    className,
    "aria-hidden": "true",
  };

  switch (iconName) {
    case "schedule":
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="15" rx="3" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
        </svg>
      );
    case "published":
      return (
        <svg {...commonProps}>
          <path d="M12 4 3.5 8l8.5 4 8.5-4L12 4Z" />
          <path d="m3.5 12 8.5 4 8.5-4" />
          <path d="m3.5 16 8.5 4 8.5-4" />
        </svg>
      );
    case "approved":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12 2.2 2.2 4.8-4.8" />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="m9 9 6 6" />
          <path d="m15 9-6 6" />
        </svg>
      );
    case "usage":
      return (
        <svg {...commonProps}>
          <path d="M4 19h16" />
          <path d="M6 16V9" />
          <path d="M12 16V5" />
          <path d="M18 16v-3" />
        </svg>
      );
    case "issue":
      return (
        <svg {...commonProps}>
          <path d="M12 4 3.5 19h17L12 4Z" />
          <path d="M12 9v4" />
          <path d="M12 16h.01" />
        </svg>
      );
    case "device":
      return (
        <svg {...commonProps}>
          <path d="M14 7 17 10" />
          <path d="M3 21 10 14" />
          <path d="M14.5 3C16.9853 3 19 5.01472 19 7.5c0 .87873-.252 1.6986-.6875 2.39062L10 18.2031 5.79688 14l8.31252-8.3125C14.8014 5.25205 15.6213 5 16.5 5" />
        </svg>
      );
    case "software":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8" />
          <path d="M8 12h8" />
          <path d="M8 15h5" />
        </svg>
      );
    case "room":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );
    case "change":
      return (
        <svg {...commonProps}>
          <path d="M7 7h9a4 4 0 0 1 4 4v0" />
          <path d="m13 3 3 4-3 4" />
          <path d="M17 17H8a4 4 0 0 1-4-4v0" />
          <path d="m11 21-3-4 3-4" />
        </svg>
      );
    case "template":
      return (
        <svg {...commonProps}>
          <path d="M8 4h8l4 4v12H8Z" />
          <path d="M16 4v4h4" />
          <path d="M11 13h6" />
          <path d="M11 17h6" />
        </svg>
      );
    case "download":
      return (
        <svg {...commonProps}>
          <path d="M12 4v10" />
          <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
          <path d="M5 19h14" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

/**
 * Hàm nhận vào: status là trạng thái nghiệp vụ của lịch, thiết bị, phần mềm hoặc yêu cầu thay đổi.
 * Hàm xử lý: ánh xạ trạng thái sang tone badge phù hợp với ngữ cảnh báo cáo admin.
 * Hàm trả về: JSX của badge trạng thái.
 */
function buildReportStatusBadge(status) {
  const toneClassMap = {
    Published: "roomStatusPositive",
    "Khả dụng": "roomStatusPositive",
    "Hoạt động": "roomStatusPositive",
    "Đạt": "roomStatusPositive",
    Active: "roomStatusPositive",
    Open: "roomStatusPositive",
    "Đã cài đủ": "roomStatusPositive",
    Approved: "roomStatusNeutral",
    Draft: "roomStatusNeutral",
    "Đang kiểm tra": "roomStatusNeutral",
    "Mới ghi nhận": "roomStatusNeutral",
    "Bảo trì": "roomStatusWarning",
    "Lỗi nhẹ": "roomStatusWarning",
    "Cần cập nhật": "roomStatusWarning",
    "Chưa đạt": "roomStatusWarning",
    "Đang xử lý": "roomStatusWarning",
    "Đang sửa": "roomStatusWarning",
    Cancelled: "roomStatusDanger",
    "Hỏng": "roomStatusDanger",
    Locked: "roomStatusDanger",
    "Tạm ngưng": "roomStatusDanger",
    "Thiếu gói": "roomStatusDanger",
    Completed: "trainingStatusMuted",
    "Đã thay": "trainingStatusMuted",
    "Đã xử lý": "trainingStatusMuted",
    "Bình thường": "trainingStatusMuted",
  };

  return (
    <span className={`roomStatusBadge ${toneClassMap[status] || "roomStatusNeutral"}`}>
      {status}
    </span>
  );
}

/**
 * Hàm nhận vào: value là số lượng cần tính và total là tổng số.
 * Hàm xử lý: quy đổi giá trị sang phần trăm, tránh chia cho 0.
 * Hàm trả về: số phần trăm đã làm tròn.
 */
function calculatePercentage(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

/**
 * Hàm nhận vào: title là tiêu đề, value là số liệu, iconName là mã icon và hint là mô tả phụ.
 * Hàm xử lý: dựng card thống kê tổng quan cho đầu trang reports.
 * Hàm trả về: JSX của một card thống kê.
 */
/**
 * Hàm nhận vào: title, description và data của biểu đồ cột.
 * Hàm xử lý: dựng card biểu đồ cột bằng HTML/CSS thuần để hiển thị số buổi theo từng mục.
 * Hàm trả về: JSX của card biểu đồ cột.
 */
function BarChartCard({ title, description, data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <article className="card reportChartCard">
      <div className="reportChartHeader">
        <h4 className="roomSectionTitle">{title}</h4>
        <p className="roomSectionText">{description}</p>
      </div>

      <div className="reportVerticalChart">
        {data.map((item) => (
          <div key={item.label} className="reportVerticalBarItem">
            <span className="reportBarValue">{item.value}</span>
            <div className="reportVerticalBarTrack">
              <div
                className="reportVerticalBarFill"
                style={{ height: `${Math.max(calculatePercentage(item.value, maxValue), 10)}%` }}
              />
            </div>
            <span className="reportBarLabel">{item.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

/**
 * Hàm nhận vào: title, description và data của biểu đồ cột ngang.
 * Hàm xử lý: dựng thanh tiến độ ngang để so sánh nhanh tần suất sử dụng theo phòng hoặc nhóm trạng thái.
 * Hàm trả về: JSX của card biểu đồ cột ngang.
 */
function HorizontalBarChart({ title, description, data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <article className="card reportChartCard">
      <div className="reportChartHeader">
        <h4 className="roomSectionTitle">{title}</h4>
        <p className="roomSectionText">{description}</p>
      </div>

      <div className="reportHorizontalChart">
        {data.map((item) => (
          <div key={item.label} className="reportHorizontalBarItem">
            <span className="reportHorizontalLabel">{item.label}</span>
            <div className="reportHorizontalTrack">
              <div
                className="reportHorizontalFill"
                style={{ width: `${Math.max(calculatePercentage(item.value, maxValue), 8)}%` }}
              />
            </div>
            <span className="reportHorizontalValue">{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

/**
 * Hàm nhận vào: title, description, data và totalLabel của biểu đồ donut.
 * Hàm xử lý: dùng conic-gradient để thể hiện tỷ lệ trạng thái lịch thực hành theo từng nhóm.
 * Hàm trả về: JSX của card donut summary.
 */
function DonutSummaryChart({ title, description, data, totalLabel }) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  const gradientSegments = data
    .filter((item) => item.value > 0)
    .map((item) => {
      const nextAngle = currentAngle + (item.value / totalValue) * 360;
      const segment = `${item.color} ${currentAngle}deg ${nextAngle}deg`;

      currentAngle = nextAngle;
      return segment;
    });

  return (
    <article className="card reportChartCard">
      <div className="reportChartHeader">
        <h4 className="roomSectionTitle">{title}</h4>
        <p className="roomSectionText">{description}</p>
      </div>

      <div className="reportDonutLayout">
        <div
          className="reportDonut"
          style={{
            background: gradientSegments.length
              ? `conic-gradient(${gradientSegments.join(", ")})`
              : "#e2e8f0",
          }}
        >
          <div className="reportDonutCenter">
            <strong>{totalValue}</strong>
            <span>{totalLabel}</span>
          </div>
        </div>

        <ul className="reportLegendList">
          {data.map((item) => (
            <li key={item.label} className="reportLegendItem">
              <span
                className="reportLegendSwatch"
                style={{ backgroundColor: item.color }}
              />
              <span className="reportLegendLabel">{item.label}</span>
              <strong className="reportLegendValue">{item.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/**
 * Hàm nhận vào: title, description và data xu hướng theo tuần.
 * Hàm xử lý: dựng mini trend chart bằng cột đứng để mô tả biến động số buổi thực hành theo tuần.
 * Hàm trả về: JSX của card trend chart.
 */
function TrendChart({ title, description, data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <article className="card reportChartCard">
      <div className="reportChartHeader">
        <h4 className="roomSectionTitle">{title}</h4>
        <p className="roomSectionText">{description}</p>
      </div>

      <div className="reportTrendChart">
        {data.map((item) => (
          <div key={item.label} className="reportTrendItem">
            <span className="reportBarValue">{item.value}</span>
            <div className="reportTrendTrack">
              <div
                className="reportTrendFill"
                style={{ height: `${Math.max(calculatePercentage(item.value, maxValue), 10)}%` }}
              />
            </div>
            <span className="reportBarLabel">{item.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

/**
 * Hàm nhận vào: activeTab là tab báo cáo đang mở và item là bản ghi dữ liệu thô.
 * Hàm xử lý: trích xuất phần mô tả dùng cho tìm kiếm mềm theo đúng ngữ cảnh của từng tab.
 * Hàm trả về: chuỗi tổng hợp từ các field quan trọng của bản ghi.
 */
function buildReportSearchTarget(activeTab, item) {
  switch (activeTab) {
    case "roomUsage":
      return [item.room_code, item.notes, item.usage_status].join(" ");
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
    case "issues":
      return [
        item.issue_code,
        item.room_code,
        item.device_code,
        item.device_name,
        item.issue_type,
        item.issue_status,
      ].join(" ");
    case "software":
      return [
        item.room_code,
        item.software_name,
        item.required_course_label,
        item.software_status,
      ].join(" ");
    case "changes":
      return [
        item.request_code,
        item.change_type,
        item.schedule_code,
        item.proposed_room_code,
        item.requested_by_name,
        item.request_status,
      ].join(" ");
    case "template":
      return [item.indicator_label, item.notes].join(" ");
    default:
      return "";
  }
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại và item là bản ghi dữ liệu.
 * Hàm xử lý: lấy giá trị trạng thái phù hợp với tab đang lọc để dùng cho select trạng thái.
 * Hàm trả về: chuỗi trạng thái hoặc "all" khi tab không có lọc riêng.
 */
function getReportStatusValue(activeTab, item) {
  switch (activeTab) {
    case "roomUsage":
      return item.usage_status;
    case "schedules":
      return item.entry_status;
    case "issues":
      return item.issue_status;
    case "software":
      return item.software_status;
    case "changes":
      return item.request_status;
    default:
      return "all";
  }
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại và item là bản ghi dữ liệu.
 * Hàm xử lý: trả về khoảng ngày gốc của bản ghi để áp dụng bộ lọc từ ngày/đến ngày.
 * Hàm trả về: object gồm startDate và endDate.
 */
function getReportItemDateRange(activeTab, item) {
  switch (activeTab) {
    case "roomUsage":
      return { startDate: item.start_date, endDate: item.end_date };
    case "schedules":
      return { startDate: item.start_date, endDate: item.end_date };
    case "issues":
      return { startDate: item.start_date, endDate: item.end_date };
    case "software":
      return { startDate: item.installed_on, endDate: item.installed_on };
    case "changes":
      return { startDate: item.start_date, endDate: item.end_date };
    case "template":
      return { startDate: "", endDate: "" };
    default:
      return { startDate: "", endDate: "" };
  }
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại.
 * Hàm xử lý: chọn đúng mảng mock data thô cho tab đang được mở.
 * Hàm trả về: mảng dữ liệu gốc của tab đó.
 */
function getActiveTabItems(activeTab) {
  switch (activeTab) {
    case "roomUsage":
      return roomUsageMockItems;
    case "schedules":
      return reportScheduleMockItems;
    case "issues":
      return roomIssueMockItems;
    case "software":
      return softwareReportMockItems;
    case "changes":
      return changeRequestReportMockItems;
    case "template":
      return reportTemplateIndicatorItems;
    default:
      return [];
  }
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại và items là danh sách dữ liệu đã lọc.
 * Hàm xử lý: map dữ liệu thô sang đúng shape mà DataTable cần hiển thị cho tab đó.
 * Hàm trả về: mảng rows đã sẵn sàng để render.
 */
function getActiveTabRows(activeTab, items) {
  switch (activeTab) {
    case "roomUsage":
      return items.map((item) => ({
        id: item.id,
        room_code: item.room_code,
        total_sessions: item.total_sessions,
        published_sessions: item.published_sessions,
        cancelled_sessions: item.cancelled_sessions,
        completed_sessions: item.completed_sessions,
        usage_rate: `${item.usage_rate}%`,
        usable_student_computers: item.usable_student_computers,
        issue_count: item.issue_count,
        notes: item.notes,
      }));
    case "schedules":
      return items.map((item) => ({
        id: item.id,
        schedule_code: item.schedule_code,
        course_label: `${item.course_code} - ${item.course_name}`,
        section_label: `${item.section_code} / Nhóm ${item.group_no}`,
        lecturer_name: item.lecturer_name,
        room_code: item.room_code,
        time_slot_label: item.time_slot_label,
        date_range: formatDateRange(item.start_date, item.end_date),
        entry_status: buildReportStatusBadge(item.entry_status),
        notes: item.notes,
      }));
    case "issues":
      return items.map((item) => ({
        id: item.id,
        issue_code: item.issue_code,
        room_code: item.room_code,
        device_label: `${item.device_code} - ${item.device_name}`,
        issue_type: item.issue_type,
        priority_level: item.priority_level,
        issue_status: buildReportStatusBadge(item.issue_status),
        reported_by_name: item.reported_by_name,
        created_at: formatDateLabel(item.created_at),
        notes: item.notes,
      }));
    case "software":
      return items.map((item) => ({
        id: item.id,
        room_code: item.room_code,
        software_name: item.software_name,
        installed_version: item.installed_version,
        required_course_label: item.required_course_label,
        software_status: buildReportStatusBadge(item.software_status),
        notes: item.notes,
      }));
    case "changes":
      return items.map((item) => ({
        id: item.id,
        request_code: item.request_code,
        change_type: item.change_type,
        schedule_code: item.schedule_code,
        proposed_room_code: item.proposed_room_code,
        proposed_time_slot_label: item.proposed_time_slot_label,
        requested_by_name: item.requested_by_name,
        request_status: buildReportStatusBadge(item.request_status),
        reason_text: item.reason_text,
        created_at: formatDateLabel(item.created_at),
      }));
    case "template":
      return items.map((item, index) => ({
        id: item.id,
        stt: index + 1,
        indicator_label: item.indicator_label,
        indicator_value: item.indicator_value,
        notes: item.notes,
      }));
    default:
      return [];
  }
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại.
 * Hàm xử lý: chọn đúng cấu hình cột DataTable cho tab đang hiển thị.
 * Hàm trả về: mảng columns của DataTable.
 */
function getActiveTabColumns(activeTab) {
  return reportColumnMap[activeTab] || reportColumnMap.template;
}

/**
 * Hàm nhận vào: activeTab là tab hiện tại và items là danh sách dữ liệu thô đã lọc.
 * Hàm xử lý: map dữ liệu thô sang dạng thuần text để phục vụ xuất CSV của từng tab.
 * Hàm trả về: mảng dữ liệu plain object dùng cho file CSV.
 */
function getActiveTabExportRows(activeTab, items) {
  switch (activeTab) {
    case "roomUsage":
      return items.map((item) => ({
        room_code: item.room_code,
        total_sessions: item.total_sessions,
        published_sessions: item.published_sessions,
        cancelled_sessions: item.cancelled_sessions,
        completed_sessions: item.completed_sessions,
        usage_rate: `${item.usage_rate}%`,
        usable_student_computers: item.usable_student_computers,
        issue_count: item.issue_count,
        notes: item.notes,
      }));
    case "schedules":
      return items.map((item) => ({
        schedule_code: item.schedule_code,
        course_label: `${item.course_code} - ${item.course_name}`,
        section_label: `${item.section_code} / Nhóm ${item.group_no}`,
        lecturer_name: item.lecturer_name,
        room_code: item.room_code,
        time_slot_label: item.time_slot_label,
        date_range: formatDateRange(item.start_date, item.end_date),
        entry_status: item.entry_status,
        notes: item.notes,
      }));
    case "issues":
      return items.map((item) => ({
        issue_code: item.issue_code,
        room_code: item.room_code,
        device_label: `${item.device_code} - ${item.device_name}`,
        issue_type: item.issue_type,
        priority_level: item.priority_level,
        issue_status: item.issue_status,
        reported_by_name: item.reported_by_name,
        created_at: formatDateLabel(item.created_at),
        notes: item.notes,
      }));
    case "software":
      return items.map((item) => ({
        room_code: item.room_code,
        software_name: item.software_name,
        installed_version: item.installed_version,
        required_course_label: item.required_course_label,
        software_status: item.software_status,
        notes: item.notes,
      }));
    case "changes":
      return items.map((item) => ({
        request_code: item.request_code,
        change_type: item.change_type,
        schedule_code: item.schedule_code,
        proposed_room_code: item.proposed_room_code,
        proposed_time_slot_label: item.proposed_time_slot_label,
        requested_by_name: item.requested_by_name,
        request_status: item.request_status,
        reason_text: item.reason_text,
        created_at: formatDateLabel(item.created_at),
      }));
    case "template":
      return items.map((item, index) => ({
        stt: index + 1,
        indicator_label: item.indicator_label,
        indicator_value: item.indicator_value,
        notes: item.notes,
      }));
    default:
      return [];
  }
}

/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: dựng toàn bộ giao diện thống kê và báo cáo cho QTV/Admin bằng mock data, gồm filter, tab, biểu đồ, bảng và khu tạo báo cáo.
 * Hàm trả về: JSX của route /admin/reports.
 */
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [fromDate, setFromDate] = useState("2026-03-01");
  const [toDate, setToDate] = useState("2026-05-31");
  const [semesterFilter, setSemesterFilter] = useState("HK2_2025_2026");
  const [weekFilter, setWeekFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [reportTypeFilter, setReportTypeFilter] = useState("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reportCreator, setReportCreator] = useState("Admin PTIT HCM");
  const [reportUnit, setReportUnit] = useState("Phòng máy - PTIT HCM");
  const [reportNote, setReportNote] = useState(
    "Báo cáo giữa kỳ phục vụ theo dõi vận hành và phân công lịch thực hành.",
  );
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeWarnings, setIncludeWarnings] = useState(true);
  const [generatedMessage, setGeneratedMessage] = useState("");

  const filteredScheduleBaseItems = useMemo(
    () =>
      reportScheduleMockItems.filter((item) => {
        const matchedSemester =
          semesterFilter === "all" || item.semester_code === semesterFilter;
        const matchedWeek =
          weekFilter === "all" || String(item.week_no) === weekFilter;
        const matchedRoom =
          roomFilter === "all" || item.room_code === roomFilter;
        const matchedDateRange = matchesDateRange(
          item.start_date,
          item.end_date,
          fromDate,
          toDate,
        );

        return matchedSemester && matchedWeek && matchedRoom && matchedDateRange;
      }),
    [fromDate, roomFilter, semesterFilter, toDate, weekFilter],
  );

  const filteredRoomUsageBaseItems = useMemo(
    () =>
      roomUsageMockItems.filter((item) => {
        const matchedSemester =
          semesterFilter === "all" || item.semester_code === semesterFilter;
        const matchedWeek =
          weekFilter === "all" || String(item.week_no) === weekFilter;
        const matchedRoom =
          roomFilter === "all" || item.room_code === roomFilter;
        const matchedDateRange = matchesDateRange(
          item.start_date,
          item.end_date,
          fromDate,
          toDate,
        );

        return matchedSemester && matchedWeek && matchedRoom && matchedDateRange;
      }),
    [fromDate, roomFilter, semesterFilter, toDate, weekFilter],
  );

  const filteredIssueBaseItems = useMemo(
    () =>
      roomIssueMockItems.filter((item) => {
        const matchedSemester =
          semesterFilter === "all" || item.semester_code === semesterFilter;
        const matchedWeek =
          weekFilter === "all" || String(item.week_no) === weekFilter;
        const matchedRoom =
          roomFilter === "all" || item.room_code === roomFilter;
        const matchedDateRange = matchesDateRange(
          item.start_date,
          item.end_date,
          fromDate,
          toDate,
        );

        return matchedSemester && matchedWeek && matchedRoom && matchedDateRange;
      }),
    [fromDate, roomFilter, semesterFilter, toDate, weekFilter],
  );

  const filteredDeviceStatusBaseItems = useMemo(
    () =>
      deviceStatusMockItems.filter((item) => {
        const matchedSemester =
          semesterFilter === "all" || item.semester_code === semesterFilter;
        const matchedWeek =
          weekFilter === "all" || String(item.week_no) === weekFilter;
        const matchedRoom =
          roomFilter === "all" || item.room_code === roomFilter;
        const matchedDateRange = matchesDateRange(
          item.last_updated_at,
          item.last_updated_at,
          fromDate,
          toDate,
        );

        return matchedSemester && matchedWeek && matchedRoom && matchedDateRange;
      }),
    [fromDate, roomFilter, semesterFilter, toDate, weekFilter],
  );

  const filteredSoftwareBaseItems = useMemo(
    () =>
      softwareReportMockItems.filter((item) => {
        const matchedSemester =
          semesterFilter === "all" || item.semester_code === semesterFilter;
        const matchedWeek =
          weekFilter === "all" || String(item.week_no) === weekFilter;
        const matchedRoom =
          roomFilter === "all" || item.room_code === roomFilter;
        const matchedDateRange = matchesDateRange(
          item.installed_on,
          item.installed_on,
          fromDate,
          toDate,
        );

        return matchedSemester && matchedWeek && matchedRoom && matchedDateRange;
      }),
    [fromDate, roomFilter, semesterFilter, toDate, weekFilter],
  );

  const filteredChangeBaseItems = useMemo(
    () =>
      changeRequestReportMockItems.filter((item) => {
        const matchedSemester =
          semesterFilter === "all" || item.semester_code === semesterFilter;
        const matchedWeek =
          weekFilter === "all" || String(item.week_no) === weekFilter;
        const matchedRoom =
          roomFilter === "all" ||
          item.proposed_room_code === roomFilter ||
          item.proposed_room_code === "";
        const matchedDateRange = matchesDateRange(
          item.start_date,
          item.end_date,
          fromDate,
          toDate,
        );

        return matchedSemester && matchedWeek && matchedRoom && matchedDateRange;
      }),
    [fromDate, roomFilter, semesterFilter, toDate, weekFilter],
  );

  const filteredWeeklyTrendItems = useMemo(
    () =>
      weeklyTrendMockItems.filter((item) => {
        const matchedSemester =
          semesterFilter === "all" || item.semester_code === semesterFilter;
        const matchedWeek =
          weekFilter === "all" || String(item.week_no) === weekFilter;
        const matchedDateRange = matchesDateRange(
          item.start_date,
          item.end_date,
          fromDate,
          toDate,
        );

        return matchedSemester && matchedWeek && matchedDateRange;
      }),
    [fromDate, semesterFilter, toDate, weekFilter],
  );

  const reportStats = useMemo(() => {
    const totalSessions = filteredScheduleBaseItems.length;
    const publishedSessions = filteredScheduleBaseItems.filter(
      (item) => item.entry_status === "Published",
    ).length;
    const approvedSessions = filteredScheduleBaseItems.filter(
      (item) => item.entry_status === "Approved",
    ).length;
    const cancelledSessions = filteredScheduleBaseItems.filter(
      (item) => item.entry_status === "Cancelled",
    ).length;
    const averageUsageRate =
      filteredRoomUsageBaseItems.length > 0
        ? Math.round(
            filteredRoomUsageBaseItems.reduce(
              (sum, item) => sum + item.usage_rate,
              0,
            ) / filteredRoomUsageBaseItems.length,
          )
        : 0;
    const activeIssues = filteredIssueBaseItems.filter((item) =>
      ["Đang xử lý", "Đang kiểm tra"].includes(item.issue_status),
    ).length;
    const faultyDevices = filteredDeviceStatusBaseItems.filter((item) =>
      ["Lỗi nhẹ", "Hỏng", "Đang sửa"].includes(item.device_status),
    ).length;
    const softwareAttentionItems = filteredSoftwareBaseItems.filter((item) =>
      ["Cần cập nhật", "Thiếu gói", "Tạm ngưng"].includes(item.software_status),
    ).length;

    return [
      {
        title: "Tổng buổi thực hành",
        value: totalSessions,
        iconName: "schedule",
      },
      {
        title: "Đã công bố",
        value: publishedSessions,
        iconName: "published",
      },
      {
        title: "Đã duyệt",
        value: approvedSessions,
        iconName: "approved",
      },
      {
        title: "Đã hủy",
        value: cancelledSessions,
        iconName: "cancelled",
      },
      {
        title: "Tỷ lệ sử dụng phòng",
        value: `${averageUsageRate}%`,
        iconName: "usage",
      },
      {
        title: "Sự cố đang xử lý",
        value: activeIssues,
        iconName: "issue",
      },
      {
        title: "Thiết bị lỗi",
        value: faultyDevices,
        iconName: "device",
      },
      {
        title: "Phần mềm cần cập nhật",
        value: softwareAttentionItems,
        iconName: "software",
      },
    ];
  }, [
    filteredDeviceStatusBaseItems,
    filteredIssueBaseItems,
    filteredRoomUsageBaseItems,
    filteredScheduleBaseItems,
    filteredSoftwareBaseItems,
  ]);

  const scheduleStatusSummaryItems = useMemo(() => {
    const statusOrder = [
      { label: "Published", color: "#047857" },
      { label: "Approved", color: "#2563eb" },
      { label: "Draft", color: "#64748b" },
      { label: "Cancelled", color: "#dc2626" },
      { label: "Completed", color: "#7c3aed" },
    ];

    return statusOrder.map((statusItem) => ({
      label: statusItem.label,
      color: statusItem.color,
      value: filteredScheduleBaseItems.filter(
        (item) => item.entry_status === statusItem.label,
      ).length,
    }));
  }, [filteredScheduleBaseItems]);

  const sessionsByRoomChartData = useMemo(
    () =>
      filteredRoomUsageBaseItems.map((item) => ({
        label: item.room_code,
        value: item.total_sessions,
      })),
    [filteredRoomUsageBaseItems],
  );

  const roomUsageBarData = useMemo(
    () =>
      filteredRoomUsageBaseItems.map((item) => ({
        label: item.room_code,
        value: item.usage_rate,
      })),
    [filteredRoomUsageBaseItems],
  );

  const weeklyTrendChartData = useMemo(
    () =>
      filteredWeeklyTrendItems.map((item) => ({
        label: item.week_label,
        value: item.total_sessions,
      })),
    [filteredWeeklyTrendItems],
  );

  const issueTypeChartData = useMemo(() => {
    const issueTypeMap = {};

    filteredIssueBaseItems.forEach((item) => {
      issueTypeMap[item.issue_type] = (issueTypeMap[item.issue_type] || 0) + 1;
    });

    return Object.entries(issueTypeMap).map(([label, value]) => ({ label, value }));
  }, [filteredIssueBaseItems]);

  const deviceStatusChartData = useMemo(() => {
    const deviceStatusMap = {};

    filteredDeviceStatusBaseItems.forEach((item) => {
      deviceStatusMap[item.device_status] =
        (deviceStatusMap[item.device_status] || 0) + 1;
    });

    return Object.entries(deviceStatusMap).map(([label, value]) => ({
      label,
      value,
    }));
  }, [filteredDeviceStatusBaseItems]);

  const softwareStatusChartData = useMemo(() => {
    const softwareStatusMap = {};

    filteredSoftwareBaseItems.forEach((item) => {
      softwareStatusMap[item.software_status] =
        (softwareStatusMap[item.software_status] || 0) + 1;
    });

    return Object.entries(softwareStatusMap).map(([label, value]) => ({
      label,
      value,
    }));
  }, [filteredSoftwareBaseItems]);

  const changeSummaryCards = useMemo(() => {
    const changeCount = filteredChangeBaseItems.filter(
      (item) => item.change_type === "Đổi lịch",
    ).length;
    const cancelCount = filteredChangeBaseItems.filter(
      (item) => item.change_type === "Hủy lịch",
    ).length;
    const makeupCount = filteredChangeBaseItems.filter(
      (item) => item.change_type === "Học bù",
    ).length;
    const handledCount = filteredChangeBaseItems.filter((item) =>
      ["Approved", "Completed"].includes(item.request_status),
    ).length;

    return [
      { label: "Tổng yêu cầu đổi lịch", value: changeCount },
      { label: "Tổng yêu cầu hủy", value: cancelCount },
      { label: "Tổng yêu cầu học bù", value: makeupCount },
      { label: "Yêu cầu đã xử lý", value: handledCount },
    ];
  }, [filteredChangeBaseItems]);

  const reportTemplatePreviewItems = useMemo(() => {
    const peakRoom = filteredRoomUsageBaseItems.reduce(
      (bestItem, currentItem) =>
        currentItem.total_sessions > (bestItem?.total_sessions || 0)
          ? currentItem
          : bestItem,
      null,
    );

    const indicatorValueMap = {
      totalScheduled: filteredScheduleBaseItems.length,
      publishedSessions: filteredScheduleBaseItems.filter(
        (item) => item.entry_status === "Published",
      ).length,
      cancelledSessions: filteredScheduleBaseItems.filter(
        (item) => item.entry_status === "Cancelled",
      ).length,
      peakRoomUsage: peakRoom
        ? `${peakRoom.room_code} (${peakRoom.total_sessions} buổi)`
        : "Chưa có dữ liệu",
      issueRelatedCount: filteredIssueBaseItems.length,
    };

    return reportTemplateIndicatorItems.map((item) => ({
      ...item,
      indicator_value: indicatorValueMap[item.indicator_key] || 0,
    }));
  }, [filteredIssueBaseItems, filteredRoomUsageBaseItems, filteredScheduleBaseItems]);

  const currentItems = useMemo(() => {
    if (activeTab === "overview") {
      return [];
    }

    if (activeTab === "template") {
      return reportTemplatePreviewItems.filter((item) => {
        const normalizedKeyword = normalizeText(searchKeyword);
        const matchedKeyword =
          !normalizedKeyword ||
          normalizeText(buildReportSearchTarget(activeTab, item)).includes(
            normalizedKeyword,
          );

        return matchedKeyword;
      });
    }

    const normalizedKeyword = normalizeText(searchKeyword);

    return getActiveTabItems(activeTab).filter((item) => {
      const { startDate, endDate } = getReportItemDateRange(activeTab, item);
      const matchedKeyword =
        !normalizedKeyword ||
        normalizeText(buildReportSearchTarget(activeTab, item)).includes(
          normalizedKeyword,
        );
      const matchedSemester =
        semesterFilter === "all" || item.semester_code === semesterFilter;
      const matchedWeek =
        weekFilter === "all" || String(item.week_no || "") === weekFilter;
      const matchedRoom =
        roomFilter === "all" ||
        item.room_code === roomFilter ||
        item.proposed_room_code === roomFilter;
      const matchedStatus =
        statusFilter === "all" ||
        getReportStatusValue(activeTab, item) === statusFilter;
      const matchedDateRange = matchesDateRange(
        startDate,
        endDate,
        fromDate,
        toDate,
      );

      return (
        matchedKeyword &&
        matchedSemester &&
        matchedWeek &&
        matchedRoom &&
        matchedStatus &&
        matchedDateRange
      );
    });
  }, [
    activeTab,
    fromDate,
    roomFilter,
    searchKeyword,
    semesterFilter,
    statusFilter,
    toDate,
    weekFilter,
    reportTemplatePreviewItems,
  ]);

  const currentColumns = useMemo(
    () => getActiveTabColumns(activeTab),
    [activeTab],
  );
  const currentRows = useMemo(
    () => getActiveTabRows(activeTab, currentItems),
    [activeTab, currentItems],
  );

  /**
   * Hàm nhận vào: nextTab là key của tab báo cáo cần chuyển tới.
   * Hàm xử lý: cập nhật tab hiện tại, đồng bộ bộ chọn loại báo cáo và reset lọc trạng thái về mặc định.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setReportTypeFilter(nextTab);
    setStatusFilter("all");
  }

  /**
   * Hàm nhận vào: event là sự kiện change của select loại báo cáo.
   * Hàm xử lý: cập nhật loại báo cáo và chuyển thẳng tab giao diện tương ứng.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleReportTypeChange(event) {
    const nextReportType = event.target.value;

    setReportTypeFilter(nextReportType);
    setActiveTab(nextReportType);
    setStatusFilter("all");
  }

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: đưa toàn bộ filter và trạng thái giao diện báo cáo về mặc định ban đầu.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleResetFilters() {
    setSearchKeyword("");
    setFromDate("2026-03-01");
    setToDate("2026-05-31");
    setSemesterFilter("HK2_2025_2026");
    setWeekFilter("all");
    setRoomFilter("all");
    setStatusFilter("all");
    setReportTypeFilter(activeTab);
    setGeneratedMessage("");
  }

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: cập nhật trạng thái giao diện để mô phỏng hành động tạo thống kê từ dữ liệu báo cáo.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleGenerateStatistics() {
    setGeneratedMessage(
      `Đã tạo thống kê lúc ${new Date().toLocaleString("vi-VN")} từ dữ liệu mô phỏng.`,
    );
  }

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: xuất CSV tương ứng với tab hiện tại; riêng tab tổng quan sẽ xuất các chỉ tiêu tóm tắt.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleExportCurrentTab() {
    if (activeTab === "overview") {
      const overviewColumns = reportColumnMap.template;
      const overviewRows = reportTemplatePreviewItems.map((item, index) => ({
        stt: index + 1,
        indicator_label: item.indicator_label,
        indicator_value: item.indicator_value,
        notes: item.notes,
      }));

      exportRowsToCsv("tong-quan-bao-cao.csv", overviewRows, overviewColumns);
      return;
    }

    exportRowsToCsv(
      `bao-cao-${activeTab}.csv`,
      getActiveTabExportRows(activeTab, currentItems),
      currentColumns,
    );
  }

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: xuất dữ liệu mẫu báo cáo tổng hợp ra file CSV mở được bằng Excel.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleExportTemplateReport() {
    const exportRows = reportTemplatePreviewItems.map((item, index) => ({
      stt: index + 1,
      indicator_label: item.indicator_label,
      indicator_value: item.indicator_value,
      notes: item.notes,
    }));

    exportRowsToCsv("bao-cao-thong-ke-phong-may.csv", exportRows, reportColumnMap.template);
  }

  const currentSearchPlaceholder = searchPlaceholderMap[activeTab];
  const currentStatusOptions = reportStatusOptionMap[activeTab];

  return (
    <div>
      <section className="card">
        <p className="roomSectionText reportSummaryText">
          Thống kê số liệu vận hành, sử dụng phòng máy, lịch thực hành, thiết bị và
          xuất báo cáo phục vụ quản trị hệ thống.
        </p>
      </section>

      <section className="card summaryCardGrid summaryCardGridCompact">
        {reportStats.map((statItem) => (
          <CardUI
            key={statItem.title}
            icon={renderReportIcon(statItem.iconName, "summaryCardIcon", 20)}
            title={statItem.title}
            number={statItem.value}
          />
        ))}
      </section>

      <section className="card managementAccount reportManagement">
        <div className="card accountsView reportPrimaryPanel">
          <div className="card optionView roomToolbar">
            <div className="buttonsView roomTabList">
              {reportTabItems.map((tabItem) => {
                const isActive = activeTab === tabItem.key;

                return (
                  <button
                    key={tabItem.key}
                    type="button"
                    className={
                      isActive
                        ? "roomTabButton roomTabButtonActive"
                        : "roomTabButton"
                    }
                    onClick={() => handleTabChange(tabItem.key)}
                  >
                    {tabItem.label}
                  </button>
                );
              })}
            </div>

            <div className="inputFind roomSearchGroup">
              <button type="button" className="button roomSearchButton">
                Tìm kiếm
              </button>
              <input
                type="text"
                className="input roomSearchInput"
                placeholder={currentSearchPlaceholder}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </div>
          </div>

          <div className="card option roomFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">Bộ lọc báo cáo</h3>
              <p className="roomSectionText">
                Lọc theo ngày, học kỳ, tuần học, phòng và trạng thái để tạo thống
                kê giữa kỳ hoặc báo cáo phục vụ quản trị.
              </p>
            </div>

            <div className="reportFilterGrid">
              <div className="lookupFilterField">
                <span>Từ ngày</span>
                <input
                  type="date"
                  className="input"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>

              <div className="lookupFilterField">
                <span>Đến ngày</span>
                <input
                  type="date"
                  className="input"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>

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
                <span>Loại báo cáo</span>
                <select
                  className="select"
                  value={reportTypeFilter}
                  onChange={handleReportTypeChange}
                >
                  {reportTypeOptions.map((optionItem) => (
                    <option key={optionItem.value} value={optionItem.value}>
                      {optionItem.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lookupFilterField">
                <span>Trạng thái lịch</span>
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

              <div className="reportActionGroup">
                <button
                  type="button"
                  className="button roomSearchButton"
                  onClick={handleGenerateStatistics}
                >
                  Tạo thống kê
                </button>
                <button
                  type="button"
                  className="button secondary roomRefreshButton"
                  onClick={handleResetFilters}
                >
                  Làm mới
                </button>
                <button
                  type="button"
                  className="button roomSearchButton"
                  onClick={handleExportCurrentTab}
                >
                  Xuất thống kê
                </button>
                <button
                  type="button"
                  className="button secondary lookupAdvancedButton"
                  onClick={handleExportTemplateReport}
                >
                  Xuất Excel (CSV)
                </button>
                <button type="button" className="button secondary reportGhostButton">
                  Bộ lọc nâng cao
                </button>
              </div>

              {generatedMessage ? (
                <p className="reportGeneratedNote">{generatedMessage}</p>
              ) : null}
            </div>
          </div>

          {activeTab === "overview" ? (
            <div className="reportChartGrid">
              <BarChartCard
                title="Số buổi thực hành theo phòng"
                description="Theo dõi số buổi đã xếp ở từng phòng máy trong phạm vi lọc hiện tại."
                data={sessionsByRoomChartData}
              />

              <DonutSummaryChart
                title="Tỷ lệ trạng thái lịch"
                description="Phân bổ Draft, Approved, Published, Cancelled và Completed của lịch thực hành."
                data={scheduleStatusSummaryItems}
                totalLabel="lịch"
              />

              <TrendChart
                title="Số buổi thực hành theo tuần"
                description="Nhịp sử dụng phòng máy theo các tuần trong học kỳ đang theo dõi."
                data={weeklyTrendChartData}
              />

              <article className="card reportChartCard">
                <div className="reportChartHeader">
                  <h4 className="roomSectionTitle">Tóm tắt chỉ tiêu QTV_BM06</h4>
                  <p className="roomSectionText">
                    Bộ chỉ tiêu mẫu phục vụ báo cáo giữa kỳ cho quản trị viên.
                  </p>
                </div>

                <div className="reportIndicatorTableWrap">
                  <DataTable
                    columns={reportColumnMap.template}
                    rows={getActiveTabRows("template", reportTemplatePreviewItems)}
                  />
                </div>
              </article>
            </div>
          ) : activeTab === "roomUsage" ? (
            <>
              <div className="reportChartGrid reportChartGridCompact">
                <HorizontalBarChart
                  title="Tần suất sử dụng phòng"
                  description="So sánh tỷ lệ sử dụng của 3 phòng máy trong kỳ báo cáo."
                  data={roomUsageBarData}
                />
              </div>

              <div className="card roomTableCard">
                {currentRows.length > 0 ? (
                  <DataTable columns={currentColumns} rows={currentRows} />
                ) : (
                  <div className="roomEmptyState">
                    <h4>Chưa có dữ liệu sử dụng phòng</h4>
                    <p>Bộ lọc hiện tại chưa tạo ra bản ghi phù hợp cho phòng máy.</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === "schedules" ? (
            <>
              <div className="reportChartGrid reportChartGridCompact">
                <DonutSummaryChart
                  title="Trạng thái lịch thực hành"
                  description="Quan sát nhanh tỷ lệ lịch đang nháp, đã duyệt, đã công bố, hủy và hoàn thành."
                  data={scheduleStatusSummaryItems}
                  totalLabel="buổi"
                />
              </div>

              <div className="card roomTableCard">
                {currentRows.length > 0 ? (
                  <DataTable columns={currentColumns} rows={currentRows} />
                ) : (
                  <div className="roomEmptyState">
                    <h4>Chưa có lịch phù hợp</h4>
                    <p>Không tìm thấy lịch thực hành phù hợp với bộ lọc đang chọn.</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === "issues" ? (
            <>
              <div className="reportChartGrid">
                <BarChartCard
                  title="Sự cố theo loại"
                  description="Theo dõi nhóm sự cố phát sinh trong giai đoạn báo cáo."
                  data={issueTypeChartData}
                />

                <HorizontalBarChart
                  title="Thiết bị theo trạng thái"
                  description="Tình trạng chung của các thiết bị liên quan đến phòng thực hành."
                  data={deviceStatusChartData}
                />
              </div>

              <div className="card roomTableCard">
                {currentRows.length > 0 ? (
                  <DataTable columns={currentColumns} rows={currentRows} />
                ) : (
                  <div className="roomEmptyState">
                    <h4>Chưa có dữ liệu sự cố</h4>
                    <p>Không có sự cố phù hợp với phạm vi và trạng thái đang lọc.</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === "software" ? (
            <>
              <div className="reportChartGrid reportChartGridCompact">
                <HorizontalBarChart
                  title="Tình trạng phần mềm theo phòng"
                  description="Nhìn nhanh số lượng phần mềm đã đủ, thiếu hoặc cần cập nhật."
                  data={softwareStatusChartData}
                />
              </div>

              <div className="card roomTableCard">
                {currentRows.length > 0 ? (
                  <DataTable columns={currentColumns} rows={currentRows} />
                ) : (
                  <div className="roomEmptyState">
                    <h4>Chưa có dữ liệu phần mềm</h4>
                    <p>Không tìm thấy phần mềm phù hợp với bộ lọc hiện tại.</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === "changes" ? (
            <>
              <div className="reportMetricGrid">
                {changeSummaryCards.map((metricItem) => (
                  <article key={metricItem.label} className="card reportMetricCard">
                    <span className="reportMetricLabel">{metricItem.label}</span>
                    <strong className="reportMetricValue">{metricItem.value}</strong>
                  </article>
                ))}
              </div>

              <div className="card roomTableCard">
                {currentRows.length > 0 ? (
                  <DataTable columns={currentColumns} rows={currentRows} />
                ) : (
                  <div className="roomEmptyState">
                    <h4>Chưa có yêu cầu phát sinh</h4>
                    <p>
                      Không tìm thấy yêu cầu đổi lịch, hủy lịch hay học bù phù hợp với
                      bộ lọc.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <article className="card reportTemplatePreview">
              <div className="reportTemplateHeader">
                <h3 className="roomSectionTitle">BÁO CÁO THỐNG KÊ SỬ DỤNG PHÒNG MÁY</h3>
                <p className="roomSectionText">
                  Từ ngày {formatDateLabel(fromDate)} đến ngày {formatDateLabel(toDate)}
                </p>
                <p className="roomSectionText">
                  Người lập: {reportCreator} | Đơn vị: {reportUnit}
                </p>
              </div>

              <div className="reportIndicatorTableWrap">
                <DataTable columns={currentColumns} rows={currentRows} />
              </div>

              <div className="reportTemplateActions">
                <button
                  type="button"
                  className="button roomSearchButton"
                  onClick={handleGenerateStatistics}
                >
                  Tạo báo cáo
                </button>
                <button type="button" className="button secondary roomRefreshButton">
                  Xem trước báo cáo
                </button>
                <button
                  type="button"
                  className="button roomSearchButton"
                  onClick={handleExportTemplateReport}
                >
                  Xuất Excel
                </button>
                <button type="button" className="button secondary lookupAdvancedButton">
                  Xuất PDF mock
                </button>
                <button type="button" className="button secondary reportGhostButton">
                  In báo cáo mock
                </button>
              </div>
            </article>
          )}
        </div>

        <aside className="card reportSecondaryPanel">
          <div className="card reportSidebarCard">
            <h5 className="accountUploadTitle">TẠO BÁO CÁO</h5>
            <p className="roomSectionText roomUploadText">
              Chọn mẫu, cập nhật thông tin người lập và xuất báo cáo dạng CSV để tiếp
              tục xử lý ở giai đoạn MVP.
            </p>

            <div className="reportSidebarForm">
              <div className="lookupFilterField">
                <span>Chọn mẫu báo cáo</span>
                <select
                  className="select"
                  value={reportTypeFilter}
                  onChange={handleReportTypeChange}
                >
                  <option value="roomUsage">Báo cáo sử dụng phòng máy</option>
                  <option value="issues">Báo cáo tình trạng thiết bị</option>
                  <option value="schedules">Báo cáo lịch thực hành theo học kỳ</option>
                  <option value="changes">Báo cáo đổi/hủy/học bù</option>
                  <option value="software">Báo cáo phần mềm theo phòng</option>
                  <option value="template">Mẫu báo cáo tổng hợp</option>
                </select>
              </div>

              <div className="lookupFilterField">
                <span>Người lập báo cáo</span>
                <input
                  type="text"
                  className="input"
                  value={reportCreator}
                  onChange={(event) => setReportCreator(event.target.value)}
                />
              </div>

              <div className="lookupFilterField">
                <span>Đơn vị</span>
                <input
                  type="text"
                  className="input"
                  value={reportUnit}
                  onChange={(event) => setReportUnit(event.target.value)}
                />
              </div>

              <div className="lookupFilterField">
                <span>Ghi chú</span>
                <textarea
                  className="input reportSidebarTextarea"
                  value={reportNote}
                  onChange={(event) => setReportNote(event.target.value)}
                />
              </div>

              <div className="reportSidebarChecks">
                <label className="reportSidebarCheckItem">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(event) => setIncludeCharts(event.target.checked)}
                  />
                  <span>Kèm biểu đồ</span>
                </label>
                <label className="reportSidebarCheckItem">
                  <input
                    type="checkbox"
                    checked={includeDetails}
                    onChange={(event) => setIncludeDetails(event.target.checked)}
                  />
                  <span>Kèm bảng chi tiết</span>
                </label>
                <label className="reportSidebarCheckItem">
                  <input
                    type="checkbox"
                    checked={includeWarnings}
                    onChange={(event) => setIncludeWarnings(event.target.checked)}
                  />
                  <span>Kèm cảnh báo</span>
                </label>
              </div>

              <div className="reportSidebarActions">
                <button
                  type="button"
                  className="button roomSearchButton"
                  onClick={handleGenerateStatistics}
                >
                  Tạo báo cáo
                </button>
                <button
                  type="button"
                  className="button secondary lookupAdvancedButton"
                  onClick={handleExportTemplateReport}
                >
                  Xuất báo cáo Excel
                </button>
                <button type="button" className="button secondary roomRefreshButton">
                  Xuất báo cáo PDF mock
                </button>
                <button
                  type="button"
                  className="button secondary reportGhostButton"
                  onClick={handleExportCurrentTab}
                >
                  Tải mẫu báo cáo
                </button>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
