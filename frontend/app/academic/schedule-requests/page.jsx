"use client";

import { useEffect, useMemo, useState } from "react";

import { CardUI } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import FilterSearchToolbar from "../../../components/common/FilterSearchToolbar.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import {
  ButtonUI,
  RefreshButton,
} from "../../../components/common/buttonUI.jsx";
import {
  AcademicIcon,
  AdminIcon,
  LecturerIcon,
  UsersIcon,
} from "../../../components/icons/systemIcon.jsx";
import { getUser } from "../../../lib/authStorage";
import {
  createScheduleRequest,
  listScheduleRequests,
} from "../../../services/scheduleRequestService";

const REQUEST_STATUS_META = {
  draft: { label: "Nháp", variant: "muted" },
  pending_review: { label: "Chờ duyệt", variant: "warning" },
  approved: { label: "Đã duyệt", variant: "success" },
  rejected: { label: "Từ chối", variant: "danger" },
  scheduled: { label: "Đã xếp lịch", variant: "info" },
  published: { label: "Đã công bố", variant: "success" },
  cancelled: { label: "Đã hủy", variant: "danger" },
};

const requestStatusTabs = [
  { key: "all", label: "Tất cả" },
  { key: "draft", label: "Nháp" },
  { key: "pending_review", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "scheduled", label: "Đã xếp" },
  { key: "published", label: "Đã công bố" },
  { key: "rejected", label: "Từ chối" },
  { key: "cancelled", label: "Đã hủy" },
];

const initialCreateForm = {
  course_section_id: "",
  requested_team_count: "1",
  max_students_per_team: "",
  total_required_sessions: "1",
  preferred_week_start: "",
  preferred_week_end: "",
  preferred_day_of_week: "",
  preferred_time_slot_id: "",
  notes: "",
};

const ALLOWED_SCHEDULE_REQUEST_ROLES = ["QTV", "CBDT"];

function normalizeRoleCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function canManageScheduleRequests(user) {
  return ALLOWED_SCHEDULE_REQUEST_ROLES.includes(
    normalizeRoleCode(user?.role_code),
  );
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeStatus(value) {
  return String(value || "draft")
    .trim()
    .toLowerCase();
}

function getDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

function getSortableTime(value) {
  const resolvedDate = new Date(value);
  return Number.isNaN(resolvedDate.getTime()) ? 0 : resolvedDate.getTime();
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const resolvedDate = new Date(value);

  if (Number.isNaN(resolvedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
  }).format(resolvedDate);
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const resolvedDate = new Date(value);

  if (Number.isNaN(resolvedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(resolvedDate);
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

  return dayMap[value] || "—";
}

function buildCourseLabel(requestItem, index) {
  const courseCode = requestItem?.course_code || "";
  const courseName = requestItem?.course_name || "";
  const groupNo = requestItem?.group_no || "";

  if (courseCode && courseName && groupNo) {
    return `${courseCode} - ${courseName} | Nhóm ${groupNo}`;
  }

  if (courseCode && courseName) {
    return `${courseCode} - ${courseName}`;
  }

  if (courseName) {
    return courseName;
  }

  if (courseCode) {
    return courseCode;
  }

  return `Yêu cầu xếp lịch #${index + 1}`;
}

function normalizeScheduleRequestItem(requestItem, index) {
  const requestStatus = normalizeStatus(
    requestItem?.request_status || requestItem?.status,
  );

  return {
    id: requestItem?.id ?? requestItem?.request_id ?? index + 1,
    course_section_id: requestItem?.course_section_id,
    courseLabel: buildCourseLabel(requestItem, index),
    course_code: requestItem?.course_code,
    course_name: requestItem?.course_name,
    group_no: requestItem?.group_no,
    requested_team_count: requestItem?.requested_team_count,
    max_students_per_team: requestItem?.max_students_per_team,
    total_required_sessions: requestItem?.total_required_sessions,
    preferred_week_start: requestItem?.preferred_week_start,
    preferred_week_end: requestItem?.preferred_week_end,
    preferred_day_of_week: requestItem?.preferred_day_of_week,
    preferred_time_slot_id: requestItem?.preferred_time_slot_id,
    request_status: requestStatus,
    requested_by_user_id: requestItem?.requested_by_user_id,
    requested_by_name: requestItem?.requested_by_name,
    reviewed_by_user_id: requestItem?.reviewed_by_user_id,
    published_by_user_id: requestItem?.published_by_user_id,
    reviewed_at: requestItem?.reviewed_at,
    published_at: requestItem?.published_at,
    notes: requestItem?.notes,
    created_at: requestItem?.created_at || requestItem?.createdAt,
    updated_at: requestItem?.updated_at || requestItem?.updatedAt,
    raw: requestItem,
  };
}

function sortScheduleRequests(requestItems) {
  return [...requestItems].sort(
    (firstItem, secondItem) =>
      getSortableTime(secondItem.created_at) -
      getSortableTime(firstItem.created_at),
  );
}

function buildRequestStatusBadge(status) {
  const resolvedMeta = REQUEST_STATUS_META[status] || {
    label: status || "Không rõ",
    variant: "muted",
  };

  return (
    <StatusBadge value={status} variant={resolvedMeta.variant}>
      {resolvedMeta.label}
    </StatusBadge>
  );
}

function getApiErrorMessage(error, fallbackMessage) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return error.details.join(", ");
  }

  if (error?.details && typeof error.details === "object") {
    return Object.values(error.details).filter(Boolean).join(", ");
  }

  return error?.message || fallbackMessage;
}

function toPositiveInteger(value) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function getOptionalPositiveInteger(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return toPositiveInteger(value);
}

function getOptionalDayOfWeek(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 7) {
    return null;
  }

  return parsedValue;
}

function getValidationErrorText(errorItem) {
  if (typeof errorItem === "string") {
    return errorItem;
  }

  return (
    errorItem?.msg ||
    errorItem?.message ||
    errorItem?.error ||
    "Dữ liệu không hợp lệ."
  );
}

function getValidationErrorField(errorItem) {
  return errorItem?.path || errorItem?.param || errorItem?.field || null;
}

function getApiFieldErrors(error) {
  if (!Array.isArray(error?.details)) {
    return {};
  }

  return error.details.reduce((fieldErrors, errorItem) => {
    const fieldName = getValidationErrorField(errorItem);

    if (!fieldName) {
      return fieldErrors;
    }

    return {
      ...fieldErrors,
      [fieldName]: getValidationErrorText(errorItem),
    };
  }, {});
}

function getFirstApiErrorMessage(error, fallbackMessage) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return getValidationErrorText(error.details[0]);
  }

  if (error?.details && typeof error.details === "object") {
    return Object.values(error.details).filter(Boolean).join(", ");
  }

  return error?.message || fallbackMessage;
}

function validateCreateForm(formData, currentUser) {
  const fieldErrors = {};

  // Route đã được RoleGuard bảo vệ, kiểm tra thêm tại page để tránh cache user lệch.
  if (!canManageScheduleRequests(currentUser)) {
    fieldErrors.form =
      "Chỉ tài khoản QTV hoặc CBDT mới được tạo yêu cầu xếp lịch.";
  }

  if (!toPositiveInteger(formData.course_section_id)) {
    fieldErrors.course_section_id = "Vui lòng nhập ID lớp học phần hợp lệ.";
  }

  if (!toPositiveInteger(formData.requested_team_count)) {
    fieldErrors.requested_team_count =
      "Số tổ thực hành phải là số nguyên dương.";
  }

  if (!toPositiveInteger(formData.max_students_per_team)) {
    fieldErrors.max_students_per_team =
      "Số sinh viên tham dự phải là số nguyên dương.";
  }

  if (!toPositiveInteger(formData.total_required_sessions)) {
    fieldErrors.total_required_sessions =
      "Số buổi cần xếp phải là số nguyên dương.";
  }

  if (!formData.preferred_week_start) {
    fieldErrors.preferred_week_start = "Vui lòng chọn ngày bắt đầu dự kiến.";
  }

  if (!formData.preferred_week_end) {
    fieldErrors.preferred_week_end = "Vui lòng chọn ngày kết thúc dự kiến.";
  }

  if (
    formData.preferred_week_start &&
    formData.preferred_week_end &&
    formData.preferred_week_end < formData.preferred_week_start
  ) {
    fieldErrors.preferred_week_end =
      "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.";
  }

  if (
    formData.preferred_day_of_week &&
    !getOptionalDayOfWeek(formData.preferred_day_of_week)
  ) {
    fieldErrors.preferred_day_of_week =
      "Thứ ưu tiên phải nằm trong khoảng 1–7.";
  }

  if (
    formData.preferred_time_slot_id &&
    !getOptionalPositiveInteger(formData.preferred_time_slot_id)
  ) {
    fieldErrors.preferred_time_slot_id = "ID ca học phải là số nguyên dương.";
  }

  return fieldErrors;
}

function buildCreatePayload(formData) {
  return {
    course_section_id: toPositiveInteger(formData.course_section_id),
    requested_team_count: toPositiveInteger(formData.requested_team_count),
    max_students_per_team: toPositiveInteger(formData.max_students_per_team),
    total_required_sessions: toPositiveInteger(
      formData.total_required_sessions,
    ),
    preferred_week_start: formData.preferred_week_start || null,
    preferred_week_end: formData.preferred_week_end || null,
    preferred_day_of_week: getOptionalDayOfWeek(formData.preferred_day_of_week),
    preferred_time_slot_id: getOptionalPositiveInteger(
      formData.preferred_time_slot_id,
    ),
    notes: formData.notes.trim() || null,
  };
}

export default function ScheduleRequestsPage() {
  const [currentUser, setCurrentUser] = useState(null);

  const [requestItems, setRequestItems] = useState([]);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [createSuccessMessage, setCreateSuccessMessage] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  async function loadScheduleRequests() {
    try {
      setIsLoadingRequests(true);
      setErrorMessage("");

      const storedCurrentUser = getUser();

      if (storedCurrentUser) {
        setCurrentUser(storedCurrentUser);
      }

      const response = await listScheduleRequests();
      const rawRequestItems = Array.isArray(response?.data)
        ? response.data
        : response?.data
          ? [response.data]
          : [];

      // Backend đã tự filter theo role:
      // - CBDT chỉ thấy yêu cầu do chính mình tạo.
      // - QTV thấy toàn bộ yêu cầu.
      // Vì vậy frontend không tự lọc theo requested_by_user_id để tránh lệch dữ liệu.
      const normalizedRequestItems = sortScheduleRequests(
        rawRequestItems.map(normalizeScheduleRequestItem),
      );

      setRequestItems(normalizedRequestItems);
    } catch (error) {
      setRequestItems([]);
      setErrorMessage(
        getApiErrorMessage(error, "Không tải được yêu cầu xếp lịch."),
      );
    } finally {
      setIsLoadingRequests(false);
    }
  }

  useEffect(() => {
    loadScheduleRequests();
  }, []);

  const filteredRequestItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return requestItems.filter((requestItem) => {
      const matchesStatus =
        activeStatus === "all" || requestItem.request_status === activeStatus;

      const searchableText = normalizeText(
        [
          requestItem.id,
          requestItem.course_section_id,
          requestItem.courseLabel,
          requestItem.course_code,
          requestItem.course_name,
          requestItem.group_no,
          requestItem.request_status,
          requestItem.requested_by_name,
          requestItem.notes,
          requestItem.created_at,
          requestItem.updated_at,
        ].join(" "),
      );

      const matchesKeyword =
        !normalizedKeyword || searchableText.includes(normalizedKeyword);

      return matchesStatus && matchesKeyword;
    });
  }, [activeStatus, requestItems, searchKeyword]);

  const requestColumns = useMemo(
    () => [
      { key: "id", label: "ID" },
      { key: "course_section_id", label: "ID LHP" },
      { key: "courseLabel", label: "Lớp học phần" },
      { key: "course_code", label: "Mã HP" },
      { key: "course_name", label: "Tên học phần" },
      { key: "group_no", label: "Nhóm" },
      { key: "requested_team_count", label: "Số tổ" },
      { key: "max_students_per_team", label: "Số SV" },
      { key: "total_required_sessions", label: "Số buổi" },
      { key: "preferred_week_start", label: "Từ ngày" },
      { key: "preferred_week_end", label: "Đến ngày" },
      { key: "preferred_day_of_week", label: "Thứ ưu tiên" },
      { key: "preferred_time_slot_id", label: "ID ca" },
      { key: "request_status", label: "Trạng thái" },
      { key: "requested_by_name", label: "Người tạo" },
      { key: "requested_by_user_id", label: "ID người tạo" },
      { key: "reviewed_by_user_id", label: "ID người duyệt" },
      { key: "published_by_user_id", label: "ID người công bố" },
      { key: "reviewed_at", label: "Duyệt lúc" },
      { key: "published_at", label: "Công bố lúc" },
      { key: "notes", label: "Ghi chú" },
      { key: "created_at", label: "Tạo lúc" },
      { key: "updated_at", label: "Cập nhật" },
    ],
    [],
  );

  const requestRows = useMemo(
    () =>
      filteredRequestItems.map((requestItem) => ({
        id: requestItem.id,
        course_section_id: getDisplayValue(requestItem.course_section_id),
        courseLabel: requestItem.courseLabel,
        course_code: getDisplayValue(requestItem.course_code),
        course_name: getDisplayValue(requestItem.course_name),
        group_no: getDisplayValue(requestItem.group_no),
        requested_team_count: getDisplayValue(requestItem.requested_team_count),
        max_students_per_team: getDisplayValue(
          requestItem.max_students_per_team,
        ),
        total_required_sessions: getDisplayValue(
          requestItem.total_required_sessions,
        ),
        preferred_week_start: formatDate(requestItem.preferred_week_start),
        preferred_week_end: formatDate(requestItem.preferred_week_end),
        preferred_day_of_week: formatDayOfWeek(
          requestItem.preferred_day_of_week,
        ),
        preferred_time_slot_id: getDisplayValue(
          requestItem.preferred_time_slot_id,
        ),
        request_status: buildRequestStatusBadge(requestItem.request_status),
        requested_by_name: getDisplayValue(requestItem.requested_by_name),
        requested_by_user_id: getDisplayValue(requestItem.requested_by_user_id),
        reviewed_by_user_id: getDisplayValue(requestItem.reviewed_by_user_id),
        published_by_user_id: getDisplayValue(requestItem.published_by_user_id),
        reviewed_at: formatDateTime(requestItem.reviewed_at),
        published_at: formatDateTime(requestItem.published_at),
        notes: getDisplayValue(requestItem.notes),
        created_at: formatDateTime(requestItem.created_at),
        updated_at: formatDateTime(requestItem.updated_at),
      })),
    [filteredRequestItems],
  );

  const draftCount = useMemo(
    () =>
      requestItems.filter(
        (requestItem) => requestItem.request_status === "draft",
      ).length,
    [requestItems],
  );

  const pendingReviewCount = useMemo(
    () =>
      requestItems.filter(
        (requestItem) => requestItem.request_status === "pending_review",
      ).length,
    [requestItems],
  );

  const latestRequestItem = requestItems[0] || null;

  const summaryItems = useMemo(
    () => [
      {
        icon: AcademicIcon,
        title: "Tổng yêu cầu",
        value: requestItems.length,
        message: "Dữ liệu thật từ GET /api/schedule-requests",
      },
      {
        icon: UsersIcon,
        title: "Nháp",
        value: draftCount,
        message: "Trạng thái mặc định khi tạo mới",
      },
      {
        icon: LecturerIcon,
        title: "Chờ duyệt",
        value: pendingReviewCount,
        message: "Yêu cầu đã gửi chờ xử lý",
      },
      {
        icon: AdminIcon,
        title: "Đang hiển thị",
        value: requestRows.length,
        message: latestRequestItem
          ? `Mới nhất: ${formatDateTime(latestRequestItem.created_at)}`
          : "Chưa có bản ghi phù hợp",
      },
    ],
    [
      draftCount,
      latestRequestItem,
      pendingReviewCount,
      requestItems.length,
      requestRows.length,
    ],
  );

  function updateCreateForm(fieldName, value) {
    setCreateForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  function resetCreateState() {
    setCreateForm(initialCreateForm);
    setCreateFieldErrors({});
    setCreateErrorMessage("");
    setCreateSuccessMessage("");
  }

  function handleOpenCreateModal() {
    setSuccessMessage("");

    // Đồng bộ frontend với backend contract:
    // GET/POST /api/schedule-requests cho phép QTV và CBDT.
    if (!canManageScheduleRequests(currentUser)) {
      setErrorMessage(
        "Chỉ tài khoản QTV hoặc CBDT mới được tạo yêu cầu xếp lịch.",
      );
      return;
    }

    resetCreateState();
    setIsCreateModalOpen(true);
  }

  function handleCloseCreateModal() {
    if (isSubmittingCreate) {
      return;
    }

    setIsCreateModalOpen(false);
    resetCreateState();
  }

  async function handleCreateRequestSubmit(event) {
    event.preventDefault();

    const fieldErrors = validateCreateForm(createForm, currentUser);

    if (Object.keys(fieldErrors).length > 0) {
      setCreateFieldErrors(fieldErrors);
      setCreateErrorMessage(
        fieldErrors.form || "Vui lòng kiểm tra lại các trường chưa hợp lệ.",
      );
      return;
    }

    try {
      setIsSubmittingCreate(true);
      setCreateFieldErrors({});
      setCreateErrorMessage("");
      setCreateSuccessMessage("");

      await createScheduleRequest(buildCreatePayload(createForm));

      setCreateSuccessMessage("Tạo yêu cầu xếp lịch thành công.");
      setSuccessMessage("Tạo yêu cầu xếp lịch thành công.");
      setIsCreateModalOpen(false);
      resetCreateState();

      await loadScheduleRequests();
    } catch (error) {
      const apiFieldErrors = getApiFieldErrors(error);

      setCreateFieldErrors(apiFieldErrors);
      setCreateErrorMessage(
        getFirstApiErrorMessage(
          error,
          "Không thể tạo yêu cầu xếp lịch. Vui lòng kiểm tra dữ liệu.",
        ),
      );
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  function handleResetFilters() {
    setActiveStatus("all");
    setSearchKeyword("");
  }

  async function handleReloadData() {
    setSuccessMessage("");
    await loadScheduleRequests();
  }

  return (
    <div className="adminPageStack">
      <section className="card summaryCardGrid summaryCardGridCompact">
        {summaryItems.map((summaryItem) => (
          <CardUI
            key={summaryItem.title}
            icon={summaryItem.icon}
            title={summaryItem.title}
            number={summaryItem.value}
            message={summaryItem.message}
          />
        ))}
      </section>

      <section className="card managementAccount">
        <SectionLayout
          title="YÊU CẦU XẾP LỊCH"
          message={
            errorMessage
              ? errorMessage
              : successMessage ||
                "Danh sách yêu cầu xếp lịch thực hành được tải trực tiếp từ backend."
          }
          direction={0}
          className="card"
        />

        <div className="card accountsView accountPrimaryPanel">
          <FilterSearchToolbar
            tabs={requestStatusTabs}
            activeKey={activeStatus}
            onTabChange={setActiveStatus}
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            searchPlaceholder="Tìm theo học phần, nhóm, người tạo, ghi chú hoặc trạng thái..."
            searchButtonLabel="Tìm kiếm"
          />

          <div className="card roomFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">Danh sách yêu cầu xếp lịch</h3>
              <p className="roomSectionText">
                Hiển thị {requestRows.length} bản ghi phù hợp với bộ lọc hiện
                tại.
              </p>
            </div>

            <div className="roomFilterControls">
              <StatusBadge variant={errorMessage ? "danger" : "success"}>
                {errorMessage ? "API lỗi" : "API thật"}
              </StatusBadge>

              <ButtonUI
                tone="primary"
                shape="rounded"
                size="sm"
                onClick={handleOpenCreateModal}
              >
                Yêu cầu xếp lịch
              </ButtonUI>

              <RefreshButton onClick={handleResetFilters}>
                Đặt lại bộ lọc
              </RefreshButton>

              <RefreshButton
                onClick={handleReloadData}
                disabled={isLoadingRequests}
              >
                Đồng bộ lại
              </RefreshButton>
            </div>
          </div>

          <div className="card roomTableCard">
            <DataTable
              columns={requestColumns}
              rows={requestRows}
              loading={isLoadingRequests}
              error={errorMessage}
              emptyTitle="Chưa có yêu cầu xếp lịch"
              emptyDescription="Backend chưa trả bản ghi nào hoặc không có dữ liệu khớp bộ lọc."
            />
          </div>
        </div>
      </section>

      {isCreateModalOpen ? (
        <div className="modalOverlay" role="presentation">
          <section
            className="modalPanel scheduleRequestModalPanel"
            role="dialog"
            aria-modal="true"
          >
            <div className="modalHeader">
              <div>
                <p className="modalEyebrow">Tạo yêu cầu mới</p>
                <h3 className="modalTitle">Yêu cầu xếp lịch thực hành</h3>
              </div>

              <button
                type="button"
                className="modalCloseButton"
                onClick={handleCloseCreateModal}
                disabled={isSubmittingCreate}
                aria-label="Đóng popup"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateRequestSubmit}>
              <div className="modalBody scheduleRequestModalBody">
                <div className="scheduleRequestFormGrid">
                  <label className="trainingField">
                    Lớp học phần
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={createForm.course_section_id}
                      placeholder="Nhập ID lớp học phần, ví dụ: 1"
                      onChange={(event) =>
                        updateCreateForm(
                          "course_section_id",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    />
                    {createFieldErrors.course_section_id ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.course_section_id}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Số tổ thực hành
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={createForm.requested_team_count}
                      onChange={(event) =>
                        updateCreateForm(
                          "requested_team_count",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    />
                    {createFieldErrors.requested_team_count ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.requested_team_count}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Số buổi cần xếp
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={createForm.total_required_sessions}
                      onChange={(event) =>
                        updateCreateForm(
                          "total_required_sessions",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    />
                    {createFieldErrors.total_required_sessions ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.total_required_sessions}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Số sinh viên tham dự
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={createForm.max_students_per_team}
                      placeholder="Ví dụ: 40"
                      onChange={(event) =>
                        updateCreateForm(
                          "max_students_per_team",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    />
                    {createFieldErrors.max_students_per_team ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.max_students_per_team}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Từ ngày
                    <input
                      className="input"
                      type="date"
                      value={createForm.preferred_week_start}
                      onChange={(event) =>
                        updateCreateForm(
                          "preferred_week_start",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    />
                    {createFieldErrors.preferred_week_start ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.preferred_week_start}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Đến ngày
                    <input
                      className="input"
                      type="date"
                      value={createForm.preferred_week_end}
                      onChange={(event) =>
                        updateCreateForm(
                          "preferred_week_end",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    />
                    {createFieldErrors.preferred_week_end ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.preferred_week_end}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Thứ ưu tiên
                    <select
                      className="input"
                      value={createForm.preferred_day_of_week}
                      onChange={(event) =>
                        updateCreateForm(
                          "preferred_day_of_week",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    >
                      <option value="">Không chọn</option>
                      <option value="1">Chủ nhật</option>
                      <option value="2">Thứ 2</option>
                      <option value="3">Thứ 3</option>
                      <option value="4">Thứ 4</option>
                      <option value="5">Thứ 5</option>
                      <option value="6">Thứ 6</option>
                      <option value="7">Thứ 7</option>
                    </select>
                    {createFieldErrors.preferred_day_of_week ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.preferred_day_of_week}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    ID ca học ưu tiên
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={createForm.preferred_time_slot_id}
                      placeholder="Ví dụ: 1"
                      onChange={(event) =>
                        updateCreateForm(
                          "preferred_time_slot_id",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    />
                    {createFieldErrors.preferred_time_slot_id ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.preferred_time_slot_id}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Người tạo yêu cầu
                    <input
                      className="input scheduleRequestReadOnly"
                      value={
                        currentUser?.full_name ||
                        currentUser?.username ||
                        "Tài khoản hiện tại"
                      }
                      readOnly
                    />
                  </label>

                  <label className="trainingField">
                    Trạng thái mặc định
                    <input
                      className="input scheduleRequestReadOnly"
                      value="Nháp (draft)"
                      readOnly
                    />
                  </label>

                  <label className="trainingField trainingFieldFull">
                    Ghi chú
                    <textarea
                      className="textarea trainingTextarea"
                      value={createForm.notes}
                      placeholder="Nhập yêu cầu phòng, phần mềm, thiết bị hoặc ghi chú bổ sung..."
                      onChange={(event) =>
                        updateCreateForm("notes", event.target.value)
                      }
                      disabled={isSubmittingCreate}
                    />
                    {createFieldErrors.notes ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.notes}
                      </span>
                    ) : null}
                  </label>
                </div>

                {createErrorMessage ? (
                  <p className="scheduleRequestAlert scheduleRequestAlertDanger">
                    {createErrorMessage}
                  </p>
                ) : null}

                {createSuccessMessage ? (
                  <p className="scheduleRequestAlert scheduleRequestAlertSuccess">
                    {createSuccessMessage}
                  </p>
                ) : null}
              </div>

              <div className="modalActions">
                <ButtonUI
                  tone="secondary"
                  shape="rounded"
                  onClick={handleCloseCreateModal}
                  disabled={isSubmittingCreate}
                >
                  Hủy
                </ButtonUI>

                <ButtonUI
                  tone="primary"
                  shape="rounded"
                  type="submit"
                  disabled={isSubmittingCreate}
                >
                  {isSubmittingCreate ? "Đang gửi..." : "Tạo yêu cầu"}
                </ButtonUI>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
