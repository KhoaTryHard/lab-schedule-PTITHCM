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
  checkScheduleConstraints,
  createScheduleFromOption,
} from "../../../services/scheduleService.js";
import { listScheduleRequests } from "../../../services/scheduleRequestService";

const AUTO_ARRANGE_INITIAL_FORM = {
  schedule_request_id: "",
  preferred_day_of_week: "",
  preferred_time_slot: "",
};

const CHECK_CONSTRAINT_INITIAL_FORM = {
  request_id: "1",
  course_section_id: "6",
  practice_team_id: "1",
  lecturer_user_id: "8",
  room_id: "1",
  room_code: "2B11",
  day_of_week: "4",
  time_slot: "Tiết 1-4",
  start_date: "2026-04-29",
  end_date: "2026-04-29",
  student_count: "40",
  required_software_ids: "",
};

const CHECK_CONSTRAINT_PASS_FORM = {
  request_id: "1",
  course_section_id: "6",
  practice_team_id: "1",
  lecturer_user_id: "8",
  room_id: "1",
  room_code: "2B11",
  day_of_week: "4",
  time_slot: "Tiết 1-4",
  start_date: "2026-04-29",
  end_date: "2026-04-29",
  student_count: "40",
  required_software_ids: "",
};

const CHECK_CONSTRAINT_ROOM_STATUS_FAIL_FORM = {
  request_id: "1",
  course_section_id: "6",
  practice_team_id: "1",
  lecturer_user_id: "8",
  room_id: "3",
  room_code: "2B31",
  day_of_week: "4",
  time_slot: "Tiết 1-4",
  start_date: "2026-04-29",
  end_date: "2026-04-29",
  student_count: "40",
  required_software_ids: "",
};

const CHECK_CONSTRAINT_CONFLICT_FAIL_FORM = {
  request_id: "1",
  course_section_id: "1",
  practice_team_id: "1",
  lecturer_user_id: "4",
  room_id: "3",
  room_code: "2B31",
  day_of_week: "4",
  time_slot: "Tiết 7-10",
  start_date: "2025-09-17",
  end_date: "2025-09-17",
  student_count: "40",
  required_software_ids: "",
};

const REQUIRED_RULES = [
  {
    code: "ROOM_SCOPE",
    label: "Phạm vi phòng",
    meaning: "Phòng có thuộc phạm vi cho phép của MVP không.",
    suggestion: "Chọn phòng thuộc phạm vi 2B11, 2B21 hoặc 2B31.",
  },
  {
    code: "ROOM_STATUS",
    label: "Trạng thái phòng",
    meaning: "Phòng có đang ở trạng thái available không.",
    suggestion:
      "Chọn phòng khác hoặc cập nhật trạng thái phòng về available trước khi xếp lịch.",
  },
  {
    code: "ROOM_BLOCKED",
    label: "Phòng bị khóa",
    meaning: "Phòng có bị block bởi yêu cầu khóa phòng đã duyệt không.",
    suggestion: "Chọn phòng khác hoặc đổi khoảng thời gian.",
  },
  {
    code: "HOLIDAY_BLOCKED",
    label: "Ngày nghỉ",
    meaning:
      "Ngày học có bị chặn bởi lịch nghỉ hoặc ngày không xếp lịch không.",
    suggestion: "Chọn ngày khác không thuộc lịch nghỉ.",
  },
  {
    code: "ROOM_CONFLICT",
    label: "Trùng phòng",
    meaning: "Phòng có bị trùng lịch cùng thứ, ca và khoảng ngày không.",
    suggestion: "Đổi phòng, đổi ca hoặc đổi khoảng ngày.",
  },
  {
    code: "LECTURER_CONFLICT",
    label: "Trùng giảng viên",
    meaning: "Giảng viên có bị phân công dạy lớp khác cùng thời điểm không.",
    suggestion: "Chọn giảng viên khác hoặc đổi ca thực hành.",
  },
  {
    code: "CAPACITY_OK",
    label: "Đủ sức chứa",
    meaning: "Số máy/sức chứa phòng có đáp ứng tổ thực hành không.",
    suggestion: "Chọn phòng lớn hơn hoặc tách thêm tổ thực hành.",
  },
  {
    code: "SOFTWARE_OK",
    label: "Đủ phần mềm",
    meaning: "Phòng có cài đủ phần mềm yêu cầu không.",
    suggestion:
      "Chọn phòng khác hoặc yêu cầu kỹ thuật viên cài bổ sung phần mềm.",
  },
];

const EXTRA_RULE_META = {
  TEAM_CONFLICT: {
    label: "Trùng tổ thực hành",
    meaning: "Tổ thực hành có bị xếp trùng cùng thời điểm không.",
    suggestion: "Đổi ca, đổi ngày hoặc chọn tổ thực hành khác.",
  },
};

const DAY_OPTIONS = [
  { value: "", label: "Không ưu tiên" },
  { value: "2", label: "Thứ 2" },
  { value: "3", label: "Thứ 3" },
  { value: "4", label: "Thứ 4" },
  { value: "5", label: "Thứ 5" },
  { value: "6", label: "Thứ 6" },
];

const AUTO_TIME_SLOT_OPTIONS = [
  { value: "", label: "Không ưu tiên" },
  { value: "1-4", label: "Tiết 1-4" },
  { value: "7-10", label: "Tiết 7-10" },
];

const CHECK_TIME_SLOT_OPTIONS = [
  { value: "Tiết 1-4", label: "Tiết 1-4" },
  { value: "Tiết 7-10", label: "Tiết 7-10" },
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

function toRequiredPositiveInteger(value, fieldLabel) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${fieldLabel} phải là số nguyên dương.`);
  }

  return parsedValue;
}

function parseSoftwareIds(value) {
  if (!String(value || "").trim()) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
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

function buildConstraintPayload(formData) {
  if (!formData.room_code.trim()) {
    throw new Error("Vui lòng nhập mã phòng.");
  }

  if (!formData.time_slot.trim()) {
    throw new Error("Vui lòng chọn ca học.");
  }

  if (!formData.start_date || !formData.end_date) {
    throw new Error("Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc.");
  }

  if (formData.end_date < formData.start_date) {
    throw new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
  }

  return {
    room_code: formData.room_code.trim().toUpperCase(),
    lecturer_user_id: toRequiredPositiveInteger(
      formData.lecturer_user_id,
      "ID giảng viên",
    ),
    practice_team_id: toRequiredPositiveInteger(
      formData.practice_team_id,
      "ID tổ thực hành",
    ),
    day_of_week: toRequiredPositiveInteger(
      formData.day_of_week,
      "Thứ trong tuần",
    ),
    time_slot: formData.time_slot.trim(),
    start_date: formData.start_date,
    end_date: formData.end_date,
    required_software_ids: parseSoftwareIds(formData.required_software_ids),
  };
}

function normalizeRuleCode(code) {
  return String(code || "UNKNOWN_RULE")
    .trim()
    .toUpperCase();
}

function normalizeConstraintResults(apiData) {
  const rawResults = Array.isArray(apiData?.results)
    ? apiData.results
    : Array.isArray(apiData?.constraints)
      ? apiData.constraints
      : [];

  return rawResults.map((item, index) => ({
    id: `${item?.code || "RULE"}-${index + 1}`,
    code: normalizeRuleCode(item?.code),
    passed:
      typeof item?.passed === "boolean"
        ? item.passed
        : typeof item?.is_passed === "boolean"
          ? item.is_passed
          : null,
    message:
      item?.message || item?.detail || "API không trả message cho rule này.",
    raw: item,
  }));
}

function getRuleMeta(code) {
  return (
    REQUIRED_RULES.find((rule) => rule.code === code) ||
    EXTRA_RULE_META[code] || {
      label: code,
      meaning: "Rule bổ sung do backend trả về.",
      suggestion: "Đọc message backend để xử lý.",
    }
  );
}

function buildRuleRows(constraintResults) {
  const resultMap = new Map(
    constraintResults.map((result) => [result.code, result]),
  );

  const requiredRows = REQUIRED_RULES.map((rule) => {
    const matchedResult = resultMap.get(rule.code);

    if (!matchedResult) {
      return {
        id: rule.code,
        code: rule.code,
        label: rule.label,
        meaning: rule.meaning,
        passed: null,
        message: "Backend chưa trả kết quả cho rule này.",
        suggestion: rule.suggestion,
        isRequired: true,
      };
    }

    return {
      id: rule.code,
      code: rule.code,
      label: rule.label,
      meaning: rule.meaning,
      passed: matchedResult.passed,
      message: matchedResult.message,
      suggestion: rule.suggestion,
      isRequired: true,
    };
  });

  const extraRows = constraintResults
    .filter(
      (result) => !REQUIRED_RULES.some((rule) => rule.code === result.code),
    )
    .map((result) => {
      const meta = getRuleMeta(result.code);

      return {
        id: result.id,
        code: result.code,
        label: meta.label,
        meaning: meta.meaning,
        passed: result.passed,
        message: result.message,
        suggestion: meta.suggestion,
        isRequired: false,
      };
    });

  return [...requiredRows, ...extraRows];
}

function getResultVariant(passed) {
  if (passed === true) {
    return "success";
  }

  if (passed === false) {
    return "danger";
  }

  return "muted";
}

function getResultLabel(passed) {
  if (passed === true) {
    return "PASS";
  }

  if (passed === false) {
    return "FAIL";
  }

  return "CHƯA TRẢ";
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

  const [autoFormData, setAutoFormData] = useState(AUTO_ARRANGE_INITIAL_FORM);
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");

  const [autoArrangeData, setAutoArrangeData] = useState(null);
  const [isArranging, setIsArranging] = useState(false);
  const [arrangeError, setArrangeError] = useState("");
  const [autoValidationError, setAutoValidationError] = useState("");
  const [selectedReasonOption, setSelectedReasonOption] = useState(null);
  const [creatingOptionKey, setCreatingOptionKey] = useState("");
  const [toast, setToast] = useState(null);

  const [constraintFormData, setConstraintFormData] = useState(
    CHECK_CONSTRAINT_INITIAL_FORM,
  );
  const [constraintData, setConstraintData] = useState(null);
  const [constraintRows, setConstraintRows] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [constraintError, setConstraintError] = useState("");
  const [constraintLocalMessage, setConstraintLocalMessage] = useState("");

  const selectedRequest = useMemo(
    () =>
      scheduleRequests.find(
        (requestItem) =>
          String(requestItem.id) === autoFormData.schedule_request_id,
      ) || null,
    [autoFormData.schedule_request_id, scheduleRequests],
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

  const canAutoArrange =
    Boolean(autoFormData.schedule_request_id) && !isArranging;

  const failedConstraintRows = useMemo(
    () => constraintRows.filter((row) => row.passed === false),
    [constraintRows],
  );

  const passedConstraintRows = useMemo(
    () => constraintRows.filter((row) => row.passed === true),
    [constraintRows],
  );

  const missingRequiredConstraintRows = useMemo(
    () => constraintRows.filter((row) => row.isRequired && row.passed === null),
    [constraintRows],
  );

  const hasCheckedConstraints = Boolean(constraintData);
  const hasFailedConstraintRule = failedConstraintRows.length > 0;
  const apiPassedConstraints = Boolean(constraintData?.passed);
  const canCreateScheduleAfterCheck =
    hasCheckedConstraints && apiPassedConstraints && !hasFailedConstraintRule;

  const constraintSummaryStatus = useMemo(() => {
    if (constraintError) {
      return {
        variant: "danger",
        label: "API lỗi",
        title: "Không thể kiểm tra ràng buộc",
        message: constraintError,
      };
    }

    if (!hasCheckedConstraints) {
      return {
        variant: "muted",
        label: "",
        title: "Sẵn sàng kiểm tra",
        message:
          "Nhập thông tin lịch hoặc nạp case demo rồi bấm Kiểm tra ràng buộc.",
      };
    }

    if (hasFailedConstraintRule || !apiPassedConstraints) {
      return {
        variant: "danger",
        label: "Không hợp lệ",
        title: "Không thể tạo lịch",
        message:
          "Có ít nhất một ràng buộc chưa đạt. Đây là màn hình dùng để chụp minh chứng case FAIL.",
      };
    }

    if (missingRequiredConstraintRows.length > 0) {
      return {
        variant: "warning",
        label: "Hợp lệ có cảnh báo",
        title: "API báo pass nhưng còn rule chưa trả về",
        message:
          "Backend chưa trả đủ rule bắt buộc. Có thể chụp minh chứng pass, nhưng nên kiểm tra lại backend nếu cần đủ 8 rule.",
      };
    }

    return {
      variant: "success",
      label: "Hợp lệ",
      title: "Có thể tạo lịch",
      message:
        "Tất cả ràng buộc đã đạt. Đây là màn hình dùng để chụp minh chứng case PASS.",
    };
  }, [
    apiPassedConstraints,
    constraintError,
    hasCheckedConstraints,
    hasFailedConstraintRule,
    missingRequiredConstraintRows.length,
  ]);

  const autoArrangeColumns = useMemo(
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
    [creatingOptionKey, autoFormData.schedule_request_id],
  );

  const constraintColumns = useMemo(
    () => [
      {
        key: "code",
        label: "Rule",
        render: (value, row) => (
          <div style={{ display: "grid", gap: 2 }}>
            <strong>{value}</strong>
            <span style={{ color: "#64748b", fontSize: 12 }}>{row.label}</span>
          </div>
        ),
      },
      { key: "meaning", label: "Ý nghĩa" },
      {
        key: "passed",
        label: "Kết quả",
        render: (value) => (
          <StatusBadge variant={getResultVariant(value)}>
            {getResultLabel(value)}
          </StatusBadge>
        ),
      },
      { key: "message", label: "Thông báo" },
      { key: "suggestion", label: "Gợi ý xử lý" },
    ],
    [],
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

  function updateAutoFormData(fieldName, value) {
    setAutoFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));

    setAutoValidationError("");
    setArrangeError("");
  }

  function updateConstraintFormData(fieldName, value) {
    setConstraintFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));

    setConstraintError("");
    setConstraintLocalMessage("");
  }

  async function submitAutoArrange() {
    try {
      setIsArranging(true);
      setArrangeError("");
      setAutoValidationError("");
      setAutoArrangeData(null);

      const payload = buildAutoArrangePayload(autoFormData, selectedRequest);
      const response = await autoArrange(payload);
      setAutoArrangeData(normalizeAutoArrangeData(response));
    } catch (error) {
      if (handleAuthError(error)) {
        return;
      }

      if (!autoFormData.schedule_request_id) {
        setAutoValidationError("Vui lòng chọn yêu cầu xếp lịch.");
        return;
      }

      setArrangeError(getApiErrorMessage(error, "Không thể xếp lịch tự động."));
    } finally {
      setIsArranging(false);
    }
  }

  async function handleAutoArrangeSubmit(event) {
    event.preventDefault();

    if (!autoFormData.schedule_request_id) {
      setAutoValidationError("Vui lòng chọn yêu cầu xếp lịch.");
      return;
    }

    await submitAutoArrange();
  }

  async function handleUseOption(option) {
    const requestId = toPositiveInteger(autoFormData.schedule_request_id);

    if (!requestId) {
      setAutoValidationError("Vui lòng chọn yêu cầu xếp lịch.");
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

  function resetAutoArrangeResult() {
    setAutoArrangeData(null);
    setArrangeError("");
    setAutoValidationError("");
    setToast(null);
  }

  function resetConstraintResult() {
    setConstraintData(null);
    setConstraintRows([]);
    setConstraintError("");
    setConstraintLocalMessage("");
  }

  function loadConstraintDemoForm(nextForm) {
    setConstraintFormData(nextForm);
    resetConstraintResult();
  }

  async function handleCheckConstraints(event) {
    event.preventDefault();

    try {
      setIsChecking(true);
      setConstraintError("");
      setConstraintLocalMessage("");

      const payload = buildConstraintPayload(constraintFormData);
      const response = await checkScheduleConstraints(payload);
      const apiData = response?.data || {};
      const normalizedResults = normalizeConstraintResults(apiData);

      setConstraintData(apiData);
      setConstraintRows(buildRuleRows(normalizedResults));
    } catch (error) {
      if (handleAuthError(error)) {
        return;
      }

      setConstraintData(null);
      setConstraintRows([]);
      setConstraintError(
        getApiErrorMessage(error, "Không thể kiểm tra ràng buộc xếp lịch."),
      );
    } finally {
      setIsChecking(false);
    }
  }

  function handleCreateScheduleAfterCheck() {
    if (!canCreateScheduleAfterCheck) {
      setConstraintLocalMessage(
        "Không thể tạo lịch vì còn ràng buộc chưa đạt hoặc chưa có kết quả kiểm tra hợp lệ.",
      );
      return;
    }

    setConstraintLocalMessage(
      "Ràng buộc đã đạt. Đây là bước kiểm tra trước khi tạo lịch draft.",
    );
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
          <p className="commonEyebrow">Academic · Scheduling demo</p>
          <h1 className="commonTitle">Xếp lịch tự động & kiểm tra ràng buộc</h1>
          <p className="commonDescription">
            Trang này phục vụ luồng demo chính: Auto Arrange tạo 3 phương án xếp
            hạng, đồng thời khôi phục Check Constraints để chụp ảnh PASS và FAIL
            cho báo cáo.
          </p>
        </div>

        <div className="commonHeaderActions">
          <StatusBadge variant="info">API thật</StatusBadge>
          <StatusBadge variant="published">Demo scope</StatusBadge>
        </div>
      </div>

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
            <p className="commonEyebrow">Auto Arrange</p>
            <h2
              style={{
                margin: "6px 0 0",
                color: "#0f172a",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              Sinh top 3 phương án xếp lịch
            </h2>
          </div>

          <StatusBadge variant={rankedOptions.length > 0 ? "success" : "info"}>
            {rankedOptions.length > 0
              ? `${rankedOptions.length} option`
              : "Sẵn sàng"}
          </StatusBadge>
        </div>

        <section
          className="commonGrid commonGrid2"
          style={{ alignItems: "start" }}
        >
          <form onSubmit={handleAutoArrangeSubmit}>
            <div style={{ display: "grid", gap: 14 }}>
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
                      value={autoFormData.schedule_request_id}
                      onChange={(event) =>
                        updateAutoFormData(
                          "schedule_request_id",
                          event.target.value,
                        )
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

                  {!autoFormData.schedule_request_id || autoValidationError ? (
                    <p
                      role="alert"
                      style={{
                        margin: "-6px 0 4px",
                        color: "#b91c1c",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {autoValidationError ||
                        "Bắt buộc chọn schedule_request_id để bật nút Auto Arrange."}
                    </p>
                  ) : null}

                  <div className="commonGrid commonGrid2">
                    <label className="label">
                      Ngày ưu tiên
                      <select
                        className="select"
                        value={autoFormData.preferred_day_of_week}
                        onChange={(event) =>
                          updateAutoFormData(
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
                        value={autoFormData.preferred_time_slot}
                        onChange={(event) =>
                          updateAutoFormData(
                            "preferred_time_slot",
                            event.target.value,
                          )
                        }
                        disabled={isArranging}
                      >
                        {AUTO_TIME_SLOT_OPTIONS.map((option) => (
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
                      disabled={!canAutoArrange || requestsLoading}
                    >
                      {isArranging ? "⏳ Đang Auto Arrange..." : "Auto Arrange"}
                    </ButtonUI>

                    <RefreshButton
                      type="button"
                      onClick={resetAutoArrangeResult}
                      disabled={isArranging}
                    >
                      Xóa kết quả
                    </RefreshButton>
                  </div>
                </>
              )}
            </div>
          </form>

          <aside>
            {selectedRequest ? (
              <div className="commonActionCard">
                <p className="commonEyebrow">Tóm tắt request</p>
                <h3 style={{ margin: 0, fontSize: 18 }}>
                  {selectedRequest.courseLabel}
                </h3>

                <div className="commonGrid commonGrid2">
                  <p className="commonDescription">
                    ID: <strong>#{selectedRequest.id}</strong>
                  </p>
                  <p className="commonDescription">
                    Trạng thái:{" "}
                    <strong>
                      {getDisplayValue(selectedRequest.request_status)}
                    </strong>
                  </p>
                  <p className="commonDescription">
                    Số tổ:{" "}
                    <strong>
                      {getDisplayValue(selectedRequest.requested_team_count)}
                    </strong>
                  </p>
                  <p className="commonDescription">
                    Số buổi:{" "}
                    <strong>
                      {getDisplayValue(selectedRequest.total_required_sessions)}
                    </strong>
                  </p>
                  <p className="commonDescription">
                    Từ:{" "}
                    <strong>
                      {formatDate(selectedRequest.preferred_week_start)}
                    </strong>
                  </p>
                  <p className="commonDescription">
                    Đến:{" "}
                    <strong>
                      {formatDate(selectedRequest.preferred_week_end)}
                    </strong>
                  </p>
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

        <div style={{ marginTop: 16 }}>
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
              columns={autoArrangeColumns}
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
        </div>
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
            <p className="commonEyebrow">Check Constraints</p>
            <h2
              style={{
                margin: "6px 0 0",
                color: "#0f172a",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              Kiểm tra 8 rule bằng API thật
            </h2>
            <p className="commonDescription">
              Phần này khôi phục case cũ từ branch develop để chụp ảnh PASS/FAIL
              cho báo cáo. Không fake kết quả; mọi rule lấy từ backend.
            </p>
          </div>

          {constraintSummaryStatus.label ? (
            <StatusBadge variant={constraintSummaryStatus.variant}>
              {constraintSummaryStatus.label}
            </StatusBadge>
          ) : null}
        </div>

        <section
          className="commonGrid commonGrid2"
          style={{ alignItems: "start" }}
        >
          <form onSubmit={handleCheckConstraints}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <RefreshButton
                onClick={() =>
                  loadConstraintDemoForm(CHECK_CONSTRAINT_PASS_FORM)
                }
                disabled={isChecking}
              >
                Nạp case PASS
              </RefreshButton>

              <RefreshButton
                onClick={() =>
                  loadConstraintDemoForm(CHECK_CONSTRAINT_ROOM_STATUS_FAIL_FORM)
                }
                disabled={isChecking}
              >
                Nạp case ROOM_STATUS 2B31
              </RefreshButton>

              <RefreshButton
                onClick={() =>
                  loadConstraintDemoForm(CHECK_CONSTRAINT_CONFLICT_FAIL_FORM)
                }
                disabled={isChecking}
              >
                Nạp case ROOM_CONFLICT
              </RefreshButton>
            </div>

            <div className="commonGrid commonGrid3">
              <label className="label">
                ID yêu cầu
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={constraintFormData.request_id}
                  onChange={(event) =>
                    updateConstraintFormData("request_id", event.target.value)
                  }
                  disabled={isChecking}
                />
              </label>

              <label className="label">
                ID lớp học phần
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={constraintFormData.course_section_id}
                  onChange={(event) =>
                    updateConstraintFormData(
                      "course_section_id",
                      event.target.value,
                    )
                  }
                  disabled={isChecking}
                />
              </label>

              <label className="label">
                ID tổ thực hành
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={constraintFormData.practice_team_id}
                  onChange={(event) =>
                    updateConstraintFormData(
                      "practice_team_id",
                      event.target.value,
                    )
                  }
                  disabled={isChecking}
                />
              </label>

              <label className="label">
                ID giảng viên
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={constraintFormData.lecturer_user_id}
                  onChange={(event) =>
                    updateConstraintFormData(
                      "lecturer_user_id",
                      event.target.value,
                    )
                  }
                  disabled={isChecking}
                />
              </label>

              <label className="label">
                ID phòng
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={constraintFormData.room_id}
                  onChange={(event) =>
                    updateConstraintFormData("room_id", event.target.value)
                  }
                  disabled={isChecking}
                />
              </label>

              <label className="label">
                Mã phòng
                <input
                  className="input"
                  value={constraintFormData.room_code}
                  placeholder="Ví dụ: 2B31"
                  onChange={(event) =>
                    updateConstraintFormData("room_code", event.target.value)
                  }
                  disabled={isChecking}
                />
              </label>

              <label className="label">
                Thứ trong tuần
                <select
                  className="select"
                  value={constraintFormData.day_of_week}
                  onChange={(event) =>
                    updateConstraintFormData("day_of_week", event.target.value)
                  }
                  disabled={isChecking}
                >
                  <option value="1">Chủ nhật</option>
                  <option value="2">Thứ 2</option>
                  <option value="3">Thứ 3</option>
                  <option value="4">Thứ 4</option>
                  <option value="5">Thứ 5</option>
                  <option value="6">Thứ 6</option>
                  <option value="7">Thứ 7</option>
                </select>
              </label>

              <label className="label">
                Ca học
                <select
                  className="select"
                  value={constraintFormData.time_slot}
                  onChange={(event) =>
                    updateConstraintFormData("time_slot", event.target.value)
                  }
                  disabled={isChecking}
                >
                  {CHECK_TIME_SLOT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label">
                Số sinh viên
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={constraintFormData.student_count}
                  onChange={(event) =>
                    updateConstraintFormData(
                      "student_count",
                      event.target.value,
                    )
                  }
                  disabled={isChecking}
                />
              </label>

              <label className="label">
                Từ ngày
                <input
                  className="input"
                  type="date"
                  value={constraintFormData.start_date}
                  onChange={(event) =>
                    updateConstraintFormData("start_date", event.target.value)
                  }
                  disabled={isChecking}
                />
              </label>

              <label className="label">
                Đến ngày
                <input
                  className="input"
                  type="date"
                  value={constraintFormData.end_date}
                  onChange={(event) =>
                    updateConstraintFormData("end_date", event.target.value)
                  }
                  disabled={isChecking}
                />
              </label>

              <label className="label">
                ID phần mềm yêu cầu
                <input
                  className="input"
                  value={constraintFormData.required_software_ids}
                  placeholder="Ví dụ: 1,2,6,8"
                  onChange={(event) =>
                    updateConstraintFormData(
                      "required_software_ids",
                      event.target.value,
                    )
                  }
                  disabled={isChecking}
                />
              </label>
            </div>

            <div
              style={{
                margin: "12px 0",
                padding: 12,
                border: "1px solid rgba(139, 0, 0, 0.1)",
                borderRadius: 14,
                background: "#fffafa",
                color: "#334155",
                lineHeight: 1.6,
              }}
            >
              <strong>Preview:</strong> Phòng{" "}
              {constraintFormData.room_code || "—"} ·{" "}
              {formatDayOfWeek(constraintFormData.day_of_week)} ·{" "}
              {constraintFormData.time_slot || "—"} ·{" "}
              {constraintFormData.start_date || "—"} đến{" "}
              {constraintFormData.end_date || "—"}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <ButtonUI
                tone="primary"
                shape="rounded"
                type="submit"
                disabled={isChecking}
              >
                {isChecking ? "Đang kiểm tra..." : "Kiểm tra ràng buộc"}
              </ButtonUI>

              <ButtonUI
                tone={canCreateScheduleAfterCheck ? "primary" : "secondary"}
                shape="rounded"
                type="button"
                onClick={handleCreateScheduleAfterCheck}
                disabled={!canCreateScheduleAfterCheck || isChecking}
              >
                Tạo lịch
              </ButtonUI>

              <RefreshButton
                onClick={resetConstraintResult}
                disabled={isChecking}
              >
                Xóa kết quả
              </RefreshButton>
            </div>
          </form>

          <aside className="commonActionCard">
            <p className="commonEyebrow">Kết quả tổng quan</p>
            <h3 style={{ margin: 0, fontSize: 20 }}>
              {constraintSummaryStatus.title}
            </h3>
            <p className="commonDescription">
              {constraintSummaryStatus.message}
            </p>

            <div className="commonGrid commonGrid2">
              <div className="commonActionCard">
                <p className="commonActionTitle">Tổng rule</p>
                <strong>
                  {constraintRows.length || REQUIRED_RULES.length}
                </strong>
              </div>

              <div className="commonActionCard">
                <p className="commonActionTitle">Pass</p>
                <strong>{passedConstraintRows.length}</strong>
              </div>

              <div className="commonActionCard">
                <p className="commonActionTitle">Fail</p>
                <strong>{failedConstraintRows.length}</strong>
              </div>

              <div className="commonActionCard">
                <p className="commonActionTitle">Chưa trả</p>
                <strong>{missingRequiredConstraintRows.length}</strong>
              </div>
            </div>

            {constraintLocalMessage ? (
              <p
                style={{
                  margin: 0,
                  padding: 12,
                  borderRadius: 14,
                  background: canCreateScheduleAfterCheck
                    ? "#ecfdf5"
                    : "#fef2f2",
                  color: canCreateScheduleAfterCheck ? "#047857" : "#b91c1c",
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                {constraintLocalMessage}
              </p>
            ) : null}

            <p className="commonDescription">
              Ghi chú: case <strong>ROOM_STATUS 2B31</strong> chỉ fail thật nếu
              DB đang để phòng 2B31 khác <strong>available</strong>. Frontend
              không tự dựng rule giả.
            </p>
          </aside>
        </section>

        <div style={{ marginTop: 16 }}>
          {isChecking ? (
            <LoadingState
              title="Đang kiểm tra ràng buộc..."
              description="Hệ thống đang gọi API /schedules/check-constraints."
            />
          ) : constraintError ? (
            <ErrorState
              title="Không thể kiểm tra ràng buộc"
              error={constraintError}
              showRetry={false}
            />
          ) : hasCheckedConstraints ? (
            <DataTable
              columns={constraintColumns}
              rows={constraintRows}
              emptyTitle="API chưa trả rule"
              emptyDescription="Backend chưa trả danh sách results/constraints."
            />
          ) : (
            <EmptyState
              title="Chưa có kết quả kiểm tra"
              description="Nhập dữ liệu lịch thực hành hoặc nạp case demo rồi bấm Kiểm tra ràng buộc."
              icon="✅"
            />
          )}
        </div>
      </section>
    </section>
  );
}
