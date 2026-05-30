"use client";

import { useMemo, useState } from "react";

import { CardUI, UploadCard } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { renderTrainingIcon as renderSystemTrainingIcon } from "../../../components/systemIcon.jsx";

// Mảng dữ liệu mock cho học kỳ, giữ field gần bảng semesters để nối API sau thuận tiện hơn.
const semesterMockItems = [
  {
    id: 1,
    semester_code: "HK1_2025_2026",
    academic_year: "2025-2026",
    semester_no: 1,
    semester_name: "Học kỳ 1 năm học 2025-2026",
    start_date: "2025-08-18",
    end_date: "2025-12-28",
    is_current: true,
    semester_status: "Đang hiện hành",
  },
  {
    id: 2,
    semester_code: "HK2_2025_2026",
    academic_year: "2025-2026",
    semester_no: 2,
    semester_name: "Học kỳ 2 năm học 2025-2026",
    start_date: "2026-01-12",
    end_date: "2026-05-24",
    is_current: false,
    semester_status: "Đã đóng",
  },
];

// Mảng dữ liệu mock cho tuần học, bám gần bảng academic_weeks.
const academicWeekMockItems = [
  {
    id: 1,
    semester_id: 1,
    semester_code: "HK1_2025_2026",
    semester_name: "HK1 2025-2026",
    week_no: 6,
    start_date: "2025-09-22",
    end_date: "2025-09-28",
    notes: "Ưu tiên cho các lớp thực hành nhập môn lập trình.",
  },
  {
    id: 2,
    semester_id: 1,
    semester_code: "HK1_2025_2026",
    semester_name: "HK1 2025-2026",
    week_no: 8,
    start_date: "2025-10-06",
    end_date: "2025-10-12",
    notes: "Tuần cao điểm cho các lớp học phần cần phòng máy.",
  },
  {
    id: 3,
    semester_id: 2,
    semester_code: "HK2_2025_2026",
    semester_name: "HK2 2025-2026",
    week_no: 34,
    start_date: "2026-03-02",
    end_date: "2026-03-08",
    notes: "Chuẩn bị ghép lịch các lớp web và cơ sở dữ liệu.",
  },
  {
    id: 4,
    semester_id: 2,
    semester_code: "HK2_2025_2026",
    semester_name: "HK2 2025-2026",
    week_no: 38,
    start_date: "2026-03-30",
    end_date: "2026-04-05",
    notes: "Theo dõi các lớp cần dồn ca thực hành.",
  },
];

// Mảng dữ liệu mock cho ca học, bám gần bảng time_slots.
const timeSlotMockItems = [
  {
    id: 1,
    slot_code: "CA_1_4",
    slot_label: "Tiết 1-4",
    start_period: 1,
    end_period: 4,
    start_time: "07:00",
    end_time: "10:15",
    is_active: true,
    slot_status: "Đang dùng",
  },
  {
    id: 2,
    slot_code: "CA_7_10",
    slot_label: "Tiết 7-10",
    start_period: 7,
    end_period: 10,
    start_time: "13:00",
    end_time: "16:15",
    is_active: true,
    slot_status: "Đang dùng",
  },
  {
    id: 3,
    slot_code: "CA_11_13",
    slot_label: "Tiết 11-13",
    start_period: 11,
    end_period: 13,
    start_time: "17:30",
    end_time: "19:45",
    is_active: false,
    slot_status: "Ngừng dùng",
  },
];

// Mảng dữ liệu mock cho học phần, bám gần bảng courses.
const courseMockItems = [
  {
    id: 1,
    course_code: "INT1332",
    course_name: "Lập trình hướng đối tượng",
    credits: 3,
    lecture_periods: 30,
    lab_periods: 30,
    is_lab_required: true,
    course_status: "Active",
    description: "Học phần nền tảng lập trình OOP cho sinh viên CNTT.",
  },
  {
    id: 2,
    course_code: "INT14105",
    course_name: "An toàn ứng dụng web và cơ sở dữ liệu",
    credits: 3,
    lecture_periods: 30,
    lab_periods: 30,
    is_lab_required: true,
    course_status: "Active",
    description:
      "Khai thác môi trường web, CSDL và các kịch bản kiểm thử an toàn.",
  },
  {
    id: 3,
    course_code: "INT1303",
    course_name: "An toàn và bảo mật hệ thống thông tin",
    credits: 3,
    lecture_periods: 45,
    lab_periods: 15,
    is_lab_required: true,
    course_status: "Inactive",
    description: "Học phần nâng cao về bảo vệ hệ thống và vận hành an toàn.",
  },
  {
    id: 4,
    course_code: "INT1434-3",
    course_name: "Lập trình Web",
    credits: 4,
    lecture_periods: 30,
    lab_periods: 45,
    is_lab_required: true,
    course_status: "Archived",
    description: "Học phần xây dựng ứng dụng web thực hành trên phòng máy.",
  },
];

// Mảng dữ liệu mock cho lớp học phần, bám gần bảng course_sections.
const courseSectionMockItems = [
  {
    id: 1,
    course_id: 1,
    course_code: "INT1332",
    course_name: "Lập trình hướng đối tượng",
    semester_id: 1,
    semester_code: "HK1_2025_2026",
    semester_name: "HK1 2025-2026",
    group_no: "01",
    section_code: "INT1332_01",
    registered_enrollment: 36,
    planned_enrollment: 40,
    class_start_date: "2025-09-01",
    class_end_date: "2025-12-20",
    section_status: "Open",
    notes: "Ưu tiên phòng 2B11 cho các buổi thực hành OOP.",
    lecturer_name: "Nguyễn Trọng Khang",
  },
  {
    id: 2,
    course_id: 1,
    course_code: "INT1332",
    course_name: "Lập trình hướng đối tượng",
    semester_id: 1,
    semester_code: "HK1_2025_2026",
    semester_name: "HK1 2025-2026",
    group_no: "03",
    section_code: "INT1332_03",
    registered_enrollment: 34,
    planned_enrollment: 40,
    class_start_date: "2025-09-03",
    class_end_date: "2025-12-20",
    section_status: "Open",
    notes: "Cần 1 ca chiều cố định trong tuần 8 trở đi.",
    lecturer_name: "Lê Minh Toàn",
  },
  {
    id: 3,
    course_id: 1,
    course_code: "INT1332",
    course_name: "Lập trình hướng đối tượng",
    semester_id: 1,
    semester_code: "HK1_2025_2026",
    semester_name: "HK1 2025-2026",
    group_no: "04",
    section_code: "INT1332_04",
    registered_enrollment: 28,
    planned_enrollment: 35,
    class_start_date: "2025-09-10",
    class_end_date: "2025-12-20",
    section_status: "Draft",
    notes: "Đợi chốt giảng viên phụ trách trước khi công bố.",
    lecturer_name: "Chưa phân công",
  },
  {
    id: 4,
    course_id: 2,
    course_code: "INT14105",
    course_name: "An toàn ứng dụng web và cơ sở dữ liệu",
    semester_id: 2,
    semester_code: "HK2_2025_2026",
    semester_name: "HK2 2025-2026",
    group_no: "01",
    section_code: "INT14105_01",
    registered_enrollment: 40,
    planned_enrollment: 40,
    class_start_date: "2026-01-20",
    class_end_date: "2026-05-10",
    section_status: "Open",
    notes: "Cần máy cài MySQL Workbench và trình duyệt cập nhật.",
    lecturer_name: "Trần Quốc Huy",
  },
  {
    id: 5,
    course_id: 3,
    course_code: "INT1303",
    course_name: "An toàn và bảo mật hệ thống thông tin",
    semester_id: 2,
    semester_code: "HK2_2025_2026",
    semester_name: "HK2 2025-2026",
    group_no: "03",
    section_code: "INT1303_03",
    registered_enrollment: 24,
    planned_enrollment: 30,
    class_start_date: "2026-02-02",
    class_end_date: "2026-05-16",
    section_status: "Closed",
    notes: "Đã hoàn tất phân bổ do lớp học phần ghép.",
    lecturer_name: "Phạm Hoàng Dương",
  },
  {
    id: 6,
    course_id: 4,
    course_code: "INT1434-3",
    course_name: "Lập trình Web",
    semester_id: 2,
    semester_code: "HK2_2025_2026",
    semester_name: "HK2 2025-2026",
    group_no: "03",
    section_code: "INT1434-3_03",
    registered_enrollment: 12,
    planned_enrollment: 30,
    class_start_date: "2026-02-18",
    class_end_date: "2026-05-24",
    section_status: "Cancelled",
    notes: "Hủy do số lượng đăng ký chưa đạt ngưỡng mở lớp.",
    lecturer_name: "Ngô Hải Yến",
  },
];

// Mảng dữ liệu mock cho lớp hành chính, bám gần bảng student_cohorts.
const studentCohortMockItems = [
  {
    id: 1,
    cohort_code: "D21CQCN01-N",
    faculty_name: "Công nghệ thông tin",
    major_name: "An toàn thông tin",
    intake_year: 2021,
    cohort_status: "Active",
  },
  {
    id: 2,
    cohort_code: "D22CQCN03-N",
    faculty_name: "Công nghệ thông tin",
    major_name: "Công nghệ phần mềm",
    intake_year: 2022,
    cohort_status: "Active",
  },
  {
    id: 3,
    cohort_code: "D20CQCN02-N",
    faculty_name: "Công nghệ thông tin",
    major_name: "Hệ thống thông tin",
    intake_year: 2020,
    cohort_status: "Inactive",
  },
];

// Mảng dữ liệu mock cho phân công giảng viên, bám gần bảng course_section_lecturers.
const lecturerAssignmentMockItems = [
  {
    id: 1,
    course_section_id: 1,
    course_section_code: "INT1332_01",
    course_section_label: "INT1332 - Nhóm 01",
    lecturer_user_id: 901,
    lecturer_name: "Nguyễn Trọng Khang",
    lecturer_role: "Chính",
    assigned_at: "2025-08-25",
  },
  {
    id: 2,
    course_section_id: 2,
    course_section_code: "INT1332_03",
    course_section_label: "INT1332 - Nhóm 03",
    lecturer_user_id: 902,
    lecturer_name: "Lê Minh Toàn",
    lecturer_role: "Chính",
    assigned_at: "2025-08-27",
  },
  {
    id: 3,
    course_section_id: 4,
    course_section_code: "INT14105_01",
    course_section_label: "INT14105 - Nhóm 01",
    lecturer_user_id: 903,
    lecturer_name: "Trần Quốc Huy",
    lecturer_role: "Chính",
    assigned_at: "2026-01-10",
  },
  {
    id: 4,
    course_section_id: 5,
    course_section_code: "INT1303_03",
    course_section_label: "INT1303 - Nhóm 03",
    lecturer_user_id: 904,
    lecturer_name: "Phạm Hoàng Dương",
    lecturer_role: "Phối hợp",
    assigned_at: "2026-01-12",
  },
];

// Danh sách tab quản lý chính của module dữ liệu đào tạo.
const trainingTabItems = [
  { key: "semesters", label: "Học kỳ" },
  { key: "weeks", label: "Tuần học" },
  { key: "slots", label: "Ca học" },
  { key: "courses", label: "Học phần" },
  { key: "sections", label: "Lớp học phần" },
  { key: "cohorts", label: "Lớp hành chính" },
  { key: "lecturers", label: "Phân công giảng viên" },
];

// Placeholder tìm kiếm theo từng tab để hỗ trợ đúng ngữ cảnh nghiệp vụ.
const searchPlaceholderMap = {
  semesters: "Tìm theo mã học kỳ, năm học...",
  weeks: "Tìm theo tuần học, học kỳ hoặc ghi chú...",
  slots: "Tìm theo mã ca, nhãn ca hoặc khung giờ...",
  courses: "Tìm theo mã học phần hoặc tên học phần...",
  sections: "Tìm theo mã học phần, nhóm, giảng viên...",
  cohorts: "Tìm theo mã lớp, khoa hoặc ngành...",
  lecturers: "Tìm theo lớp học phần, giảng viên hoặc vai trò...",
};

// Tiêu đề vùng bảng theo từng tab.
const tableTitleMap = {
  semesters: "Danh sách học kỳ",
  weeks: "Danh sách tuần học",
  slots: "Danh sách ca học",
  courses: "Danh sách học phần",
  sections: "Danh sách lớp học phần",
  cohorts: "Danh sách lớp hành chính",
  lecturers: "Danh sách phân công giảng viên",
};

// Tùy chọn lọc trạng thái theo từng tab, bám gần nghiệp vụ MVP.
const statusOptionMap = {
  semesters: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Đang hiện hành", label: "Đang hiện hành" },
    { value: "Đã đóng", label: "Đã đóng" },
  ],
  weeks: [{ value: "all", label: "Tất cả trạng thái" }],
  slots: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Đang dùng", label: "Đang dùng" },
    { value: "Ngừng dùng", label: "Ngừng dùng" },
  ],
  courses: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Archived", label: "Archived" },
  ],
  sections: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Draft", label: "Draft" },
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" },
    { value: "Cancelled", label: "Cancelled" },
  ],
  cohorts: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Archived", label: "Archived" },
  ],
  lecturers: [{ value: "all", label: "Tất cả trạng thái" }],
};

// Cấu hình quick actions bên phải, dùng cùng UI upload với các màn admin khác.
const trainingQuickItems = [
  {
    key: "semester",
    title: "Thêm học kỳ",
    iconName: "semester",
    templateHref: "/api/template-download/createcourse/semesters",
    templateDownloadName: "semesters.xlsx",
    fileLabel: "File excel",
    buttonLabel: "Thêm mới",
  },
  {
    key: "week",
    title: "Thêm tuần học",
    iconName: "week",
    templateHref: "/api/template-download/createcourse/weeks",
    templateDownloadName: "academic-weeks.xlsx",
    fileLabel: "File excel",
    buttonLabel: "Thêm mới",
  },
  {
    key: "slot",
    title: "Thêm ca học",
    iconName: "slot",
    templateHref: "/api/template-download/createcourse/time-slots",
    templateDownloadName: "time-slots.xlsx",
    fileLabel: "File excel",
    buttonLabel: "Thêm mới",
  },
  {
    key: "course",
    title: "Thêm học phần",
    iconName: "course",
    templateHref: "/api/template-download/createcourse/courses",
    templateDownloadName: "courses.xlsx",
    fileLabel: "File excel",
    buttonLabel: "Thêm mới",
  },
  {
    key: "section",
    title: "Thêm lớp học phần",
    iconName: "section",
    templateHref: "/api/template-download/createcourse/course-sections",
    templateDownloadName: "course-sections.xlsx",
    fileLabel: "File excel",
    buttonLabel: "Thêm mới",
  },
];

// Mảng cột dùng cho DataTable theo từng tab quản lý.
const trainingColumnMap = {
  semesters: [
    { key: "semester_code", label: "Mã học kỳ" },
    { key: "academic_year", label: "Năm học" },
    { key: "semester_name", label: "Tên học kỳ" },
    { key: "start_date", label: "Thời gian bắt đầu" },
    { key: "end_date", label: "Thời gian kết thúc" },
    { key: "is_current", label: "Hiện hành" },
    { key: "semester_status", label: "Trạng thái" },
    { key: "action", label: "Hành động" },
  ],
  weeks: [
    { key: "week_no", label: "Tuần" },
    { key: "semester_name", label: "Học kỳ" },
    { key: "start_date", label: "Ngày bắt đầu" },
    { key: "end_date", label: "Ngày kết thúc" },
    { key: "notes", label: "Ghi chú" },
    { key: "action", label: "Hành động" },
  ],
  slots: [
    { key: "slot_code", label: "Mã ca" },
    { key: "slot_label", label: "Nhãn ca" },
    { key: "start_period", label: "Tiết bắt đầu" },
    { key: "end_period", label: "Tiết kết thúc" },
    { key: "start_time", label: "Giờ bắt đầu" },
    { key: "end_time", label: "Giờ kết thúc" },
    { key: "slot_status", label: "Trạng thái" },
    { key: "action", label: "Hành động" },
  ],
  courses: [
    { key: "course_code", label: "Mã học phần" },
    { key: "course_name", label: "Tên học phần" },
    { key: "credits", label: "Số tín chỉ" },
    { key: "lecture_periods", label: "Tiết lý thuyết" },
    { key: "lab_periods", label: "Tiết thực hành" },
    { key: "is_lab_required", label: "Cần phòng máy" },
    { key: "course_status", label: "Trạng thái" },
    { key: "action", label: "Hành động" },
  ],
  sections: [
    { key: "section_code", label: "Mã lớp học phần" },
    { key: "course_name", label: "Học phần" },
    { key: "semester_name", label: "Học kỳ" },
    { key: "group_no", label: "Nhóm" },
    { key: "planned_enrollment", label: "Sĩ số dự kiến" },
    { key: "registered_enrollment", label: "Sĩ số đăng ký" },
    { key: "class_range", label: "Thời gian học" },
    { key: "section_status", label: "Trạng thái" },
    { key: "action", label: "Hành động" },
  ],
  cohorts: [
    { key: "cohort_code", label: "Mã lớp" },
    { key: "faculty_name", label: "Khoa" },
    { key: "major_name", label: "Ngành" },
    { key: "intake_year", label: "Khóa" },
    { key: "cohort_status", label: "Trạng thái" },
    { key: "action", label: "Hành động" },
  ],
  lecturers: [
    { key: "course_section_label", label: "Lớp học phần" },
    { key: "lecturer_name", label: "Giảng viên" },
    { key: "lecturer_role", label: "Vai trò" },
    { key: "assigned_at", label: "Ngày phân công" },
    { key: "action", label: "Hành động" },
  ],
};

/**
 * Hàm nhận vào: value là chuỗi hoặc giá trị bất kỳ cần chuẩn hóa.
 * Hàm xử lý: loại bỏ dấu tiếng Việt và chuyển về chữ thường để tìm kiếm mềm trên nhiều cột.
 * Hàm trả về: chuỗi đã chuẩn hóa để dùng trong search/filter.
 */
function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Hàm nhận vào: dateValue là chuỗi ngày theo dạng YYYY-MM-DD.
 * Hàm xử lý: đổi chuỗi ngày sang định dạng DD/MM/YYYY để hiển thị trên bảng và form.
 * Hàm trả về: chuỗi ngày đã format hoặc dấu gạch ngang nếu thiếu dữ liệu.
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
 * Hàm nhận vào: iconName là mã icon, className là class CSS bổ sung và size là kích thước SVG.
 * Hàm xử lý: dựng icon SVG phù hợp cho card thống kê, quick action và phần mô tả của module đào tạo.
 * Hàm trả về: JSX của icon tương ứng.
 */
function renderTrainingIcon(iconName, className = "", size = 24) {
  return renderSystemTrainingIcon(iconName, className, size);
}

/**
 * Hàm nhận vào: status là trạng thái nghiệp vụ của học kỳ, ca học, học phần hoặc lớp học phần.
 * Hàm xử lý: ánh xạ trạng thái sang tone badge tương ứng để giao diện nhìn nhất quán với rooms.
 * Hàm trả về: JSX của badge trạng thái.
 */
function buildTrainingStatusBadge(status) {
  const toneClassMap = {
    "Đang hiện hành": "roomStatusPositive",
    "Hiện hành": "roomStatusPositive",
    Open: "roomStatusPositive",
    Active: "roomStatusPositive",
    "Đang dùng": "roomStatusPositive",
    Draft: "roomStatusNeutral",
    Closed: "trainingStatusMuted",
    Inactive: "trainingStatusMuted",
    "Đã đóng": "trainingStatusMuted",
    "Ngừng dùng": "trainingStatusMuted",
    Cancelled: "roomStatusDanger",
    Archived: "roomStatusDanger",
  };

  const toneClassName = toneClassMap[status] || "roomStatusNeutral";

  return <span className={`roomStatusBadge ${toneClassName}`}>{status}</span>;
}

/**
 * Hàm nhận vào: isCurrent là cờ boolean cho biết học kỳ có đang hiện hành hay không.
 * Hàm xử lý: dựng badge ngắn cho cột "Hiện hành" của bảng học kỳ.
 * Hàm trả về: JSX của badge trạng thái hiện hành.
 */
function buildCurrentBadge(isCurrent) {
  return (
    <span
      className={`roomStatusBadge ${
        isCurrent ? "roomStatusPositive" : "trainingStatusMuted"
      }`}
    >
      {isCurrent ? "Hiện hành" : "Không"}
    </span>
  );
}

/**
 * Hàm nhận vào: iconName là mã icon, title là tên card và value là số liệu hiển thị.
 * Hàm xử lý: dựng card thống kê đầu trang theo cùng style với rooms/accounts.
 * Hàm trả về: JSX của một card thống kê.
 */
/**
 * Hàm nhận vào: tabKey là tab đang chọn và item là bản ghi dữ liệu của tab đó.
 * Hàm xử lý: trả về chuỗi mục tiêu dùng để tìm kiếm mềm theo đúng nghiệp vụ của từng tab.
 * Hàm trả về: chuỗi ghép từ các field quan trọng của bản ghi.
 */
function buildTrainingSearchTarget(tabKey, item) {
  switch (tabKey) {
    case "semesters":
      return [
        item.semester_code,
        item.academic_year,
        item.semester_name,
        item.semester_status,
      ].join(" ");
    case "weeks":
      return [
        item.week_no,
        item.semester_code,
        item.semester_name,
        item.notes,
      ].join(" ");
    case "slots":
      return [
        item.slot_code,
        item.slot_label,
        item.start_time,
        item.end_time,
        item.slot_status,
      ].join(" ");
    case "courses":
      return [
        item.course_code,
        item.course_name,
        item.course_status,
        item.description,
      ].join(" ");
    case "sections":
      return [
        item.section_code,
        item.course_code,
        item.course_name,
        item.group_no,
        item.lecturer_name,
        item.section_status,
      ].join(" ");
    case "cohorts":
      return [
        item.cohort_code,
        item.faculty_name,
        item.major_name,
        item.intake_year,
        item.cohort_status,
      ].join(" ");
    case "lecturers":
      return [
        item.course_section_label,
        item.lecturer_name,
        item.lecturer_role,
        item.assigned_at,
      ].join(" ");
    default:
      return "";
  }
}

/**
 * Hàm nhận vào: tabKey là tab đang mở và item là bản ghi dữ liệu của tab đó.
 * Hàm xử lý: lấy ra giá trị trạng thái tương ứng để phục vụ bộ lọc select.
 * Hàm trả về: chuỗi trạng thái hoặc giá trị "all" khi tab không cần lọc trạng thái thực tế.
 */
function getTrainingStatusValue(tabKey, item) {
  switch (tabKey) {
    case "semesters":
      return item.semester_status;
    case "slots":
      return item.slot_status;
    case "courses":
      return item.course_status;
    case "sections":
      return item.section_status;
    case "cohorts":
      return item.cohort_status;
    default:
      return "all";
  }
}

/**
 * Hàm nhận vào: tabKey là tab đang hoạt động.
 * Hàm xử lý: chọn đúng mảng mock data tương ứng với tab hiện tại.
 * Hàm trả về: mảng dữ liệu gốc của tab đó.
 */
function getTrainingItemsByTab(tabKey) {
  switch (tabKey) {
    case "semesters":
      return semesterMockItems;
    case "weeks":
      return academicWeekMockItems;
    case "slots":
      return timeSlotMockItems;
    case "courses":
      return courseMockItems;
    case "sections":
      return courseSectionMockItems;
    case "cohorts":
      return studentCohortMockItems;
    case "lecturers":
      return lecturerAssignmentMockItems;
    default:
      return [];
  }
}

/**
 * Hàm nhận vào: khôg nhận props.
 * Hàm xử lý: dựng màn quản lý dữ liệu đào tạo cho QTV, gồm mô tả, thống kê, tab, filter, bảng, quick actions và form lớp học phần.
 * Hàm trả về: JSX của route /admin/trainingData.
 */
export default function TrainingDataPage({ showQuickDeclaration = false } = {}) {
  const [activeTab, setActiveTab] = useState("semesters");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const trainingStats = useMemo(() => {
    const openSections = courseSectionMockItems.filter(
      (item) => item.section_status === "Open",
    ).length;

    return [
      {
        iconName: "semester",
        title: "Học kỳ",
        value: semesterMockItems.length,
      },
      {
        iconName: "week",
        title: "Tuần học",
        value: academicWeekMockItems.length,
      },
      { iconName: "slot", title: "Ca học", value: timeSlotMockItems.length },
      { iconName: "course", title: "Học phần", value: courseMockItems.length },
      {
        iconName: "section",
        title: "Lớp học phần",
        value: courseSectionMockItems.length,
      },
      { iconName: "overview", title: "Lớp đang mở", value: openSections },
    ];
  }, []);

  const currentItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return getTrainingItemsByTab(activeTab).filter((item) => {
      const matchedKeyword =
        !normalizedKeyword ||
        normalizeText(buildTrainingSearchTarget(activeTab, item)).includes(
          normalizedKeyword,
        );
      const matchedStatus =
        statusFilter === "all" ||
        getTrainingStatusValue(activeTab, item) === statusFilter;

      return matchedKeyword && matchedStatus;
    });
  }, [activeTab, searchKeyword, statusFilter]);

  const currentColumns = useMemo(
    () => trainingColumnMap[activeTab],
    [activeTab],
  );

  const currentRows = useMemo(() => {
    switch (activeTab) {
      case "semesters":
        return currentItems.map((item) => ({
          id: item.id,
          semester_code: item.semester_code,
          academic_year: item.academic_year,
          semester_name: item.semester_name,
          start_date: formatDateLabel(item.start_date),
          end_date: formatDateLabel(item.end_date),
          is_current: buildCurrentBadge(item.is_current),
          semester_status: buildTrainingStatusBadge(item.semester_status),
          action: (
            <ButtonUI
              type="button"
              tone="outline"
              shape="pill"
              size="sm"
              className="roomLinkButton"
            >
              Xem học kỳ
            </ButtonUI>
          ),
        }));
      case "weeks":
        return currentItems.map((item) => ({
          id: item.id,
          week_no: `Tuần ${item.week_no}`,
          semester_name: item.semester_name,
          start_date: formatDateLabel(item.start_date),
          end_date: formatDateLabel(item.end_date),
          notes: item.notes || "—",
          action: (
            <ButtonUI
              type="button"
              tone="outline"
              shape="pill"
              size="sm"
              className="roomLinkButton"
            >
              Xem tuần
            </ButtonUI>
          ),
        }));
      case "slots":
        return currentItems.map((item) => ({
          id: item.id,
          slot_code: item.slot_code,
          slot_label: item.slot_label,
          start_period: item.start_period,
          end_period: item.end_period,
          start_time: item.start_time,
          end_time: item.end_time,
          slot_status: buildTrainingStatusBadge(item.slot_status),
          action: (
            <ButtonUI
              type="button"
              tone="outline"
              shape="pill"
              size="sm"
              className="roomLinkButton"
            >
              Chỉnh sửa
            </ButtonUI>
          ),
        }));
      case "courses":
        return currentItems.map((item) => ({
          id: item.id,
          course_code: item.course_code,
          course_name: item.course_name,
          credits: item.credits,
          lecture_periods: item.lecture_periods,
          lab_periods: item.lab_periods,
          is_lab_required: item.is_lab_required ? "Có" : "Không",
          course_status: buildTrainingStatusBadge(item.course_status),
          action: (
            <ButtonUI
              type="button"
              tone="outline"
              shape="pill"
              size="sm"
              className="roomLinkButton"
            >
              Xem học phần
            </ButtonUI>
          ),
        }));
      case "sections":
        return currentItems.map((item) => ({
          id: item.id,
          section_code: item.section_code,
          course_name: item.course_name,
          semester_name: item.semester_name,
          group_no: item.group_no,
          planned_enrollment: item.planned_enrollment,
          registered_enrollment: item.registered_enrollment,
          class_range: `${formatDateLabel(item.class_start_date)} - ${formatDateLabel(
            item.class_end_date,
          )}`,
          section_status: buildTrainingStatusBadge(item.section_status),
          action: (
            <ButtonUI
              type="button"
              tone="outline"
              shape="pill"
              size="sm"
              className="roomLinkButton"
            >
              Mở lịch
            </ButtonUI>
          ),
        }));
      case "cohorts":
        return currentItems.map((item) => ({
          id: item.id,
          cohort_code: item.cohort_code,
          faculty_name: item.faculty_name,
          major_name: item.major_name,
          intake_year: item.intake_year,
          cohort_status: buildTrainingStatusBadge(item.cohort_status),
          action: (
            <ButtonUI
              type="button"
              tone="outline"
              shape="pill"
              size="sm"
              className="roomLinkButton"
            >
              Xem lớp
            </ButtonUI>
          ),
        }));
      case "lecturers":
        return currentItems.map((item) => ({
          id: item.id,
          course_section_label: item.course_section_label,
          lecturer_name: item.lecturer_name,
          lecturer_role: item.lecturer_role,
          assigned_at: formatDateLabel(item.assigned_at),
          action: (
            <ButtonUI
              type="button"
              tone="outline"
              shape="pill"
              size="sm"
              className="roomLinkButton"
            >
              Điều chỉnh
            </ButtonUI>
          ),
        }));
      default:
        return [];
    }
  }, [activeTab, currentItems]);

  const currentStatusOptions = statusOptionMap[activeTab];
  const currentSearchPlaceholder = searchPlaceholderMap[activeTab];
  const currentTableTitle = tableTitleMap[activeTab];

  /**
   * Hàm nhận vào: nextTab là key của tab mà người dùng vừa chọn.
   * Hàm xử lý: chuyển tab hiện tại và reset search/filter để tránh giữ lại trạng thái cũ không phù hợp.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setSearchKeyword("");
    setStatusFilter("all");
  }

  return (
    <div>
      <section className="card summaryCardGrid">
        {trainingStats.map((statItem) => (
          <CardUI
            key={statItem.title}
            icon={renderTrainingIcon(statItem.iconName, "summaryCardIcon", 20)}
            title={statItem.title}
            number={statItem.value}
          />
        ))}
      </section>

      <section className="card managementAccount">
        {showQuickDeclaration ? (
          <SectionLayout
            title="KHAI BÁO NHANH"
            message="Chuẩn bị biểu mẫu và thêm nhanh học kỳ, ca học, học phần hoặc lớp học phần phục vụ xếp lịch thực hành."
            direction={0}
            className="card accountUploadSection"
          >
            {trainingQuickItems.map((quickItem) => (
              <UploadCard
                key={quickItem.key}
                icon={renderTrainingIcon(
                  quickItem.iconName,
                  "uploadCardIconSvg",
                  22,
                )}
                title={quickItem.title}
                templateHref={quickItem.templateHref}
                templateDownloadName={quickItem.templateDownloadName}
                templateLabel="Tải biểu mẫu"
                fileLabel={quickItem.fileLabel}
                buttonLabel={quickItem.buttonLabel}
              />
            ))}
          </SectionLayout>
        ) : null}

        <div className="card accountsView trainingPrimaryPanel">
          <div className="card optionView roomToolbar">
            <div className="buttonsView roomTabList">
              {trainingTabItems.map((tabItem) => {
                const isActive = activeTab === tabItem.key;

                return (
                  <ButtonUI
                    key={tabItem.key}
                    shape="pill"
                    tone={isActive ? "primary" : "outline"}
                    size="sm"
                    active={isActive}
                    className={
                      isActive
                        ? "roomTabButton roomTabButtonActive"
                        : "roomTabButton"
                    }
                    onClick={() => handleTabChange(tabItem.key)}
                  >
                    {tabItem.label}
                  </ButtonUI>
                );
              })}
            </div>

            <div className="inputFind roomSearchGroup">
              <ButtonUI
                tone="primary"
                shape="rounded"
                className="roomSearchButton"
              >
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

          <div className="card option roomFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">{currentTableTitle}</h3>
              <p className="roomSectionText">
                Hiển thị {currentRows.length} bản ghi theo bộ lọc hiện tại.
              </p>
            </div>

            <div className="roomFilterControls">
              <ButtonUI
                tone="secondary"
                shape="rounded"
                className="roomRefreshButton"
                onClick={() => {
                  setSearchKeyword("");
                  setStatusFilter("all");
                }}
              >
                Làm mới
              </ButtonUI>

              <select
                className="select roomStatusSelect"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {currentStatusOptions.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card roomTableCard">
            {currentRows.length > 0 ? (
              <DataTable columns={currentColumns} rows={currentRows} />
            ) : (
              <div className="roomEmptyState">
                <h4>Chưa có dữ liệu phù hợp</h4>
                <p>
                  Không tìm thấy bản ghi đào tạo phù hợp với từ khóa hoặc trạng
                  thái hiện tại.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
