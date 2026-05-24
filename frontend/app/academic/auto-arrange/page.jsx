"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DataTable from "../../../components/common/DataTable.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import {
  ButtonUI,
  RefreshButton,
} from "../../../components/common/buttonUI.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../components/common/UiState.jsx";
import { clearAuth } from "../../../lib/authStorage";
import {
  autoArrange,
  createScheduleFromOption,
} from "../../../services/scheduleService.js";
import { listScheduleRequests } from "../../../services/scheduleRequestService";

const INITIAL_FORM = {
  schedule_request_id: "",
  preferred_day_of_week: "",
  preferred_time_slot: "",
};

const DAY_OPTIONS = [
  { value: "", label: "Không ưu tiên" },
  { value: "2", label: "Thứ 2" },
  { value: "3", label: "Thứ 3" },
  { value: "4", label: "Thứ 4" },
  { value: "5", label: "Thứ 5" },
  { value: "6", label: "Thứ 6" },
];

const TIME_SLOT_OPTIONS = [
  { value: "", label: "Không ưu tiên" },
  { value: "1-4", label: "Tiết 1-4" },
  { value: "7-10", label: "Tiết 7-10" },
];

const EMPTY_FAILED_REASON_SAMPLES = [
  {
    room_code: "2B11",
    day_of_week: 4,
    time_slot: "7-10",
    failed_rules: [
      { code: "ROOM_CONFLICT", message: "Phòng đã có lịch trùng." },
    ],
  },
  {
    room_code: "2B21",
    day_of_week: 4,
    time_slot: "7-10",
    failed_rules: [
      {
        code: "CAPACITY_OK",
        message: "Sĩ số tổ thực hành lớn hơn số máy khả dụng.",
      },
    ],
  },
  {
    room_code: "2B31",
    day_of_week: 4,
    time_slot: "7-10",
    failed_rules: [
      {
        code: "ROOM_STATUS",
        message: "Phòng không ở trạng thái available.",
      },
    ],
  },
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

function toPositiveInteger(value) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
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

function getApiDetailText(detail) {
  if (typeof detail === "string") {
    return detail;
  }

  return (
    detail?.msg ||
    detail?.message ||
    detail?.error ||
    detail?.detail ||
    JSON.stringify(detail)
  );
}

function getApiErrorMessage(error, fallbackMessage) {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return error.details.map(getApiDetailText).join(", ");
  }

  if (error?.details && typeof error.details === "object") {
    return Object.values(error.details)
      .filter(Boolean)
      .map(getApiDetailText)
      .join(", ");
  }

  return error?.message || fallbackMessage;
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
    request_status:
      requestItem?.request_status || requestItem?.status || "draft",
    requested_by_name: requestItem?.requested_by_name,
    notes: requestItem?.notes,
    raw: requestItem,
  };
}

function normalizeRequestList(response) {
  const rawItems = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.requests)
      ? response.data.requests
      : [];

  return rawItems.map(normalizeScheduleRequestItem);
}

function normalizeReasons(reasons) {
  if (!Array.isArray(reasons)) {
    return [];
  }

  return reasons
    .map((reason) => {
      if (typeof reason === "string") {
        return reason;
      }

      return reason?.message || reason?.detail || reason?.code || "";
    })
    .filter(Boolean);
}

function normalizeOption(option, index) {
  const roomCode = option?.room_code || option?.roomCode || "";
  const dayOfWeek = Number(option?.day_of_week || option?.dayOfWeek || 0);
  const timeSlot = option?.time_slot || option?.timeSlot || "";
  const startDate = option?.start_date || option?.startDate || "";
  const endDate = option?.end_date || option?.endDate || startDate;
  const score = Number(option?.score || 0);

  return {
    optionKey:
      option?.id ||
      `${roomCode}-${dayOfWeek}-${timeSlot}-${startDate}-${index + 1}`,
    rank: index + 1,
    room_code: roomCode,
    day_of_week: dayOfWeek,
    time_slot: timeSlot,
    start_date: startDate,
    end_date: endDate,
    score,
    reasons: normalizeReasons(option?.reasons),
    practice_team_id: option?.practice_team_id,
    lecturer_user_id: option?.lecturer_user_id,
    required_software_ids: option?.required_software_ids,
    available_slot_id: option?.available_slot_id,
    notes: option?.notes,
    raw: option,
  };
}

function normalizeAutoArrangeData(response) {
  const apiData = response?.data || {};
  const rawOptions = Array.isArray(apiData?.ranked_options)
    ? apiData.ranked_options
    : [];

  const rankedOptions = rawOptions
    .map(normalizeOption)
    .sort((firstOption, secondOption) => {
      if (secondOption.score !== firstOption.score) {
        return secondOption.score - firstOption.score;
      }

      return firstOption.rank - secondOption.rank;
    })
    .slice(0, 3)
    .map((option, index) => ({
      ...option,
      rank: index + 1,
    }));

  return {
    request_id: apiData?.request_id || null,
    auto_arrange_status:
      apiData?.auto_arrange_status ||
      (rankedOptions.length > 0 ? "success" : "no_valid_option"),
    selected_option: apiData?.selected_option || rankedOptions[0] || null,
    ranked_options: rankedOptions,
    failed_reasons: Array.isArray(apiData?.failed_reasons)
      ? apiData.failed_reasons
      : [],
  };
}

function getScoreBadgeStyle(score) {
  if (score >= 100) {
    return {
      background: "#064e3b",
      color: "#ffffff",
    };
  }

  if (score >= 75) {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  return {
    background: "#fef3c7",
    color: "#92400e",
  };
}

function getScoreLabel(score) {
  if (score >= 100) {
    return "Rất cao";
  }

  if (score >= 75) {
    return "Tốt";
  }

  return "Cần cân nhắc";
}

function formatFailedRule(rule) {
  if (typeof rule === "string") {
    return rule;
  }

  const code = rule?.code || "UNKNOWN_RULE";
  const message = rule?.message ? ` - ${rule.message}` : "";

  return `${code}${message}`;
}

function normalizeFailedReasons(failedReasons) {
  const source =
    Array.isArray(failedReasons) && failedReasons.length > 0
      ? failedReasons
      : EMPTY_FAILED_REASON_SAMPLES;

  return source.map((item, index) => ({
    id: `${item?.room_code || "ROOM"}-${item?.day_of_week || "DAY"}-${
      item?.time_slot || "SLOT"
    }-${index + 1}`,
    room_code: item?.room_code || "—",
    day_of_week: item?.day_of_week,
    time_slot: item?.time_slot || "—",
    failed_rules: Array.isArray(item?.failed_rules)
      ? item.failed_rules
      : Array.isArray(item?.rules)
        ? item.rules
        : [],
  }));
}

function buildAutoArrangePayload(formData, selectedRequest) {
  const requestId = toPositiveInteger(formData.schedule_request_id);

  if (!requestId) {
    throw new Error("Vui lòng chọn yêu cầu xếp lịch trước khi Auto Arrange.");
  }

  const payload = {
    request_id: requestId,
    schedule_request_id: requestId,
  };

  const preferredDay = toPositiveInteger(formData.preferred_day_of_week);
  if (preferredDay) {
    payload.preferred_day_of_week = preferredDay;
  }

  if (formData.preferred_time_slot) {
    payload.preferred_time_slot = formData.preferred_time_slot;
  }

  if (selectedRequest?.course_section_id) {
    payload.course_section_id = selectedRequest.course_section_id;
  }

  if (selectedRequest?.preferred_week_start) {
    payload.start_date = selectedRequest.preferred_week_start;
  }

  if (selectedRequest?.preferred_week_end) {
    payload.end_date = selectedRequest.preferred_week_end;
  }

  return payload;
}

function buildCreateOptionPayload(option) {
  const rawOption =
    option?.raw && typeof option.raw === "object" ? option.raw : {};

  const payload = {
    ...rawOption,
    room_code: option.room_code,
    day_of_week: option.day_of_week,
    time_slot: option.time_slot,
    start_date: option.start_date,
    end_date: option.end_date,
  };

  if (option.practice_team_id) {
    payload.practice_team_id = option.practice_team_id;
  }

  if (option.lecturer_user_id) {
    payload.lecturer_user_id = option.lecturer_user_id;
  }

  if (Array.isArray(option.required_software_ids)) {
    payload.required_software_ids = option.required_software_ids;
  }

  if (option.available_slot_id) {
    payload.available_slot_id = option.available_slot_id;
  }

  payload.notes =
    option.notes ||
    rawOption.notes ||
    `Tạo từ Auto Arrange - option #${option.rank}, score ${option.score}`;

  delete payload.id;
  delete payload.optionKey;
  delete payload.rank;
  delete payload.reasons;
  delete payload.raw;
  delete payload.score;
  delete payload.constraintResult;
  delete payload.constraint_result;

  return payload;
}

function Toast({ toast, onClose }) {
  if (!toast) {
    return null;
  }

  const isSuccess = toast.type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 120,
        width: "min(420px, calc(100vw - 40px))",
        padding: 16,
        borderRadius: 18,
        border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
        background: isSuccess ? "#f0fdf4" : "#fef2f2",
        color: isSuccess ? "#166534" : "#991b1b",
        boxShadow: "0 20px 48px rgba(15, 23, 42, 0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <strong>{isSuccess ? "Thành công" : "Có lỗi"}</strong>
          <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>{toast.message}</p>
        </div>

        <button
          type="button"
          aria-label="Đóng thông báo"
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ReasonsModal({ option, onClose }) {
  if (!option) {
    return null;
  }

  return (
    <div className="modalOverlay" role="presentation" onClick={onClose}>
      <section
        className="modalPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auto-arrange-reasons-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modalHeader">
          <div>
            <p className="modalEyebrow">Lý do đề xuất</p>
            <h2 id="auto-arrange-reasons-title" className="modalTitle">
              Option #{option.rank} · {option.room_code}
            </h2>
          </div>

          <button
            type="button"
            className="modalCloseButton"
            aria-label="Đóng"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="modalBody">
          <p className="modalText">
            {formatDayOfWeek(option.day_of_week)} · Tiết {option.time_slot} ·{" "}
            {formatDate(option.start_date)} đến {formatDate(option.end_date)}
          </p>

          {option.reasons.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
              {option.reasons.map((reason, index) => (
                <li key={`${option.optionKey}-reason-${index}`}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="modalText">
              Backend chưa trả danh sách reasons cho phương án này.
            </p>
          )}
        </div>

        <footer className="modalActions">
          <ButtonUI tone="secondary" shape="rounded" onClick={onClose}>
            Đóng
          </ButtonUI>
        </footer>
      </section>
    </div>
  );
}

export default function AutoArrangePage() {
  const router = useRouter();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");

  const [autoArrangeData, setAutoArrangeData] = useState(null);
  const [isArranging, setIsArranging] = useState(false);
  const [arrangeError, setArrangeError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [selectedReasonOption, setSelectedReasonOption] = useState(null);
  const [creatingOptionKey, setCreatingOptionKey] = useState("");
  const [toast, setToast] = useState(null);

  const selectedRequest = useMemo(
    () =>
      scheduleRequests.find(
        (requestItem) =>
          String(requestItem.id) === formData.schedule_request_id,
      ) || null,
    [formData.schedule_request_id, scheduleRequests],
  );

  const filteredRequestOptions = useMemo(() => {
    return scheduleRequests.filter((requestItem) => {
      const status = normalizeText(requestItem.request_status);

      return !["cancelled", "rejected", "published"].includes(status);
    });
  }, [scheduleRequests]);

  const rankedOptions = autoArrangeData?.ranked_options || [];
  const failedReasons = normalizeFailedReasons(autoArrangeData?.failed_reasons);

  const isNoValidOption =
    autoArrangeData?.auto_arrange_status === "no_valid_option" ||
    (autoArrangeData && rankedOptions.length === 0);

  const canSubmit = Boolean(formData.schedule_request_id) && !isArranging;

  const columns = useMemo(
    () => [
      {
        key: "rank",
        label: "Hạng",
        render: (value) => <strong>#{value}</strong>,
      },
      {
        key: "room_code",
        label: "Phòng",
        render: (value) => <strong>{value}</strong>,
      },
      {
        key: "day_of_week",
        label: "Thứ",
        render: (value) => formatDayOfWeek(value),
      },
      {
        key: "time_slot",
        label: "Ca",
        render: (value) => `Tiết ${value}`,
      },
      {
        key: "start_date",
        label: "Thời gian",
        render: (value, row) =>
          `${formatDate(value)} → ${formatDate(row.end_date)}`,
      },
      {
        key: "score",
        label: "Score",
        render: (value) => (
          <span
            className="commonBadge"
            style={getScoreBadgeStyle(Number(value))}
            title={getScoreLabel(Number(value))}
          >
            {value} · {getScoreLabel(Number(value))}
          </span>
        ),
      },
      {
        key: "reasons",
        label: "Lý do",
        render: (_, row) => (
          <ButtonUI
            tone="outline"
            size="sm"
            shape="rounded"
            onClick={() => setSelectedReasonOption(row)}
          >
            Xem lý do
          </ButtonUI>
        ),
      },
      {
        key: "actions",
        label: "Thao tác",
        render: (_, row) => (
          <ButtonUI
            tone="primary"
            size="sm"
            shape="rounded"
            onClick={() => handleUseOption(row)}
            disabled={Boolean(creatingOptionKey)}
          >
            {creatingOptionKey === row.optionKey
              ? "Đang tạo..."
              : "Use this option"}
          </ButtonUI>
        ),
      },
    ],
    [creatingOptionKey],
  );

  useEffect(() => {
    loadScheduleRequests();
  }, []);

  function handleAuthError(error) {
    if (error?.status === 401 || error?.status === 403) {
      clearAuth();
      router.replace("/login");
      return true;
    }

    return false;
  }

  async function loadScheduleRequests() {
    try {
      setRequestsLoading(true);
      setRequestError("");

      const response = await listScheduleRequests();
      setScheduleRequests(normalizeRequestList(response));
    } catch (error) {
      if (handleAuthError(error)) {
        return;
      }

      setRequestError(
        getApiErrorMessage(error, "Không thể tải danh sách yêu cầu xếp lịch."),
      );
    } finally {
      setRequestsLoading(false);
    }
  }

  function updateFormData(fieldName, value) {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));

    setValidationError("");
    setArrangeError("");
  }

  async function submitAutoArrange() {
    try {
      setIsArranging(true);
      setArrangeError("");
      setValidationError("");
      setAutoArrangeData(null);

      const payload = buildAutoArrangePayload(formData, selectedRequest);
      const response = await autoArrange(payload);
      setAutoArrangeData(normalizeAutoArrangeData(response));
    } catch (error) {
      if (handleAuthError(error)) {
        return;
      }

      if (!formData.schedule_request_id) {
        setValidationError("Vui lòng chọn yêu cầu xếp lịch.");
        return;
      }

      setArrangeError(getApiErrorMessage(error, "Không thể xếp lịch tự động."));
    } finally {
      setIsArranging(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.schedule_request_id) {
      setValidationError("Vui lòng chọn yêu cầu xếp lịch.");
      return;
    }

    await submitAutoArrange();
  }

  async function handleUseOption(option) {
    const requestId = toPositiveInteger(formData.schedule_request_id);

    if (!requestId) {
      setValidationError("Vui lòng chọn yêu cầu xếp lịch.");
      return;
    }

    const confirmed = window.confirm("Tạo lịch draft với phương án này?");

    if (!confirmed) {
      return;
    }

    try {
      setCreatingOptionKey(option.optionKey);
      setToast(null);

      await createScheduleFromOption(
        buildCreateOptionPayload(option),
        requestId,
      );

      setToast({
        type: "success",
        message: "Đã tạo lịch draft.",
      });

      window.setTimeout(() => {
        router.replace("/academic/schedules");
      }, 650);
    } catch (error) {
      if (handleAuthError(error)) {
        return;
      }

      setToast({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Không thể tạo lịch draft từ phương án đã chọn.",
        ),
      });
    } finally {
      setCreatingOptionKey("");
    }
  }

  function resetResult() {
    setAutoArrangeData(null);
    setArrangeError("");
    setValidationError("");
    setToast(null);
  }

  return (
    <section className="adminPageStack">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ReasonsModal
        option={selectedReasonOption}
        onClose={() => setSelectedReasonOption(null)}
      />

      <div className="commonPageHeader">
        <div className="commonPageHeaderBody">
          <p className="commonEyebrow">Academic · Auto Arrange</p>
          <h1 className="commonTitle">Xếp lịch tự động</h1>
          <p className="commonDescription">
            Chọn yêu cầu xếp lịch, nhập ưu tiên ngày/ca nếu có, sau đó hệ thống
            gọi API thật để trả về top 3 phương án phòng máy được xếp hạng.
          </p>
        </div>

        <div className="commonHeaderActions">
          <StatusBadge variant="info">
            {rankedOptions.length > 0
              ? `${rankedOptions.length} option`
              : "Sẵn sàng"}
          </StatusBadge>
        </div>
      </div>

      <section
        className="commonGrid"
        style={{
          gridTemplateColumns: "minmax(0, 0.9fr) minmax(320px, 0.45fr)",
          alignItems: "start",
        }}
      >
        <form className="card" onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <p className="commonEyebrow">Form input</p>
              <h2
                style={{
                  margin: "6px 0 0",
                  color: "#0f172a",
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                Thông tin xếp lịch
              </h2>
            </div>

            {requestsLoading ? (
              <LoadingState
                title="Đang tải yêu cầu xếp lịch..."
                description="Danh sách dùng để chọn schedule_request_id."
              />
            ) : requestError ? (
              <ErrorState
                title="Không thể tải yêu cầu xếp lịch"
                error={requestError}
                onRetry={loadScheduleRequests}
              />
            ) : (
              <>
                <label className="label">
                  Yêu cầu xếp lịch <span style={{ color: "#b91c1c" }}>*</span>
                  <select
                    className="select"
                    value={formData.schedule_request_id}
                    onChange={(event) =>
                      updateFormData("schedule_request_id", event.target.value)
                    }
                    disabled={isArranging}
                  >
                    <option value="">Chọn schedule request</option>
                    {filteredRequestOptions.map((requestItem) => (
                      <option key={requestItem.id} value={requestItem.id}>
                        #{requestItem.id} · {requestItem.courseLabel} ·{" "}
                        {requestItem.request_status}
                      </option>
                    ))}
                  </select>
                </label>

                {!formData.schedule_request_id || validationError ? (
                  <p
                    role="alert"
                    style={{
                      margin: "-6px 0 4px",
                      color: "#b91c1c",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {validationError ||
                      "Bắt buộc chọn schedule_request_id để bật nút Auto Arrange."}
                  </p>
                ) : null}

                <div className="commonGrid commonGrid2">
                  <label className="label">
                    Ngày ưu tiên
                    <select
                      className="select"
                      value={formData.preferred_day_of_week}
                      onChange={(event) =>
                        updateFormData(
                          "preferred_day_of_week",
                          event.target.value,
                        )
                      }
                      disabled={isArranging}
                    >
                      {DAY_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="label">
                    Ca ưu tiên
                    <select
                      className="select"
                      value={formData.preferred_time_slot}
                      onChange={(event) =>
                        updateFormData(
                          "preferred_time_slot",
                          event.target.value,
                        )
                      }
                      disabled={isArranging}
                    >
                      {TIME_SLOT_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <ButtonUI
                    type="submit"
                    tone="primary"
                    shape="rounded"
                    disabled={!canSubmit || requestsLoading}
                  >
                    {isArranging ? "⏳ Đang Auto Arrange..." : "Auto Arrange"}
                  </ButtonUI>

                  <RefreshButton
                    type="button"
                    onClick={resetResult}
                    disabled={isArranging}
                  >
                    Xóa kết quả
                  </RefreshButton>
                </div>
              </>
            )}
          </div>
        </form>

        <aside className="card">
          <p className="commonEyebrow">Tóm tắt</p>

          {selectedRequest ? (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>
                {selectedRequest.courseLabel}
              </h3>

              <p className="commonDescription">
                ID yêu cầu: <strong>#{selectedRequest.id}</strong>
              </p>

              <div className="commonGrid commonGrid2">
                <div className="commonActionCard">
                  <p className="commonActionTitle">Số tổ</p>
                  <strong>
                    {getDisplayValue(selectedRequest.requested_team_count)}
                  </strong>
                </div>

                <div className="commonActionCard">
                  <p className="commonActionTitle">Số buổi</p>
                  <strong>
                    {getDisplayValue(selectedRequest.total_required_sessions)}
                  </strong>
                </div>

                <div className="commonActionCard">
                  <p className="commonActionTitle">Tuần bắt đầu</p>
                  <strong>
                    {formatDate(selectedRequest.preferred_week_start)}
                  </strong>
                </div>

                <div className="commonActionCard">
                  <p className="commonActionTitle">Tuần kết thúc</p>
                  <strong>
                    {formatDate(selectedRequest.preferred_week_end)}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Chưa chọn yêu cầu"
              description="Chọn một schedule request để xem tóm tắt trước khi xếp lịch."
              icon="🧭"
            />
          )}
        </aside>
      </section>

      <section className="card">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 14,
          }}
        >
          <div>
            <p className="commonEyebrow">Ranked options</p>
            <h2
              style={{
                margin: "6px 0 0",
                color: "#0f172a",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              Top 3 phương án đề xuất
            </h2>
          </div>

          {autoArrangeData?.auto_arrange_status ? (
            <StatusBadge
              variant={
                autoArrangeData.auto_arrange_status === "success"
                  ? "success"
                  : "warning"
              }
            >
              {autoArrangeData.auto_arrange_status}
            </StatusBadge>
          ) : null}
        </div>

        {isArranging ? (
          <LoadingState
            title="Đang sinh phương án xếp lịch..."
            description="API có thể mất khoảng 2 giây vì phải kiểm tra nhiều candidate."
          />
        ) : arrangeError ? (
          <ErrorState
            title="Không thể Auto Arrange"
            error={arrangeError}
            onRetry={submitAutoArrange}
            retryLabel="Thử Auto Arrange lại"
          />
        ) : isNoValidOption ? (
          <EmptyState
            title="Không có phương án hợp lệ"
            description="Thử đổi tuần, đổi ca, hoặc giảm sĩ số team."
            icon="🧩"
            action={
              <div style={{ width: "100%", marginTop: 10 }}>
                <p
                  style={{
                    margin: "0 0 8px",
                    color: "#334155",
                    fontWeight: 800,
                  }}
                >
                  Một số lý do fail mẫu:
                </p>

                <ul
                  style={{
                    display: "grid",
                    gap: 8,
                    margin: 0,
                    paddingLeft: 18,
                    color: "#475569",
                    lineHeight: 1.6,
                  }}
                >
                  {failedReasons.map((reason) => (
                    <li key={reason.id}>
                      <strong>
                        Phòng {reason.room_code} +{" "}
                        {formatDayOfWeek(reason.day_of_week)} +{" "}
                        {reason.time_slot}:
                      </strong>{" "}
                      {reason.failed_rules.length > 0
                        ? reason.failed_rules.map(formatFailedRule).join("; ")
                        : "Backend chưa trả failed_rules."}
                    </li>
                  ))}
                </ul>
              </div>
            }
          />
        ) : rankedOptions.length > 0 ? (
          <DataTable
            columns={columns}
            rows={rankedOptions}
            rowKey="optionKey"
            pageSize={3}
            enablePagination={false}
            emptyTitle="Chưa có phương án"
            emptyDescription="Bấm Auto Arrange để gọi API và hiển thị top 3 option."
          />
        ) : (
          <EmptyState
            title="Chưa có kết quả Auto Arrange"
            description="Chọn yêu cầu xếp lịch rồi bấm Auto Arrange."
            icon="📋"
          />
        )}
      </section>
    </section>
  );
}
