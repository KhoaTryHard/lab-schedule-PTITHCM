"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../common/DataTable.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import { ButtonUI } from "../common/buttonUI.jsx";
import {
  approveSchedule,
  listPublishedSchedules,
  listSchedules,
  publishSchedule,
} from "../../services/scheduleService";
import { getUser } from "../../lib/authStorage";

const INITIAL_FILTERS = {
  status: "all",
  week_no: "",
  room_code: "",
  course_section_id: "",
  lecturer_user_id: "",
  schedule_request_id: "",
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

const GENERAL_SCHEDULE_FILTERS = new Set([
  "status",
  "room_code",
  "lecturer_user_id",
  "schedule_request_id",
  "student_user_id",
]);

const PUBLISHED_SCHEDULE_FILTERS = new Set([
  "schedule_request_id",
  "room_code",
  "lecturer_user_id",
]);

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

function getApiErrorMessage(error, fallbackMessage) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return error.details
      .map((item) => item?.msg || item?.message || item?.error || item)
      .join(", ");
  }

  if (error?.details && typeof error.details === "object") {
    return Object.values(error.details)
      .filter(Boolean)
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.msg || item?.message || item?.error || JSON.stringify(item),
      )
      .join(", ");
  }

  return error?.message || fallbackMessage;
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

function buildApiFilters(
  filters,
  fixedParams = {},
  usePublishedEndpoint = false,
) {
  const apiFilters = {};
  const allowedFilterSet = usePublishedEndpoint
    ? PUBLISHED_SCHEDULE_FILTERS
    : GENERAL_SCHEDULE_FILTERS;

  Object.entries(filters).forEach(([key, value]) => {
    if (!allowedFilterSet.has(key)) {
      return;
    }

    if (hasValue(value) && value !== "all") {
      apiFilters[key] = String(value).trim();
    }
  });

  Object.entries(fixedParams).forEach(([key, value]) => {
    if (!allowedFilterSet.has(key)) {
      return;
    }

    if (hasValue(value) && value !== "all") {
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
    const rowScheduleRequestId =
      row?.lab_schedule_request_id || row?.schedule_request_id;

    return (
      matchesFilterValue(rowStatus, filters.status) &&
      matchesFilterValue(rowWeek, filters.week_no) &&
      matchesFilterValue(row?.room_code, filters.room_code) &&
      matchesFilterValue(rowCourseSectionId, filters.course_section_id) &&
      matchesFilterValue(rowLecturerUserId, filters.lecturer_user_id) &&
      matchesFilterValue(rowScheduleRequestId, filters.schedule_request_id)
    );
  });
}

function SmallCell({ children, strong = false }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        lineHeight: 1.45,
        fontWeight: strong ? 800 : 600,
        color: strong ? "#0f172a" : "#334155",
        minWidth: 0,
      }}
    >
      {children ?? "—"}
    </span>
  );
}

function getValue(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") {
      return row[key];
    }
  }

  return "—";
}

function buildScheduleRows(rows) {
  return rows.map((row, index) => {
    const status = row?.entry_status || row?.status || "—";

    return {
      rowKey:
        row?.id || `${row?.lab_schedule_request_id || "schedule"}-${index}`,
      id: row?.id,
      raw_status: status,
      lab_schedule_request_id: getValue(
        row,
        "lab_schedule_request_id",
        "schedule_request_id",
      ),
      course_code: getValue(row, "course_code"),
      course_name: getValue(row, "course_name"),
      group_no: getValue(row, "group_no"),
      practice_team: getValue(
        row,
        "practice_team_name",
        "practice_team_code",
        "team_no",
      ),
      lecturer: getValue(
        row,
        "lecturer_name",
        "lecturer_full_name",
        "lecturer_user_id",
      ),
      room_code: getValue(row, "room_code"),
      day_of_week: row?.day_of_week,
      time_slot: getValue(row, "time_slot", "time_slot_label", "slot_label"),
      start_date: row?.start_date,
      end_date: row?.end_date,
      status,
      approved_by: getValue(row, "approved_by_name", "approved_by_user_id"),
      published_by: getValue(row, "published_by_name", "published_by_user_id"),
      approved_at: row?.approved_at,
      published_at: row?.published_at,
      notes: getValue(row, "notes"),
      created_at: row?.created_at,
      updated_at: row?.updated_at,
      planned_size: getValue(row, "planned_size"),
      team_no: getValue(row, "team_no"),
      raw: row,
    };
  });
}

function buildScheduleColumns({
  enableWorkflowActions,
  mutatingKey,
  onApprove,
  onPublish,
}) {
  const columns = [
    {
      key: "lab_schedule_request_id",
      label: "Mã yêu cầu",
      render: (value) => <SmallCell strong>{value}</SmallCell>,
    },
    {
      key: "course_code",
      label: "Mã học phần",
      render: (value) => <SmallCell strong>{value}</SmallCell>,
    },
    {
      key: "course_name",
      label: "Tên học phần",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
    {
      key: "group_no",
      label: "Nhóm",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
    {
      key: "practice_team",
      label: "Tổ",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
    {
      key: "lecturer",
      label: "Giảng viên",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
    {
      key: "room_code",
      label: "Phòng",
      render: (value) => <SmallCell strong>{value}</SmallCell>,
    },
    {
      key: "day_of_week",
      label: "Thứ",
      render: (value) => <SmallCell>{formatDayOfWeek(value)}</SmallCell>,
    },
    {
      key: "time_slot",
      label: "Ca học",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
    {
      key: "start_date",
      label: "Ngày bắt đầu",
      render: (value) => <SmallCell>{formatDate(value)}</SmallCell>,
    },
    {
      key: "end_date",
      label: "Ngày kết thúc",
      render: (value) => <SmallCell>{formatDate(value)}</SmallCell>,
    },
    {
      key: "status",
      label: "Trạng thái",
      render: (value) => <StatusBadge value={value} />,
    },
    {
      key: "approved_by",
      label: "Người duyệt",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
    {
      key: "published_by",
      label: "Người công bố",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
    {
      key: "approved_at",
      label: "Thời điểm duyệt",
      render: (value) => <SmallCell>{formatDateTime(value)}</SmallCell>,
    },
    {
      key: "published_at",
      label: "Thời điểm công bố",
      render: (value) => <SmallCell>{formatDateTime(value)}</SmallCell>,
    },
    {
      key: "notes",
      label: "Ghi chú",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
    {
      key: "created_at",
      label: "Ngày tạo",
      render: (value) => <SmallCell>{formatDateTime(value)}</SmallCell>,
    },
    {
      key: "updated_at",
      label: "Ngày cập nhật",
      render: (value) => <SmallCell>{formatDateTime(value)}</SmallCell>,
    },
    {
      key: "planned_size",
      label: "Sĩ số tổ",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
    {
      key: "team_no",
      label: "Tổ TH",
      render: (value) => <SmallCell>{value}</SmallCell>,
    },
  ];

  if (!enableWorkflowActions) {
    return columns;
  }

  return [
    ...columns,
    {
      key: "workflow_actions",
      label: "Thao tác",
      render: (_, row) => {
        const status = String(row.raw_status || "").toLowerCase();

        if (!row.id) {
          return <SmallCell>—</SmallCell>;
        }

        if (status === "draft") {
          return (
            <ButtonUI
              tone="primary"
              shape="rounded"
              size="sm"
              disabled={Boolean(mutatingKey)}
              onClick={() => onApprove(row)}
            >
              {mutatingKey === `${row.id}:approve` ? "Đang duyệt..." : "Duyệt"}
            </ButtonUI>
          );
        }

        if (status === "approved") {
          return (
            <ButtonUI
              tone="primary"
              shape="rounded"
              size="sm"
              disabled={Boolean(mutatingKey)}
              onClick={() => onPublish(row)}
            >
              {mutatingKey === `${row.id}:publish`
                ? "Đang công bố..."
                : "Công bố"}
            </ButtonUI>
          );
        }

        return <SmallCell>—</SmallCell>;
      },
    },
  ];
}

export default function ScheduleLookupTable({
  title,
  description,
  fixedParams = {},
  currentUserIdParamName = "",
  clientSideRequiredStatus = "",
  usePublishedEndpoint = false,
  enableWorkflowActions = false,
  showStatusFilter = true,
  showWeekFilter = true,
  showRoomFilter = true,
  showCourseSectionFilter = true,
  showLecturerFilter = true,
  showScheduleRequestFilter = false,
  showKeywordFilter = true,
  emptyTitle = "Chưa có lịch thực hành",
  emptyDescription = "Chưa có lịch thực hành phù hợp với bộ lọc hiện tại.",
}) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [mutatingKey, setMutatingKey] = useState("");

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

  const tableRows = useMemo(
    () => buildScheduleRows(visibleRows),
    [visibleRows],
  );

  const columns = useMemo(
    () =>
      buildScheduleColumns({
        enableWorkflowActions,
        mutatingKey,
        onApprove: handleApproveSchedule,
        onPublish: handlePublishSchedule,
      }),
    [enableWorkflowActions, mutatingKey],
  );

  async function loadScheduleData(activeFilters = appliedFilters) {
    const resolvedFixedParams = buildResolvedFixedParams(
      fixedParams,
      currentUserIdParamName,
    );

    const apiFilters = buildApiFilters(
      activeFilters,
      resolvedFixedParams,
      usePublishedEndpoint,
    );

    try {
      setIsLoading(true);
      setLoadError(null);

      const request = usePublishedEndpoint
        ? listPublishedSchedules(apiFilters)
        : listSchedules(apiFilters);

      const response = await request;
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
  }, [
    appliedFilters,
    JSON.stringify(fixedParams),
    currentUserIdParamName,
    usePublishedEndpoint,
  ]);

  function updateFilter(fieldName, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [fieldName]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setActionMessage(null);
    setAppliedFilters(filters);
  }

  function handleReset() {
    setActionMessage(null);
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
  }

  async function handleApproveSchedule(row) {
    if (!row?.id || mutatingKey) {
      return;
    }

    try {
      setMutatingKey(`${row.id}:approve`);
      setActionMessage(null);

      await approveSchedule(row.id);

      setActionMessage({
        type: "success",
        text: `Đã duyệt lịch #${row.id}.`,
      });

      await loadScheduleData(appliedFilters);
    } catch (error) {
      setActionMessage({
        type: "error",
        text: getApiErrorMessage(error, "Không thể duyệt lịch."),
      });
    } finally {
      setMutatingKey("");
    }
  }

  async function handlePublishSchedule(row) {
    if (!row?.id || mutatingKey) {
      return;
    }

    try {
      setMutatingKey(`${row.id}:publish`);
      setActionMessage(null);

      await publishSchedule(row.id);

      setActionMessage({
        type: "success",
        text: `Đã công bố lịch #${row.id}.`,
      });

      await loadScheduleData(appliedFilters);
    } catch (error) {
      setActionMessage({
        type: "error",
        text: getApiErrorMessage(error, "Không thể công bố lịch."),
      });
    } finally {
      setMutatingKey("");
    }
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

          <ButtonUI
            tone="primary"
            shape="rounded"
            onClick={() => loadScheduleData(appliedFilters)}
            disabled={isLoading || Boolean(mutatingKey)}
          >
            Đồng bộ lịch
          </ButtonUI>
        </div>

        <form onSubmit={handleSubmit} className="commonFilterGrid">
          {showStatusFilter && !usePublishedEndpoint ? (
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
                placeholder="Lọc hiển thị theo tuần"
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

          {showScheduleRequestFilter ? (
            <label className="commonField">
              <span className="commonFieldLabel">Mã yêu cầu</span>
              <input
                className="commonControl"
                value={filters.schedule_request_id}
                onChange={(event) =>
                  updateFilter("schedule_request_id", event.target.value)
                }
                placeholder="VD: 6"
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
                placeholder="Lọc hiển thị theo lớp học phần"
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
                placeholder="Lọc theo học phần, giảng viên, phòng..."
              />
            </label>
          ) : null}

          <div className="commonFilterActions">
            <ButtonUI type="submit" tone="primary" shape="rounded">
              Áp dụng lọc
            </ButtonUI>
            <ButtonUI
              tone="primary"
              shape="rounded"
              type="button"
              onClick={handleReset}
            >
              Xóa lọc
            </ButtonUI>
          </div>
        </form>
      </section>

      {actionMessage ? (
        <section
          className="commonStateBox"
          role={actionMessage.type === "error" ? "alert" : "status"}
          style={{
            borderColor:
              actionMessage.type === "error"
                ? "rgba(185, 28, 28, 0.24)"
                : "rgba(22, 163, 74, 0.24)",
            background: actionMessage.type === "error" ? "#fff7f7" : "#f0fdf4",
          }}
        >
          <h3
            className="commonStateTitle"
            style={{
              color: actionMessage.type === "error" ? "#8b0000" : "#166534",
            }}
          >
            {actionMessage.type === "error" ? "Có lỗi" : "Thành công"}
          </h3>
          <p className="commonStateText">{actionMessage.text}</p>
        </section>
      ) : null}

      <section className="card">
        <DataTable
          loading={isLoading}
          error={loadError}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          columns={columns}
          rows={tableRows}
          rowKey="rowKey"
          pageSize={10}
        />
      </section>
    </div>
  );
}
