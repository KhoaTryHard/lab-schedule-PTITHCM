"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { getUser } from "../../../lib/authStorage";
import {
  listScheduleWeeks,
  listSchedules,
  listTimeSlots,
} from "../../../services/scheduleService";
import {
  createScheduleChangeRequest,
  listScheduleChangeRequests,
} from "../../../services/scheduleChangeRequestService";

const INITIAL_FORM_STATE = {
  practice_key: "",
  affected_occurrence_key: "",
  lab_schedule_entry_id: "",
  original_occurrence_date: "",
  proposed_week_start: "",
  proposed_start_date: "",
  proposed_end_date: "",
  proposed_day_of_week: "",
  proposed_time_slot_id: "",
  reason_text: "",
};

const DAY_OPTIONS = [
  { value: "", label: "Chọn thứ..." },
  { value: "2", label: "Thứ 2" },
  { value: "3", label: "Thứ 3" },
  { value: "4", label: "Thứ 4" },
  { value: "5", label: "Thứ 5" },
  { value: "6", label: "Thứ 6" },
  { value: "7", label: "Thứ 7" },
];

const EMPTY_TIME_SLOT_OPTION = { value: "", label: "Chọn ca/tiết..." };

function extractScheduleItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function extractChangeRequestItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.requests)) return data.requests;

  return [];
}

function extractWeekItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.weeks)) return data.weeks;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function extractTimeSlotItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.time_slots)) return data.time_slots;
  if (Array.isArray(data?.timeSlots)) return data.timeSlots;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function findAcademicWeekByDate(weeks = [], date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  return (
    weeks.find((week) => {
      const startDate = parseDateOnly(week?.start_date);
      const endDate = parseDateOnly(week?.end_date);

      return (
        startDate &&
        endDate &&
        date.getTime() >= startDate.getTime() &&
        date.getTime() <= endDate.getTime()
      );
    }) || null
  );
}

function buildWeekOption(week, index) {
  const startDate = parseDateOnly(week?.start_date);
  const endDate = parseDateOnly(week?.end_date);

  if (!startDate || !endDate) return null;

  const weekNo = Number(week?.week_no) || index + 1;

  return {
    value: toDateKey(startDate),
    label: `Tuần ${weekNo} [${formatDate(startDate)} - ${formatDate(endDate)}]`,
    weekNo,
    semesterId: week?.semester_id,
    startDate,
    endDate,
  };
}

function buildProposedWeekOptions(schedule, academicWeeks = []) {
  const semesterId = schedule?.semester_id;
  const scheduleStartDate = parseDateOnly(schedule?.start_date);

  if (!semesterId || !scheduleStartDate) return [];

  return academicWeeks
    .filter((week) => {
      if (String(week?.semester_id || "") !== String(semesterId)) {
        return false;
      }

      const weekStartDate = parseDateOnly(week?.start_date);
      const weekEndDate = parseDateOnly(week?.end_date);

      return (
        weekStartDate &&
        weekEndDate &&
        weekEndDate.getTime() >= scheduleStartDate.getTime()
      );
    })
    .map(buildWeekOption)
    .filter(Boolean)
    .sort(
      (first, second) => first.startDate.getTime() - second.startDate.getTime(),
    );
}

function getProposedDateKey(weekOptions, weekStart, dayOfWeek) {
  const selectedWeek = weekOptions.find((week) => week.value === weekStart);
  const backendDay = Number(dayOfWeek);

  if (!selectedWeek || !backendDay) return "";

  const dayOffset = backendDay === 1 ? 6 : backendDay - 2;
  const proposedDate = addDays(selectedWeek.startDate, dayOffset);

  if (proposedDate.getTime() > selectedWeek.endDate.getTime()) return "";

  return toDateKey(proposedDate);
}

function applyProposedDateFields(formState, weekOptions) {
  const proposedDate = getProposedDateKey(
    weekOptions,
    formState.proposed_week_start,
    formState.proposed_day_of_week,
  );

  return {
    ...formState,
    proposed_start_date: proposedDate,
    proposed_end_date: proposedDate,
  };
}

function parseDateOnly(value) {
  if (!value) return null;

  const text = String(value).trim();

  if (text.includes("T")) {
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return null;

    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  }

  const matched = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return null;

  const [, year, month, day] = matched.map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getBackendDayOfWeek(date) {
  const day = date.getDay();
  return day === 0 ? 1 : day + 1;
}

function formatDate(value) {
  const date = value instanceof Date ? value : parseDateOnly(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

function formatFallback(value) {
  return value === undefined || value === null || String(value).trim() === ""
    ? "—"
    : value;
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (!value || Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatGroupTeam(schedule) {
  const groupNo = String(schedule?.group_no || "").padStart(2, "0");
  const teamNo = String(schedule?.team_no || "").padStart(2, "0");

  return [groupNo, teamNo].filter(Boolean).join("-");
}

function getSchedulePracticeKey(schedule) {
  return [
    schedule?.course_code || "NO_CODE",
    schedule?.group_no || "NO_GROUP",
    schedule?.team_no || "NO_TEAM",
    schedule?.practice_team_id || "NO_TEAM_ID",
    schedule?.room_code || "NO_ROOM",
  ].join("|");
}

function buildCourseName(schedule) {
  return [schedule?.course_code, schedule?.course_name]
    .filter(Boolean)
    .join(" ");
}

function buildTeachingLabel(schedule) {
  return [
    buildCourseName(schedule),
    formatGroupTeam(schedule),
    schedule?.room_code ? `Phòng ${schedule.room_code}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function normalizeTimeSlotLabel(value) {
  const text = String(value || "").toLowerCase();

  if (text.includes("sáng") || text.includes("1-4")) return "Ca sáng";
  if (text.includes("chiều") || text.includes("7-10")) return "Ca chiều";

  return value || "—";
}

function formatTimeSlotLabel(value, valueId) {
  const label = normalizeTimeSlotLabel(value);
  return label !== "—" ? label : valueId ? `Ca #${valueId}` : "—";
}

function buildTimeSlotOptions(timeSlots = [], fallbackSchedules = []) {
  const map = new Map();

  timeSlots.forEach((slot) => {
    const id = slot?.id;
    if (!id) return;

    const value = String(id);
    if (map.has(value)) return;

    map.set(value, {
      value,
      label: normalizeTimeSlotLabel(
        slot?.slot_label || slot?.time_slot || slot?.label,
      ),
      startPeriod: Number(slot?.start_period || 0),
      endPeriod: Number(slot?.end_period || 0),
    });
  });

  // Fallback giữ nguyên luồng cũ nếu API danh mục time_slots bị lỗi.
  if (map.size === 0) {
    fallbackSchedules.forEach((schedule) => {
      const id = schedule?.time_slot_id;
      if (!id) return;

      const value = String(id);
      if (map.has(value)) return;

      map.set(value, {
        value,
        label: normalizeTimeSlotLabel(schedule?.time_slot),
        startPeriod: Number(schedule?.start_period || 0),
        endPeriod: Number(schedule?.end_period || 0),
      });
    });
  }

  return Array.from(map.values())
    .sort(
      (first, second) =>
        Number(first.startPeriod || first.value) -
          Number(second.startPeriod || second.value) ||
        Number(first.endPeriod || first.value) -
          Number(second.endPeriod || second.value),
    )
    .map(({ startPeriod, endPeriod, ...option }) => option);
}

function translateStatus(value) {
  const map = {
    draft: "Nháp",
    submitted: "Đã gửi",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    implemented: "Đã cập nhật lịch",
    cancelled: "Đã hủy",
  };

  return map[value] || value || "—";
}

function buildStatusBadge(status) {
  return (
    <span className={`academicStatusBadge academicStatusBadge--${status}`}>
      {translateStatus(status)}
    </span>
  );
}

function buildHistoryClassLabel(request) {
  const schedule = request?.schedule || {};

  return [
    buildCourseName(schedule),
    formatGroupTeam(schedule),
    schedule?.room_code ? `Phòng ${schedule.room_code}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildDateSlotLabel({
  startDate,
  endDate,
  dayOfWeek,
  timeSlot,
  timeSlotId,
}) {
  const startLabel = formatDate(startDate);
  const endLabel = formatDate(endDate);
  const dateLabel =
    startDate && endDate && startLabel !== endLabel
      ? `${startLabel} → ${endLabel}`
      : startLabel;

  return [
    dateLabel,
    formatDayOfWeek(dayOfWeek),
    formatTimeSlotLabel(timeSlot, timeSlotId),
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildProposedHistoryLabel(request) {
  return buildDateSlotLabel({
    startDate: request?.proposed_start_date,
    endDate: request?.proposed_end_date || request?.proposed_start_date,
    dayOfWeek: request?.proposed_day_of_week,
    timeSlot: request?.proposed_time_slot,
    timeSlotId: request?.proposed_time_slot_id,
  });
}

function isPublishedSchedule(schedule) {
  return (
    String(schedule?.entry_status || schedule?.status || "")
      .trim()
      .toLowerCase() === "published"
  );
}

function buildScheduleOccurrences(schedule, academicWeeks = []) {
  const startDate = parseDateOnly(schedule?.start_date);
  const endDate = parseDateOnly(schedule?.end_date || schedule?.start_date);
  const targetDay = Number(schedule?.day_of_week);

  if (!startDate || !endDate || !targetDay) return [];

  const occurrences = [];
  let cursor = new Date(startDate);

  while (cursor.getTime() <= endDate.getTime()) {
    if (getBackendDayOfWeek(cursor) === targetDay) {
      const matchedWeek = findAcademicWeekByDate(academicWeeks, cursor);
      const weekNo =
        Number(matchedWeek?.week_no) ||
        Number(schedule?.start_week_no || 0) + occurrences.length ||
        occurrences.length + 1;
      const dateKey = toDateKey(cursor);

      occurrences.push({
        key: `${schedule.id}:${dateKey}`,
        schedule,
        scheduleId: String(schedule.id),
        dateKey,
        date: new Date(cursor),
        weekNo,
        label: `Tuần ${weekNo} | ${formatDate(cursor)} | ${formatDayOfWeek(
          schedule.day_of_week,
        )} | ${normalizeTimeSlotLabel(schedule.time_slot)}`,
      });
    }

    cursor = addDays(cursor, 1);
  }

  return occurrences;
}

function buildChangeRequestPayload(formState) {
  const proposedDate = formState.proposed_start_date;

  return {
    lab_schedule_entry_id: Number(formState.lab_schedule_entry_id),
    change_type: "reschedule",
    original_occurrence_date: formState.original_occurrence_date,
    proposed_start_date: proposedDate,
    proposed_end_date: proposedDate,
    proposed_day_of_week: Number(formState.proposed_day_of_week),
    proposed_time_slot_id: Number(formState.proposed_time_slot_id),
    reason_text: formState.reason_text.trim(),
  };
}

export default function LecturerChangeRequestsPage() {
  const [schedules, setSchedules] = useState([]);
  const [academicWeeks, setAcademicWeeks] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [scheduleError, setScheduleError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadChangeRequestHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      setHistoryError("");

      const response = await listScheduleChangeRequests({
        change_type: "reschedule",
      });

      setHistoryItems(extractChangeRequestItems(response));
    } catch (error) {
      setHistoryItems([]);
      setHistoryError(
        error?.message || "Không thể tải lịch sử yêu cầu đổi lịch.",
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSchedules() {
      const user = getUser();

      try {
        setIsLoadingSchedules(true);
        setScheduleError("");

        const response = await listSchedules({
          status: "published",
          lecturer_user_id: user?.id,
        });

        const publishedSchedules =
          extractScheduleItems(response).filter(isPublishedSchedule);

        const semesterIds = [
          ...new Set(
            publishedSchedules
              .map((schedule) => schedule?.semester_id)
              .filter(Boolean),
          ),
        ];

        const [timeSlotResponse, weekResponses] = await Promise.all([
          listTimeSlots().catch(() => null),
          Promise.all(
            semesterIds.map((semester_id) =>
              listScheduleWeeks({ semester_id }),
            ),
          ),
        ]);

        const fetchedWeeks = weekResponses.flatMap(extractWeekItems);
        const fetchedTimeSlots = extractTimeSlotItems(timeSlotResponse);

        if (!isMounted) return;

        setSchedules(publishedSchedules);
        setAcademicWeeks(fetchedWeeks);
        setTimeSlots(fetchedTimeSlots);

        const firstSchedule = publishedSchedules[0];
        const firstOccurrence = buildScheduleOccurrences(
          firstSchedule,
          fetchedWeeks,
        )[0];

        if (firstSchedule && firstOccurrence) {
          setFormState((current) => ({
            ...current,
            practice_key: getSchedulePracticeKey(firstSchedule),
            affected_occurrence_key: firstOccurrence.key,
            lab_schedule_entry_id: firstOccurrence.scheduleId,
            original_occurrence_date: firstOccurrence.dateKey,
          }));
        }
      } catch (error) {
        setAcademicWeeks([]);
        setTimeSlots([]);
        if (!isMounted) return;

        setSchedules([]);
        setScheduleError(
          error?.message ||
            "Không thể tải lịch thực hành đã công bố của giảng viên.",
        );
      } finally {
        if (isMounted) setIsLoadingSchedules(false);
      }
    }

    loadSchedules();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    loadChangeRequestHistory();
  }, [loadChangeRequestHistory]);

  const teachingOptions = useMemo(() => {
    const map = new Map();

    schedules.forEach((schedule) => {
      const key = getSchedulePracticeKey(schedule);

      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: buildTeachingLabel(schedule),
        });
      }
    });

    return Array.from(map.values());
  }, [schedules]);

  const availableSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          getSchedulePracticeKey(schedule) === formState.practice_key,
      ),
    [formState.practice_key, schedules],
  );

  const availableOccurrences = useMemo(
    () =>
      availableSchedules.flatMap((schedule) =>
        buildScheduleOccurrences(schedule, academicWeeks),
      ),
    [academicWeeks, availableSchedules],
  );

  const timeSlotOptions = useMemo(
    () => buildTimeSlotOptions(timeSlots, schedules),
    [timeSlots, schedules],
  );

  const selectedOccurrence = useMemo(
    () =>
      availableOccurrences.find(
        (occurrence) => occurrence.key === formState.affected_occurrence_key,
      ) || null,
    [availableOccurrences, formState.affected_occurrence_key],
  );

  const selectedSchedule =
    selectedOccurrence?.schedule || availableSchedules[0] || null;

  const proposedWeekOptions = useMemo(
    () => buildProposedWeekOptions(selectedSchedule, academicWeeks),
    [academicWeeks, selectedSchedule],
  );

  const historyRows = useMemo(
    () =>
      historyItems.map((request) => ({
        id: request.id,
        classLabel: buildHistoryClassLabel(request),
        proposedLabel: buildProposedHistoryLabel(request),
        reason: formatFallback(request.reason_text),
        createdAt: formatDateTime(request.created_at),
        status: request.request_status,
      })),
    [historyItems],
  );

  useEffect(() => {
    setFormState((current) => {
      if (proposedWeekOptions.length === 0) {
        if (
          !current.proposed_week_start &&
          !current.proposed_start_date &&
          !current.proposed_end_date
        ) {
          return current;
        }

        return {
          ...current,
          proposed_week_start: "",
          proposed_start_date: "",
          proposed_end_date: "",
        };
      }

      const hasSelectedWeek = proposedWeekOptions.some(
        (week) => week.value === current.proposed_week_start,
      );

      const nextState = {
        ...current,
        proposed_week_start: hasSelectedWeek
          ? current.proposed_week_start
          : proposedWeekOptions[0].value,
      };

      return applyProposedDateFields(nextState, proposedWeekOptions);
    });
  }, [proposedWeekOptions]);

  useEffect(() => {
    setFormState((current) => {
      if (!current.proposed_time_slot_id) return current;

      const hasSelectedTimeSlot = timeSlotOptions.some(
        (option) => option.value === String(current.proposed_time_slot_id),
      );

      return hasSelectedTimeSlot
        ? current
        : { ...current, proposed_time_slot_id: "" };
    });
  }, [timeSlotOptions]);

  function updateField(fieldName, value) {
    setStatusMessage(null);

    setFormState((current) =>
      applyProposedDateFields(
        {
          ...current,
          [fieldName]: value,
        },
        proposedWeekOptions,
      ),
    );
  }
  function handleTeachingChange(value) {
    const nextSchedule = schedules.find(
      (schedule) => getSchedulePracticeKey(schedule) === value,
    );
    const nextOccurrence = buildScheduleOccurrences(
      nextSchedule,
      academicWeeks,
    )[0];

    setStatusMessage(null);
    setFormState((current) => ({
      ...current,
      practice_key: value,
      affected_occurrence_key: nextOccurrence?.key || "",
      lab_schedule_entry_id: nextOccurrence?.scheduleId || "",
      original_occurrence_date: nextOccurrence?.dateKey || "",
      proposed_week_start: "",
      proposed_start_date: "",
      proposed_end_date: "",
    }));
  }

  function handleOccurrenceChange(value) {
    const nextOccurrence = availableOccurrences.find(
      (occurrence) => occurrence.key === value,
    );

    setStatusMessage(null);
    setFormState((current) => ({
      ...current,
      affected_occurrence_key: value,
      lab_schedule_entry_id: nextOccurrence?.scheduleId || "",
      original_occurrence_date: nextOccurrence?.dateKey || "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedOccurrence) {
      setStatusMessage({
        type: "error",
        title: "Chưa chọn buổi bị ảnh hưởng",
        text: "Vui lòng chọn đúng tuần/ngày thực hành cần đổi lịch.",
      });
      return;
    }

    if (
      !formState.proposed_start_date ||
      !formState.proposed_day_of_week ||
      !formState.proposed_time_slot_id
    ) {
      setStatusMessage({
        type: "error",
        title: "Thiếu lịch mới đề xuất",
        text: "Vui lòng chọn tuần, thứ và ca đề xuất.",
      });
      return;
    }

    if (!formState.reason_text.trim()) {
      setStatusMessage({
        type: "error",
        title: "Thiếu lý do",
        text: "Vui lòng nhập lý do đổi lịch.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await createScheduleChangeRequest(
        buildChangeRequestPayload(formState),
      );
      const createdRequest = response?.data || {};

      setStatusMessage({
        type: "success",
        title: "Đã gửi yêu cầu thành công",
        text: `Yêu cầu #${createdRequest.id || ""} đã được lưu với trạng thái ${
          createdRequest.request_status || "submitted"
        }.`,
      });

      await loadChangeRequestHistory();
    } catch (error) {
      setStatusMessage({
        type: "error",
        title: "Không thể gửi yêu cầu",
        text:
          error?.message ||
          "API schedule-change-requests từ chối yêu cầu. Vui lòng kiểm tra dữ liệu đầu vào.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="lecturerPageStack">
      {scheduleError ? (
        <section className="lecturerAlert lecturerAlert--error" role="alert">
          <h3>Không tải được lịch giảng viên</h3>
          <p>{scheduleError}</p>
        </section>
      ) : null}

      <section className="lecturerTwoColumnLayout">
        <form className="lecturerPanel" onSubmit={handleSubmit}>
          <div className="lecturerPanelHeader">
            <div>
              <h2>Yêu cầu đổi lịch</h2>
            </div>
          </div>

          <div className="lecturerFormGrid">
            <label className="lecturerField lecturerFieldFull">
              <span>Lớp / tổ thực hành phụ trách</span>
              <select
                className="lecturerControl"
                value={formState.practice_key}
                onChange={(event) => handleTeachingChange(event.target.value)}
                disabled={isLoadingSchedules || teachingOptions.length === 0}
              >
                {isLoadingSchedules ? <option>Đang tải lịch...</option> : null}
                {!isLoadingSchedules && teachingOptions.length === 0 ? (
                  <option value="">Chưa có lịch đã công bố</option>
                ) : null}
                {teachingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Ca thực hành gốc bị ảnh hưởng</span>
              <select
                className="lecturerControl"
                value={formState.affected_occurrence_key}
                onChange={(event) => handleOccurrenceChange(event.target.value)}
                disabled={availableOccurrences.length === 0}
              >
                {availableOccurrences.length === 0 ? (
                  <option value="">Chưa có buổi thực hành phù hợp</option>
                ) : null}
                {availableOccurrences.map((occurrence) => (
                  <option key={occurrence.key} value={occurrence.key}>
                    {occurrence.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField">
              <span>Tuần đề xuất</span>
              <select
                className="lecturerControl"
                value={formState.proposed_week_start}
                onChange={(event) =>
                  updateField("proposed_week_start", event.target.value)
                }
                disabled={proposedWeekOptions.length === 0}
              >
                {proposedWeekOptions.length === 0 ? (
                  <option value="">Chưa có tuần phù hợp</option>
                ) : null}
                {proposedWeekOptions.map((week) => (
                  <option key={week.value} value={week.value}>
                    {week.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField">
              <span>Thứ trong tuần đề xuất</span>
              <select
                className="lecturerControl"
                value={formState.proposed_day_of_week}
                onChange={(event) =>
                  updateField("proposed_day_of_week", event.target.value)
                }
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField">
              <span>Ca học đề xuất</span>
              <select
                className="lecturerControl"
                value={formState.proposed_time_slot_id}
                onChange={(event) =>
                  updateField("proposed_time_slot_id", event.target.value)
                }
                disabled={timeSlotOptions.length === 0}
              >
                {[EMPTY_TIME_SLOT_OPTION, ...timeSlotOptions].map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField">
              <span>Ngày đề xuất</span>
              <input
                className="lecturerControl"
                value={
                  formState.proposed_start_date
                    ? formatDate(formState.proposed_start_date)
                    : "Chọn tuần và thứ"
                }
                readOnly
              />
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Lý do yêu cầu</span>
              <textarea
                className="lecturerControl lecturerTextarea"
                value={formState.reason_text}
                onChange={(event) =>
                  updateField("reason_text", event.target.value)
                }
                placeholder="Nhập lý do đổi lịch..."
              />
            </label>
          </div>

          {statusMessage ? (
            <div
              className={`lecturerAlert lecturerAlert--${statusMessage.type}`}
              role={statusMessage.type === "error" ? "alert" : "status"}
            >
              <button
                type="button"
                className="lecturerAlertClose"
                onClick={() => setStatusMessage(null)}
                aria-label="Tắt thông báo"
              >
                ×
              </button>
              <h3>{statusMessage.title}</h3>
              <p>{statusMessage.text}</p>
            </div>
          ) : null}

          <div className="lecturerFormActions">
            <ButtonUI
              type="submit"
              className="lecturerPrimaryButton"
              disabled={
                isSubmitting ||
                isLoadingSchedules ||
                availableOccurrences.length === 0
              }
            >
              {isSubmitting ? "Đang gửi..." : "Xác nhận gửi đi"}
            </ButtonUI>

            <ButtonUI
              type="button"
              tone="outline"
              className="lecturerGhostButton"
              onClick={() => setStatusMessage(null)}
            >
              Làm mới thông báo
            </ButtonUI>
          </div>
        </form>

        <aside className="lecturerPanel lecturerAsidePanel">
          <div className="lecturerPanelHeader">
            <div>
              <p className="lecturerEyebrow">Lịch gốc</p>
              <h2>Thông tin ca thực hành</h2>
              <p>Giảng viên đối chiếu trước khi gửi yêu cầu.</p>
            </div>
          </div>

          <div className="lecturerInfoGrid">
            <div className="lecturerInfoItem lecturerInfoItemHighlight">
              <span>Ngày bị ảnh hưởng</span>
              <strong>{formatDate(selectedOccurrence?.date)}</strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Phòng hiện tại</span>
              <strong>{formatFallback(selectedSchedule?.room_code)}</strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Học phần</span>
              <strong>
                {formatFallback(buildCourseName(selectedSchedule))}
              </strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Nhóm / tổ</span>
              <strong>
                {formatFallback(formatGroupTeam(selectedSchedule))}
              </strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Thời gian</span>
              <strong>
                {formatDayOfWeek(selectedSchedule?.day_of_week)} •{" "}
                {formatFallback(
                  normalizeTimeSlotLabel(selectedSchedule?.time_slot),
                )}
              </strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="lecturerPanel">
        <div className="lecturerPanelHeader">
          <div>
            <h2>Yêu cầu đổi lịch của tôi</h2>
          </div>
        </div>

        {historyError ? (
          <div className="lecturerAlert lecturerAlert--error" role="alert">
            <h3>Không thể tải lịch sử</h3>
            <p>{historyError}</p>
          </div>
        ) : null}

        <div className="dataTableBlock">
          <table className="table">
            <thead>
              <tr>
                <th>Lớp / tổ</th>
                <th>Ca đề xuất</th>
                <th>Lý do</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingHistory ? (
                <tr>
                  <td colSpan={5}>Đang tải lịch sử yêu cầu...</td>
                </tr>
              ) : null}

              {!isLoadingHistory && historyRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>Chưa có yêu cầu đổi lịch nào.</td>
                </tr>
              ) : null}

              {!isLoadingHistory &&
                historyRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className="academicChangeOneLine"
                        title={row.classLabel}
                      >
                        {row.classLabel}
                      </span>
                    </td>
                    <td>
                      <span
                        className="academicChangeOneLine"
                        title={row.proposedLabel}
                      >
                        {row.proposedLabel}
                      </span>
                    </td>
                    <td>
                      <span
                        className="academicChangeOneLine"
                        title={row.reason}
                      >
                        {row.reason}
                      </span>
                    </td>
                    <td>{row.createdAt}</td>
                    <td>{buildStatusBadge(row.status)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
