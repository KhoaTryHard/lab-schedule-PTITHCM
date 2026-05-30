"use client";

import { useEffect, useMemo, useState } from "react";

import { getUser } from "../../lib/authStorage";
import {
  approveSchedule,
  listPublishedSchedules,
  listSchedules,
  publishSchedule,
} from "../../services/scheduleService";
import { listRooms } from "../../services/roomService";

const PERIODS = Array.from({ length: 12 }, (_, index) => index + 1);

const WEEK_DAYS = [
  { label: "Thứ 2", backendDay: 2 },
  { label: "Thứ 3", backendDay: 3 },
  { label: "Thứ 4", backendDay: 4 },
  { label: "Thứ 5", backendDay: 5 },
  { label: "Thứ 6", backendDay: 6 },
  { label: "Thứ 7", backendDay: 7 },
  { label: "Chủ Nhật", backendDay: 1 },
];

const STATUS_LABELS = {
  draft: "Nháp",
  approved: "Đã duyệt",
  published: "Đã công bố",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "draft", label: "Nháp" },
  { value: "approved", label: "Đã duyệt" },
  { value: "published", label: "Đã công bố" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "completed", label: "Hoàn thành" },
];

const ACCENT = {
  red: {
    border: "#8b0000",
    header: "#8b0000",
    period: "#8b0000",
    event: "#fee2e2",
    eventBorder: "#ef4444",
    eventText: "#111827",
    rail: "#8b0000",
  },
  blue: {
    border: "#1d9bf0",
    header: "#183b68",
    period: "#25a7e0",
    event: "#cfe3ff",
    eventBorder: "#1d9bf0",
    eventText: "#0f172a",
    rail: "#25a7e0",
  },
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

function parseDateOnly(value) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      12,
      0,
      0,
      0,
    );
  }

  const text = String(value).trim();

  /**
   * Backend/MySQL DATE đôi khi serialize thành ISO UTC.
   * Ví dụ ngày VN 2025-10-01 có thể về frontend là 2025-09-30T17:00:00.000Z.
   * Không được slice(0, 10) với ISO có timezone, vì sẽ lệch ngày và làm rớt lịch khỏi cột thứ.
   */
  if (text.includes("T")) {
    const date = new Date(text);

    if (Number.isNaN(date.getTime())) return null;

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12,
      0,
      0,
      0,
    );
  }

  const matchedDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!matchedDate) return null;

  const [, year, month, day] = matchedDate.map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getMonday(date) {
  const resolved = new Date(date);
  resolved.setHours(12, 0, 0, 0);

  const day = resolved.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  return addDays(resolved, diff);
}

function formatShortDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatDate(value) {
  const date = value instanceof Date ? value : parseDateOnly(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getDisplayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getStatusLabel(value) {
  const status = normalizeStatus(value);
  return STATUS_LABELS[status] || value || "—";
}

function extractScheduleItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function parseTimeSlot(value) {
  const text = String(value || "");
  const matched = text.match(/(\d+)\s*-\s*(\d+)/);

  if (!matched) {
    return { startPeriod: 1, endPeriod: 1, periodCount: 1 };
  }

  const startPeriod = Math.max(1, Math.min(12, Number(matched[1])));
  const endPeriod = Math.max(startPeriod, Math.min(12, Number(matched[2])));

  return {
    startPeriod,
    endPeriod,
    periodCount: endPeriod - startPeriod + 1,
  };
}

function getScheduleDateRange(items) {
  const dates = [];

  items.forEach((item) => {
    const startDate = parseDateOnly(item?.start_date);
    const endDate = parseDateOnly(item?.end_date);

    if (startDate) dates.push(startDate);
    if (endDate) dates.push(endDate);
  });

  if (dates.length === 0) {
    const currentMonday = getMonday(new Date());
    return {
      minDate: currentMonday,
      maxDate: addDays(currentMonday, 6),
    };
  }

  dates.sort((first, second) => first.getTime() - second.getTime());

  return {
    minDate: dates[0],
    maxDate: dates[dates.length - 1],
  };
}

function buildWeekOptions(items) {
  const { minDate, maxDate } = getScheduleDateRange(items);
  const firstMonday = getMonday(minDate);
  const lastMonday = getMonday(maxDate);
  const options = [];

  let cursor = new Date(firstMonday);

  while (cursor.getTime() <= lastMonday.getTime()) {
    const weekStart = new Date(cursor);
    const weekEnd = addDays(weekStart, 6);

    options.push({
      value: toDateKey(weekStart),
      label: `Tuần từ ngày ${formatDate(weekStart)} đến ngày ${formatDate(weekEnd)}`,
      startDate: weekStart,
      endDate: weekEnd,
    });

    cursor = addDays(cursor, 7);
  }

  return options.length > 0 ? options : [];
}

function resolveInitialWeek(items) {
  const options = buildWeekOptions(items);

  if (options.length === 0) {
    return toDateKey(getMonday(new Date()));
  }

  const currentMondayKey = toDateKey(getMonday(new Date()));
  const hasCurrentWeek = options.some((option) => option.value === currentMondayKey);

  if (hasCurrentWeek) {
    return currentMondayKey;
  }

  return options[0].value;
}

function normalizeScheduleItem(item, index) {
  const parsedSlot = parseTimeSlot(item?.time_slot || item?.time_slot_label);
  const status = normalizeStatus(item?.entry_status || item?.status || "draft");

  return {
    id: item?.id ?? `${item?.lab_schedule_request_id || "schedule"}-${index}`,
    lab_schedule_request_id: item?.lab_schedule_request_id ?? item?.schedule_request_id,
    practice_team_id: item?.practice_team_id,
    room_code: item?.room_code,
    lecturer_user_id: item?.lecturer_user_id,
    lecturer_name: item?.lecturer_name || item?.lecturer_full_name,
    day_of_week: Number(item?.day_of_week),
    time_slot: item?.time_slot || item?.time_slot_label || item?.slot_label,
    start_date: item?.start_date,
    end_date: item?.end_date || item?.start_date,
    entry_status: status,
    team_no: item?.team_no,
    planned_size: item?.planned_size,
    group_no: item?.group_no,
    course_code: item?.course_code,
    course_name: item?.course_name,
    approved_by_user_id: item?.approved_by_user_id,
    published_by_user_id: item?.published_by_user_id,
    approved_at: item?.approved_at,
    published_at: item?.published_at,
    notes: item?.notes,
    created_at: item?.created_at,
    updated_at: item?.updated_at,
    startPeriod: parsedSlot.startPeriod,
    endPeriod: parsedSlot.endPeriod,
    periodCount: parsedSlot.periodCount,
    raw: item,
  };
}

function occursOnWeekDate(eventItem, date) {
  const startDate = parseDateOnly(eventItem.start_date);
  const endDate = parseDateOnly(eventItem.end_date || eventItem.start_date);

  if (!startDate || !endDate) return false;

  const dateTime = date.getTime();
  return dateTime >= startDate.getTime() && dateTime <= endDate.getTime();
}

function buildResolvedFixedParams(fixedParams, currentUserIdParamName) {
  const resolved = { ...fixedParams };

  if (!currentUserIdParamName) return resolved;

  const currentUser = getUser();

  if (currentUser?.id) {
    resolved[currentUserIdParamName] = currentUser.id;
  }

  return resolved;
}

function buildSearchText(item) {
  return normalizeText(
    [
      item.id,
      item.lab_schedule_request_id,
      item.course_code,
      item.course_name,
      item.group_no,
      item.team_no,
      item.room_code,
      item.lecturer_name,
      item.entry_status,
      item.notes,
      item.created_at,
      item.updated_at,
    ].join(" "),
  );
}

function getRoomTechnicianLabel(eventItem, roomMetaByCode) {
  const roomMeta = roomMetaByCode.get(String(eventItem.room_code || "").trim().toUpperCase());
  const value =
    eventItem.primary_technician_name ||
    eventItem.technician_name ||
    roomMeta?.primary_technician_name ||
    roomMeta?.primary_technician_user_id;

  return value ? `KTV: ${value}` : "KTV: —";
}

function buildDefaultLines(eventItem) {
  return [
    `${getDisplayValue(eventItem.course_name)} (${getDisplayValue(eventItem.course_code)})`,
    `Nhóm: ${getDisplayValue(eventItem.group_no)}-${getDisplayValue(eventItem.team_no)}`,
    `Phòng: ${getDisplayValue(eventItem.room_code)}`,
    `GV: ${getDisplayValue(eventItem.lecturer_name)}`,
  ];
}

function buildTooltip(eventItem, roleVariant, roomMetaByCode, eventDate) {
  const lines = [
    `Mã MH: ${getDisplayValue(eventItem.course_code)}`,
    `Môn: ${getDisplayValue(eventItem.course_name)}`,
    `Nhóm: ${getDisplayValue(eventItem.group_no)} - Tổ TH: ${getDisplayValue(eventItem.team_no)}`,
    `Phòng: ${getDisplayValue(eventItem.room_code)}`,
    `Thứ: ${getDisplayValue(eventItem.day_of_week)} - Tiết ${eventItem.startPeriod} - Số tiết ${eventItem.periodCount}`,
    `GV: ${getDisplayValue(eventItem.lecturer_name)}`,
    `Lớp: ${getDisplayValue(eventItem.group_no)}`,
    `Ngày: ${formatDate(eventDate)}`,
  ];

  if (roleVariant === "lecturer") {
    lines.push(getRoomTechnicianLabel(eventItem, roomMetaByCode));
  }

  if (roleVariant === "academic" || roleVariant === "admin") {
    lines.unshift(`Mã yêu cầu: ${getDisplayValue(eventItem.lab_schedule_request_id)}`);
    lines.push(`Trạng thái: ${getStatusLabel(eventItem.entry_status)}`);
    lines.push(`Duyệt lúc: ${formatDateTime(eventItem.approved_at)}`);
    lines.push(`Công bố lúc: ${formatDateTime(eventItem.published_at)}`);
    lines.push(`Ngày tạo: ${formatDateTime(eventItem.created_at)}`);
    lines.push(`Ngày cập nhật: ${formatDateTime(eventItem.updated_at)}`);
  }

  return lines.join("\n");
}

function EventLine({ children, strong = false }) {
  return (
    <span
      style={{
        display: "block",
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: 11,
        lineHeight: 1.35,
        fontWeight: strong ? 800 : 650,
      }}
    >
      {children}
    </span>
  );
}

function WorkflowActions({ eventItem, mutatingKey, onApprove, onPublish }) {
  const status = normalizeStatus(eventItem.entry_status);

  if (status !== "draft" && status !== "approved") {
    return null;
  }

  const actionKey = status === "draft" ? "approve" : "publish";
  const isLoading = mutatingKey === `${eventItem.id}:${actionKey}`;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();

        if (status === "draft") {
          onApprove(eventItem);
          return;
        }

        onPublish(eventItem);
      }}
      disabled={Boolean(mutatingKey)}
      style={{
        marginTop: 4,
        minHeight: 22,
        padding: "0 8px",
        borderRadius: 999,
        border: "1px solid rgba(139, 0, 0, 0.35)",
        background: "#ffffff",
        color: "#8b0000",
        fontSize: 10,
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {isLoading ? "Đang xử lý..." : status === "draft" ? "Duyệt" : "Công bố"}
    </button>
  );
}

function ScheduleEventCard({
  eventItem,
  roleVariant,
  roomMetaByCode,
  eventDate,
  accent,
  enableWorkflowActions,
  mutatingKey,
  onApprove,
  onPublish,
}) {
  const tooltip = buildTooltip(eventItem, roleVariant, roomMetaByCode, eventDate);
  const lines = buildDefaultLines(eventItem);

  const blockStyle = {
    height: "100%",
    minHeight: Math.max(32, eventItem.periodCount * 34),
    padding: 6,
    borderLeft: `3px solid ${accent.eventBorder}`,
    background: accent.event,
    color: accent.eventText,
    overflow: "hidden",
    cursor: "default",
  };

  if (roleVariant === "academic" || roleVariant === "admin") {
    return (
      <div style={blockStyle} title={tooltip}>
        <EventLine strong>
          YC: {getDisplayValue(eventItem.lab_schedule_request_id)} ·{" "}
          {getDisplayValue(eventItem.course_name)} ({getDisplayValue(eventItem.course_code)})
        </EventLine>
        <EventLine>
          Nhóm: {getDisplayValue(eventItem.group_no)} · Tổ: {getDisplayValue(eventItem.team_no)}
        </EventLine>
        <EventLine>GV: {getDisplayValue(eventItem.lecturer_name)}</EventLine>
        <EventLine>Phòng: {getDisplayValue(eventItem.room_code)}</EventLine>
        <EventLine>Trạng thái: {getStatusLabel(eventItem.entry_status)}</EventLine>
        <EventLine>Duyệt: {formatDateTime(eventItem.approved_at)}</EventLine>
        <EventLine>Công bố: {formatDateTime(eventItem.published_at)}</EventLine>
        <EventLine>Tạo/Cập nhật: {formatDateTime(eventItem.created_at)} · {formatDateTime(eventItem.updated_at)}</EventLine>
        {enableWorkflowActions ? (
          <WorkflowActions
            eventItem={eventItem}
            mutatingKey={mutatingKey}
            onApprove={onApprove}
            onPublish={onPublish}
          />
        ) : null}
      </div>
    );
  }

  if (roleVariant === "lecturer") {
    return (
      <div style={blockStyle} title={tooltip}>
        {lines.map((line, index) => (
          <EventLine key={`${eventItem.id}-line-${index}`} strong={index === 0}>
            {line}
          </EventLine>
        ))}
        <EventLine>{getRoomTechnicianLabel(eventItem, roomMetaByCode)}</EventLine>
      </div>
    );
  }

  return (
    <div style={blockStyle} title={tooltip}>
      {lines.map((line, index) => (
        <EventLine key={`${eventItem.id}-line-${index}`} strong={index === 0}>
          {line}
        </EventLine>
      ))}
    </div>
  );
}

export default function WeeklyScheduleTable({
  title,
  description = "",
  roleVariant = "student",
  accentTone = "blue",
  fixedParams = {},
  currentUserIdParamName = "",
  clientSideRequiredStatus = "",
  usePublishedEndpoint = false,
  enableWorkflowActions = false,
  emptyTitle = "Chưa có lịch thực hành",
  emptyDescription = "Không có dữ liệu lịch thực hành thật từ API trong tuần này.",
}) {
  const accent = ACCENT[accentTone] || ACCENT.blue;

  const [rawSchedules, setRawSchedules] = useState([]);
  const [roomMetaByCode, setRoomMetaByCode] = useState(new Map());
  const [selectedWeekKey, setSelectedWeekKey] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    room_code: "",
    keyword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionMessage, setActionMessage] = useState(null);
  const [mutatingKey, setMutatingKey] = useState("");

  const normalizedSchedules = useMemo(
    () => rawSchedules.map(normalizeScheduleItem),
    [rawSchedules],
  );

  const weekOptions = useMemo(
    () => buildWeekOptions(normalizedSchedules),
    [normalizedSchedules],
  );

  const selectedWeek =
    weekOptions.find((option) => option.value === selectedWeekKey) ||
    weekOptions[0] || {
      value: toDateKey(getMonday(new Date())),
      startDate: getMonday(new Date()),
      endDate: addDays(getMonday(new Date()), 6),
      label: `Tuần từ ngày ${formatDate(getMonday(new Date()))} đến ngày ${formatDate(
        addDays(getMonday(new Date()), 6),
      )}`,
    };

  const weekDays = useMemo(
    () =>
      WEEK_DAYS.map((day, index) => ({
        ...day,
        date: addDays(selectedWeek.startDate, index),
      })),
    [selectedWeek.startDate],
  );

  const visibleEvents = useMemo(() => {
    const normalizedKeyword = normalizeText(filters.keyword);
    const normalizedRoomCode = String(filters.room_code || "").trim().toUpperCase();
    const requiredStatus = normalizeStatus(clientSideRequiredStatus);

    return normalizedSchedules.filter((eventItem) => {
      const matchedDay = weekDays.find(
        (day) => day.backendDay === eventItem.day_of_week,
      );

      if (!matchedDay || !occursOnWeekDate(eventItem, matchedDay.date)) {
        return false;
      }

      if (requiredStatus && normalizeStatus(eventItem.entry_status) !== requiredStatus) {
        return false;
      }

      if (filters.status !== "all" && normalizeStatus(eventItem.entry_status) !== filters.status) {
        return false;
      }

      if (
        normalizedRoomCode &&
        String(eventItem.room_code || "").trim().toUpperCase() !== normalizedRoomCode
      ) {
        return false;
      }

      if (normalizedKeyword && !buildSearchText(eventItem).includes(normalizedKeyword)) {
        return false;
      }

      return true;
    });
  }, [
    clientSideRequiredStatus,
    filters.keyword,
    filters.room_code,
    filters.status,
    normalizedSchedules,
    weekDays,
  ]);

  const eventsByStartKey = useMemo(() => {
    const map = new Map();

    visibleEvents.forEach((eventItem) => {
      const key = `${eventItem.day_of_week}:${eventItem.startPeriod}`;
      const currentItems = map.get(key) || [];
      currentItems.push(eventItem);
      map.set(key, currentItems);
    });

    return map;
  }, [visibleEvents]);

  useEffect(() => {
    loadScheduleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(fixedParams), currentUserIdParamName, usePublishedEndpoint]);

  useEffect(() => {
    if (selectedWeekKey || normalizedSchedules.length === 0) return;
    setSelectedWeekKey(resolveInitialWeek(normalizedSchedules));
  }, [normalizedSchedules, selectedWeekKey]);

  async function loadScheduleData() {
    const apiFilters = buildResolvedFixedParams(fixedParams, currentUserIdParamName);

    try {
      setIsLoading(true);
      setLoadError("");
      setActionMessage(null);

      const scheduleResponse = usePublishedEndpoint
        ? await listPublishedSchedules(apiFilters)
        : await listSchedules(apiFilters);

      setRawSchedules(extractScheduleItems(scheduleResponse));

      if (["admin", "academic", "technician"].includes(roleVariant)) {
        const roomResponse = await listRooms({ scope: "mvp" }).catch(() => null);
        const rooms = Array.isArray(roomResponse?.data) ? roomResponse.data : [];
        const roomMap = new Map();

        rooms.forEach((room) => {
          if (room?.room_code) {
            roomMap.set(String(room.room_code).trim().toUpperCase(), room);
          }
        });

        setRoomMetaByCode(roomMap);
      }
    } catch (error) {
      setRawSchedules([]);
      setLoadError(error?.message || "Không tải được lịch thực hành từ API.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateFilter(fieldName, value) {
    setFilters((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  function moveWeek(direction) {
    const currentStart = selectedWeek.startDate || getMonday(new Date());
    setSelectedWeekKey(toDateKey(addDays(currentStart, direction * 7)));
  }

  function isCoveredByPreviousEvent(day, period) {
    return visibleEvents.some(
      (eventItem) =>
        eventItem.day_of_week === day.backendDay &&
        eventItem.startPeriod < period &&
        eventItem.endPeriod >= period,
    );
  }

  function getCellSpan(events) {
    if (!Array.isArray(events) || events.length === 0) return 1;
    return Math.max(...events.map((eventItem) => eventItem.periodCount || 1));
  }

  async function handleApprove(eventItem) {
    if (!eventItem?.id || mutatingKey) return;

    try {
      setMutatingKey(`${eventItem.id}:approve`);
      setActionMessage(null);
      await approveSchedule(eventItem.id);
      setActionMessage({ type: "success", text: `Đã duyệt lịch #${eventItem.id}.` });
      await loadScheduleData();
    } catch (error) {
      setActionMessage({
        type: "error",
        text: error?.message || "Không thể duyệt lịch.",
      });
    } finally {
      setMutatingKey("");
    }
  }

  async function handlePublish(eventItem) {
    if (!eventItem?.id || mutatingKey) return;

    try {
      setMutatingKey(`${eventItem.id}:publish`);
      setActionMessage(null);
      await publishSchedule(eventItem.id);
      setActionMessage({
        type: "success",
        text: `Đã công bố lịch #${eventItem.id}.`,
      });
      await loadScheduleData();
    } catch (error) {
      setActionMessage({
        type: "error",
        text: error?.message || "Không thể công bố lịch.",
      });
    } finally {
      setMutatingKey("");
    }
  }

  function renderScheduleCell(day, period) {
    const key = `${day.backendDay}:${period}`;
    const events = eventsByStartKey.get(key) || [];

    if (events.length === 0 && isCoveredByPreviousEvent(day, period)) {
      return null;
    }

    if (events.length === 0) {
      return (
        <td
          key={key}
          style={{
            height: 36,
            minWidth: 180,
            border: "1px solid #d8e0e8",
            background: "#ffffff",
          }}
        />
      );
    }

    const rowSpan = getCellSpan(events);

    return (
      <td
        key={key}
        rowSpan={rowSpan}
        style={{
          height: rowSpan * 36,
          minWidth: 180,
          padding: 0,
          verticalAlign: "top",
          border: `1px solid ${accent.eventBorder}`,
          background: accent.event,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 4,
            height: "100%",
            maxHeight: rowSpan * 36,
            overflow: "hidden",
          }}
        >
          {events.map((eventItem) => (
            <ScheduleEventCard
              key={`${eventItem.id}-${day.backendDay}-${period}`}
              eventItem={eventItem}
              roleVariant={roleVariant}
              roomMetaByCode={roomMetaByCode}
              eventDate={day.date}
              accent={accent}
              enableWorkflowActions={enableWorkflowActions}
              mutatingKey={mutatingKey}
              onApprove={handleApprove}
              onPublish={handlePublish}
            />
          ))}
        </div>
      </td>
    );
  }

  return (
    <section className="adminPageStack">
      <section
        className="card"
        style={{
          borderColor: accent.border,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingBottom: 10,
            borderBottom: `1px solid ${accent.border}`,
            color: accent.header,
            fontWeight: 800,
            textTransform: "uppercase",
            fontSize: 13,
          }}
        >
          <span>⚙</span>
          <span>{title}</span>
        </div>

        {description ? (
          <p className="roomSectionText" style={{ marginTop: 10 }}>
            {description}
          </p>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1fr) auto auto",
            gap: 8,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <select
            className="select"
            value="api"
            disabled
            title="Backend hiện chưa cung cấp API học kỳ riêng, frontend không bịa dữ liệu học kỳ."
          >
            <option value="api">Dữ liệu lịch từ API backend</option>
          </select>

          <select
            className="select"
            value={selectedWeek.value}
            onChange={(event) => setSelectedWeekKey(event.target.value)}
          >
            {weekOptions.length > 0 ? (
              weekOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              <option value={selectedWeek.value}>{selectedWeek.label}</option>
            )}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              minHeight: 34,
              padding: "0 16px",
              borderRadius: 8,
              border: `1px solid ${accent.rail}`,
              background: "#ffffff",
              color: accent.rail,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            🖨 In
          </button>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#0f172a",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
            title="Theo yêu cầu hiện tại chỉ hiển thị tiết 1 đến tiết 12."
          >
            <input type="checkbox" disabled />
            Thời khóa biểu tối
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(160px, 1fr) minmax(140px, 220px) minmax(180px, 1fr) auto",
            gap: 8,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <input
            className="input"
            value={filters.keyword}
            onChange={(event) => updateFilter("keyword", event.target.value)}
            placeholder="Tìm theo học phần, mã môn, phòng, giảng viên..."
          />

          {(roleVariant === "admin" || roleVariant === "academic") && !clientSideRequiredStatus ? (
            <select
              className="select"
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}

          <input
            className="input"
            value={filters.room_code}
            onChange={(event) => updateFilter("room_code", event.target.value)}
            placeholder="Lọc phòng, ví dụ 2B11"
          />

          <button
            type="button"
            onClick={loadScheduleData}
            disabled={isLoading || Boolean(mutatingKey)}
            style={{
              minHeight: 34,
              padding: "0 16px",
              borderRadius: 8,
              border: `1px solid ${accent.rail}`,
              background: accent.rail,
              color: "#ffffff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Đồng bộ
          </button>
        </div>

        {actionMessage ? (
          <div
            className="commonStateBox"
            role={actionMessage.type === "error" ? "alert" : "status"}
            style={{
              marginTop: 10,
              borderColor:
                actionMessage.type === "error"
                  ? "rgba(185, 28, 28, 0.24)"
                  : "rgba(22, 163, 74, 0.24)",
              background: actionMessage.type === "error" ? "#fff7f7" : "#f0fdf4",
            }}
          >
            <h3 className="commonStateTitle">
              {actionMessage.type === "error" ? "Có lỗi" : "Thành công"}
            </h3>
            <p className="commonStateText">{actionMessage.text}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="commonStateBox" role="status" style={{ marginTop: 12 }}>
            <h3 className="commonStateTitle">Đang tải lịch thực hành...</h3>
            <p className="commonStateText">Frontend đang lấy dữ liệu thật từ backend.</p>
          </div>
        ) : loadError ? (
          <div className="commonStateBox" role="alert" style={{ marginTop: 12 }}>
            <h3 className="commonStateTitle">Không tải được lịch</h3>
            <p className="commonStateText">{loadError}</p>
          </div>
        ) : (
          <div
            style={{
              marginTop: 14,
              overflowX: "auto",
              border: `1px solid ${accent.rail}`,
              borderRadius: 8,
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 1280,
                borderCollapse: "collapse",
                tableLayout: "fixed",
                background: "#ffffff",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      width: 64,
                      height: 32,
                      border: "1px solid #d8e0e8",
                      background: "#ffffff",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => moveWeek(-1)}
                      style={{
                        border: 0,
                        background: "transparent",
                        fontSize: 18,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                      aria-label="Tuần trước"
                    >
                      ←
                    </button>
                  </th>

                  {weekDays.map((day) => (
                    <th
                      key={day.backendDay}
                      style={{
                        height: 32,
                        border: "1px solid #d8e0e8",
                        background: "#ffffff",
                        color: "#0f172a",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {day.label}{" "}
                      <span style={{ color: "#64748b", fontWeight: 500 }}>
                        ({formatShortDate(day.date)})
                      </span>
                    </th>
                  ))}

                  <th
                    style={{
                      width: 48,
                      height: 32,
                      border: "1px solid #d8e0e8",
                      background: "#ffffff",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => moveWeek(1)}
                      style={{
                        border: 0,
                        background: "transparent",
                        fontSize: 18,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                      aria-label="Tuần tiếp theo"
                    >
                      →
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period}>
                    <th
                      style={{
                        width: 64,
                        height: 36,
                        border: "1px solid #d8e0e8",
                        background: accent.period,
                        color: "#ffffff",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      Tiết {period}
                    </th>

                    {weekDays.map((day) => renderScheduleCell(day, period))}

                    <td
                      style={{
                        width: 48,
                        height: 36,
                        border: "1px solid #d8e0e8",
                        background: accent.rail,
                      }}
                    />
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <th
                    style={{
                      width: 64,
                      height: 32,
                      border: "1px solid #d8e0e8",
                      background: "#ffffff",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => moveWeek(-1)}
                      style={{
                        border: 0,
                        background: "transparent",
                        fontSize: 18,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                      aria-label="Tuần trước"
                    >
                      ←
                    </button>
                  </th>

                  {weekDays.map((day) => (
                    <th
                      key={`foot-${day.backendDay}`}
                      style={{
                        height: 32,
                        border: "1px solid #d8e0e8",
                        background: "#ffffff",
                        color: "#0f172a",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {day.label}{" "}
                      <span style={{ color: "#64748b", fontWeight: 500 }}>
                        ({formatShortDate(day.date)})
                      </span>
                    </th>
                  ))}

                  <th
                    style={{
                      width: 48,
                      height: 32,
                      border: "1px solid #d8e0e8",
                      background: "#ffffff",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => moveWeek(1)}
                      style={{
                        border: 0,
                        background: "transparent",
                        fontSize: 18,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                      aria-label="Tuần tiếp theo"
                    >
                      →
                    </button>
                  </th>
                </tr>
              </tfoot>
            </table>

            {visibleEvents.length === 0 ? (
              <div className="commonStateBox" style={{ margin: 12 }}>
                <h3 className="commonStateTitle">{emptyTitle}</h3>
                <p className="commonStateText">{emptyDescription}</p>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </section>
  );
}
