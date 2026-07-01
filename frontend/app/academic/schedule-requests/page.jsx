"use client";

import { useEffect, useMemo, useState } from "react";

import { CardUI } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import FilterSearchToolbar from "../../../components/common/FilterSearchToolbar.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import {
  ButtonUI,
  RefreshButton,
} from "../../../components/common/buttonUI.jsx";
import { renderAcademicIcon } from "../../../components/systemIcon.jsx";
import { getUser } from "../../../lib/authStorage";
import ConfirmDialog from "../../../components/common/ConfirmDialog.jsx";
import {
  approveScheduleRequest,
  cancelScheduleRequest,
  createScheduleRequest,
  getScheduleRequestById,
  listScheduleRequests,
  publishScheduleRequest,
  submitScheduleRequest,
  updateScheduleRequest,
} from "../../../services/scheduleRequestService";
import { listMasterData } from "../../../services/adminService";
import { checkScheduleConstraints } from "../../../services/scheduleService.js";
import { listRooms } from "../../../services/roomService";
import { simulateStudentRegistration } from "../../../services/demoRegistrationService";

const REQUEST_STATUS_META = {
  draft: { label: "Nháp", variant: "muted" },
  pending_review: { label: "Chờ duyệt", variant: "warning" },
  approved: { label: "Đã duyệt", variant: "success" },
  rejected: { label: "Từ chối", variant: "danger" },
  scheduled: { label: "Đã xếp lịch", variant: "info" },
  published: { label: "Đã công bố", variant: "success" },
  cancelled: { label: "Đã hủy", variant: "danger" },
};
const CONSTRAINT_RULE_META = {
  ROOM_SCOPE: {
    label: "Phạm vi phòng",
    meaning: "Phòng có thuộc phạm vi cho phép không.",
    suggestion: "Chọn phòng thuộc phạm vi 2B11, 2B21 hoặc 2B31.",
  },
  ROOM_STATUS: {
    label: "Trạng thái phòng",
    meaning: "Phòng có đang khả dụng không.",
    suggestion: "Chọn phòng khác hoặc mở lại phòng trước khi xếp lịch.",
  },
  ROOM_BLOCKED: {
    label: "Phòng bị khóa",
    meaning: "Phòng có bị khóa bởi lịch bảo trì hoặc yêu cầu khóa phòng không.",
    suggestion: "Chọn phòng khác hoặc đổi khoảng thời gian.",
  },
  HOLIDAY_BLOCKED: {
    label: "Ngày nghỉ",
    meaning: "Ngày học có thuộc ngày nghỉ bị chặn lịch không.",
    suggestion: "Chọn ngày khác không thuộc lịch nghỉ.",
  },
  ROOM_CONFLICT: {
    label: "Trùng phòng",
    meaning: "Phòng có bị trùng lịch cùng thứ, ca và khoảng ngày không.",
    suggestion: "Đổi phòng, đổi ca hoặc đổi khoảng ngày.",
  },
  LECTURER_CONFLICT: {
    label: "Trùng giảng viên",
    meaning: "Giảng viên có bị trùng lịch cùng thời điểm không.",
    suggestion: "Chọn giảng viên khác hoặc đổi ca thực hành.",
  },
  CAPACITY_OK: {
    label: "Đủ sức chứa",
    meaning: "Số máy khả dụng có đáp ứng sĩ số tổ thực hành không.",
    suggestion: "Chọn phòng lớn hơn hoặc tách thêm tổ thực hành.",
  },
};

const CONSTRAINT_RULE_COUNT = Object.keys(CONSTRAINT_RULE_META).length;

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
  academic_year: "",
  semester_id: "",
  start_week_id: "",
  end_week_id: "",
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

function getPlainDateValue(value) {
  if (!value) return "";

  const text = String(value);
  const plainDate = text.match(/^(\d{4}-\d{2}-\d{2})$/);

  if (plainDate) return plainDate[1];

  const resolvedDate = new Date(value);

  if (Number.isNaN(resolvedDate.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(resolvedDate);

  const getPart = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function buildAcademicWeekLabel(week) {
  return `Tuần ${week.week_no} [${formatDate(week.start_date)} - ${formatDate(
    week.end_date,
  )}]`;
}

function isInactiveTimeSlot(slot) {
  return (
    slot?.is_active === false ||
    slot?.is_active === 0 ||
    slot?.is_active === "0"
  );
}

function buildTimeSlotLabel(slot) {
  if (slot?.slot_label) {
    return slot.slot_label;
  }

  if (slot?.start_period && slot?.end_period) {
    return `Tiết ${slot.start_period}-${slot.end_period}`;
  }

  return slot?.id ? `Ca #${slot.id}` : "Ca học";
}

function buildTimeSlotScheduleValue(slot) {
  if (slot?.start_period && slot?.end_period) {
    return `${slot.start_period}-${slot.end_period}`;
  }

  return slot?.slot_label || String(slot?.id || "");
}

function normalizeTimeSlotOptions(timeSlots) {
  return (Array.isArray(timeSlots) ? timeSlots : [])
    .filter((slot) => slot?.id && !isInactiveTimeSlot(slot))
    .map((slot) => ({
      id: String(slot.id),
      label: buildTimeSlotLabel(slot),
      scheduleValue: buildTimeSlotScheduleValue(slot),
    }));
}

function getTimeSlotLabelById(timeSlotOptions, timeSlotId) {
  if (!timeSlotId) {
    return "—";
  }

  const matchedSlot = timeSlotOptions.find(
    (slot) => String(slot.id) === String(timeSlotId),
  );

  return matchedSlot?.label || `Ca #${timeSlotId}`;
}

function findWeekById(weeks, weekId) {
  return weeks.find((week) => String(week.id) === String(weekId));
}

function resolveWeekFieldsFromDates(startDate, endDate, semesters, weeks) {
  const startDateValue = getPlainDateValue(startDate);
  const endDateValue = getPlainDateValue(endDate);

  const startWeek = weeks.find(
    (week) => getPlainDateValue(week.start_date) === startDateValue,
  );
  const endWeek = weeks.find(
    (week) =>
      getPlainDateValue(week.end_date) === endDateValue &&
      (!startWeek ||
        String(week.semester_id) === String(startWeek.semester_id)),
  );
  const semesterId = startWeek?.semester_id || endWeek?.semester_id || "";
  const semester = semesters.find(
    (item) => String(item.id) === String(semesterId),
  );

  return {
    academic_year: semester?.academic_year || "",
    semester_id: semesterId ? String(semesterId) : "",
    start_week_id: startWeek?.id ? String(startWeek.id) : "",
    end_week_id: endWeek?.id ? String(endWeek.id) : "",
  };
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

function getApiErrorMessage(error, fallbackMessage) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return error.details.map(getValidationErrorText).join(", ");
  }

  if (error?.details && typeof error.details === "object") {
    return Object.values(error.details)
      .filter(Boolean)
      .map(getValidationErrorText)
      .join(", ");
  }

  return error?.message || fallbackMessage;
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

function DetailGridItem({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 4,
        padding: 12,
        borderRadius: 14,
        background: "#fffafa",
        border: "1px solid rgba(139, 0, 0, 0.1)",
      }}
    >
      <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
        {label}
      </span>
      <strong style={{ color: "#183b68", fontSize: 13 }}>{value ?? "—"}</strong>
    </div>
  );
}

function ScheduleRequestDetailDialog({
  isOpen,
  requestDetail,
  timeSlotOptions = [],
  isLoading,
  errorMessage,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  const status = normalizeStatus(
    requestDetail?.request_status || requestDetail?.status,
  );

  return (
    <div className="modalOverlay" role="presentation">
      <section
        className="modalPanel scheduleRequestModalPanel"
        role="dialog"
        aria-modal="true"
      >
        <div className="modalHeader">
          <div>
            <p className="modalEyebrow">Chi tiết từ API</p>
            <h3 className="modalTitle">
              Yêu cầu xếp lịch #{requestDetail?.id || "—"}
            </h3>
          </div>

          <button
            type="button"
            className="modalCloseButton"
            onClick={onClose}
            aria-label="Đóng popup"
          >
            ×
          </button>
        </div>

        <div className="modalBody">
          {isLoading ? (
            <div className="commonStateBox" role="status">
              <h3 className="commonStateTitle">Đang tải chi tiết...</h3>
              <p className="commonStateText">
                Frontend đang gọi GET /api/schedule-requests/:id.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="commonStateBox" role="alert">
              <h3 className="commonStateTitle">Không tải được chi tiết</h3>
              <p className="commonStateText">{errorMessage}</p>
            </div>
          ) : requestDetail ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
              }}
            >
              <DetailGridItem
                label="ID yêu cầu"
                value={getDisplayValue(requestDetail.id)}
              />
              <DetailGridItem
                label="Trạng thái"
                value={REQUEST_STATUS_META[status]?.label || status || "—"}
              />
              <DetailGridItem
                label="ID lớp học phần"
                value={getDisplayValue(requestDetail.course_section_id)}
              />
              <DetailGridItem
                label="Học phần"
                value={
                  requestDetail.course_code || requestDetail.course_name
                    ? `${requestDetail.course_code || "—"} - ${requestDetail.course_name || "—"}`
                    : "—"
                }
              />
              <DetailGridItem
                label="Nhóm"
                value={getDisplayValue(requestDetail.group_no)}
              />
              <DetailGridItem
                label="Số tổ thực hành"
                value={getDisplayValue(requestDetail.requested_team_count)}
              />
              <DetailGridItem
                label="SV / tổ"
                value={getDisplayValue(requestDetail.max_students_per_team)}
              />
              <DetailGridItem
                label="Số buổi cần xếp"
                value={getDisplayValue(requestDetail.total_required_sessions)}
              />
              <DetailGridItem
                label="Từ ngày ưu tiên"
                value={formatDate(requestDetail.preferred_week_start)}
              />
              <DetailGridItem
                label="Đến ngày ưu tiên"
                value={formatDate(requestDetail.preferred_week_end)}
              />
              <DetailGridItem
                label="Thứ ưu tiên"
                value={formatDayOfWeek(requestDetail.preferred_day_of_week)}
              />
              <DetailGridItem
                label="Ca ưu tiên"
                value={getTimeSlotLabelById(
                  timeSlotOptions,
                  requestDetail.preferred_time_slot_id,
                )}
              />
              <DetailGridItem
                label="Người tạo"
                value={getDisplayValue(requestDetail.requested_by_name)}
              />
              <DetailGridItem
                label="ID người tạo"
                value={getDisplayValue(requestDetail.requested_by_user_id)}
              />
              <DetailGridItem
                label="Ghi chú"
                value={getDisplayValue(requestDetail.notes)}
              />
              <DetailGridItem
                label="Tạo lúc"
                value={formatDateTime(requestDetail.created_at)}
              />
              <DetailGridItem
                label="Cập nhật"
                value={formatDateTime(requestDetail.updated_at)}
              />
            </div>
          ) : (
            <div className="commonStateBox">
              <h3 className="commonStateTitle">Chưa có dữ liệu chi tiết</h3>
              <p className="commonStateText">
                API không trả về dữ liệu cho yêu cầu này.
              </p>
            </div>
          )}
        </div>

        <div className="modalActions">
          <ButtonUI tone="secondary" shape="rounded" onClick={onClose}>
            Đóng
          </ButtonUI>
        </div>
      </section>
    </div>
  );
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

function findCourseSectionById(courseSectionOptions, courseSectionId) {
  return courseSectionOptions.find(
    (section) => String(section.id) === String(courseSectionId),
  );
}

function getCourseSectionEnrollment(courseSection) {
  const registeredEnrollment = toPositiveInteger(
    courseSection?.registered_enrollment,
  );
  const plannedEnrollment = toPositiveInteger(
    courseSection?.planned_enrollment,
  );

  return registeredEnrollment || plannedEnrollment;
}

function getTeamCountRequirement(formData, courseSectionOptions) {
  const courseSection = findCourseSectionById(
    courseSectionOptions,
    formData.course_section_id,
  );
  const enrollment = getCourseSectionEnrollment(courseSection);
  const maxStudentsPerTeam = toPositiveInteger(formData.max_students_per_team);

  if (!enrollment || !maxStudentsPerTeam) {
    return null;
  }

  return {
    enrollment,
    maxStudentsPerTeam,
    minimumTeamCount: Math.ceil(enrollment / maxStudentsPerTeam),
  };
}

function buildTeamCountRequirementMessage(requirement) {
  if (!requirement) {
    return "";
  }

  return `Lớp này có ${requirement.enrollment} sinh viên. Với tối đa ${requirement.maxStudentsPerTeam} sinh viên/tổ, cần ít nhất ${requirement.minimumTeamCount} tổ thực hành.`;
}

function applyAutoTeamCount(formData, courseSectionOptions) {
  const requirement = getTeamCountRequirement(formData, courseSectionOptions);

  if (!requirement) {
    return formData;
  }

  return {
    ...formData,
    requested_team_count: String(requirement.minimumTeamCount),
  };
}

function validateCreateForm(formData, currentUser, courseSectionOptions = []) {
  const fieldErrors = {};

  if (!canManageScheduleRequests(currentUser)) {
    fieldErrors.form =
      "Chỉ tài khoản QTV hoặc CBDT mới được tạo yêu cầu xếp lịch.";
  }

  if (!toPositiveInteger(formData.course_section_id)) {
    fieldErrors.course_section_id = "Vui lòng chọn lớp học phần.";
  }

  if (!toPositiveInteger(formData.requested_team_count)) {
    fieldErrors.requested_team_count =
      "Số tổ thực hành phải là số nguyên dương.";
  }

  if (!toPositiveInteger(formData.max_students_per_team)) {
    fieldErrors.max_students_per_team =
      "Số sinh viên tối đa mỗi tổ phải là số nguyên dương.";
  }

  const requestedTeamCount = toPositiveInteger(formData.requested_team_count);
  const teamCountRequirement = getTeamCountRequirement(
    formData,
    courseSectionOptions,
  );

  if (
    requestedTeamCount &&
    teamCountRequirement &&
    requestedTeamCount < teamCountRequirement.minimumTeamCount
  ) {
    fieldErrors.requested_team_count =
      buildTeamCountRequirementMessage(teamCountRequirement);
  }

  if (!toPositiveInteger(formData.total_required_sessions)) {
    fieldErrors.total_required_sessions =
      "Số buổi cần xếp phải là số nguyên dương.";
  }

  if (!formData.academic_year) {
    fieldErrors.academic_year = "Vui lòng chọn năm học.";
  }

  if (!formData.semester_id) {
    fieldErrors.semester_id = "Vui lòng chọn học kỳ.";
  }

  if (!formData.start_week_id || !formData.preferred_week_start) {
    fieldErrors.preferred_week_start = "Vui lòng chọn tuần bắt đầu.";
  }

  if (!formData.end_week_id || !formData.preferred_week_end) {
    fieldErrors.preferred_week_end = "Vui lòng chọn tuần kết thúc.";
  }

  if (
    formData.preferred_week_start &&
    formData.preferred_week_end &&
    formData.preferred_week_end < formData.preferred_week_start
  ) {
    fieldErrors.preferred_week_end =
      "Tuần kết thúc phải sau hoặc bằng tuần bắt đầu.";
  }

  if (
    formData.preferred_day_of_week &&
    !getOptionalDayOfWeek(formData.preferred_day_of_week)
  ) {
    fieldErrors.preferred_day_of_week =
      "Thứ ưu tiên phải nằm trong khoảng 1-7.";
  }

  if (
    formData.preferred_time_slot_id &&
    !getOptionalPositiveInteger(formData.preferred_time_slot_id)
  ) {
    fieldErrors.preferred_time_slot_id = "Ca học không hợp lệ.";
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

const REQUEST_ACTION_META = {
  submit: {
    title: "Gửi yêu cầu xếp lịch?",
    confirmLabel: "Gửi yêu cầu",
    success: "Đã gửi yêu cầu xếp lịch.",
  },
  approve: {
    title: "Duyệt yêu cầu và các lịch liên quan?",
    confirmLabel: "Duyệt",
    success: "Đã duyệt yêu cầu và lịch thực hành.",
  },
  cancel: {
    title: "Hủy yêu cầu và các lịch liên quan?",
    confirmLabel: "Hủy yêu cầu",
    success: "Đã hủy yêu cầu xếp lịch.",
    tone: "danger",
  },
  publish: {
    title: "Công bố yêu cầu và các lịch liên quan?",
    confirmLabel: "Công bố",
    success: "Đã công bố lịch thực hành.",
  },
};

function RequestActionDialog({
  requestItem,
  isSubmitting,
  onEdit,
  onAction,
  onClose,
}) {
  if (!requestItem) return null;

  const status = requestItem.request_status;

  return (
    <div className="modalOverlay" role="presentation">
      <section
        className="modalPanel confirmDialogPanel"
        role="dialog"
        aria-modal="true"
      >
        <div className="modalHeader">
          <div>
            <p className="modalEyebrow">Quản lý yêu cầu</p>
            <h3 className="modalTitle">Cập nhật yêu cầu #{requestItem.id}</h3>
          </div>
          <button className="modalCloseButton" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modalBody" style={{ display: "grid", gap: 10 }}>
          {status === "draft" ? (
            <>
              <ButtonUI width="full" onClick={() => onEdit(requestItem)}>
                Chỉnh sửa
              </ButtonUI>
              <ButtonUI
                width="full"
                onClick={() => onAction("submit", requestItem)}
              >
                Gửi yêu cầu
              </ButtonUI>
            </>
          ) : null}

          {status === "scheduled" ? (
            <ButtonUI
              width="full"
              onClick={() => onAction("approve", requestItem)}
            >
              Duyệt
            </ButtonUI>
          ) : null}

          {["draft", "pending_review", "scheduled", "approved"].includes(
            status,
          ) ? (
            <ButtonUI
              width="full"
              tone="outline"
              onClick={() => onAction("cancel", requestItem)}
            >
              Hủy
            </ButtonUI>
          ) : null}

          {status === "approved" ? (
            <ButtonUI
              width="full"
              onClick={() => onAction("publish", requestItem)}
            >
              Công bố
            </ButtonUI>
          ) : null}
        </div>

        <div className="modalActions">
          <ButtonUI tone="secondary" onClick={onClose} disabled={isSubmitting}>
            Thoát
          </ButtonUI>
        </div>
      </section>
    </div>
  );
}

export default function ScheduleRequestsPage() {
  const [currentUser, setCurrentUser] = useState(null);

  const [requestItems, setRequestItems] = useState([]);
  const [courseSectionOptions, setCourseSectionOptions] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [academicWeekOptions, setAcademicWeekOptions] = useState([]);
  const [timeSlotOptions, setTimeSlotOptions] = useState([]);
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isSimulatingRegistration, setIsSimulatingRegistration] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingRequest, setEditingRequest] = useState(null);
  const [actionRequest, setActionRequest] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);
  const [isLoadingRequestDetail, setIsLoadingRequestDetail] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createErrorMessage, setCreateErrorMessage] = useState("");
  const [createSuccessMessage, setCreateSuccessMessage] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isConstraintModalOpen, setIsConstraintModalOpen] = useState(false);
  const [constraintForm, setConstraintForm] = useState({
    room_code: "",
    lecturer_user_id: "",
    practice_team_id: "",
    day_of_week: "",
    time_slot: "",
    academic_year: "",
    semester_id: "",
    start_week_id: "",
    end_week_id: "",
    start_date: "",
    end_date: "",
  });
  const [constraintRows, setConstraintRows] = useState([]);
  const [constraintData, setConstraintData] = useState(null);
  const [constraintError, setConstraintError] = useState("");
  const [isCheckingConstraint, setIsCheckingConstraint] = useState(false);
  const [constraintRooms, setConstraintRooms] = useState([]);
  const [constraintLecturers, setConstraintLecturers] = useState([]);

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  async function loadCourseSectionOptions() {
    try {
      const response = await listMasterData("course-sections");
      const sections = Array.isArray(response?.data) ? response.data : [];

      setCourseSectionOptions(sections);
    } catch (error) {
      setCourseSectionOptions([]);
      setErrorMessage(
        getApiErrorMessage(error, "Không tải được danh sách lớp học phần."),
      );
    }
  }
  async function loadAcademicCalendarOptions() {
    try {
      const [semesterResponse, weekResponse, timeSlotResponse] =
        await Promise.all([
          listMasterData("semesters"),
          listMasterData("academic-weeks"),
          listMasterData("time-slots"),
        ]);

      const semesters = Array.isArray(semesterResponse?.data)
        ? semesterResponse.data
        : [];
      const weeks = Array.isArray(weekResponse?.data) ? weekResponse.data : [];
      const timeSlots = Array.isArray(timeSlotResponse?.data)
        ? timeSlotResponse.data
        : [];

      setSemesterOptions(semesters);
      setAcademicWeekOptions(
        [...weeks].sort(
          (firstWeek, secondWeek) =>
            getSortableTime(firstWeek.start_date) -
            getSortableTime(secondWeek.start_date),
        ),
      );
      setTimeSlotOptions(normalizeTimeSlotOptions(timeSlots));
    } catch (error) {
      setSemesterOptions([]);
      setAcademicWeekOptions([]);
      setTimeSlotOptions([]);
      setErrorMessage(
        getApiErrorMessage(error, "Không tải được dữ liệu học kỳ và tuần học."),
      );
    }
  }

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
    loadCourseSectionOptions();
    loadAcademicCalendarOptions();
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

  async function handleOpenRequestDetail(requestId) {
    if (!requestId) {
      return;
    }

    try {
      setIsDetailModalOpen(true);
      setSelectedRequestDetail(null);
      setDetailErrorMessage("");
      setIsLoadingRequestDetail(true);

      const response = await getScheduleRequestById(requestId);
      setSelectedRequestDetail(response?.data || null);
    } catch (error) {
      setDetailErrorMessage(
        getApiErrorMessage(error, "Không thể tải chi tiết yêu cầu xếp lịch."),
      );
    } finally {
      setIsLoadingRequestDetail(false);
    }
  }

  function handleCloseRequestDetail() {
    setIsDetailModalOpen(false);
    setSelectedRequestDetail(null);
    setDetailErrorMessage("");
  }

  const requestColumns = useMemo(
    () => [
      { key: "courseLabel", label: "Lớp học phần" },
      { key: "course_code", label: "Mã HP" },
      { key: "course_name", label: "Tên học phần" },
      { key: "group_no", label: "Nhóm" },
      { key: "requested_team_count", label: "Số tổ" },
      { key: "max_students_per_team", label: "Số SV" },
      { key: "total_required_sessions", label: "Số buổi" },
      { key: "preferred_week_start", label: "Từ ngày" },
      { key: "preferred_week_end", label: "Đến ngày" },
      { key: "preferred_time_slot_id", label: "Ca học" },
      { key: "request_status", label: "Trạng thái" },
      { key: "notes", label: "Ghi chú" },
      { key: "created_at", label: "Tạo lúc" },
      { key: "updated_at", label: "Cập nhật" },
      { key: "action", label: "Thao tác" },
    ],
    [],
  );

  const requestRows = useMemo(
    () =>
      filteredRequestItems.map((requestItem) => ({
        id: requestItem.id,
        request_status_code: requestItem.request_status,
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
        preferred_time_slot_id: getTimeSlotLabelById(
          timeSlotOptions,
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
        action: (
          <ButtonUI size="sm" onClick={() => setActionRequest(requestItem)}>
            Cập nhật
          </ButtonUI>
        ),
      })),
    [filteredRequestItems, timeSlotOptions],
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
        icon: () => renderAcademicIcon("scheduleRequest"),
        title: "Tổng yêu cầu",
        value: requestItems.length,
        message: "Các yêu cầu cá nhân",
      },
      {
        icon: () => renderAcademicIcon("draft"),
        title: "Nháp",
        value: draftCount,
        message: "Nháp",
      },
      {
        icon: () => renderAcademicIcon("pendingReview"),
        title: "Chờ duyệt",
        value: pendingReviewCount,
        message: "Yêu cầu đã gửi chờ xử lý",
      },
      {
        icon: () => renderAcademicIcon("visibleRows"),
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

  const academicYearOptions = useMemo(
    () =>
      [...new Set(semesterOptions.map((semester) => semester.academic_year))]
        .filter(Boolean)
        .sort(),
    [semesterOptions],
  );

  const createSemesterOptions = useMemo(
    () =>
      semesterOptions
        .filter(
          (semester) => semester.academic_year === createForm.academic_year,
        )
        .sort((firstSemester, secondSemester) => {
          const firstNo = Number(firstSemester.semester_no || 0);
          const secondNo = Number(secondSemester.semester_no || 0);

          return firstNo - secondNo;
        }),
    [createForm.academic_year, semesterOptions],
  );

  const createWeekOptions = useMemo(
    () =>
      academicWeekOptions.filter(
        (week) => String(week.semester_id) === String(createForm.semester_id),
      ),
    [academicWeekOptions, createForm.semester_id],
  );

  const createStartWeek = useMemo(
    () => findWeekById(createWeekOptions, createForm.start_week_id),
    [createForm.start_week_id, createWeekOptions],
  );

  const createEndWeekOptions = useMemo(() => {
    if (!createStartWeek) return createWeekOptions;

    const startDate = getPlainDateValue(createStartWeek.start_date);

    return createWeekOptions.filter(
      (week) => getPlainDateValue(week.start_date) >= startDate,
    );
  }, [createStartWeek, createWeekOptions]);

  const teamCountRequirement = useMemo(
    () => getTeamCountRequirement(createForm, courseSectionOptions),
    [courseSectionOptions, createForm],
  );

  function updateCreateForm(fieldName, value) {
    setCreateForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [fieldName]: value,
      };

      if (fieldName === "academic_year") {
        nextForm.semester_id = "";
        nextForm.start_week_id = "";
        nextForm.end_week_id = "";
        nextForm.preferred_week_start = "";
        nextForm.preferred_week_end = "";
      }

      if (fieldName === "semester_id") {
        nextForm.start_week_id = "";
        nextForm.end_week_id = "";
        nextForm.preferred_week_start = "";
        nextForm.preferred_week_end = "";
      }

      if (fieldName === "start_week_id") {
        const startWeek = findWeekById(academicWeekOptions, value);
        nextForm.preferred_week_start = getPlainDateValue(
          startWeek?.start_date,
        );

        const currentEndWeek = findWeekById(
          academicWeekOptions,
          currentForm.end_week_id,
        );

        if (
          !currentEndWeek ||
          getPlainDateValue(currentEndWeek.start_date) <
            getPlainDateValue(startWeek?.start_date)
        ) {
          nextForm.end_week_id = value;
          nextForm.preferred_week_end = getPlainDateValue(startWeek?.end_date);
        }
      }

      if (fieldName === "end_week_id") {
        const endWeek = findWeekById(academicWeekOptions, value);
        nextForm.preferred_week_end = getPlainDateValue(endWeek?.end_date);
      }

      return applyAutoTeamCount(nextForm, courseSectionOptions);
    });
  }

  function resetCreateState() {
    setCreateForm(initialCreateForm);
    setCreateFieldErrors({});
    setCreateErrorMessage("");
    setCreateSuccessMessage("");
  }

  function toDateInputValue(value) {
    if (!value) return "";

    const text = String(value);
    const plainDate = text.match(/^(\d{4}-\d{2}-\d{2})$/);

    if (plainDate) return plainDate[1];

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const getPart = (type) =>
      parts.find((part) => part.type === type)?.value || "";

    return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
  }

  function handleEditRequest(requestItem) {
    setEditingRequest(requestItem);
    setActionRequest(null);
    const preferredWeekStart = toDateInputValue(
      requestItem.preferred_week_start,
    );
    const preferredWeekEnd = toDateInputValue(requestItem.preferred_week_end);
    const weekFields = resolveWeekFieldsFromDates(
      preferredWeekStart,
      preferredWeekEnd,
      semesterOptions,
      academicWeekOptions,
    );

    setCreateForm({
      course_section_id: String(requestItem.course_section_id || ""),
      requested_team_count: String(requestItem.requested_team_count || "1"),
      max_students_per_team: String(requestItem.max_students_per_team || ""),
      total_required_sessions: String(
        requestItem.total_required_sessions || "1",
      ),
      ...weekFields,
      preferred_week_start: preferredWeekStart,
      preferred_week_end: preferredWeekEnd,
      preferred_day_of_week: String(requestItem.preferred_day_of_week || ""),
      preferred_time_slot_id: String(requestItem.preferred_time_slot_id || ""),
      notes: requestItem.notes || "",
    });
    setCreateFieldErrors({});
    setCreateErrorMessage("");
    setIsCreateModalOpen(true);
  }

  function handleRequestAction(action, requestItem) {
    setActionRequest(null);
    setPendingAction({ action, requestItem });
  }

  async function executeRequestAction() {
    if (!pendingAction) return;

    const { action, requestItem } = pendingAction;
    const handlers = {
      submit: submitScheduleRequest,
      approve: approveScheduleRequest,
      cancel: cancelScheduleRequest,
      publish: publishScheduleRequest,
    };

    if (action === "submit") {
      const requestedTeamCount = toPositiveInteger(
        requestItem.requested_team_count,
      );
      const submitRequirement = getTeamCountRequirement(
        requestItem,
        courseSectionOptions,
      );

      if (
        requestedTeamCount &&
        submitRequirement &&
        requestedTeamCount < submitRequirement.minimumTeamCount
      ) {
        setPendingAction(null);
        setErrorMessage(buildTeamCountRequirementMessage(submitRequirement));
        return;
      }
    }

    try {
      setIsActionSubmitting(true);
      setErrorMessage("");
      await handlers[action](requestItem.id);
      setSuccessMessage(REQUEST_ACTION_META[action].success);
      setPendingAction(null);
      await loadScheduleRequests();
    } catch (error) {
      setPendingAction(null);
      setErrorMessage(
        getApiErrorMessage(error, "Không thể cập nhật trạng thái yêu cầu."),
      );
    } finally {
      setIsActionSubmitting(false);
    }
  }

  function handleOpenCreateModal() {
    setEditingRequest(null);
    setSuccessMessage("");

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
    setEditingRequest(null);
    if (isSubmittingCreate) {
      return;
    }

    setIsCreateModalOpen(false);
    resetCreateState();
  }

  async function handleCreateRequestSubmit(event) {
    event.preventDefault();

    const fieldErrors = validateCreateForm(
      createForm,
      currentUser,
      courseSectionOptions,
    );

    if (Object.keys(fieldErrors).length > 0) {
      setCreateFieldErrors(fieldErrors);
      setCreateErrorMessage(
        fieldErrors.form || "Vui lòng kiểm tra lại các trường chưa hợp lệ.",
      );
      return;
    }

    const payload = buildCreatePayload(createForm);

    try {
      setIsSubmittingCreate(true);
      setCreateFieldErrors({});
      setCreateErrorMessage("");
      setCreateSuccessMessage("");

      if (editingRequest) {
        await updateScheduleRequest(editingRequest.id, payload);
      } else {
        await createScheduleRequest(payload);
      }

      const message = editingRequest
        ? "Cập nhật yêu cầu xếp lịch thành công."
        : "Tạo yêu cầu xếp lịch thành công.";

      setSuccessMessage(message);
      setEditingRequest(null);
      setIsCreateModalOpen(false);
      resetCreateState();
      await loadScheduleRequests();
    } catch (error) {
      setCreateFieldErrors(getApiFieldErrors(error));
      setCreateErrorMessage(
        getFirstApiErrorMessage(
          error,
          editingRequest
            ? "Không thể cập nhật yêu cầu xếp lịch."
            : "Không thể tạo yêu cầu xếp lịch.",
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
  const constraintTeamOptions = useMemo(() => {
    const teamMap = new Map();

    requestItems.forEach((requestItem) => {
      const teams = Array.isArray(requestItem.raw?.practice_teams)
        ? requestItem.raw.practice_teams
        : [];

      teams.forEach((team) => {
        if (!team?.id || teamMap.has(String(team.id))) return;

        teamMap.set(String(team.id), {
          value: String(team.id),
          course_section_id:
            team.course_section_id || requestItem.course_section_id,
          label: `${requestItem.courseLabel} | Tổ ${team.team_no || team.id}${
            team.planned_size ? ` | ${team.planned_size} SV` : ""
          }`,
        });
      });
    });

    return [...teamMap.values()];
  }, [requestItems]);

  async function handleSimulateRegistration() {
    const confirmed = window.confirm("Xác nhận ?");

    if (!confirmed) {
      return;
    }

    try {
      setIsSimulatingRegistration(true);
      setErrorMessage("");

      const response = await simulateStudentRegistration();
      const result = response?.data || {};

      await handleReloadData();

      window.alert(
        `Mô phỏng đăng ký thành công.\n` +
          `Tổ thực hành: ${result.practice_team_count || 0}\n` +
          `Sinh viên: ${result.student_count || 0}\n` +
          `Gán mới: ${result.inserted_member_count || 0}\n` +
          `Đã tồn tại: ${result.skipped_existing_count || 0}`,
      );
    } catch (error) {
      setErrorMessage(error.message || "Không thể mô phỏng đăng ký sinh viên.");
    } finally {
      setIsSimulatingRegistration(false);
    }
  }

  const constraintSemesterOptions = useMemo(
    () =>
      semesterOptions
        .filter(
          (semester) => semester.academic_year === constraintForm.academic_year,
        )
        .sort(
          (firstSemester, secondSemester) =>
            Number(firstSemester.semester_no || 0) -
            Number(secondSemester.semester_no || 0),
        ),
    [constraintForm.academic_year, semesterOptions],
  );

  const constraintWeekOptions = useMemo(
    () =>
      academicWeekOptions.filter(
        (week) =>
          String(week.semester_id) === String(constraintForm.semester_id),
      ),
    [academicWeekOptions, constraintForm.semester_id],
  );

  const constraintStartWeek = useMemo(
    () => findWeekById(constraintWeekOptions, constraintForm.start_week_id),
    [constraintForm.start_week_id, constraintWeekOptions],
  );

  const constraintEndWeekOptions = useMemo(() => {
    if (!constraintStartWeek) return constraintWeekOptions;

    const startDate = getPlainDateValue(constraintStartWeek.start_date);

    return constraintWeekOptions.filter(
      (week) => getPlainDateValue(week.start_date) >= startDate,
    );
  }, [constraintStartWeek, constraintWeekOptions]);

  function updateConstraintForm(field, value) {
    setConstraintForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
      };

      if (field === "academic_year") {
        nextForm.semester_id = "";
        nextForm.start_week_id = "";
        nextForm.end_week_id = "";
        nextForm.start_date = "";
        nextForm.end_date = "";
      }

      if (field === "semester_id") {
        nextForm.start_week_id = "";
        nextForm.end_week_id = "";
        nextForm.start_date = "";
        nextForm.end_date = "";
      }

      if (field === "start_week_id") {
        const startWeek = findWeekById(academicWeekOptions, value);

        nextForm.start_date = getPlainDateValue(startWeek?.start_date);

        const currentEndWeek = findWeekById(
          academicWeekOptions,
          current.end_week_id,
        );

        if (
          !currentEndWeek ||
          getPlainDateValue(currentEndWeek.start_date) <
            getPlainDateValue(startWeek?.start_date)
        ) {
          nextForm.end_week_id = value;
          nextForm.end_date = getPlainDateValue(startWeek?.end_date);
        }
      }

      if (field === "end_week_id") {
        const endWeek = findWeekById(academicWeekOptions, value);

        nextForm.end_date = getPlainDateValue(endWeek?.end_date);
      }

      return nextForm;
    });

    setConstraintError("");
  }

  async function handleOpenConstraintModal() {
    setIsConstraintModalOpen(true);
    setConstraintError("");

    const [roomResponse, lecturerResponse] = await Promise.all([
      listRooms({ scope: "mvp" }).catch(() => ({ data: [] })),
      listMasterData("lecturers").catch(() => ({ data: [] })),
    ]);

    const rooms = Array.isArray(roomResponse?.data) ? roomResponse.data : [];
    const lecturers = Array.isArray(lecturerResponse?.data)
      ? lecturerResponse.data
      : [];

    const availableRooms = rooms
      .filter((room) => String(room.room_status).toLowerCase() === "available")
      .map((room) => ({
        value: room.room_code,
        label: room.room_code,
      }));

    setConstraintRooms(availableRooms);
    setConstraintLecturers(
      lecturers.map((lecturer) => ({
        value: String(lecturer.id),
        label: lecturer.full_name || lecturer.username || `GV #${lecturer.id}`,
      })),
    );
    setConstraintForm((current) => ({
      ...current,
      room_code: current.room_code || availableRooms[0]?.value || "",
      lecturer_user_id:
        current.lecturer_user_id || String(lecturers[0]?.id || ""),
      practice_team_id:
        current.practice_team_id || constraintTeamOptions[0]?.value || "",
    }));
  }

  function buildConstraintPayload() {
    const payload = {
      room_code: constraintForm.room_code,
      lecturer_user_id: toPositiveInteger(constraintForm.lecturer_user_id),
      practice_team_id: toPositiveInteger(constraintForm.practice_team_id),
      day_of_week: toPositiveInteger(constraintForm.day_of_week),
      time_slot: constraintForm.time_slot,
      start_date: constraintForm.start_date,
      end_date: constraintForm.end_date,
    };

    if (!payload.room_code) throw new Error("Vui lòng chọn phòng.");
    if (!payload.lecturer_user_id) throw new Error("Vui lòng chọn giảng viên.");
    if (!payload.practice_team_id)
      throw new Error("Vui lòng chọn nhóm/tổ thực hành.");
    if (!payload.day_of_week) throw new Error("Vui lòng chọn thứ.");
    if (!payload.time_slot) throw new Error("Vui lòng chọn ca học.");
    if (!constraintForm.academic_year) {
      throw new Error("Vui lòng chọn năm học.");
    }

    if (!constraintForm.semester_id) {
      throw new Error("Vui lòng chọn học kỳ.");
    }

    if (!constraintForm.start_week_id || !payload.start_date) {
      throw new Error("Vui lòng chọn tuần bắt đầu.");
    }

    if (!constraintForm.end_week_id || !payload.end_date) {
      throw new Error("Vui lòng chọn tuần kết thúc.");
    }

    if (payload.end_date < payload.start_date) {
      throw new Error("Tuần kết thúc phải sau hoặc bằng tuần bắt đầu.");
    }

    return payload;
  }

  function buildConstraintRows(results = []) {
    return results.map((item) => {
      const meta = CONSTRAINT_RULE_META[item.code] || {
        label: item.code,
        meaning: "Ràng buộc chưa được mô tả.",
        suggestion: "Kiểm tra lại dữ liệu đầu vào.",
      };

      return {
        id: item.code,
        code: item.code,
        label: meta.label,
        meaning: meta.meaning,
        passed: item.passed,
        message: item.message,
        suggestion: meta.suggestion,
      };
    });
  }

  async function handleCheckConstraint(event) {
    event.preventDefault();

    try {
      setIsCheckingConstraint(true);
      setConstraintError("");

      const response = await checkScheduleConstraints(buildConstraintPayload());
      const apiData = response?.data || {};
      setConstraintData(apiData);
      setConstraintRows(buildConstraintRows(apiData.results || []));
    } catch (error) {
      setConstraintError(
        getApiErrorMessage(error, "Không thể kiểm tra ràng buộc."),
      );
    } finally {
      setIsCheckingConstraint(false);
    }
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
        {successMessage ? (
          <div className="commonStateBox" role="status">
            <h3 className="commonStateTitle">Thành công</h3>
            <p className="commonStateText">{successMessage}</p>
          </div>
        ) : null}

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
              {errorMessage ? (
                <StatusBadge variant="danger">
                  Không thể tải dữ liệu
                </StatusBadge>
              ) : null}
              <ButtonUI
                tone="primary"
                shape="rounded"
                size="sm"
                type="button"
                onClick={handleOpenConstraintModal}
              >
                Kiểm tra ràng buộc
              </ButtonUI>
              <ButtonUI
                tone="primary"
                shape="rounded"
                size="sm"
                onClick={handleOpenCreateModal}
              >
                Yêu cầu xếp lịch
              </ButtonUI>

              <ButtonUI
                tone="primary"
                shape="rounded"
                type="button"
                onClick={handleResetFilters}
              >
                Đặt lại bộ lọc
              </ButtonUI>

              <ButtonUI
                tone="primary"
                shape="rounded"
                type="button"
                onClick={handleReloadData}
                disabled={isLoadingRequests}
              >
                Đồng bộ lại
              </ButtonUI>

              <ButtonUI
                tone="primary"
                shape="rounded"
                type="button"
                onClick={handleSimulateRegistration}
                disabled={isLoadingRequests || isSimulatingRegistration}
              >
                {isSimulatingRegistration
                  ? "Đang mô phỏng..."
                  : "Mô phỏng đăng ký"}
              </ButtonUI>
            </div>
          </div>

          <div className="card roomTableCard">
            <DataTable
              columns={requestColumns}
              rows={requestRows}
              loading={isLoadingRequests}
              error={errorMessage}
              emptyTitle="Chưa có yêu cầu xếp lịch"
              emptyDescription="Chưa có dữ liệu phù hợp với bộ lọc hiện tại."
            />
          </div>
        </div>
      </section>
      {isConstraintModalOpen ? (
        <div className="modalOverlay" role="presentation">
          <section
            className="modalPanel scheduleRequestModalPanel scheduleConstraintModalPanel"
            role="dialog"
            aria-modal="true"
          >
            <div className="modalHeader">
              <div>
                <p className="modalEyebrow">Kiểm tra ràng buộc</p>
                <h3 className="modalTitle">
                  Kiểm tra ràng buộc lịch thực hành
                </h3>
              </div>
              <button
                type="button"
                className="modalCloseButton"
                onClick={() => setIsConstraintModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modalBody scheduleConstraintModalBody">
              <section className="scheduleConstraintLayout">
                <form
                  className="scheduleConstraintForm"
                  onSubmit={handleCheckConstraint}
                >
                  <div className="scheduleConstraintFormGrid">
                    <label className="trainingField scheduleConstraintField">
                      Phòng
                      <select
                        className="input"
                        value={constraintForm.room_code}
                        onChange={(e) =>
                          updateConstraintForm("room_code", e.target.value)
                        }
                      >
                        <option value="">Chọn phòng</option>
                        {constraintRooms.map((room) => (
                          <option key={room.value} value={room.value}>
                            {room.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="trainingField scheduleConstraintField">
                      Giảng viên
                      <select
                        className="input"
                        value={constraintForm.lecturer_user_id}
                        onChange={(e) =>
                          updateConstraintForm(
                            "lecturer_user_id",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Chọn giảng viên</option>
                        {constraintLecturers.map((lecturer) => (
                          <option key={lecturer.value} value={lecturer.value}>
                            {lecturer.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="trainingField scheduleConstraintField">
                      Nhóm / tổ thực hành
                      <select
                        className="input"
                        value={constraintForm.practice_team_id}
                        onChange={(e) =>
                          updateConstraintForm(
                            "practice_team_id",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Chọn nhóm/tổ</option>
                        {constraintTeamOptions.map((team) => (
                          <option key={team.value} value={team.value}>
                            {team.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="trainingField scheduleConstraintField">
                      Thứ
                      <select
                        className="input"
                        value={constraintForm.day_of_week}
                        onChange={(e) =>
                          updateConstraintForm("day_of_week", e.target.value)
                        }
                      >
                        <option value="">Không chọn</option>
                        <option value="2">Thứ 2</option>
                        <option value="3">Thứ 3</option>
                        <option value="4">Thứ 4</option>
                        <option value="5">Thứ 5</option>
                        <option value="6">Thứ 6</option>
                        <option value="7">Thứ 7</option>
                      </select>
                    </label>

                    <label className="trainingField scheduleConstraintField">
                      Ca học
                      <select
                        className="input"
                        value={constraintForm.time_slot}
                        onChange={(e) =>
                          updateConstraintForm("time_slot", e.target.value)
                        }
                      >
                        <option value="">
                          {timeSlotOptions.length
                            ? "Không chọn"
                            : "Chưa có ca học"}
                        </option>
                        {timeSlotOptions.map((slot) => (
                          <option key={slot.id} value={slot.scheduleValue}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="trainingField scheduleConstraintField">
                      Năm học
                      <select
                        className="input"
                        value={constraintForm.academic_year}
                        onChange={(event) =>
                          updateConstraintForm(
                            "academic_year",
                            event.target.value,
                          )
                        }
                      >
                        <option value="">
                          {academicYearOptions.length
                            ? "Chọn năm học"
                            : "Chưa có năm học"}
                        </option>
                        {academicYearOptions.map((academicYear) => (
                          <option key={academicYear} value={academicYear}>
                            {academicYear}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="trainingField scheduleConstraintField">
                      Học kỳ
                      <select
                        className="input"
                        value={constraintForm.semester_id}
                        onChange={(event) =>
                          updateConstraintForm(
                            "semester_id",
                            event.target.value,
                          )
                        }
                        disabled={!constraintForm.academic_year}
                      >
                        <option value="">
                          {constraintForm.academic_year
                            ? "Chọn học kỳ"
                            : "Chọn năm học trước"}
                        </option>
                        {constraintSemesterOptions.map((semester) => (
                          <option key={semester.id} value={semester.id}>
                            {semester.semester_name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="trainingField scheduleConstraintField">
                      Từ tuần
                      <select
                        className="input"
                        value={constraintForm.start_week_id}
                        onChange={(event) =>
                          updateConstraintForm(
                            "start_week_id",
                            event.target.value,
                          )
                        }
                        disabled={!constraintForm.semester_id}
                      >
                        <option value="">
                          {constraintForm.semester_id
                            ? "Chọn tuần bắt đầu"
                            : "Chọn học kỳ trước"}
                        </option>
                        {constraintWeekOptions.map((week) => (
                          <option key={week.id} value={week.id}>
                            {buildAcademicWeekLabel(week)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="trainingField scheduleConstraintField">
                      Đến tuần
                      <select
                        className="input"
                        value={constraintForm.end_week_id}
                        onChange={(event) =>
                          updateConstraintForm(
                            "end_week_id",
                            event.target.value,
                          )
                        }
                        disabled={!constraintForm.start_week_id}
                      >
                        <option value="">
                          {constraintForm.start_week_id
                            ? "Chọn tuần kết thúc"
                            : "Chọn tuần bắt đầu trước"}
                        </option>
                        {constraintEndWeekOptions.map((week) => (
                          <option key={week.id} value={week.id}>
                            {buildAcademicWeekLabel(week)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {constraintError ? (
                    <p className="scheduleRequestAlert scheduleRequestAlertDanger">
                      {constraintError}
                    </p>
                  ) : null}

                  <div className="modalActions scheduleConstraintActions">
                    <ButtonUI
                      type="submit"
                      tone="primary"
                      shape="rounded"
                      disabled={isCheckingConstraint}
                    >
                      {isCheckingConstraint
                        ? "Đang kiểm tra..."
                        : "Kiểm tra ràng buộc"}
                    </ButtonUI>
                    <ButtonUI
                      type="button"
                      tone="primary"
                      shape="rounded"
                      onClick={() => {
                        setConstraintRows([]);
                        setConstraintData(null);
                        setConstraintError("");
                      }}
                    >
                      Xóa kết quả
                    </ButtonUI>
                  </div>
                </form>

                <aside className="commonActionCard scheduleConstraintSummaryCard">
                  <p className="commonEyebrow">Kết quả tổng quan</p>
                  <div className="scheduleConstraintSummaryGrid">
                    <DetailGridItem
                      label="Tổng"
                      value={constraintRows.length || CONSTRAINT_RULE_COUNT}
                    />
                    <DetailGridItem
                      label="Đạt"
                      value={
                        constraintRows.filter((r) => r.passed === true).length
                      }
                    />
                    <DetailGridItem
                      label="Không đạt"
                      value={
                        constraintRows.filter((r) => r.passed === false).length
                      }
                    />
                    <DetailGridItem
                      label="Chưa trả"
                      value={Math.max(
                        CONSTRAINT_RULE_COUNT - constraintRows.length,
                        0,
                      )}
                    />
                  </div>
                  {constraintData ? (
                    <StatusBadge
                      variant={constraintData.passed ? "success" : "danger"}
                    >
                      {constraintData.passed ? "Hợp lệ" : "Không hợp lệ"}
                    </StatusBadge>
                  ) : (
                    <p className="commonStateText">Chưa có kết quả kiểm tra.</p>
                  )}
                </aside>
              </section>

              {constraintRows.length ? (
                <div className="scheduleConstraintTableWrap">
                  <DataTable
                    columns={[
                      { key: "label", label: "Ràng buộc" },
                      { key: "meaning", label: "Ý nghĩa" },
                      {
                        key: "passed",
                        label: "Kết quả",
                        render: (value) => (
                          <StatusBadge variant={value ? "success" : "danger"}>
                            {value ? "Đạt" : "Không đạt"}
                          </StatusBadge>
                        ),
                      },
                      { key: "message", label: "Thông báo" },
                      { key: "suggestion", label: "Gợi ý xử lý" },
                    ]}
                    rows={constraintRows}
                    pageSize={8}
                    enablePagination={false}
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
      <ScheduleRequestDetailDialog
        isOpen={isDetailModalOpen}
        requestDetail={selectedRequestDetail}
        timeSlotOptions={timeSlotOptions}
        isLoading={isLoadingRequestDetail}
        errorMessage={detailErrorMessage}
        onClose={handleCloseRequestDetail}
      />

      <RequestActionDialog
        requestItem={actionRequest}
        isSubmitting={isActionSubmitting}
        onEdit={handleEditRequest}
        onAction={handleRequestAction}
        onClose={() => setActionRequest(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={
          pendingAction ? REQUEST_ACTION_META[pendingAction.action].title : ""
        }
        message={
          pendingAction
            ? `Yêu cầu #${pendingAction.requestItem.id} sẽ được cập nhật cùng toàn bộ lịch thực hành liên quan.`
            : ""
        }
        confirmLabel={
          pendingAction
            ? REQUEST_ACTION_META[pendingAction.action].confirmLabel
            : "Xác nhận"
        }
        tone={
          pendingAction
            ? REQUEST_ACTION_META[pendingAction.action].tone || "primary"
            : "primary"
        }
        isSubmitting={isActionSubmitting}
        onCancel={() => setPendingAction(null)}
        onConfirm={executeRequestAction}
      />

      {isCreateModalOpen ? (
        <div className="modalOverlay" role="presentation">
          <section
            className="modalPanel scheduleRequestModalPanel"
            role="dialog"
            aria-modal="true"
          >
            <div className="modalHeader">
              <div>
                <p className="modalEyebrow">
                  {editingRequest ? "Chỉnh sửa yêu cầu" : "Tạo yêu cầu mới"}
                </p>
                <h3 className="modalTitle">
                  {editingRequest
                    ? "Chỉnh sửa yêu cầu xếp lịch"
                    : "Yêu cầu xếp lịch thực hành"}
                </h3>
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
                    <select
                      className="input"
                      value={createForm.course_section_id}
                      onChange={(event) =>
                        updateCreateForm(
                          "course_section_id",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    >
                      <option value="">
                        {courseSectionOptions.length
                          ? "Chọn lớp học phần"
                          : "Không có lớp học phần"}
                      </option>

                      {courseSectionOptions.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.section_code} {section.course_name}
                        </option>
                      ))}
                    </select>
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
                      readOnly
                      disabled={isSubmittingCreate}
                    />
                    {teamCountRequirement ? (
                      <span className="commonStateText">
                        Tự tính theo {teamCountRequirement.enrollment} SV đăng
                        ký, tối đa {teamCountRequirement.maxStudentsPerTeam}{" "}
                        SV/tổ nên cần {teamCountRequirement.minimumTeamCount}{" "}
                        tổ.
                      </span>
                    ) : (
                      <span className="commonStateText">
                        Chọn lớp học phần và nhập số sinh viên tối đa mỗi tổ để
                        hệ thống tự tính.
                      </span>
                    )}
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
                    Số sinh viên tối đa mỗi tổ
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
                    Năm học
                    <select
                      className="input"
                      value={createForm.academic_year}
                      onChange={(event) =>
                        updateCreateForm("academic_year", event.target.value)
                      }
                      disabled={isSubmittingCreate}
                    >
                      <option value="">
                        {academicYearOptions.length
                          ? "Chọn năm học"
                          : "Chưa có năm học"}
                      </option>
                      {academicYearOptions.map((academicYear) => (
                        <option key={academicYear} value={academicYear}>
                          {academicYear}
                        </option>
                      ))}
                    </select>
                    {createFieldErrors.academic_year ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.academic_year}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Học kỳ
                    <select
                      className="input"
                      value={createForm.semester_id}
                      onChange={(event) =>
                        updateCreateForm("semester_id", event.target.value)
                      }
                      disabled={isSubmittingCreate || !createForm.academic_year}
                    >
                      <option value="">
                        {createForm.academic_year
                          ? "Chọn học kỳ"
                          : "Chọn năm học trước"}
                      </option>
                      {createSemesterOptions.map((semester) => (
                        <option key={semester.id} value={semester.id}>
                          {semester.semester_name}
                        </option>
                      ))}
                    </select>
                    {createFieldErrors.semester_id ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.semester_id}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Từ tuần
                    <select
                      className="input"
                      value={createForm.start_week_id}
                      onChange={(event) =>
                        updateCreateForm("start_week_id", event.target.value)
                      }
                      disabled={isSubmittingCreate || !createForm.semester_id}
                    >
                      <option value="">
                        {createForm.semester_id
                          ? "Chọn tuần bắt đầu"
                          : "Chọn học kỳ trước"}
                      </option>
                      {createWeekOptions.map((week) => (
                        <option key={week.id} value={week.id}>
                          {buildAcademicWeekLabel(week)}
                        </option>
                      ))}
                    </select>
                    {createFieldErrors.preferred_week_start ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.preferred_week_start}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField">
                    Đến tuần
                    <select
                      className="input"
                      value={createForm.end_week_id}
                      onChange={(event) =>
                        updateCreateForm("end_week_id", event.target.value)
                      }
                      disabled={isSubmittingCreate || !createForm.start_week_id}
                    >
                      <option value="">
                        {createForm.start_week_id
                          ? "Chọn tuần kết thúc"
                          : "Chọn tuần bắt đầu trước"}
                      </option>
                      {createEndWeekOptions.map((week) => (
                        <option key={week.id} value={week.id}>
                          {buildAcademicWeekLabel(week)}
                        </option>
                      ))}
                    </select>
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
                    Ca học
                    <select
                      className="input"
                      value={createForm.preferred_time_slot_id}
                      onChange={(event) =>
                        updateCreateForm(
                          "preferred_time_slot_id",
                          event.target.value,
                        )
                      }
                      disabled={isSubmittingCreate}
                    >
                      <option value="">
                        {timeSlotOptions.length
                          ? "Không chọn"
                          : "Chưa có ca học"}
                      </option>
                      {createForm.preferred_time_slot_id &&
                      !timeSlotOptions.some(
                        (slot) =>
                          slot.id === String(createForm.preferred_time_slot_id),
                      ) ? (
                        <option value={createForm.preferred_time_slot_id}>
                          {getTimeSlotLabelById(
                            timeSlotOptions,
                            createForm.preferred_time_slot_id,
                          )}
                        </option>
                      ) : null}
                      {timeSlotOptions.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                    {createFieldErrors.preferred_time_slot_id ? (
                      <span className="fieldErrorText">
                        {createFieldErrors.preferred_time_slot_id}
                      </span>
                    ) : null}
                  </label>

                  <label className="trainingField trainingFieldFull">
                    Ghi chú
                    <textarea
                      className="textarea trainingTextarea"
                      value={createForm.notes}
                      placeholder="Nhập yêu cầu phòng, thiết bị hoặc ghi chú bổ sung..."
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
                  {isSubmittingCreate
                    ? "Đang lưu..."
                    : editingRequest
                      ? "Lưu yêu cầu"
                      : "Tạo yêu cầu"}
                </ButtonUI>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
