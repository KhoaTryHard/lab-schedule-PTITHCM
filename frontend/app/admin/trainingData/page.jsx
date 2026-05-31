"use client";

import { useEffect, useMemo, useState } from "react";

import { CardUI, UploadCard } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { renderTrainingIcon as renderSystemTrainingIcon } from "../../../components/systemIcon.jsx";
import {
  createMasterData,
  listMasterData,
  updateMasterData,
} from "../../../services/adminService";

const trainingTabItems = [
  { key: "semesters", resource: "semesters", label: "Học kỳ" },
  { key: "weeks", resource: "academic-weeks", label: "Tuần học" },
  { key: "slots", resource: "time-slots", label: "Ca học" },
  { key: "courses", resource: "courses", label: "Học phần" },
  { key: "sections", resource: "course-sections", label: "Lớp học phần" },
  { key: "cohorts", resource: "student-cohorts", label: "Lớp hành chính" },
  { key: "lecturers", resource: "lecturer-assignments", label: "Phân công GV" },
];

const statusOptionMap = {
  semesters: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Đang dùng" },
    { value: "inactive", label: "Ngừng dùng" },
  ],
  weeks: [{ value: "all", label: "Tất cả trạng thái" }],
  slots: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Đang dùng" },
    { value: "inactive", label: "Ngừng dùng" },
  ],
  courses: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
  ],
  sections: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "draft", label: "Draft" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "cancelled", label: "Cancelled" },
  ],
  cohorts: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
  ],
  lecturers: [{ value: "all", label: "Tất cả trạng thái" }],
};

const searchPlaceholderMap = {
  semesters: "Tìm theo học kỳ, năm học...",
  weeks: "Tìm theo tuần học, học kỳ...",
  slots: "Tìm theo ca học hoặc khung giờ...",
  courses: "Tìm theo mã hoặc tên học phần...",
  sections: "Tìm theo học phần, nhóm, giảng viên...",
  cohorts: "Tìm theo mã lớp, khoa hoặc ngành...",
  lecturers: "Tìm theo lớp học phần hoặc giảng viên...",
};

const tableTitleMap = {
  semesters: "Danh sách học kỳ",
  weeks: "Danh sách tuần học",
  slots: "Danh sách ca học",
  courses: "Danh sách học phần",
  sections: "Danh sách lớp học phần",
  cohorts: "Danh sách lớp hành chính",
  lecturers: "Danh sách phân công giảng viên",
};

const trainingQuickItems = [
  {
    key: "semester",
    title: "Thêm học kỳ",
    iconName: "semester",
    templateHref: "/api/template-download/createcourse/semesters",
    templateDownloadName: "semesters.xlsx",
  },
  {
    key: "week",
    title: "Thêm tuần học",
    iconName: "week",
    templateHref: "/api/template-download/createcourse/weeks",
    templateDownloadName: "academic-weeks.xlsx",
  },
  {
    key: "slot",
    title: "Thêm ca học",
    iconName: "slot",
    templateHref: "/api/template-download/createcourse/time-slots",
    templateDownloadName: "time-slots.xlsx",
  },
  {
    key: "course",
    title: "Thêm học phần",
    iconName: "course",
    templateHref: "/api/template-download/createcourse/courses",
    templateDownloadName: "courses.xlsx",
  },
  {
    key: "section",
    title: "Thêm lớp học phần",
    iconName: "section",
    templateHref: "/api/template-download/createcourse/course-sections",
    templateDownloadName: "course-sections.xlsx",
  },
];

const masterFormConfigMap = {
  semesters: [
    { name: "academic_year", label: "Năm học", required: true },
    { name: "semester_no", label: "Học kỳ số", type: "number", required: true },
    { name: "semester_name", label: "Tên học kỳ", required: true },
    { name: "start_date", label: "Ngày bắt đầu", type: "date", required: true },
    { name: "end_date", label: "Ngày kết thúc", type: "date", required: true },
    { name: "is_active", label: "Đang sử dụng", type: "checkbox" },
  ],
  weeks: [
    { name: "semester_id", label: "Học kỳ", type: "semester", required: true },
    { name: "week_no", label: "Tuần số", type: "number", required: true },
    { name: "start_date", label: "Ngày bắt đầu", type: "date", required: true },
    { name: "end_date", label: "Ngày kết thúc", type: "date", required: true },
  ],
  slots: [
    { name: "slot_label", label: "Nhãn ca", required: true },
    { name: "start_period", label: "Tiết bắt đầu", type: "number", required: true },
    { name: "end_period", label: "Tiết kết thúc", type: "number", required: true },
    { name: "start_time", label: "Giờ bắt đầu", type: "time", nullable: true },
    { name: "end_time", label: "Giờ kết thúc", type: "time", nullable: true },
    { name: "is_active", label: "Đang sử dụng", type: "checkbox" },
  ],
  courses: [
    { name: "course_code", label: "Mã học phần", required: true },
    { name: "course_name", label: "Tên học phần", required: true },
    { name: "credits", label: "Tín chỉ", type: "number" },
    { name: "lecture_periods", label: "Số tiết lý thuyết", type: "number" },
    { name: "lab_periods", label: "Số tiết thực hành", type: "number" },
    { name: "course_status", label: "Trạng thái", type: "course_status" },
    { name: "description", label: "Mô tả", nullable: true },
  ],
  sections: [
    { name: "course_id", label: "Học phần", type: "course", required: true },
    { name: "semester_id", label: "Học kỳ", type: "semester", required: true },
    { name: "group_no", label: "Nhóm", required: true },
    { name: "registered_enrollment", label: "Số SV đăng ký", type: "number" },
    { name: "planned_enrollment", label: "Số SV dự kiến", type: "number", nullable: true },
    { name: "class_start_date", label: "Ngày bắt đầu", type: "date", nullable: true },
    { name: "class_end_date", label: "Ngày kết thúc", type: "date", nullable: true },
    { name: "section_status", label: "Trạng thái", type: "section_status" },
    { name: "notes", label: "Ghi chú", nullable: true },
  ],
  cohorts: [
    { name: "cohort_code", label: "Mã lớp", required: true },
    { name: "faculty_name", label: "Khoa", nullable: true },
    { name: "major_name", label: "Ngành", nullable: true },
    { name: "intake_year", label: "Khóa", nullable: true },
    { name: "cohort_status", label: "Trạng thái", type: "cohort_status" },
  ],
};

const selectOptionMap = {
  course_status: [
    ["active", "Active"],
    ["inactive", "Inactive"],
    ["archived", "Archived"],
  ],
  section_status: [
    ["draft", "Draft"],
    ["open", "Open"],
    ["closed", "Closed"],
    ["cancelled", "Cancelled"],
  ],
  cohort_status: [
    ["active", "Active"],
    ["inactive", "Inactive"],
    ["archived", "Archived"],
  ],
};

const trainingColumnMap = {
  semesters: [
    { key: "semester_code", label: "Mã học kỳ" },
    { key: "academic_year", label: "Năm học" },
    { key: "semester_name", label: "Tên học kỳ" },
    { key: "start_date", label: "Bắt đầu" },
    { key: "end_date", label: "Kết thúc" },
    { key: "status", label: "Trạng thái" },
    { key: "action", label: "Phạm vi #48" },
  ],
  weeks: [
    { key: "week_no", label: "Tuần" },
    { key: "semester_name", label: "Học kỳ" },
    { key: "start_date", label: "Bắt đầu" },
    { key: "end_date", label: "Kết thúc" },
    { key: "action", label: "Phạm vi #48" },
  ],
  slots: [
    { key: "slot_code", label: "Mã ca" },
    { key: "slot_label", label: "Nhãn ca" },
    { key: "period_range", label: "Tiết" },
    { key: "time_range", label: "Giờ" },
    { key: "status", label: "Trạng thái" },
    { key: "action", label: "Phạm vi #48" },
  ],
  courses: [
    { key: "course_code", label: "Mã học phần" },
    { key: "course_name", label: "Tên học phần" },
    { key: "credits", label: "Tín chỉ" },
    { key: "lecture_periods", label: "LT" },
    { key: "lab_periods", label: "TH" },
    { key: "status", label: "Trạng thái" },
    { key: "action", label: "Phạm vi #48" },
  ],
  sections: [
    { key: "section_code", label: "Mã lớp học phần" },
    { key: "course_name", label: "Học phần" },
    { key: "semester_name", label: "Học kỳ" },
    { key: "group_no", label: "Nhóm" },
    { key: "planned_enrollment", label: "Dự kiến" },
    { key: "registered_enrollment", label: "Đăng ký" },
    { key: "status", label: "Trạng thái" },
    { key: "action", label: "Phạm vi #48" },
  ],
  cohorts: [
    { key: "cohort_code", label: "Mã lớp" },
    { key: "faculty_name", label: "Khoa" },
    { key: "major_name", label: "Ngành" },
    { key: "intake_year", label: "Khóa" },
    { key: "status", label: "Trạng thái" },
    { key: "action", label: "Phạm vi #48" },
  ],
  lecturers: [
    { key: "course_section_label", label: "Lớp học phần" },
    { key: "lecturer_name", label: "Giảng viên" },
    { key: "lecturer_role", label: "Vai trò" },
    { key: "assigned_at", label: "Ngày phân công" },
    { key: "action", label: "Phạm vi #48" },
  ],
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function renderTrainingIcon(iconName, className = "", size = 24) {
  return renderSystemTrainingIcon(iconName, className, size);
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const stringValue = String(dateValue);
  const plainDateMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (plainDateMatch) {
    return `${plainDateMatch[3]}/${plainDateMatch[2]}/${plainDateMatch[1]}`;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return stringValue;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatTimeLabel(timeValue) {
  if (!timeValue) {
    return "—";
  }

  return String(timeValue).slice(0, 5);
}

function formatStatusLabel(status) {
  const labels = {
    active: "Active",
    inactive: "Inactive",
    archived: "Archived",
    draft: "Draft",
    open: "Open",
    closed: "Closed",
    cancelled: "Cancelled",
  };

  return labels[status] || status || "—";
}

function buildTrainingStatusBadge(status) {
  const toneClassMap = {
    active: "roomStatusPositive",
    open: "roomStatusPositive",
    draft: "roomStatusNeutral",
    inactive: "trainingStatusMuted",
    closed: "trainingStatusMuted",
    archived: "roomStatusDanger",
    cancelled: "roomStatusDanger",
  };

  return (
    <span className={`roomStatusBadge ${toneClassMap[status] || "roomStatusNeutral"}`}>
      {formatStatusLabel(status)}
    </span>
  );
}

function buildScopeBadge(readOnly = false) {
  return (
    <span className={`roomStatusBadge ${readOnly ? "trainingStatusMuted" : "roomStatusPositive"}`}>
      {readOnly ? "Read-only" : "API CRUD"}
    </span>
  );
}

function getTabItem(tabKey) {
  return trainingTabItems.find((tabItem) => tabItem.key === tabKey) || trainingTabItems[0];
}

function getStatusValue(tabKey, item) {
  switch (tabKey) {
    case "semesters":
    case "slots":
      return item.is_active ? "active" : "inactive";
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

function buildSearchTarget(tabKey, item) {
  switch (tabKey) {
    case "semesters":
      return [item.semester_code, item.academic_year, item.semester_name].join(" ");
    case "weeks":
      return [item.week_no, item.semester_code, item.semester_name].join(" ");
    case "slots":
      return [item.slot_code, item.slot_label, item.start_time, item.end_time].join(" ");
    case "courses":
      return [item.course_code, item.course_name, item.description].join(" ");
    case "sections":
      return [
        item.section_code,
        item.course_code,
        item.course_name,
        item.semester_name,
        item.lecturer_name,
      ].join(" ");
    case "cohorts":
      return [item.cohort_code, item.faculty_name, item.major_name, item.intake_year].join(" ");
    case "lecturers":
      return [
        item.course_section_code,
        item.course_section_label,
        item.lecturer_name,
        item.lecturer_role,
      ].join(" ");
    default:
      return "";
  }
}

function buildRows(tabKey, items, onEdit) {
  const action = (item, readOnly = false) => (
    readOnly ? buildScopeBadge(true) : (
      <ButtonUI size="sm" tone="secondary" onClick={() => onEdit(item)}>
        Sửa
      </ButtonUI>
    )
  );

  switch (tabKey) {
    case "semesters":
      return items.map((item) => ({
        id: item.id,
        semester_code: item.semester_code,
        academic_year: item.academic_year,
        semester_name: item.semester_name,
        start_date: formatDateLabel(item.start_date),
        end_date: formatDateLabel(item.end_date),
        status: buildTrainingStatusBadge(getStatusValue(tabKey, item)),
        action: action(item),
      }));
    case "weeks":
      return items.map((item) => ({
        id: item.id,
        week_no: `Tuần ${item.week_no}`,
        semester_name: item.semester_name,
        start_date: formatDateLabel(item.start_date),
        end_date: formatDateLabel(item.end_date),
        action: action(item),
      }));
    case "slots":
      return items.map((item) => ({
        id: item.id,
        slot_code: item.slot_code,
        slot_label: item.slot_label,
        period_range: `${item.start_period}-${item.end_period}`,
        time_range: `${formatTimeLabel(item.start_time)} - ${formatTimeLabel(item.end_time)}`,
        status: buildTrainingStatusBadge(getStatusValue(tabKey, item)),
        action: action(item),
      }));
    case "courses":
      return items.map((item) => ({
        id: item.id,
        course_code: item.course_code,
        course_name: item.course_name,
        credits: item.credits,
        lecture_periods: item.lecture_periods,
        lab_periods: item.lab_periods,
        status: buildTrainingStatusBadge(item.course_status),
        action: action(item),
      }));
    case "sections":
      return items.map((item) => ({
        id: item.id,
        section_code: item.section_code,
        course_name: item.course_name,
        semester_name: item.semester_name,
        group_no: item.group_no,
        planned_enrollment: item.planned_enrollment || "—",
        registered_enrollment: item.registered_enrollment,
        status: buildTrainingStatusBadge(item.section_status),
        action: action(item),
      }));
    case "cohorts":
      return items.map((item) => ({
        id: item.id,
        cohort_code: item.cohort_code,
        faculty_name: item.faculty_name || "—",
        major_name: item.major_name || "—",
        intake_year: item.intake_year || "—",
        status: buildTrainingStatusBadge(item.cohort_status),
        action: action(item),
      }));
    case "lecturers":
      return items.map((item) => ({
        id: item.id,
        course_section_label: item.course_section_label,
        lecturer_name: item.lecturer_name,
        lecturer_role: item.lecturer_role,
        assigned_at: formatDateLabel(item.assigned_at),
        action: action(item, true),
      }));
    default:
      return [];
  }
}

function getDefaultForm(tabKey, trainingData) {
  const defaults = {
    semesters: { is_active: true },
    weeks: { semester_id: trainingData.semesters?.[0]?.id || "" },
    slots: { is_active: true },
    courses: { credits: "0", lecture_periods: "0", lab_periods: "0", course_status: "active" },
    sections: {
      course_id: trainingData.courses?.[0]?.id || "",
      semester_id: trainingData.semesters?.[0]?.id || "",
      registered_enrollment: "0",
      planned_enrollment: "",
      section_status: "open",
    },
    cohorts: { cohort_status: "active" },
  };

  return masterFormConfigMap[tabKey].reduce((form, field) => ({
    ...form,
    [field.name]: defaults[tabKey]?.[field.name] ?? (field.type === "checkbox" ? false : ""),
  }), {});
}

function MasterDataDialog({
  activeTab,
  item,
  form,
  trainingData,
  error,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!form) return null;

  function renderInput(field) {
    if (field.type === "checkbox") {
      return (
        <input
          type="checkbox"
          name={field.name}
          checked={Boolean(form[field.name])}
          onChange={(event) => onChange(field.name, event.target.checked)}
        />
      );
    }

    if (field.type === "semester" || field.type === "course") {
      const options = field.type === "semester" ? trainingData.semesters || [] : trainingData.courses || [];
      return (
        <select className="select" name={field.name} value={form[field.name]} onChange={(event) => onChange(field.name, event.target.value)} required={field.required}>
          <option value="">Chọn dữ liệu</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {field.type === "semester" ? option.semester_name : `${option.course_code} - ${option.course_name}`}
            </option>
          ))}
        </select>
      );
    }

    if (selectOptionMap[field.type]) {
      return (
        <select className="select" name={field.name} value={form[field.name]} onChange={(event) => onChange(field.name, event.target.value)}>
          {selectOptionMap[field.type].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      );
    }

    return (
      <input
        className="input"
        name={field.name}
        type={field.type || "text"}
        value={form[field.name]}
        onChange={(event) => onChange(field.name, event.target.value)}
        required={field.required}
      />
    );
  }

  return (
    <div className="modalOverlay" role="presentation">
      <section className="modalPanel masterDataDialog" role="dialog" aria-modal="true" aria-labelledby="master-dialog-title">
        <div className="modalHeader">
          <div>
            <p className="modalEyebrow">QTV / Dữ liệu đào tạo</p>
            <h3 id="master-dialog-title" className="modalTitle">
              {item ? "Cập nhật dữ liệu" : "Tạo dữ liệu"}
            </h3>
          </div>
          <button type="button" className="modalCloseButton" onClick={onClose} disabled={isSaving} aria-label="Đóng">x</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modalBody masterDataGrid">
            {error ? <p className="academicAlert academicAlert--error">{error}</p> : null}
            {masterFormConfigMap[activeTab].map((field) => (
              <label key={field.name} className="label">
                {field.label}
                {renderInput(field)}
              </label>
            ))}
          </div>
          <div className="modalActions">
            <ButtonUI tone="secondary" onClick={onClose} disabled={isSaving}>Hủy</ButtonUI>
            <ButtonUI type="submit" disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu dữ liệu"}</ButtonUI>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function TrainingDataPage({ showQuickDeclaration = false } = {}) {
  const [activeTab, setActiveTab] = useState("semesters");
  const [trainingData, setTrainingData] = useState({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [masterForm, setMasterForm] = useState(null);
  const [dialogError, setDialogError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadTrainingData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const responses = await Promise.all(
        trainingTabItems.map((tabItem) => listMasterData(tabItem.resource)),
      );

      const nextData = {};
      responses.forEach((response, index) => {
        nextData[trainingTabItems[index].key] = Array.isArray(response?.data)
          ? response.data
          : [];
      });

      setTrainingData(nextData);
    } catch (error) {
      setErrorMessage(error.message || "Không thể tải dữ liệu đào tạo từ API.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTrainingData();
  }, []);

  const currentItems = useMemo(() => {
    const baseItems = Array.isArray(trainingData[activeTab])
      ? trainingData[activeTab]
      : [];
    const normalizedKeyword = normalizeText(searchKeyword);

    return baseItems.filter((item) => {
      const matchedKeyword =
        !normalizedKeyword ||
        normalizeText(buildSearchTarget(activeTab, item)).includes(normalizedKeyword);
      const matchedStatus =
        statusFilter === "all" || getStatusValue(activeTab, item) === statusFilter;

      return matchedKeyword && matchedStatus;
    });
  }, [activeTab, searchKeyword, statusFilter, trainingData]);

  const trainingStats = useMemo(() => {
    const sections = trainingData.sections || [];
    const openSections = sections.filter((item) => item.section_status === "open").length;

    return [
      {
        iconName: "semester",
        title: "Học kỳ",
        value: (trainingData.semesters || []).length,
      },
      {
        iconName: "week",
        title: "Tuần học",
        value: (trainingData.weeks || []).length,
      },
      {
        iconName: "slot",
        title: "Ca học",
        value: (trainingData.slots || []).length,
      },
      {
        iconName: "course",
        title: "Học phần",
        value: (trainingData.courses || []).length,
      },
      {
        iconName: "section",
        title: "Lớp học phần",
        value: sections.length,
      },
      {
        iconName: "overview",
        title: "Lớp đang mở",
        value: openSections,
      },
    ];
  }, [trainingData]);

  const currentRows = buildRows(activeTab, currentItems, openEditDialog);

  const currentColumns = trainingColumnMap[activeTab] || [];
  const currentStatusOptions = statusOptionMap[activeTab] || statusOptionMap.semesters;
  const currentSearchPlaceholder =
    searchPlaceholderMap[activeTab] || "Tìm kiếm dữ liệu đào tạo...";
  const currentTableTitle = tableTitleMap[activeTab] || "Danh sách dữ liệu đào tạo";

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setSearchKeyword("");
    setStatusFilter("all");
  }

  function closeDialog() {
    if (isSaving) return;
    setSelectedItem(null);
    setMasterForm(null);
    setDialogError("");
  }

  function openCreateDialog() {
    setSelectedItem(null);
    setMasterForm(getDefaultForm(activeTab, trainingData));
    setDialogError("");
  }

  function openEditDialog(item) {
    const form = getDefaultForm(activeTab, trainingData);
    masterFormConfigMap[activeTab].forEach((field) => {
      const value = item[field.name];
      form[field.name] = field.type === "checkbox" ? Boolean(value) : value ?? "";
    });
    setSelectedItem(item);
    setMasterForm(form);
    setDialogError("");
  }

  function updateMasterForm(field, value) {
    setMasterForm((current) => ({ ...current, [field]: value }));
  }

  async function saveMasterData(event) {
    event.preventDefault();
    const resource = getTabItem(activeTab).resource;
    const payload = {};

    masterFormConfigMap[activeTab].forEach((field) => {
      const value = masterForm[field.name];

      if (field.type === "checkbox") payload[field.name] = Boolean(value);
      else if (value !== "") payload[field.name] = field.type === "number" || ["semester", "course"].includes(field.type) ? Number(value) : value;
      else if (field.nullable) payload[field.name] = null;
    });

    try {
      setIsSaving(true);
      setDialogError("");
      if (selectedItem) await updateMasterData(resource, selectedItem.id, payload);
      else await createMasterData(resource, payload);
      setSelectedItem(null);
      setMasterForm(null);
      await loadTrainingData();
    } catch (error) {
      setDialogError(error.message || "Không thể lưu dữ liệu đào tạo.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleRefresh() {
    setSearchKeyword("");
    setStatusFilter("all");
    loadTrainingData();
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
            message="API master data đã đọc dữ liệu thật; Excel import vẫn nằm ngoài phạm vi #48."
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
                fileLabel="File excel"
                buttonLabel="Tải"
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
                onClick={() => setSearchKeyword(searchKeyword.trim())}
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
              {activeTab === "lecturers" ? (
                <p className="roomSectionText">
                  {getTabItem(activeTab).label} là read-only trong phạm vi #48.
                </p>
              ) : null}
            </div>

            <div className="roomFilterControls">
              {activeTab !== "lecturers" ? (
                <ButtonUI onClick={openCreateDialog}>Tạo dữ liệu</ButtonUI>
              ) : null}
              <ButtonUI
                tone="secondary"
                shape="rounded"
                className="roomRefreshButton"
                onClick={handleRefresh}
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
            <DataTable
              columns={currentColumns}
              rows={currentRows}
              loading={isLoading}
              error={errorMessage}
              emptyTitle="Chưa có dữ liệu phù hợp"
              emptyDescription="Không tìm thấy bản ghi đào tạo phù hợp với từ khóa hoặc trạng thái hiện tại."
            />
          </div>
        </div>
      </section>
      <MasterDataDialog
        activeTab={activeTab}
        item={selectedItem}
        form={masterForm}
        trainingData={trainingData}
        error={dialogError}
        isSaving={isSaving}
        onChange={updateMasterForm}
        onClose={closeDialog}
        onSubmit={saveMasterData}
      />
    </div>
  );
}
