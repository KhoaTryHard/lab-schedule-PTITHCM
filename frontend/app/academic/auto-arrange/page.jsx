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
import { listMasterData } from "../../../services/adminService";
import { listRooms } from "../../../services/roomService";

const AUTO_FORM_INITIAL = {
  schedule_request_id: "",
  preferred_day_of_week: "",
  preferred_time_slot: "",
  practice_team_id: "",
  lecturer_user_id: "",
  start_date: "",
  end_date: "",
};

const CHECK_FORM_INITIAL = {
  practice_team_id: "",
  lecturer_user_id: "",
  room_code: "",
  day_of_week: "",
  time_slot: "",
  start_date: "",
  end_date: "",
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
];

const DAY_OPTIONS = [
  { value: "", label: "Không chọn" },
  { value: "2", label: "Thứ 2" },
  { value: "3", label: "Thứ 3" },
  { value: "4", label: "Thứ 4" },
  { value: "5", label: "Thứ 5" },
  { value: "6", label: "Thứ 6" },
  { value: "7", label: "Thứ 7" },
];

const AUTO_TIME_OPTIONS = [
  { value: "", label: "Không ưu tiên" },
  { value: "1-4", label: "Ca sáng" },
  { value: "7-10", label: "Ca chiều" },
];

const CHECK_TIME_OPTIONS = [
  { value: "", label: "Không chọn" },
  { value: "1-4", label: "Ca sáng" },
  { value: "7-10", label: "Ca chiều" },
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
    "Ranked by simple rule-based scoring":
      "Được xếp hạng theo điểm rule-based.",
    "No room conflict detected": "Không phát hiện trùng phòng.",
    "No lecturer conflict detected": "Không phát hiện trùng lịch giảng viên.",
    "Room is not blocked for this period":
      "Phòng không bị khóa trong khoảng thời gian này.",
    "No blocked holidays on the selected schedule":
      "Không có ngày nghỉ bị chặn trong lịch đã chọn.",
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

function buildRoomOptions(items) {
  return items
    .filter((room) => {
      if (typeof room === "string") return true;
      return String(room?.room_status || "").toLowerCase() === "available";
    })
    .map((room) => {
      const roomCode =
        typeof room === "string" ? room : room?.room_code || room?.code;

      if (!roomCode) return null;

      const normalizedRoomCode = String(roomCode).trim().toUpperCase();

      return {
        value: normalizedRoomCode,
        label: normalizedRoomCode,
      };
    })
    .filter(Boolean);
}

function getCourseSectionLabel(requestItem) {
  const raw = requestItem?.raw || requestItem || {};
  const courseCode = raw.course_code || requestItem?.course_code || "";
  const courseName = raw.course_name || requestItem?.course_name || "";
  const groupNo = raw.group_no || requestItem?.group_no || "";

  if (courseCode || courseName || groupNo) {
    return `${courseCode}${courseName ? ` - ${courseName}` : ""}${
      groupNo ? ` | Nhóm ${groupNo}` : ""
    }`;
  }

  return requestItem?.courseLabel || "Lớp học phần";
}

function buildPracticeTeamLabel(team, requestItem) {
  return `${getCourseSectionLabel(requestItem)} | Tổ ${
    team.team_no || team.id
  }${team.planned_size ? ` | ${team.planned_size} SV` : ""}`;
}

function buildAllPracticeTeamOptions(requests) {
  const optionMap = new Map();

  requests.forEach((requestItem) => {
    getRequestPracticeTeams(requestItem).forEach((team) => {
      const teamId = toPositiveInteger(team?.id);

      if (!teamId || optionMap.has(String(teamId))) {
        return;
      }

      optionMap.set(String(teamId), {
        value: String(teamId),
        label: buildPracticeTeamLabel(team, requestItem),
      });
    });
  });

  return [...optionMap.values()];
}

function formatDateInputInVietnamTime(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const partMap = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

function getDatePart(parts, type) {
  return parts.find((part) => part.type === type)?.value || "";
}

function formatDateForInput(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = getDatePart(parts, "year");
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");

  return year && month && day ? `${year}-${month}-${day}` : "";
}

function toDateInputValue(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : formatDateForInput(value);
  }

  const text = String(value).trim();

  if (!text) return "";

  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    return text;
  }

  const vietnamDateMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (vietnamDateMatch) {
    const [, day, month, year] = vietnamDateMatch;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatDateForInput(date);
}

function extractDataItems(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.schedules)) return response.data.schedules;
  return [];
}

function normalizeAutoTimeSlotValue(slot) {
  if (!slot) return "";

  const slotLabel = String(slot.slot_label || slot.time_slot || slot).trim();
  const matchedRange = slotLabel.match(/(\d+)\s*-\s*(\d+)/);

  if (matchedRange) {
    return `${matchedRange[1]}-${matchedRange[2]}`;
  }

  const startPeriod = toPositiveInteger(slot.start_period);
  const endPeriod = toPositiveInteger(slot.end_period);

  if (startPeriod && endPeriod) {
    return `${startPeriod}-${endPeriod}`;
  }

  return "";
}

function buildAutoTimeOptions(timeSlots) {
  const optionMap = new Map();

  timeSlots.forEach((slot) => {
    const value = normalizeAutoTimeSlotValue(slot);

    if (!value || optionMap.has(value)) {
      return;
    }

    optionMap.set(value, {
      value,
      label: slot.slot_label || `Tiết ${value}`,
    });
  });

  const dynamicOptions = [...optionMap.values()];

  return [
    { value: "", label: "Không ưu tiên" },
    ...(dynamicOptions.length > 0
      ? dynamicOptions
      : AUTO_TIME_OPTIONS.slice(1)),
  ];
}

function getPreferredTimeSlotValue(requestItem, timeSlots) {
  const preferredTimeSlotId = toPositiveInteger(
    requestItem?.preferred_time_slot_id ||
      requestItem?.raw?.preferred_time_slot_id,
  );

  if (preferredTimeSlotId) {
    const matchedSlot = timeSlots.find(
      (slot) => Number(slot.id) === Number(preferredTimeSlotId),
    );

    const mappedValue = normalizeAutoTimeSlotValue(matchedSlot);

    if (mappedValue) {
      return mappedValue;
    }
  }

  return normalizeAutoTimeSlotValue(
    requestItem?.preferred_time_slot || requestItem?.raw?.preferred_time_slot,
  );
}

function getRequestPracticeTeams(requestItem) {
  const teams =
    requestItem?.practice_teams || requestItem?.raw?.practice_teams || [];

  return Array.isArray(teams) ? teams : [];
}

function inferPracticeTeamId(requestItem) {
  const directPracticeTeamId = toPositiveInteger(
    requestItem?.practice_team_id || requestItem?.raw?.practice_team_id,
  );

  if (directPracticeTeamId) {
    return String(directPracticeTeamId);
  }

  const firstTeam = getRequestPracticeTeams(requestItem)[0];

  return firstTeam?.id ? String(firstTeam.id) : "";
}

function inferLecturerId(requestItem, lecturerAssignments, schedules) {
  const directLecturerId = toPositiveInteger(
    requestItem?.lecturer_user_id || requestItem?.raw?.lecturer_user_id,
  );

  if (directLecturerId) {
    return String(directLecturerId);
  }

  const courseSectionId = toPositiveInteger(
    requestItem?.course_section_id || requestItem?.raw?.course_section_id,
  );

  if (!courseSectionId) {
    return "";
  }

  const primaryAssignment =
    lecturerAssignments.find(
      (assignment) =>
        Number(assignment?.course_section_id) === Number(courseSectionId) &&
        String(assignment?.lecturer_role || "").toLowerCase() === "primary" &&
        toPositiveInteger(assignment?.lecturer_user_id),
    ) ||
    lecturerAssignments.find(
      (assignment) =>
        Number(assignment?.course_section_id) === Number(courseSectionId) &&
        toPositiveInteger(assignment?.lecturer_user_id),
    );

  if (primaryAssignment?.lecturer_user_id) {
    return String(primaryAssignment.lecturer_user_id);
  }

  const matchedSchedule = schedules.find(
    (schedule) =>
      Number(schedule?.course_section_id) === Number(courseSectionId) &&
      toPositiveInteger(schedule?.lecturer_user_id),
  );

  return matchedSchedule?.lecturer_user_id
    ? String(matchedSchedule.lecturer_user_id)
    : "";
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
      max_students_per_team: item?.max_students_per_team,
      total_required_sessions: item?.total_required_sessions,
      preferred_week_start: toDateInputValue(item?.preferred_week_start),
      preferred_week_end: toDateInputValue(item?.preferred_week_end),
      preferred_day_of_week: item?.preferred_day_of_week,
      preferred_time_slot_id: item?.preferred_time_slot_id,
      practice_teams: getRequestPracticeTeams(item),
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

function buildLecturerOptions(items) {
  const lecturerMap = new Map();

  items.forEach((item) => {
    const id =
      item?.lecturer_user_id ||
      item?.user_id ||
      (item?.full_name || item?.username || item?.email ? item?.id : null);

    const name =
      item?.lecturer_name ||
      item?.lecturer_full_name ||
      item?.full_name ||
      item?.name ||
      item?.lecturer ||
      "";

    if (id && !lecturerMap.has(String(id))) {
      lecturerMap.set(String(id), {
        id: String(id),
        name: name || `Giảng viên #${id}`,
      });
    }
  });

  return [...lecturerMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "vi"),
  );
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
  const scheduleItems = Array.isArray(option?.schedule_items)
    ? option.schedule_items
    : [];

  const firstItem = scheduleItems[0] || {};
  const roomCode = option?.room_code || firstItem.room_code || "";
  const dayOfWeek = Number(
    option?.day_of_week || firstItem.day_of_week || option?.dayOfWeek || 0,
  );
  const timeSlot =
    option?.time_slot || firstItem.time_slot || option?.timeSlot || "";
  const startDate =
    option?.start_date || firstItem.start_date || option?.startDate || "";
  const endDate =
    option?.end_date || firstItem.end_date || option?.endDate || startDate;

  const normalizedItems = scheduleItems.map((item) => ({
    room_code: item.room_code,
    day_of_week: Number(item.day_of_week || 0),
    time_slot: item.time_slot,
    start_date: item.start_date,
    end_date: item.end_date || item.start_date,
    session_dates: Array.isArray(item.session_dates) ? item.session_dates : [],
    start_week_no: item.start_week_no || "",
    end_week_no: item.end_week_no || "",
    total_required_sessions: item.total_required_sessions || "",
    practice_team_id: item.practice_team_id,
    lecturer_user_id: item.lecturer_user_id,
    team_no: item.team_no,
    planned_size: item.planned_size,
  }));

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
    session_dates: Array.isArray(option?.session_dates)
      ? option.session_dates
      : firstItem.session_dates || [],
    start_week_no: option?.start_week_no || option?.startWeekNo || "",
    end_week_no: option?.end_week_no || option?.endWeekNo || "",
    total_required_sessions:
      option?.total_required_sessions || option?.totalRequiredSessions || "",
    team_count: option?.team_count || normalizedItems.length || 1,
    schedule_items: normalizedItems,
    score,
    reasons: normalizeReasons(option?.reasons),
    practice_team_id: option?.practice_team_id || firstItem.practice_team_id,
    lecturer_user_id: option?.lecturer_user_id || firstItem.lecturer_user_id,
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
  const [roomOptions, setRoomOptions] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [lecturerAssignments, setLecturerAssignments] = useState([]);
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
  const practiceTeamOptions = useMemo(
    () => getRequestPracticeTeams(selectedRequest),
    [selectedRequest],
  );
  const checkPracticeTeamOptions = useMemo(
    () => buildAllPracticeTeamOptions(requests),
    [requests],
  );
  const autoTimeOptions = useMemo(
    () => buildAutoTimeOptions(timeSlots),
    [timeSlots],
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
        key: "team_count",
        label: "Số tổ",
        render: (value) => <strong>{value || 1}</strong>,
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
        render: (value, row) => {
          const weekLabel =
            row.start_week_no && row.end_week_no
              ? `Tuần ${row.start_week_no}-${row.end_week_no} · `
              : "";

          return `${weekLabel}${formatDate(value)} → ${formatDate(row.end_date)}`;
        },
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

    const mappedTimeSlot = getPreferredTimeSlotValue(
      selectedRequest,
      timeSlots,
    );
    const inferredPracticeTeamId = inferPracticeTeamId(selectedRequest);
    const inferredLecturerId = inferLecturerId(
      selectedRequest,
      lecturerAssignments,
      scheduleItems,
    );

    setAutoForm((current) => ({
      ...current,
      preferred_day_of_week: selectedRequest.preferred_day_of_week
        ? String(selectedRequest.preferred_day_of_week)
        : "",
      preferred_time_slot: mappedTimeSlot || "",
      practice_team_id: "",
      lecturer_user_id: inferredLecturerId || current.lecturer_user_id || "",
      start_date: selectedRequest.preferred_week_start || "",
      end_date: selectedRequest.preferred_week_end || "",
    }));

    setAutoResult(null);
    setArrangeError("");
    setAutoValidation("");
  }, [selectedRequest, timeSlots, scheduleItems, lecturerAssignments]);

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

      const [
        requestResponse,
        scheduleResponse,
        timeSlotResponse,
        lecturerAssignmentResponse,
        lecturerResponse,
        roomResponse,
      ] = await Promise.all([
        listScheduleRequests(),
        listSchedules({}),
        listMasterData("time-slots").catch(() => ({ data: [] })),
        listMasterData("lecturer-assignments").catch(() => ({ data: [] })),
        listMasterData("lecturers").catch(() => ({ data: [] })),
        listRooms({ scope: "mvp" }).catch(() => ({ data: [] })),
      ]);

      const nextRequests = normalizeScheduleRequests(requestResponse);
      const nextSchedules = extractSchedules(scheduleResponse);
      const nextTimeSlots = extractDataItems(timeSlotResponse);
      const nextLecturerAssignments = extractDataItems(
        lecturerAssignmentResponse,
      );
      const nextLecturers = buildLecturerOptions([
        ...extractDataItems(lecturerResponse),
        ...nextSchedules,
        ...nextLecturerAssignments,
      ]);
      const nextRooms = buildRoomOptions(extractDataItems(roomResponse));
      const firstPracticeTeam = buildAllPracticeTeamOptions(nextRequests)[0];

      setRequests(nextRequests);
      setScheduleItems(nextSchedules);
      setTimeSlots(nextTimeSlots);
      setLecturerAssignments(nextLecturerAssignments);
      setLecturers(nextLecturers);
      setRoomOptions(nextRooms);

      setCheckForm((current) => ({
        ...current,
        room_code: current.room_code || nextRooms[0]?.value || "2B11",
        lecturer_user_id:
          current.lecturer_user_id || nextLecturers[0]?.id || "",
        practice_team_id:
          current.practice_team_id || firstPracticeTeam?.value || "",
      }));
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

    if (!requestId) {
      throw new Error("chưa chọn yêu cầu xếp lịch");
    }

    const lecturerUserId = toPositiveInteger(autoForm.lecturer_user_id);
    const preferredDayOfWeek =
      toPositiveInteger(autoForm.preferred_day_of_week) ||
      toPositiveInteger(selectedRequest?.preferred_day_of_week);
    const preferredTimeSlot =
      autoForm.preferred_time_slot ||
      getPreferredTimeSlotValue(selectedRequest, timeSlots) ||
      undefined;
    const startDate =
      autoForm.start_date || selectedRequest?.preferred_week_start || "";
    const endDate =
      autoForm.end_date || selectedRequest?.preferred_week_end || startDate;

    if (!lecturerUserId) {
      throw new Error(
        "chưa xác định được giảng viên, vui lòng chọn giảng viên",
      );
    }

    if (!startDate || !endDate) {
      throw new Error("yêu cầu xếp lịch chưa có khoảng ngày hợp lệ");
    }

    return {
      request_id: requestId,
      schedule_request_id: requestId,
      total_required_sessions:
        toPositiveInteger(selectedRequest?.total_required_sessions) ||
        undefined,
      preferred_day_of_week: preferredDayOfWeek || undefined,
      preferred_time_slot: preferredTimeSlot,
      practice_team_id: undefined,
      lecturer_user_id: lecturerUserId,
      start_date: startDate,
      end_date: endDate,
    };
  }

  function buildCreatePayload(option) {
    const scheduleItems = Array.isArray(option.schedule_items)
      ? option.schedule_items
      : [];

    if (scheduleItems.length > 0) {
      return {
        schedule_items: scheduleItems.map((item) => ({
          room_code: item.room_code,
          day_of_week: item.day_of_week,
          time_slot: item.time_slot,
          practice_team_id: toPositiveInteger(item.practice_team_id),
          lecturer_user_id:
            toPositiveInteger(item.lecturer_user_id) ||
            toPositiveInteger(autoForm.lecturer_user_id),
          start_date: item.start_date,
          end_date: item.end_date || item.start_date,
          total_required_sessions:
            toPositiveInteger(item.total_required_sessions) ||
            toPositiveInteger(selectedRequest?.total_required_sessions) ||
            undefined,
          notes: `Tạo từ tự động xếp lịch - phương án #${option.rank}, điểm ${option.score}`,
        })),
        notes: `Tạo từ tự động xếp lịch - phương án #${option.rank}, điểm ${option.score}`,
      };
    }

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
    const payload = {
      room_code: checkForm.room_code.trim().toUpperCase(),
      lecturer_user_id: toPositiveInteger(checkForm.lecturer_user_id),
      practice_team_id: toPositiveInteger(checkForm.practice_team_id),
      day_of_week: toPositiveInteger(checkForm.day_of_week),
      time_slot: checkForm.time_slot,
      start_date: checkForm.start_date,
      end_date: checkForm.end_date,
    };

    if (!payload.room_code) throw new Error("Vui lòng chọn phòng.");
    if (!payload.lecturer_user_id) throw new Error("Vui lòng chọn giảng viên.");
    if (!payload.practice_team_id)
      throw new Error("Vui lòng chọn nhóm/tổ thực hành.");
    if (!payload.day_of_week) throw new Error("Vui lòng chọn thứ.");
    if (!payload.time_slot) throw new Error("Vui lòng chọn ca học.");
    if (!payload.start_date || !payload.end_date) {
      throw new Error("Vui lòng chọn khoảng ngày kiểm tra.");
    }

    return payload;
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

      const itemsToCheck =
        Array.isArray(createPayload.schedule_items) &&
        createPayload.schedule_items.length > 0
          ? createPayload.schedule_items
          : [createPayload];

      for (const item of itemsToCheck) {
        const constraintResponse = await checkScheduleConstraints({
          room_code: item.room_code,
          lecturer_user_id: toPositiveInteger(item.lecturer_user_id),
          practice_team_id: toPositiveInteger(item.practice_team_id),
          day_of_week: toPositiveInteger(item.day_of_week),
          time_slot: item.time_slot,
          start_date: item.start_date,
          end_date: item.end_date,
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
                        String(item.request_status).toLowerCase() ===
                        "pending_review",
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
                  {autoTimeOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label">
                Phạm vi xếp lịch
                <input
                  className="input"
                  value={
                    selectedRequest
                      ? `Tự động xếp tất cả ${practiceTeamOptions.length || 0} tổ thực hành`
                      : "Chọn yêu cầu xếp lịch trước"
                  }
                  readOnly
                  disabled
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
