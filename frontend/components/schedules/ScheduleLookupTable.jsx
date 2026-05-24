"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../common/DataTable.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import { ButtonUI, RefreshButton } from "../common/buttonUI.jsx";
import { listSchedules } from "../../services/scheduleService";
import { getUser } from "../../lib/authStorage";

const INITIAL_FILTERS = {
  status: "all",
  week_no: "",
  room_code: "",
  course_section_id: "",
  lecturer_user_id: "",
  keyword: "",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "draft", label: "Nháp" },
  { value: "approved", label: "Đã duyệt" },
  { value: "published", label: "Đã công bố" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "completed", label: "Hoàn thành" },
];

const BACKEND_SUPPORTED_FILTERS = new Set([
  "status",
  "room_code",
  "lecturer_user_id",
  "schedule_request_id",
  "student_user_id",
]);

const PRIORITY_FIELD_ORDER = [
  "id",
  "schedule_id",
  "lab_schedule_request_id",
  "available_slot_id",
  "course_section_id",
  "course_code",
  "course_name",
  "section_code",
  "course_section_code",
  "group_no",
  "practice_team_id",
  "practice_team_code",
  "practice_team_name",
  "lecturer_user_id",
  "lecturer_name",
  "lecturer_full_name",
  "room_id",
  "room_code",
  "room_name",
  "day_of_week",
  "time_slot_id",
  "slot_label",
  "time_slot",
  "time_slot_label",
  "start_period",
  "end_period",
  "start_date",
  "end_date",
  "week_no",
  "week",
  "entry_status",
  "status",
  "created_by_user_id",
  "approved_by_user_id",
  "published_by_user_id",
  "cancelled_by_user_id",
  "approved_at",
  "published_at",
  "cancelled_at",
  "cancellation_reason",
  "notes",
  "created_at",
  "updated_at",
];

const FIELD_LABEL_MAP = {
  id: "ID",
  schedule_id: "Mã lịch",
  lab_schedule_request_id: "Mã yêu cầu",
  available_slot_id: "Khung giờ khả dụng",
  course_section_id: "ID lớp học phần",
  course_code: "Mã học phần",
  course_name: "Tên học phần",
  section_code: "Mã lớp học phần",
  course_section_code: "Mã lớp học phần",
  group_no: "Nhóm",
  practice_team_id: "ID tổ TH",
  practice_team_code: "Mã tổ TH",
  practice_team_name: "Tên tổ TH",
  lecturer_user_id: "ID giảng viên",
  lecturer_name: "Giảng viên",
  lecturer_full_name: "Giảng viên",
  room_id: "ID phòng",
  room_code: "Phòng",
  room_name: "Tên phòng",
  day_of_week: "Thứ",
  time_slot_id: "ID ca",
  slot_label: "Ca học",
  time_slot: "Ca học",
  time_slot_label: "Ca học",
  start_period: "Tiết bắt đầu",
  end_period: "Tiết kết thúc",
  start_date: "Ngày bắt đầu",
  end_date: "Ngày kết thúc",
  week_no: "Tuần",
  week: "Tuần",
  entry_status: "Trạng thái",
  status: "Trạng thái",
  created_by_user_id: "Người tạo",
  approved_by_user_id: "Người duyệt",
  published_by_user_id: "Người công bố",
  cancelled_by_user_id: "Người hủy",
  approved_at: "Thời điểm duyệt",
  published_at: "Thời điểm công bố",
  cancelled_at: "Thời điểm hủy",
  cancellation_reason: "Lý do hủy",
  notes: "Ghi chú",
  created_at: "Ngày tạo",
  updated_at: "Ngày cập nhật",
};

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeComparableValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatDayOfWeek(value) {
  const dayMap = {
    1: "Chủ nhật",
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
  };

  return dayMap[value] || value || "—";
}

function getFieldLabel(fieldName) {
  return FIELD_LABEL_MAP[fieldName] || fieldName;
}

function extractScheduleItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.schedules)) {
    return data.schedules;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function buildApiFilters(filters, fixedParams = {}) {
  const apiFilters = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (!BACKEND_SUPPORTED_FILTERS.has(key)) {
      return;
    }

    if (hasValue(value) && value !== "all") {
      apiFilters[key] = String(value).trim();
    }
  });

  Object.entries(fixedParams).forEach(([key, value]) => {
    if (BACKEND_SUPPORTED_FILTERS.has(key) && hasValue(value)) {
      apiFilters[key] = String(value).trim();
    }
  });

  return apiFilters;
}

function buildResolvedFixedParams(fixedParams, currentUserIdParamName) {
  const resolvedFixedParams = { ...fixedParams };

  if (!currentUserIdParamName) {
    return resolvedFixedParams;
  }

  const currentUser = getUser();

  if (currentUser?.id) {
    resolvedFixedParams[currentUserIdParamName] = currentUser.id;
  }

  return resolvedFixedParams;
}

function getAllRowFields(rows) {
  const fieldSet = new Set();

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      fieldSet.add(key);
    });
  });

  const priorityFields = PRIORITY_FIELD_ORDER.filter((fieldName) =>
    fieldSet.has(fieldName),
  );

  const remainingFields = [...fieldSet]
    .filter((fieldName) => !PRIORITY_FIELD_ORDER.includes(fieldName))
    .sort();

  return [...priorityFields, ...remainingFields];
}

function shouldRenderStatusBadge(fieldName) {
  return ["entry_status", "status", "request_status"].includes(fieldName);
}

function shouldFormatDateTime(fieldName) {
  return (
    fieldName.endsWith("_at") ||
    fieldName === "createdAt" ||
    fieldName === "updatedAt"
  );
}

function shouldFormatDate(fieldName) {
  return (
    fieldName.endsWith("_date") ||
    fieldName === "startDate" ||
    fieldName === "endDate"
  );
}

function formatCellValue(fieldName, value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (fieldName === "day_of_week") {
    return formatDayOfWeek(value);
  }

  if (shouldRenderStatusBadge(fieldName)) {
    return <StatusBadge value={value} />;
  }

  if (shouldFormatDateTime(fieldName)) {
    return formatDateTime(value);
  }

  if (shouldFormatDate(fieldName)) {
    return formatDate(value);
  }

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  if (Array.isArray(value) || typeof value === "object") {
    return (
      <code style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(value)}</code>
    );
  }

  return value;
}

function buildDynamicColumns(rows) {
  return getAllRowFields(rows).map((fieldName) => ({
    key: fieldName,
    label: getFieldLabel(fieldName),
    render: (value) => formatCellValue(fieldName, value),
  }));
}

function filterRowsByKeyword(rows, keyword) {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) {
    return rows;
  }

  return rows.filter((row) => {
    const searchableText = normalizeText(Object.values(row || {}).join(" "));
    return searchableText.includes(normalizedKeyword);
  });
}

function filterRowsByRequiredStatus(rows, requiredStatus) {
  if (!requiredStatus) {
    return rows;
  }

  const normalizedRequiredStatus = String(requiredStatus).trim().toLowerCase();

  return rows.filter((row) => {
    const rowStatus = String(row?.entry_status || row?.status || "")
      .trim()
      .toLowerCase();

    return rowStatus === normalizedRequiredStatus;
  });
}

function matchesFilterValue(rowValue, filterValue) {
  if (!hasValue(filterValue) || filterValue === "all") {
    return true;
  }

  return (
    normalizeComparableValue(rowValue) === normalizeComparableValue(filterValue)
  );
}

function filterRowsByAppliedFilters(rows, filters) {
  return rows.filter((row) => {
    const rowStatus = row?.entry_status || row?.status;
    const rowWeek = row?.week_no || row?.week;
    const rowCourseSectionId =
      row?.course_section_id || row?.section_id || row?.courseSectionId;
    const rowLecturerUserId =
      row?.lecturer_user_id || row?.lecturer_id || row?.lecturerUserId;

    return (
      matchesFilterValue(rowStatus, filters.status) &&
      matchesFilterValue(rowWeek, filters.week_no) &&
      matchesFilterValue(row?.room_code, filters.room_code) &&
      matchesFilterValue(rowCourseSectionId, filters.course_section_id) &&
      matchesFilterValue(rowLecturerUserId, filters.lecturer_user_id)
    );
  });
}

export default function ScheduleLookupTable({
  title,
  description,
  fixedParams = {},
  currentUserIdParamName = "",
  clientSideRequiredStatus = "",
  showStatusFilter = true,
  showWeekFilter = true,
  showRoomFilter = true,
  showCourseSectionFilter = true,
  showLecturerFilter = true,
  showKeywordFilter = true,
  emptyTitle = "Chưa có lịch thực hành",
  emptyDescription = "Chưa có lịch thực hành phù hợp với bộ lọc hiện tại.",
}) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const visibleRows = useMemo(() => {
    const statusSafeRows = filterRowsByRequiredStatus(
      scheduleRows,
      clientSideRequiredStatus,
    );

    const filterSafeRows = filterRowsByAppliedFilters(
      statusSafeRows,
      appliedFilters,
    );

    return filterRowsByKeyword(filterSafeRows, appliedFilters.keyword);
  }, [scheduleRows, appliedFilters, clientSideRequiredStatus]);

  const dynamicColumns = useMemo(
    () => buildDynamicColumns(visibleRows),
    [visibleRows],
  );

  async function loadScheduleData(activeFilters = appliedFilters) {
    const resolvedFixedParams = buildResolvedFixedParams(
      fixedParams,
      currentUserIdParamName,
    );
    const apiFilters = buildApiFilters(activeFilters, resolvedFixedParams);

    try {
      setIsLoading(true);
      setLoadError(null);

      const response = await listSchedules(apiFilters);
      const items = extractScheduleItems(response);

      setScheduleRows(items);
    } catch (error) {
      setScheduleRows([]);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadScheduleData(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, JSON.stringify(fixedParams), currentUserIdParamName]);

  function updateFilter(fieldName, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [fieldName]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setAppliedFilters(filters);
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
  }

  return (
    <div className="adminPageStack">
      <section className="card">
        <div className="roomFilterBar">
          <div className="roomFilterSummary">
            <h1 className="roomSectionTitle">{title}</h1>
            {description ? (
              <p className="roomSectionText">{description}</p>
            ) : null}
          </div>

          <RefreshButton
            onClick={() => loadScheduleData(appliedFilters)}
            disabled={isLoading}
          >
            Đồng bộ lịch
          </RefreshButton>
        </div>

        <form onSubmit={handleSubmit} className="commonFilterGrid">
          {showStatusFilter ? (
            <label className="commonField">
              <span className="commonFieldLabel">Trạng thái</span>
              <select
                className="commonControl"
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showWeekFilter ? (
            <label className="commonField">
              <span className="commonFieldLabel">Tuần</span>
              <input
                className="commonControl"
                value={filters.week_no}
                onChange={(event) =>
                  updateFilter("week_no", event.target.value)
                }
                placeholder="VD: 38"
              />
            </label>
          ) : null}

          {showRoomFilter ? (
            <label className="commonField">
              <span className="commonFieldLabel">Phòng</span>
              <input
                className="commonControl"
                value={filters.room_code}
                onChange={(event) =>
                  updateFilter("room_code", event.target.value)
                }
                placeholder="VD: 2B11"
              />
            </label>
          ) : null}

          {showCourseSectionFilter ? (
            <label className="commonField">
              <span className="commonFieldLabel">Lớp học phần</span>
              <input
                className="commonControl"
                value={filters.course_section_id}
                onChange={(event) =>
                  updateFilter("course_section_id", event.target.value)
                }
                placeholder="VD: 6"
              />
            </label>
          ) : null}

          {showLecturerFilter ? (
            <label className="commonField">
              <span className="commonFieldLabel">Giảng viên</span>
              <input
                className="commonControl"
                value={filters.lecturer_user_id}
                onChange={(event) =>
                  updateFilter("lecturer_user_id", event.target.value)
                }
                placeholder="VD: 8"
              />
            </label>
          ) : null}

          {showKeywordFilter ? (
            <label className="commonField">
              <span className="commonFieldLabel">Từ khóa</span>
              <input
                className="commonControl"
                value={filters.keyword}
                onChange={(event) =>
                  updateFilter("keyword", event.target.value)
                }
                placeholder="Lọc trên dữ liệu đã tải: học phần, giảng viên, phòng..."
              />
            </label>
          ) : null}

          <div className="commonFilterActions">
            <ButtonUI type="submit">Áp dụng lọc</ButtonUI>
            <ButtonUI tone="secondary" type="button" onClick={handleReset}>
              Xóa lọc
            </ButtonUI>
          </div>
        </form>
      </section>

      <section className="card">
        <DataTable
          loading={isLoading}
          error={loadError}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          columns={dynamicColumns}
          rows={visibleRows}
        />
      </section>
    </div>
  );
}
