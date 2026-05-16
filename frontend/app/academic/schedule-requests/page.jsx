"use client";

import { useEffect, useMemo, useState } from "react";

import { CardUI } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import FilterSearchToolbar from "../../../components/common/FilterSearchToolbar.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import { ButtonUI, RefreshButton } from "../../../components/common/buttonUI.jsx";
import {
  AcademicIcon,
  AdminIcon,
  LecturerIcon,
  UsersIcon,
} from "../../../components/icons/systemIcon.jsx";
import { getUser } from "../../../lib/authStorage";
import { login } from "../../../services/authService";
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
  room_requirement: "",
  software_equipment_requirement: "",
  notes: "",
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeStatus(value) {
  return String(value || "draft").trim().toLowerCase();
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
      getSortableTime(secondItem.created_at) - getSortableTime(firstItem.created_at),
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

function buildNotesPayload(formData) {
  const noteParts = [];

  if (formData.room_requirement.trim()) {
    noteParts.push(`Yêu cầu phòng máy: ${formData.room_requirement.trim()}`);
  }

  if (formData.software_equipment_requirement.trim()) {
    noteParts.push(
      `Yêu cầu phần mềm / thiết bị: ${formData.software_equipment_requirement.trim()}`,
    );
  }

  if (formData.notes.trim()) {
    noteParts.push(`Ghi chú: ${formData.notes.trim()}`);
  }

  return noteParts.join("\n");
}

function validateCreateForm(formData, currentUser) {
  const validationErrors = [];

  if (currentUser?.role_code !== "CBDT") {
    validationErrors.push("Chỉ tài khoản CBDT mới được tạo yêu cầu xếp lịch.");
  }

  if (!toPositiveInteger(formData.course_section_id)) {
    validationErrors.push("Vui lòng nhập ID lớp học phần hợp lệ.");
  }

  if (!toPositiveInteger(formData.requested_team_count)) {
    validationErrors.push("Số tổ thực hành phải là số nguyên dương.");
  }

  if (!toPositiveInteger(formData.max_students_per_team)) {
    validationErrors.push("Số sinh viên tham dự phải là số nguyên dương.");
  }

  if (!toPositiveInteger(formData.total_required_sessions)) {
    validationErrors.push("Số buổi cần xếp phải là số nguyên dương.");
  }

  if (!formData.preferred_week_start || !formData.preferred_week_end) {
    validationErrors.push("Vui lòng chọn đủ khoảng thời gian dự kiến.");
  }

  if (
    formData.preferred_week_start &&
    formData.preferred_week_end &&
    formData.preferred_week_end < formData.preferred_week_start
  ) {
    validationErrors.push("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
  }

  return validationErrors;
}

function buildCreatePayload(formData) {
  return {
    course_section_id: toPositiveInteger(formData.course_section_id),
    requested_team_count: toPositiveInteger(formData.requested_team_count),
    max_students_per_team: toPositiveInteger(formData.max_students_per_team),
    total_required_sessions: toPositiveInteger(formData.total_required_sessions),
    preferred_week_start: formData.preferred_week_start || null,
    preferred_week_end: formData.preferred_week_end || null,
    notes: buildNotesPayload(formData) || null,
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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [createSuccessMessage, setCreateSuccessMessage] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  async function loadScheduleRequests() {
    try {
      setIsLoadingRequests(true);
      setErrorMessage("");

      const response = await listScheduleRequests();
      const rawRequestItems = Array.isArray(response?.data)
        ? response.data
        : response?.data
          ? [response.data]
          : [];

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
        max_students_per_team: getDisplayValue(requestItem.max_students_per_team),
        total_required_sessions: getDisplayValue(
          requestItem.total_required_sessions,
        ),
        preferred_week_start: formatDate(requestItem.preferred_week_start),
        preferred_week_end: formatDate(requestItem.preferred_week_end),
        preferred_day_of_week: formatDayOfWeek(requestItem.preferred_day_of_week),
        preferred_time_slot_id: getDisplayValue(requestItem.preferred_time_slot_id),
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
      requestItems.filter((requestItem) => requestItem.request_status === "draft")
        .length,
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
    setReauthPassword("");
    setCreateErrorMessage("");
    setCreateSuccessMessage("");
    setIsPasswordDialogOpen(false);
  }

  function handleOpenCreateModal() {
    setSuccessMessage("");

    if (currentUser?.role_code !== "CBDT") {
      setErrorMessage("Chỉ tài khoản CBDT mới được tạo yêu cầu xếp lịch.");
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

  function handleContinueToPasswordDialog(event) {
    event.preventDefault();

    const validationErrors = validateCreateForm(createForm, currentUser);

    if (validationErrors.length > 0) {
      setCreateErrorMessage(validationErrors.join(" "));
      return;
    }

    setCreateErrorMessage("");
    setIsPasswordDialogOpen(true);
  }

  async function handleConfirmCreateRequest(event) {
    event.preventDefault();

    if (!reauthPassword.trim()) {
      setCreateErrorMessage("Vui lòng nhập lại mật khẩu để xác nhận.");
      return;
    }

    if (!currentUser?.username) {
      setCreateErrorMessage("Không xác định được tài khoản hiện tại.");
      return;
    }

    try {
      setIsSubmittingCreate(true);
      setCreateErrorMessage("");
      setCreateSuccessMessage("");

      await login(currentUser.username, reauthPassword);
      await createScheduleRequest(buildCreatePayload(createForm));

      setCreateSuccessMessage("Tạo yêu cầu xếp lịch thành công.");
      setSuccessMessage("Tạo yêu cầu xếp lịch thành công.");
      setIsPasswordDialogOpen(false);
      setIsCreateModalOpen(false);
      resetCreateState();

      await loadScheduleRequests();
    } catch (error) {
      setCreateErrorMessage(
        getApiErrorMessage(
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
                Hiển thị {requestRows.length} bản ghi phù hợp với bộ lọc hiện tại.
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

            <form onSubmit={handleContinueToPasswordDialog}>
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
                        updateCreateForm("course_section_id", event.target.value)
                      }
                      disabled={isSubmittingCreate}
                    />
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
                  </label>

                  <label className="trainingField">
                    Đến ngày
                    <input
                      className="input"
                      type="date"
                      value={createForm.preferred_week_end}
                      onChange={(event) =>
                        updateCreateForm("preferred_week_end", event.target.value)
                      }
                      disabled={isSubmittingCreate}
                    />
                  </label>

                  <label className="trainingField trainingFieldFull">
                    Yêu cầu phòng máy
                    <input
                      className="input"
                      value={createForm.room_requirement}
                      placeholder="Ví dụ: ưu tiên phòng 2B11, cần máy chiếu, mạng LAN ổn định..."
                      onChange={(event) =>
                        updateCreateForm("room_requirement", event.target.value)
                      }
                      disabled={isSubmittingCreate}
                    />
                  </label>

                  <label className="trainingField trainingFieldFull">
                    Yêu cầu phần mềm / thiết bị
                    <textarea
                      className="textarea trainingTextarea"
                      value={createForm.software_equipment_requirement}
                      placeholder="Ví dụ: VS Code, Node.js, MySQL Workbench, trình duyệt Chrome..."
                      onChange={(event) =>
                        updateCreateForm(
                          "software_equipment_requirement",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    />
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
                      placeholder="Nhập ghi chú bổ sung cho người xếp lịch..."
                      onChange={(event) =>
                        updateCreateForm("notes", event.target.value)
                      }
                      disabled={isSubmittingCreate}
                    />
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
                  Tiếp tục xác nhận
                </ButtonUI>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isPasswordDialogOpen ? (
        <div className="modalOverlay" role="presentation">
          <section className="modalPanel" role="dialog" aria-modal="true">
            <div className="modalHeader">
              <div>
                <p className="modalEyebrow">Xác nhận bảo mật</p>
                <h3 className="modalTitle">Nhập lại mật khẩu</h3>
              </div>

              <button
                type="button"
                className="modalCloseButton"
                onClick={() => setIsPasswordDialogOpen(false)}
                disabled={isSubmittingCreate}
                aria-label="Đóng popup xác nhận mật khẩu"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmCreateRequest}>
              <div className="modalBody">
                <p className="modalText">
                  Vui lòng nhập lại mật khẩu của tài khoản{" "}
                  <strong>{currentUser?.username || "hiện tại"}</strong> trước khi
                  gửi yêu cầu lên hệ thống.
                </p>

                <label className="label">
                  Mật khẩu xác nhận
                  <input
                    className="input"
                    type="password"
                    value={reauthPassword}
                    placeholder="••••••••"
                    onChange={(event) => setReauthPassword(event.target.value)}
                    disabled={isSubmittingCreate}
                    autoComplete="current-password"
                  />
                </label>

                {createErrorMessage ? (
                  <p className="scheduleRequestAlert scheduleRequestAlertDanger">
                    {createErrorMessage}
                  </p>
                ) : null}
              </div>

              <div className="modalActions">
                <ButtonUI
                  tone="secondary"
                  shape="rounded"
                  onClick={() => setIsPasswordDialogOpen(false)}
                  disabled={isSubmittingCreate}
                >
                  Quay lại
                </ButtonUI>

                <ButtonUI
                  tone="primary"
                  shape="rounded"
                  type="submit"
                  disabled={isSubmittingCreate}
                >
                  {isSubmittingCreate ? "Đang gửi..." : "Xác nhận và gửi"}
                </ButtonUI>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
