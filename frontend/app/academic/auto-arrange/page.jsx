"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DataTable from "../../../components/common/DataTable.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
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
  listSchedules,
} from "../../../services/scheduleService.js";
import { listScheduleRequests } from "../../../services/scheduleRequestService";

const AUTO_FORM_INITIAL = {
  schedule_request_id: "",
  preferred_day_of_week: "",
  preferred_time_slot: "",
  practice_team_id: "1",
  lecturer_user_id: "",
  start_date: "",
  end_date: "",
};

const CHECK_FORM_INITIAL = {
  practice_team_id: "1",
  lecturer_user_id: "",
  room_code: "2B11",
  day_of_week: "4",
  time_slot: "Tiết 1-4",
  start_date: "2026-04-29",
  end_date: "2026-04-29",
  required_software_ids: "",
};

const CHECK_PASS_FORM = {
  practice_team_id: "1",
  lecturer_user_id: "8",
  room_code: "2B11",
  day_of_week: "4",
  time_slot: "Tiết 1-4",
  start_date: "2026-04-29",
  end_date: "2026-04-29",
  required_software_ids: "",
};

const CHECK_ROOM_STATUS_FORM = {
  practice_team_id: "1",
  lecturer_user_id: "8",
  room_code: "2B31",
  day_of_week: "4",
  time_slot: "Tiết 1-4",
  start_date: "2026-04-29",
  end_date: "2026-04-29",
  required_software_ids: "",
};

const CHECK_CONFLICT_FORM = {
  practice_team_id: "1",
  lecturer_user_id: "4",
  room_code: "2B31",
  day_of_week: "4",
  time_slot: "Tiết 7-10",
  start_date: "2025-09-17",
  end_date: "2025-09-17",
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
    meaning: "Phòng có đang ở trạng thái khả dụng không.",
    suggestion: "Chọn phòng khác hoặc mở lại phòng trước khi xếp lịch.",
  },
  {
    code: "ROOM_BLOCKED",
    label: "Phòng bị khóa",
    meaning: "Phòng có bị khóa bởi lịch bảo trì hoặc yêu cầu khóa phòng không.",
    suggestion: "Chọn phòng khác hoặc đổi khoảng thời gian.",
  },
  {
    code: "HOLIDAY_BLOCKED",
    label: "Ngày nghỉ",
    meaning: "Ngày học có thuộc ngày nghỉ bị chặn lịch không.",
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
    meaning: "Giảng viên có bị phân công lớp khác cùng thời điểm không.",
    suggestion: "Chọn giảng viên khác hoặc đổi ca thực hành.",
  },
  {
    code: "CAPACITY_OK",
    label: "Đủ sức chứa",
    meaning: "Số máy khả dụng có đáp ứng sĩ số tổ thực hành không.",
    suggestion: "Chọn phòng lớn hơn hoặc tách thêm tổ thực hành.",
  },
  {
    code: "SOFTWARE_OK",
    label: "Đủ phần mềm",
    meaning: "Phòng có cài đủ phần mềm yêu cầu không.",
    suggestion: "Chọn phòng khác hoặc yêu cầu kỹ thuật viên cài phần mềm.",
  },
];

const DAY_OPTIONS = [
  { value: "", label: "Không ưu tiên" },
  { value: "2", label: "Thứ 2" },
  { value: "3", label: "Thứ 3" },
  { value: "4", label: "Thứ 4" },
  { value: "5", label: "Thứ 5" },
  { value: "6", label: "Thứ 6" },
];

const AUTO_TIME_OPTIONS = [
  { value: "", label: "Không ưu tiên" },
  { value: "1-4", label: "Tiết 1-4" },
  { value: "7-10", label: "Tiết 7-10" },
];

const CHECK_TIME_OPTIONS = [
  { value: "Tiết 1-4", label: "Tiết 1-4" },
  { value: "Tiết 7-10", label: "Tiết 7-10" },
];

function toPositiveInteger(value) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
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

function translateBackendMessage(message) {
  const text = String(message || "");

  const directMap = {
    "In MVP room scope": "Phòng thuộc phạm vi MVP.",
    "Passes demo hard constraints": "Đạt các ràng buộc cứng của demo.",
    "Ranked by simple rule-based scoring stub":
      "Được xếp hạng theo điểm rule-based.",
    "No room conflict detected": "Không phát hiện trùng phòng.",
    "No lecturer conflict detected": "Không phát hiện trùng lịch giảng viên.",
    "Room is not blocked for this period":
      "Phòng không bị khóa trong khoảng thời gian này.",
    "No blocked holidays on the selected schedule":
      "Không có ngày nghỉ bị chặn trong lịch đã chọn.",
    "No specific software requirements": "Không có yêu cầu phần mềm cụ thể.",
    "Room not found in database": "Không tìm thấy phòng trong cơ sở dữ liệu.",
    "Time slot not found in database":
      "Không tìm thấy ca học trong cơ sở dữ liệu.",
    "Practice team not found in database":
      "Không tìm thấy tổ thực hành trong cơ sở dữ liệu.",
  };

  if (directMap[text]) {
    return directMap[text];
  }

  let matched = text.match(/^Room (.+) is in MVP scope$/);
  if (matched) return `Phòng ${matched[1]} thuộc phạm vi MVP.`;

  matched = text.match(/^Room (.+) is available$/);
  if (matched) return `Phòng ${matched[1]} đang khả dụng.`;

  matched = text.match(/^Room (.+) is not available \(status: (.+)\)$/);
  if (matched) {
    return `Phòng ${matched[1]} không khả dụng. Trạng thái hiện tại: ${matched[2]}.`;
  }

  matched = text.match(
    /^Room is already booked for (.+) session\(s\) overlapping this period$/,
  );
  if (matched) return `Phòng đã có ${matched[1]} buổi trùng trong khoảng này.`;

  matched = text.match(
    /^Lecturer has (.+) conflicting session\(s\) in this period$/,
  );
  if (matched) {
    return `Giảng viên có ${matched[1]} buổi dạy bị trùng trong khoảng này.`;
  }

  matched = text.match(/^Room has (.+) usable computers, team size is (.+)$/);
  if (matched) {
    return `Phòng có ${matched[1]} máy khả dụng, sĩ số tổ là ${matched[2]}.`;
  }

  matched = text.match(
    /^Room only has (.+) usable computers but team size is (.+)$/,
  );
  if (matched) {
    return `Phòng chỉ có ${matched[1]} máy khả dụng, nhưng sĩ số tổ là ${matched[2]}.`;
  }

  matched = text.match(
    /^All (.+) required software package\(s\) are installed$/,
  );
  if (matched) return `Đã cài đủ ${matched[1]} gói phần mềm bắt buộc.`;

  matched = text.match(/^Missing software package ID\(s\): (.+)$/);
  if (matched) return `Thiếu phần mềm có ID: ${matched[1]}.`;

  return text
    .replaceAll(
      "practice_team_id must be a positive integer",
      "practice_team_id phải là số nguyên dương",
    )
    .replaceAll(
      "lecturer_user_id must be a positive integer",
      "lecturer_user_id phải là số nguyên dương",
    )
    .replaceAll(
      "start_date must be a valid date (YYYY-MM-DD)",
      "start_date phải là ngày hợp lệ (YYYY-MM-DD)",
    )
    .replaceAll(
      "end_date must be a valid date (YYYY-MM-DD)",
      "end_date phải là ngày hợp lệ (YYYY-MM-DD)",
    );
}

function getApiDetailText(detail) {
  if (typeof detail === "string") return translateBackendMessage(detail);
  return translateBackendMessage(
    detail?.msg ||
      detail?.message ||
      detail?.error ||
      detail?.detail ||
      JSON.stringify(detail),
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

  return translateBackendMessage(error?.message || fallbackMessage);
}

function extractConstraintResultsFromError(error) {
  if (Array.isArray(error?.details)) {
    return error.details;
  }

  if (Array.isArray(error?.details?.results)) {
    return error.details.results;
  }

  if (Array.isArray(error?.details?.constraintResult?.results)) {
    return error.details.constraintResult.results;
  }

  if (Array.isArray(error?.constraintResult?.results)) {
    return error.constraintResult.results;
  }

  if (typeof error?.message === "string") {
    try {
      const parsedMessage = JSON.parse(error.message);

      if (Array.isArray(parsedMessage)) {
        return parsedMessage;
      }

      if (Array.isArray(parsedMessage?.results)) {
        return parsedMessage.results;
      }

      if (Array.isArray(parsedMessage?.constraintResult?.results)) {
        return parsedMessage.constraintResult.results;
      }
    } catch {
      return [];
    }
  }

  return [];
}

function buildConstraintFailMessage(results) {
  const failedRules = Array.isArray(results)
    ? results.filter((rule) => rule && rule.passed === false)
    : [];

  if (failedRules.length === 0) {
    return "";
  }

  return failedRules
    .map((rule) => {
      const meta = REQUIRED_RULES.find(
        (item) => item.code === normalizeRuleCode(rule.code),
      );

      const label = meta?.label || rule.code || "Ràng buộc";
      const message = translateBackendMessage(rule.message || "");

      return `${label}: ${message}`;
    })
    .join("; ");
}

function parseSoftwareIds(value) {
  if (!String(value || "").trim()) return [];
  return String(value)
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function normalizeScheduleRequests(response) {
  const rawItems = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.requests)
      ? response.data.requests
      : [];

  return rawItems.map((item, index) => {
    const courseCode = item?.course_code || "";
    const courseName = item?.course_name || "";
    const groupNo = item?.group_no || "";
    const courseLabel =
      courseCode && courseName
        ? `${courseCode} - ${courseName}${groupNo ? ` | Nhóm ${groupNo}` : ""}`
        : `Yêu cầu xếp lịch #${index + 1}`;

    return {
      id: item?.id ?? item?.request_id ?? index + 1,
      courseLabel,
      course_section_id: item?.course_section_id,
      requested_team_count: item?.requested_team_count,
      total_required_sessions: item?.total_required_sessions,
      preferred_week_start: item?.preferred_week_start,
      preferred_week_end: item?.preferred_week_end,
      request_status: item?.request_status || item?.status || "draft",
      raw: item,
    };
  });
}

function extractSchedules(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.schedules)) return response.data.schedules;
  return [];
}

function buildLecturerOptions(schedules) {
  const lecturerMap = new Map();

  schedules.forEach((schedule) => {
    const id = schedule?.lecturer_user_id;
    const name =
      schedule?.lecturer_name ||
      schedule?.lecturer_full_name ||
      schedule?.lecturer ||
      "";

    if (id && !lecturerMap.has(String(id))) {
      lecturerMap.set(String(id), {
        id: String(id),
        name: name || `Giảng viên #${id}`,
      });
    }
  });

  return [...lecturerMap.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

function normalizeReasons(reasons) {
  if (!Array.isArray(reasons)) return [];
  return reasons
    .map((reason) =>
      typeof reason === "string"
        ? translateBackendMessage(reason)
        : translateBackendMessage(
            reason?.message || reason?.detail || reason?.code || "",
          ),
    )
    .filter(Boolean);
}

function normalizeFailedReasons(reasons) {
  if (!Array.isArray(reasons)) return [];

  return reasons
    .map((reason, index) => {
      const code =
        typeof reason === "string" ? "" : normalizeRuleCode(reason?.code);
      const message =
        typeof reason === "string"
          ? translateBackendMessage(reason)
          : translateBackendMessage(
              reason?.message || reason?.detail || reason?.code || "",
            );

      return {
        id: `${code || "FAILED_REASON"}-${index + 1}`,
        code,
        message,
      };
    })
    .filter((reason) => reason.message || reason.code);
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
      `${roomCode}-${dayOfWeek}-${timeSlot}-${startDate}-${index}`,
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
    raw: option,
  };
}

function normalizeAutoArrangeData(response) {
  const apiData = response?.data || {};
  const rankedOptions = Array.isArray(apiData?.ranked_options)
    ? apiData.ranked_options.map(normalizeOption).slice(0, 3)
    : [];
  const rawStatus = String(apiData?.auto_arrange_status || "")
    .trim()
    .toLowerCase();
  const autoArrangeStatus =
    rawStatus === "no_options" || rawStatus === "no_valid_option"
      ? "no_options"
      : rawStatus || (rankedOptions.length > 0 ? "success" : "no_options");

  return {
    auto_arrange_status: autoArrangeStatus,
    ranked_options: rankedOptions,
    failed_reasons: normalizeFailedReasons(apiData?.failed_reasons),
  };
}

function getScoreBadgeStyle(score) {
  if (score >= 100) return { background: "#064e3b", color: "#ffffff" };
  if (score >= 75) return { background: "#dcfce7", color: "#166534" };
  return { background: "#fef3c7", color: "#92400e" };
}

function getScoreLabel(score) {
  if (score >= 100) return "Rất cao";
  if (score >= 75) return "Tốt";
  return "Cần cân nhắc";
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
    message: translateBackendMessage(
      item?.message || item?.detail || "API không trả thông báo cho rule này.",
    ),
  }));
}

function buildRuleRows(results) {
  const resultMap = new Map(results.map((result) => [result.code, result]));

  return REQUIRED_RULES.map((rule) => {
    const matchedResult = resultMap.get(rule.code);

    return {
      id: rule.code,
      code: rule.code,
      label: rule.label,
      meaning: rule.meaning,
      passed: matchedResult?.passed ?? null,
      message:
        matchedResult?.message || "Backend chưa trả kết quả cho rule này.",
      suggestion: rule.suggestion,
    };
  });
}

function getResultVariant(passed) {
  if (passed === true) return "success";
  if (passed === false) return "danger";
  return "muted";
}

function getResultLabel(passed) {
  if (passed === true) return "Đạt";
  if (passed === false) return "Không đạt";
  return "Chưa trả";
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

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
        width: "min(460px, calc(100vw - 40px))",
        padding: 16,
        borderRadius: 18,
        border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
        background: isSuccess ? "#f0fdf4" : "#fff7f7",
        color: isSuccess ? "#166534" : "#8b0000",
        boxShadow: "0 20px 48px rgba(15, 23, 42, 0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 22 }}>{isSuccess ? "✅" : "⚠️"}</span>
        <div style={{ flex: 1 }}>
          <strong>{isSuccess ? "Thành công" : "Có lỗi"}</strong>
          <p style={{ margin: "6px 0 0", lineHeight: 1.5 }}>{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          style={{
            border: 0,
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            fontSize: 20,
            fontWeight: 900,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, option, onCancel, onConfirm, loading }) {
  if (!open || !option) return null;

  return (
    <div className="modalOverlay" role="presentation" onClick={onCancel}>
      <section
        className="modalPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-create-schedule-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(480px, 100%)",
          border: "1px solid rgba(139, 0, 0, 0.22)",
          background: "#ffffff",
        }}
      >
        <header className="modalHeader">
          <div>
            <p className="modalEyebrow">Xác nhận tạo lịch</p>
            <h2
              id="confirm-create-schedule-title"
              className="modalTitle"
              style={{ color: "#8b0000" }}
            >
              Tạo lịch draft với phương án này?
            </h2>
          </div>
        </header>

        <div className="modalBody">
          <p className="modalText">
            Phòng <strong>{option.room_code}</strong> ·{" "}
            {formatDayOfWeek(option.day_of_week)} · Tiết {option.time_slot}
          </p>
        </div>

        <footer className="modalActions">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              minHeight: 42,
              padding: "0 18px",
              borderRadius: 14,
              border: "1px solid rgba(139, 0, 0, 0.34)",
              background: "#fffafa",
              color: "#8b0000",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              minHeight: 42,
              padding: "0 18px",
              borderRadius: 14,
              border: "1px solid #8b0000",
              background: "#8b0000",
              color: "#ffffff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {loading ? "Đang tạo..." : "OK"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function ReasonsModal({ option, onClose }) {
  if (!option) return null;

  return (
    <div className="modalOverlay" role="presentation" onClick={onClose}>
      <section
        className="modalPanel"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modalHeader">
          <div>
            <p className="modalEyebrow">Lý do đề xuất</p>
            <h2 className="modalTitle">
              Phương án #{option.rank} · Phòng {option.room_code}
            </h2>
          </div>

          <button
            type="button"
            className="modalCloseButton"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </header>

        <div className="modalBody">
          {option.reasons.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
              {option.reasons.map((reason, index) => (
                <li key={`${option.optionKey}-reason-${index}`}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="modalText">
              Backend chưa trả danh sách lý do cho phương án này.
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

function FailedReasonsList({ reasons }) {
  if (!Array.isArray(reasons) || reasons.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        width: "min(560px, 100%)",
        marginTop: 8,
        textAlign: "left",
      }}
    >
      <strong>Các ràng buộc thường làm phương án bị loại</strong>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        {reasons.map((reason) => (
          <li key={reason.id}>
            {reason.code ? <strong>{reason.code}: </strong> : null}
            {reason.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AutoArrangePage() {
  const router = useRouter();

  const [autoForm, setAutoForm] = useState(AUTO_FORM_INITIAL);
  const [requests, setRequests] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestError, setRequestError] = useState("");

  const [autoResult, setAutoResult] = useState(null);
  const [arranging, setArranging] = useState(false);
  const [arrangeError, setArrangeError] = useState("");
  const [autoValidation, setAutoValidation] = useState("");
  const [selectedReasonOption, setSelectedReasonOption] = useState(null);
  const [confirmOption, setConfirmOption] = useState(null);
  const [creatingOption, setCreatingOption] = useState(false);
  const [toast, setToast] = useState(null);

  const [checkForm, setCheckForm] = useState(CHECK_FORM_INITIAL);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [constraintData, setConstraintData] = useState(null);
  const [constraintRows, setConstraintRows] = useState([]);

  const selectedRequest = useMemo(
    () =>
      requests.find((item) => String(item.id) === autoForm.schedule_request_id),
    [requests, autoForm.schedule_request_id],
  );

  const rankedOptions = autoResult?.ranked_options || [];
  const failedReasons = autoResult?.failed_reasons || [];
  const failedRows = constraintRows.filter((row) => row.passed === false);
  const passedRows = constraintRows.filter((row) => row.passed === true);
  const missingRows = constraintRows.filter((row) => row.passed === null);

  const autoColumns = useMemo(
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
      { key: "time_slot", label: "Ca", render: (value) => `Tiết ${value}` },
      {
        key: "start_date",
        label: "Thời gian",
        render: (value, row) =>
          `${formatDate(value)} → ${formatDate(row.end_date)}`,
      },
      {
        key: "score",
        label: "Điểm",
        render: (value) => (
          <span
            className="commonBadge"
            style={getScoreBadgeStyle(Number(value))}
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
            onClick={() => setConfirmOption(row)}
            disabled={creatingOption}
          >
            Chọn lịch này
          </ButtonUI>
        ),
      },
    ],
    [creatingOption],
  );

  const constraintColumns = useMemo(
    () => [
      {
        key: "code",
        label: "Ràng buộc",
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
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedRequest) return;

    setAutoForm((current) => ({
      ...current,
      start_date:
        current.start_date || selectedRequest.preferred_week_start || "",
      end_date: current.end_date || selectedRequest.preferred_week_end || "",
    }));
  }, [selectedRequest]);

  function handleAuthError(error) {
    if (error?.status === 401 || error?.status === 403) {
      clearAuth();
      router.replace("/login");
      return true;
    }
    return false;
  }

  async function loadInitialData() {
    try {
      setLoadingRequests(true);
      setRequestError("");

      const [requestResponse, scheduleResponse] = await Promise.all([
        listScheduleRequests(),
        listSchedules({}),
      ]);

      const nextRequests = normalizeScheduleRequests(requestResponse);
      const scheduleItems = extractSchedules(scheduleResponse);
      const nextLecturers = buildLecturerOptions(scheduleItems);

      setRequests(nextRequests);
      setLecturers(nextLecturers);

      if (nextLecturers[0]) {
        setAutoForm((current) => ({
          ...current,
          lecturer_user_id: current.lecturer_user_id || nextLecturers[0].id,
        }));
        setCheckForm((current) => ({
          ...current,
          lecturer_user_id: current.lecturer_user_id || nextLecturers[0].id,
        }));
      }
    } catch (error) {
      if (handleAuthError(error)) return;
      setRequestError(
        getApiErrorMessage(error, "Không thể tải dữ liệu xếp lịch."),
      );
    } finally {
      setLoadingRequests(false);
    }
  }

  function updateAutoForm(field, value) {
    setAutoForm((current) => ({ ...current, [field]: value }));
    setAutoValidation("");
    setArrangeError("");
  }

  function updateCheckForm(field, value) {
    setCheckForm((current) => ({ ...current, [field]: value }));
    setCheckError("");
  }

  function buildAutoPayload() {
    const requestId = toPositiveInteger(autoForm.schedule_request_id);
    if (!requestId) throw new Error("chưa chọn yêu cầu xếp lịch");

    return {
      request_id: requestId,
      schedule_request_id: requestId,
      preferred_day_of_week: toPositiveInteger(autoForm.preferred_day_of_week),
      preferred_time_slot: autoForm.preferred_time_slot || undefined,
      practice_team_id: toPositiveInteger(autoForm.practice_team_id),
      lecturer_user_id: toPositiveInteger(autoForm.lecturer_user_id),
      start_date: autoForm.start_date || selectedRequest?.preferred_week_start,
      end_date: autoForm.end_date || selectedRequest?.preferred_week_end,
    };
  }

  function buildCreatePayload(option) {
    return {
      ...option.raw,
      room_code: option.room_code,
      day_of_week: option.day_of_week,
      time_slot: option.time_slot,
      practice_team_id:
        toPositiveInteger(option.practice_team_id) ||
        toPositiveInteger(autoForm.practice_team_id),
      lecturer_user_id:
        toPositiveInteger(option.lecturer_user_id) ||
        toPositiveInteger(autoForm.lecturer_user_id),
      start_date: option.start_date || autoForm.start_date,
      end_date: option.end_date || autoForm.end_date || option.start_date,
      notes: `Tạo từ tự động xếp lịch - phương án #${option.rank}, điểm ${option.score}`,
    };
  }

  function buildCheckPayload() {
    return {
      room_code: checkForm.room_code.trim().toUpperCase(),
      lecturer_user_id: toPositiveInteger(checkForm.lecturer_user_id),
      practice_team_id: toPositiveInteger(checkForm.practice_team_id),
      day_of_week: toPositiveInteger(checkForm.day_of_week),
      time_slot: checkForm.time_slot,
      start_date: checkForm.start_date,
      end_date: checkForm.end_date,
      required_software_ids: parseSoftwareIds(checkForm.required_software_ids),
    };
  }

  async function handleAutoArrange(event) {
    event.preventDefault();

    try {
      setArranging(true);
      setAutoResult(null);
      setArrangeError("");
      setAutoValidation("");

      const response = await autoArrange(buildAutoPayload());
      setAutoResult(normalizeAutoArrangeData(response));
    } catch (error) {
      if (handleAuthError(error)) return;
      const message = getApiErrorMessage(error, "Không thể tự động xếp lịch.");
      if (message === "chưa chọn yêu cầu xếp lịch") {
        setAutoValidation(message);
      } else {
        setArrangeError(message);
      }
    } finally {
      setArranging(false);
    }
  }

  async function handleConfirmCreateSchedule() {
    if (!confirmOption) return;

    const requestId = toPositiveInteger(autoForm.schedule_request_id);

    if (!requestId) {
      setAutoValidation("chưa chọn yêu cầu xếp lịch");
      setConfirmOption(null);
      return;
    }

    const createPayload = buildCreatePayload(confirmOption);

    try {
      setCreatingOption(true);
      setToast(null);

      const constraintResponse = await checkScheduleConstraints({
        room_code: createPayload.room_code,
        lecturer_user_id: toPositiveInteger(createPayload.lecturer_user_id),
        practice_team_id: toPositiveInteger(createPayload.practice_team_id),
        day_of_week: toPositiveInteger(createPayload.day_of_week),
        time_slot: createPayload.time_slot,
        start_date: createPayload.start_date,
        end_date: createPayload.end_date,
        required_software_ids: Array.isArray(
          createPayload.required_software_ids,
        )
          ? createPayload.required_software_ids
          : [],
      });

      const constraintResult = constraintResponse?.data || {};
      const failedMessage = buildConstraintFailMessage(
        constraintResult.results,
      );

      if (!constraintResult.passed || failedMessage) {
        setToast({
          type: "error",
          message:
            failedMessage ||
            "Không thể tạo lịch draft vì còn ràng buộc chưa đạt.",
        });
        return;
      }

      await createScheduleFromOption(createPayload, requestId);

      setToast({ type: "success", message: "Đã tạo lịch draft." });
      setConfirmOption(null);

      window.setTimeout(() => {
        router.replace("/academic/schedules");
      }, 650);
    } catch (error) {
      if (handleAuthError(error)) return;

      const constraintResults = extractConstraintResultsFromError(error);
      const failedMessage = buildConstraintFailMessage(constraintResults);

      setToast({
        type: "error",
        message:
          failedMessage ||
          getApiErrorMessage(
            error,
            "Không thể tạo lịch draft từ phương án đã chọn.",
          ),
      });
    } finally {
      setCreatingOption(false);
    }
  }

  async function handleCheckConstraints(event) {
    event.preventDefault();

    try {
      setChecking(true);
      setCheckError("");
      setConstraintData(null);
      setConstraintRows([]);

      const response = await checkScheduleConstraints(buildCheckPayload());
      const apiData = response?.data || {};
      const rows = buildRuleRows(normalizeConstraintResults(apiData));

      setConstraintData(apiData);
      setConstraintRows(rows);
    } catch (error) {
      if (handleAuthError(error)) return;
      setCheckError(
        getApiErrorMessage(error, "Không thể kiểm tra ràng buộc xếp lịch."),
      );
    } finally {
      setChecking(false);
    }
  }

  function loadCheckCase(nextForm) {
    setCheckForm((current) => ({
      ...current,
      ...nextForm,
      lecturer_user_id: nextForm.lecturer_user_id || current.lecturer_user_id,
    }));
    setConstraintData(null);
    setConstraintRows([]);
    setCheckError("");
  }

  return (
    <section className="adminPageStack">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ReasonsModal
        option={selectedReasonOption}
        onClose={() => setSelectedReasonOption(null)}
      />
      <ConfirmDialog
        open={Boolean(confirmOption)}
        option={confirmOption}
        loading={creatingOption}
        onCancel={() => setConfirmOption(null)}
        onConfirm={handleConfirmCreateSchedule}
      />

      <div className="commonPageHeader">
        <div className="commonPageHeaderBody">
          <p className="commonEyebrow">Academic · Scheduling</p>
          <h1 className="commonTitle">Kiểm tra ràng buộc & xếp lịch tự động</h1>
        </div>
      </div>

      <section className="card">
        <div style={{ marginBottom: 14 }}>
          <p className="commonEyebrow">Kiểm tra ràng buộc</p>
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
              <ButtonUI
                type="button"
                tone="primary"
                shape="rounded"
                onClick={() => loadCheckCase(CHECK_PASS_FORM)}
                disabled={checking}
              >
                Nạp case PASS
              </ButtonUI>

              <ButtonUI
                type="button"
                tone="primary"
                shape="rounded"
                onClick={() => loadCheckCase(CHECK_ROOM_STATUS_FORM)}
                disabled={checking}
              >
                Nạp case ROOM_STATUS 2B31
              </ButtonUI>

              <ButtonUI
                type="button"
                tone="primary"
                shape="rounded"
                onClick={() => loadCheckCase(CHECK_CONFLICT_FORM)}
                disabled={checking}
              >
                Nạp case ROOM_CONFLICT
              </ButtonUI>
            </div>

            <div className="commonGrid commonGrid3">
              <label className="label">
                Phòng
                <input
                  className="input"
                  value={checkForm.room_code}
                  onChange={(event) =>
                    updateCheckForm("room_code", event.target.value)
                  }
                  disabled={checking}
                />
              </label>

              <label className="label">
                Giảng viên
                <select
                  className="select"
                  value={checkForm.lecturer_user_id}
                  onChange={(event) =>
                    updateCheckForm("lecturer_user_id", event.target.value)
                  }
                  disabled={checking}
                >
                  <option value="">Chọn giảng viên</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.id}: {lecturer.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label">
                ID tổ thực hành
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={checkForm.practice_team_id}
                  onChange={(event) =>
                    updateCheckForm("practice_team_id", event.target.value)
                  }
                  disabled={checking}
                />
              </label>

              <label className="label">
                Thứ
                <select
                  className="select"
                  value={checkForm.day_of_week}
                  onChange={(event) =>
                    updateCheckForm("day_of_week", event.target.value)
                  }
                  disabled={checking}
                >
                  <option value="2">Thứ 2</option>
                  <option value="3">Thứ 3</option>
                  <option value="4">Thứ 4</option>
                  <option value="5">Thứ 5</option>
                  <option value="6">Thứ 6</option>
                </select>
              </label>

              <label className="label">
                Ca học
                <select
                  className="select"
                  value={checkForm.time_slot}
                  onChange={(event) =>
                    updateCheckForm("time_slot", event.target.value)
                  }
                  disabled={checking}
                >
                  {CHECK_TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label">
                Từ ngày
                <input
                  className="input"
                  type="date"
                  value={checkForm.start_date}
                  onChange={(event) =>
                    updateCheckForm("start_date", event.target.value)
                  }
                  disabled={checking}
                />
              </label>

              <label className="label">
                Đến ngày
                <input
                  className="input"
                  type="date"
                  value={checkForm.end_date}
                  onChange={(event) =>
                    updateCheckForm("end_date", event.target.value)
                  }
                  disabled={checking}
                />
              </label>

              <label className="label">
                ID phần mềm yêu cầu
                <input
                  className="input"
                  value={checkForm.required_software_ids}
                  placeholder="Ví dụ: 1,2,6,8"
                  onChange={(event) =>
                    updateCheckForm("required_software_ids", event.target.value)
                  }
                  disabled={checking}
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 14,
              }}
            >
              <ButtonUI
                tone="primary"
                shape="rounded"
                type="submit"
                disabled={checking}
              >
                {checking ? "Đang kiểm tra..." : "Kiểm tra ràng buộc"}
              </ButtonUI>

              <ButtonUI
                type="button"
                tone="primary"
                shape="rounded"
                disabled={checking}
                onClick={() => {
                  setConstraintData(null);
                  setConstraintRows([]);
                  setCheckError("");
                }}
              >
                Xóa kết quả
              </ButtonUI>
            </div>
          </form>

          <aside
            className="commonActionCard"
            style={{ display: "grid", gap: 10 }}
          >
            <p className="commonEyebrow">Kết quả tổng quan</p>

            <div className="commonGrid commonGrid2">
              <div className="commonActionCard" style={{ padding: 10 }}>
                <p className="commonActionTitle">Tổng</p>
                <strong>
                  {constraintRows.length || REQUIRED_RULES.length}
                </strong>
              </div>
              <div className="commonActionCard" style={{ padding: 10 }}>
                <p className="commonActionTitle">Đạt</p>
                <strong>{passedRows.length}</strong>
              </div>
              <div className="commonActionCard" style={{ padding: 10 }}>
                <p className="commonActionTitle">Không đạt</p>
                <strong>{failedRows.length}</strong>
              </div>
              <div className="commonActionCard" style={{ padding: 10 }}>
                <p className="commonActionTitle">Chưa trả</p>
                <strong>{missingRows.length}</strong>
              </div>
            </div>

            {!constraintData && !checking && !checkError ? (
              <EmptyState
                title="Chưa có kết quả kiểm tra"
                description="Nhập dữ liệu lịch thực hành hoặc nạp case demo rồi bấm Kiểm tra ràng buộc."
                icon="✅"
              />
            ) : null}

            {constraintData ? (
              <StatusBadge
                variant={
                  failedRows.length > 0 || !constraintData?.passed
                    ? "danger"
                    : "success"
                }
              >
                {failedRows.length > 0 || !constraintData?.passed
                  ? "Không hợp lệ"
                  : "Hợp lệ"}
              </StatusBadge>
            ) : null}
          </aside>
        </section>

        <div style={{ marginTop: 16 }}>
          {checking ? (
            <LoadingState
              title="Đang kiểm tra ràng buộc..."
              description="Hệ thống đang gọi API kiểm tra ràng buộc."
            />
          ) : checkError ? (
            <ErrorState
              title="Không thể kiểm tra ràng buộc"
              error={checkError}
              showRetry={false}
            />
          ) : constraintData ? (
            <DataTable
              columns={constraintColumns}
              rows={constraintRows}
              emptyTitle="API chưa trả ràng buộc"
              emptyDescription="Backend chưa trả danh sách kết quả kiểm tra."
            />
          ) : null}
        </div>
      </section>

      <section className="card">
        <div style={{ marginBottom: 14 }}>
          <p className="commonEyebrow">Tự động xếp lịch</p>
        </div>

        {loadingRequests ? (
          <LoadingState
            title="Đang tải yêu cầu xếp lịch..."
            description="Hệ thống đang lấy dữ liệu từ API thật."
          />
        ) : requestError ? (
          <ErrorState
            title="Không thể tải dữ liệu"
            error={requestError}
            onRetry={loadInitialData}
          />
        ) : (
          <form onSubmit={handleAutoArrange}>
            <div className="commonGrid commonGrid3">
              <label className="label">
                Yêu cầu xếp lịch <span style={{ color: "#b91c1c" }}>*</span>
                <select
                  className="select"
                  value={autoForm.schedule_request_id}
                  onChange={(event) =>
                    updateAutoForm("schedule_request_id", event.target.value)
                  }
                  disabled={arranging}
                >
                  <option value="">Chọn yêu cầu xếp lịch</option>
                  {requests
                    .filter(
                      (item) =>
                        !["cancelled", "rejected", "published"].includes(
                          String(item.request_status).toLowerCase(),
                        ),
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        #{item.id} · {item.courseLabel} · {item.request_status}
                      </option>
                    ))}
                </select>
              </label>

              <label className="label">
                Ngày ưu tiên
                <select
                  className="select"
                  value={autoForm.preferred_day_of_week}
                  onChange={(event) =>
                    updateAutoForm("preferred_day_of_week", event.target.value)
                  }
                  disabled={arranging}
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
                  value={autoForm.preferred_time_slot}
                  onChange={(event) =>
                    updateAutoForm("preferred_time_slot", event.target.value)
                  }
                  disabled={arranging}
                >
                  {AUTO_TIME_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label">
                ID tổ thực hành
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={autoForm.practice_team_id}
                  onChange={(event) =>
                    updateAutoForm("practice_team_id", event.target.value)
                  }
                  disabled={arranging}
                />
              </label>

              <label className="label">
                Giảng viên
                <select
                  className="select"
                  value={autoForm.lecturer_user_id}
                  onChange={(event) =>
                    updateAutoForm("lecturer_user_id", event.target.value)
                  }
                  disabled={arranging}
                >
                  <option value="">Chọn giảng viên</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.id}: {lecturer.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label">
                Từ ngày
                <input
                  className="input"
                  type="date"
                  value={autoForm.start_date}
                  onChange={(event) =>
                    updateAutoForm("start_date", event.target.value)
                  }
                  disabled={arranging}
                />
              </label>

              <label className="label">
                Đến ngày
                <input
                  className="input"
                  type="date"
                  value={autoForm.end_date}
                  onChange={(event) =>
                    updateAutoForm("end_date", event.target.value)
                  }
                  disabled={arranging}
                />
              </label>
            </div>

            {autoValidation ? (
              <p style={{ color: "#b91c1c", fontSize: 13, fontWeight: 800 }}>
                {autoValidation}
              </p>
            ) : !autoForm.schedule_request_id ? (
              <p style={{ color: "#b91c1c", fontSize: 13, fontWeight: 800 }}>
                chưa chọn yêu cầu xếp lịch
              </p>
            ) : null}

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 14,
              }}
            >
              <ButtonUI
                type="submit"
                tone="primary"
                shape="rounded"
                disabled={!autoForm.schedule_request_id || arranging}
              >
                {arranging ? "Đang tự động xếp lịch..." : "Tự động xếp lịch"}
              </ButtonUI>

              <ButtonUI
                type="button"
                tone="primary"
                shape="rounded"
                onClick={() => {
                  setAutoResult(null);
                  setArrangeError("");
                  setAutoValidation("");
                }}
                disabled={arranging}
              >
                Xóa kết quả
              </ButtonUI>
            </div>
          </form>
        )}

        <div style={{ marginTop: 16 }}>
          {arranging ? (
            <LoadingState
              title="Đang sinh phương án xếp lịch..."
              description="API có thể mất vài giây vì phải kiểm tra nhiều phương án."
            />
          ) : arrangeError ? (
            <ErrorState
              title="Không thể tự động xếp lịch"
              error={arrangeError}
              onRetry={() => {}}
              showRetry={false}
            />
          ) : autoResult?.auto_arrange_status === "no_options" ? (
            <EmptyState
              title="Không có phương án hợp lệ"
              description="Thử đổi tuần, đổi ca, hoặc giảm sĩ số tổ thực hành."
              icon="🧩"
              action={<FailedReasonsList reasons={failedReasons} />}
            />
          ) : rankedOptions.length > 0 ? (
            <DataTable
              columns={autoColumns}
              rows={rankedOptions}
              rowKey="optionKey"
              pageSize={3}
              enablePagination={false}
            />
          ) : (
            <EmptyState
              title="Chưa có kết quả tự động xếp lịch"
              description="Chọn yêu cầu xếp lịch rồi bấm Tự động xếp lịch."
              icon="📋"
            />
          )}
        </div>
      </section>
    </section>
  );
}
