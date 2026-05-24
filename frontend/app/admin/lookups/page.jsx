"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { listRooms } from "../../../services/roomService";
import { listScheduleRequests } from "../../../services/scheduleRequestService";
import { listSchedules } from "../../../services/scheduleService";

const LOOKUP_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "schedules", label: "Lịch thực hành" },
  { key: "schedule-requests", label: "Yêu cầu xếp lịch" },
  { key: "rooms", label: "Phòng máy" },
];

const ROOM_STATUS_LABELS = {
  available: "Khả dụng",
  maintenance: "Bảo trì",
  out_of_order: "Hỏng",
  locked: "Tạm khóa",
};

const SCHEDULE_STATUS_LABELS = {
  draft: "Nháp",
  approved: "Đã duyệt",
  published: "Đã công bố",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

const REQUEST_STATUS_LABELS = {
  draft: "Nháp",
  pending_review: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  scheduled: "Đã xếp lịch",
  published: "Đã công bố",
  cancelled: "Đã hủy",
};

const columnsByTab = {
  all: [
    { key: "lookup_type", label: "Loại dữ liệu" },
    { key: "lookup_label", label: "Mã / Tên" },
    { key: "lookup_description", label: "Mô tả" },
    { key: "room_code", label: "Phòng" },
    { key: "status", label: "Trạng thái" },
  ],
  schedules: [
    { key: "schedule_code", label: "Mã lịch" },
    { key: "course_label", label: "Học phần" },
    { key: "section_label", label: "Lớp / Nhóm" },
    { key: "lecturer_name", label: "Giảng viên" },
    { key: "room_code", label: "Phòng" },
    { key: "day_of_week", label: "Thứ" },
    { key: "time_slot_label", label: "Ca" },
    { key: "date_range", label: "Thời gian" },
    { key: "status", label: "Trạng thái" },
  ],
  "schedule-requests": [
    { key: "request_code", label: "Mã YC" },
    { key: "course_label", label: "Học phần" },
    { key: "group_no", label: "Nhóm" },
    { key: "requested_team_count", label: "Số tổ" },
    { key: "max_students_per_team", label: "SV / tổ" },
    { key: "total_required_sessions", label: "Số buổi" },
    { key: "preferred_range", label: "Khoảng ưu tiên" },
    { key: "requested_by_name", label: "Người tạo" },
    { key: "status", label: "Trạng thái" },
    { key: "created_at", label: "Ngày tạo" },
  ],
  rooms: [
    { key: "room_code", label: "Phòng" },
    { key: "total_computers", label: "Tổng máy" },
    { key: "usable_computers", label: "Máy dùng được" },
    { key: "usable_student_computers", label: "Máy cho SV" },
    { key: "broken_computers", label: "Máy hỏng" },
    { key: "has_projector", label: "Máy chiếu" },
    { key: "has_wifi", label: "WiFi" },
    { key: "has_lan", label: "LAN" },
    { key: "status", label: "Trạng thái" },
    { key: "notes", label: "Ghi chú" },
  ],
};

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

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return "—";
  }

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
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

  return dayMap[value] || getDisplayValue(value);
}

function getRoomStatusLabel(status) {
  return ROOM_STATUS_LABELS[status] || status || "Không rõ";
}

function getScheduleStatusLabel(status) {
  return SCHEDULE_STATUS_LABELS[status] || status || "Không rõ";
}

function getRequestStatusLabel(status) {
  return REQUEST_STATUS_LABELS[status] || status || "Không rõ";
}

function getStatusBadgeClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (
    ["available", "published", "approved", "completed", "active"].includes(
      normalizedStatus,
    )
  ) {
    return "roomStatusPositive";
  }

  if (
    ["maintenance", "pending_review", "draft", "scheduled"].includes(
      normalizedStatus,
    )
  ) {
    return "roomStatusWarning";
  }

  if (
    ["out_of_order", "locked", "cancelled", "rejected", "inactive"].includes(
      normalizedStatus,
    )
  ) {
    return "roomStatusDanger";
  }

  return "roomStatusNeutral";
}

function buildStatusBadge(status, label) {
  return (
    <span className={`roomStatusBadge ${getStatusBadgeClass(status)}`}>
      {label || status || "Không rõ"}
    </span>
  );
}

function extractArrayData(response, nestedKey) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[nestedKey])) {
    return data[nestedKey];
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function normalizeScheduleItem(item, index) {
  const id = item?.id ?? item?.schedule_id ?? index + 1;
  const status = item?.entry_status || item?.status || "draft";

  return {
    id,
    dataType: "schedule",
    schedule_code: item?.schedule_code || `LS-${String(id).padStart(3, "0")}`,
    course_label:
      item?.course_code || item?.course_name
        ? `${item?.course_code || "—"} - ${item?.course_name || "—"}`
        : `Lớp học phần #${item?.course_section_id || "—"}`,
    section_label:
      item?.section_code || item?.group_no
        ? `${item?.section_code || "—"} / Nhóm ${item?.group_no || "—"}`
        : "—",
    lecturer_name:
      item?.lecturer_name ||
      item?.lecturer_full_name ||
      (item?.lecturer_user_id ? `User #${item.lecturer_user_id}` : "—"),
    room_code: item?.room_code || "—",
    day_of_week: formatDayOfWeek(item?.day_of_week),
    time_slot_label:
      item?.time_slot_label || item?.slot_label || item?.time_slot || "—",
    date_range: formatDateRange(item?.start_date, item?.end_date),
    status,
    statusLabel: getScheduleStatusLabel(status),
    week_no: item?.week_no || item?.week || "",
    searchText: [
      item?.schedule_code,
      item?.course_code,
      item?.course_name,
      item?.section_code,
      item?.group_no,
      item?.lecturer_name,
      item?.lecturer_full_name,
      item?.room_code,
      status,
    ].join(" "),
  };
}

function normalizeScheduleRequestItem(item, index) {
  const id = item?.id ?? item?.request_id ?? index + 1;
  const status = item?.request_status || item?.status || "draft";

  return {
    id,
    dataType: "schedule-request",
    request_code: `YC-${String(id).padStart(3, "0")}`,
    course_label:
      item?.course_code || item?.course_name
        ? `${item?.course_code || "—"} - ${item?.course_name || "—"}`
        : `Lớp học phần #${item?.course_section_id || "—"}`,
    group_no: item?.group_no || "—",
    requested_team_count: getDisplayValue(item?.requested_team_count),
    max_students_per_team: getDisplayValue(item?.max_students_per_team),
    total_required_sessions: getDisplayValue(item?.total_required_sessions),
    preferred_range: formatDateRange(
      item?.preferred_week_start,
      item?.preferred_week_end,
    ),
    requested_by_name:
      item?.requested_by_name ||
      (item?.requested_by_user_id ? `User #${item.requested_by_user_id}` : "—"),
    status,
    statusLabel: getRequestStatusLabel(status),
    created_at: formatDate(item?.created_at),
    room_code: "",
    week_no: "",
    searchText: [
      id,
      item?.course_code,
      item?.course_name,
      item?.group_no,
      item?.request_status,
      item?.requested_by_name,
      item?.notes,
    ].join(" "),
  };
}

function normalizeRoomItem(item, index) {
  const id = item?.id ?? index + 1;
  const status = item?.room_status || "unknown";

  return {
    id,
    dataType: "room",
    room_code: item?.room_code || "—",
    total_computers: getDisplayValue(item?.total_computers),
    usable_computers: getDisplayValue(item?.usable_computers),
    usable_student_computers: getDisplayValue(item?.usable_student_computers),
    broken_computers: getDisplayValue(item?.broken_computers),
    has_projector: item?.has_projector ? "Có" : "Không",
    has_wifi: item?.has_wifi ? "Có" : "Không",
    has_lan: item?.has_lan ? "Có" : "Không",
    status,
    statusLabel: getRoomStatusLabel(status),
    notes: getDisplayValue(item?.notes),
    week_no: "",
    searchText: [
      item?.room_code,
      item?.room_status,
      item?.notes,
      item?.primary_technician_user_id,
    ].join(" "),
  };
}

function buildAllRows({ schedules, scheduleRequests, rooms }) {
  return [
    ...schedules.map((item) => ({
      id: `schedule-${item.id}`,
      dataType: "schedule",
      lookup_type: "Lịch thực hành",
      lookup_label: item.schedule_code,
      lookup_description: `${item.course_label} · ${item.lecturer_name}`,
      room_code: item.room_code,
      status: item.status,
      statusLabel: item.statusLabel,
      week_no: item.week_no,
      searchText: item.searchText,
    })),
    ...scheduleRequests.map((item) => ({
      id: `schedule-request-${item.id}`,
      dataType: "schedule-request",
      lookup_type: "Yêu cầu xếp lịch",
      lookup_label: item.request_code,
      lookup_description: `${item.course_label} · ${item.requested_by_name}`,
      room_code: "",
      status: item.status,
      statusLabel: item.statusLabel,
      week_no: "",
      searchText: item.searchText,
    })),
    ...rooms.map((item) => ({
      id: `room-${item.id}`,
      dataType: "room",
      lookup_type: "Phòng máy",
      lookup_label: item.room_code,
      lookup_description: `${item.usable_student_computers} máy cho sinh viên · ${item.notes}`,
      room_code: item.room_code,
      status: item.status,
      statusLabel: item.statusLabel,
      week_no: "",
      searchText: item.searchText,
    })),
  ];
}

function filterItems(items, filters) {
  const normalizedKeyword = normalizeText(filters.keyword);

  return items.filter((item) => {
    const matchesKeyword =
      !normalizedKeyword ||
      normalizeText(item.searchText).includes(normalizedKeyword);

    const matchesRoom =
      !filters.room_code ||
      filters.room_code === "all" ||
      item.room_code === filters.room_code;

    const matchesStatus =
      !filters.status ||
      filters.status === "all" ||
      item.status === filters.status;

    const matchesWeek =
      !filters.week_no ||
      String(item.week_no || "").trim() === String(filters.week_no).trim();

    return matchesKeyword && matchesRoom && matchesStatus && matchesWeek;
  });
}

function buildRows(activeTab, items) {
  if (activeTab === "all") {
    return items.map((item) => ({
      id: item.id,
      lookup_type: item.lookup_type,
      lookup_label: item.lookup_label,
      lookup_description: item.lookup_description,
      room_code: getDisplayValue(item.room_code),
      status: buildStatusBadge(item.status, item.statusLabel),
    }));
  }

  if (activeTab === "schedules") {
    return items.map((item) => ({
      id: item.id,
      schedule_code: item.schedule_code,
      course_label: item.course_label,
      section_label: item.section_label,
      lecturer_name: item.lecturer_name,
      room_code: item.room_code,
      day_of_week: item.day_of_week,
      time_slot_label: item.time_slot_label,
      date_range: item.date_range,
      status: buildStatusBadge(item.status, item.statusLabel),
    }));
  }

  if (activeTab === "schedule-requests") {
    return items.map((item) => ({
      id: item.id,
      request_code: item.request_code,
      course_label: item.course_label,
      group_no: item.group_no,
      requested_team_count: item.requested_team_count,
      max_students_per_team: item.max_students_per_team,
      total_required_sessions: item.total_required_sessions,
      preferred_range: item.preferred_range,
      requested_by_name: item.requested_by_name,
      status: buildStatusBadge(item.status, item.statusLabel),
      created_at: item.created_at,
    }));
  }

  if (activeTab === "rooms") {
    return items.map((item) => ({
      id: item.id,
      room_code: item.room_code,
      total_computers: item.total_computers,
      usable_computers: item.usable_computers,
      usable_student_computers: item.usable_student_computers,
      broken_computers: item.broken_computers,
      has_projector: item.has_projector,
      has_wifi: item.has_wifi,
      has_lan: item.has_lan,
      status: buildStatusBadge(item.status, item.statusLabel),
      notes: item.notes,
    }));
  }

  return [];
}

function getTabError(activeTab, errors) {
  if (activeTab === "all") {
    return [errors.schedules, errors.scheduleRequests, errors.rooms]
      .filter(Boolean)
      .join(" | ");
  }

  if (activeTab === "schedules") {
    return errors.schedules;
  }

  if (activeTab === "schedule-requests") {
    return errors.scheduleRequests;
  }

  if (activeTab === "rooms") {
    return errors.rooms;
  }

  return "";
}

function getTabLoading(activeTab, loading) {
  if (activeTab === "all") {
    return loading.schedules || loading.scheduleRequests || loading.rooms;
  }

  if (activeTab === "schedules") {
    return loading.schedules;
  }

  if (activeTab === "schedule-requests") {
    return loading.scheduleRequests;
  }

  if (activeTab === "rooms") {
    return loading.rooms;
  }

  return false;
}

function getEmptyDescription(activeTab) {
  if (activeTab === "schedules") {
    return "Frontend đã gọi GET /api/schedules, nhưng backend hiện có thể vẫn trả schedules rỗng nếu endpoint còn stub.";
  }

  if (activeTab === "schedule-requests") {
    return "Chưa có yêu cầu xếp lịch nào từ API GET /api/schedule-requests.";
  }

  if (activeTab === "rooms") {
    return "Chưa có phòng máy nào từ API GET /api/rooms hoặc bộ lọc hiện tại không khớp.";
  }

  return "Không có dữ liệu thật phù hợp từ các API hiện có.";
}

export default function LookupsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState("");

  const [lookupData, setLookupData] = useState({
    schedules: [],
    scheduleRequests: [],
    rooms: [],
  });

  const [loading, setLoading] = useState({
    schedules: false,
    scheduleRequests: false,
    rooms: false,
  });

  const [errors, setErrors] = useState({
    schedules: "",
    scheduleRequests: "",
    rooms: "",
  });

  async function loadLookupData() {
    setLoading({
      schedules: true,
      scheduleRequests: true,
      rooms: true,
    });
    setErrors({
      schedules: "",
      scheduleRequests: "",
      rooms: "",
    });

    const [scheduleResult, scheduleRequestResult, roomResult] =
      await Promise.allSettled([
        listSchedules(),
        listScheduleRequests(),
        listRooms({ scope: "mvp" }),
      ]);

    setLookupData({
      schedules:
        scheduleResult.status === "fulfilled"
          ? extractArrayData(scheduleResult.value, "schedules").map(
              normalizeScheduleItem,
            )
          : [],
      scheduleRequests:
        scheduleRequestResult.status === "fulfilled"
          ? extractArrayData(
              scheduleRequestResult.value,
              "scheduleRequests",
            ).map(normalizeScheduleRequestItem)
          : [],
      rooms:
        roomResult.status === "fulfilled"
          ? extractArrayData(roomResult.value, "rooms").map(normalizeRoomItem)
          : [],
    });

    setErrors({
      schedules:
        scheduleResult.status === "rejected"
          ? scheduleResult.reason?.message || "Không tải được lịch thực hành."
          : "",
      scheduleRequests:
        scheduleRequestResult.status === "rejected"
          ? scheduleRequestResult.reason?.message ||
            "Không tải được yêu cầu xếp lịch."
          : "",
      rooms:
        roomResult.status === "rejected"
          ? roomResult.reason?.message || "Không tải được danh sách phòng."
          : "",
    });

    setLoading({
      schedules: false,
      scheduleRequests: false,
      rooms: false,
    });
  }

  useEffect(() => {
    loadLookupData();
  }, []);

  const baseItems = useMemo(() => {
    if (activeTab === "all") {
      return buildAllRows(lookupData);
    }

    if (activeTab === "schedules") {
      return lookupData.schedules;
    }

    if (activeTab === "schedule-requests") {
      return lookupData.scheduleRequests;
    }

    if (activeTab === "rooms") {
      return lookupData.rooms;
    }

    return [];
  }, [activeTab, lookupData]);

  const roomOptions = useMemo(() => {
    const roomCodes = new Set();

    lookupData.rooms.forEach((room) => {
      if (room.room_code && room.room_code !== "—") {
        roomCodes.add(room.room_code);
      }
    });

    lookupData.schedules.forEach((schedule) => {
      if (schedule.room_code && schedule.room_code !== "—") {
        roomCodes.add(schedule.room_code);
      }
    });

    return [
      { value: "all", label: "Tất cả phòng" },
      ...[...roomCodes].sort().map((roomCode) => ({
        value: roomCode,
        label: roomCode,
      })),
    ];
  }, [lookupData.rooms, lookupData.schedules]);

  const statusOptions = useMemo(() => {
    const statusMap = new Map();

    baseItems.forEach((item) => {
      if (item.status) {
        statusMap.set(item.status, item.statusLabel || item.status);
      }
    });

    return [
      { value: "all", label: "Tất cả trạng thái" },
      ...[...statusMap.entries()].map(([value, label]) => ({ value, label })),
    ];
  }, [baseItems]);

  const filteredItems = useMemo(
    () =>
      filterItems(baseItems, {
        keyword,
        room_code: roomFilter,
        status: statusFilter,
        week_no:
          activeTab === "schedules" || activeTab === "all" ? weekFilter : "",
      }),
    [activeTab, baseItems, keyword, roomFilter, statusFilter, weekFilter],
  );

  const rows = useMemo(
    () => buildRows(activeTab, filteredItems),
    [activeTab, filteredItems],
  );

  const columns = columnsByTab[activeTab] || columnsByTab.all;
  const tabError = getTabError(activeTab, errors);
  const tabLoading = getTabLoading(activeTab, loading);

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setStatusFilter("all");
    setRoomFilter("all");
    setWeekFilter("");
    setKeyword("");
  }

  function handleResetFilters() {
    setKeyword("");
    setRoomFilter("all");
    setStatusFilter("all");
    setWeekFilter("");
  }

  return (
    <div>
      <section className="card managementAccount">
        <div className="card accountsView accountPrimaryPanel lookupPrimaryPanel">
          <div className="card optionView roomToolbar">
            <div className="buttonsView roomTabList">
              {LOOKUP_TABS.map((tabItem) => {
                const isActive = activeTab === tabItem.key;

                return (
                  <ButtonUI
                    key={tabItem.key}
                    shape="pill"
                    tone={isActive ? "primary" : "outline"}
                    size="sm"
                    active={isActive}
                    className={
                      isActive
                        ? "roomTabButton roomTabButtonActive"
                        : "roomTabButton"
                    }
                    onClick={() => handleTabChange(tabItem.key)}
                  >
                    {tabItem.label}
                  </ButtonUI>
                );
              })}
            </div>

            <div className="inputFind roomSearchGroup">
              <ButtonUI
                tone="primary"
                shape="rounded"
                className="roomSearchButton"
                type="button"
              >
                Tìm kiếm
              </ButtonUI>
              <input
                type="text"
                className="input roomSearchInput"
                placeholder="Tìm theo mã lịch, học phần, phòng, người tạo, trạng thái..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
          </div>

          <div className="card option roomFilterBar lookupFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">Kết quả tra cứu</h3>
              <p className="roomSectionText">Dữ liệu tra cứu được lọc.</p>
            </div>

            <div className="lookupFilterGrid">
              {activeTab === "all" || activeTab === "schedules" ? (
                <div className="lookupFilterField">
                  <span>Tuần học</span>
                  <input
                    className="input"
                    value={weekFilter}
                    placeholder="VD: 38"
                    onChange={(event) => setWeekFilter(event.target.value)}
                  />
                </div>
              ) : null}

              {activeTab === "all" ||
              activeTab === "schedules" ||
              activeTab === "rooms" ? (
                <div className="lookupFilterField">
                  <span>Phòng</span>
                  <select
                    className="select"
                    value={roomFilter}
                    onChange={(event) => setRoomFilter(event.target.value)}
                  >
                    {roomOptions.map((optionItem) => (
                      <option key={optionItem.value} value={optionItem.value}>
                        {optionItem.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="lookupFilterField">
                <span>Trạng thái</span>
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {statusOptions.map((optionItem) => (
                    <option key={optionItem.value} value={optionItem.value}>
                      {optionItem.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lookupFilterActions">
                <ButtonUI
                  tone="secondary"
                  shape="rounded"
                  className="roomRefreshButton"
                  type="button"
                  onClick={handleResetFilters}
                >
                  Xóa lọc
                </ButtonUI>

                <ButtonUI
                  tone="secondary"
                  shape="rounded"
                  className="roomRefreshButton"
                  type="button"
                  onClick={loadLookupData}
                  disabled={tabLoading}
                >
                  {tabLoading ? "Đang đồng bộ..." : "Đồng bộ API"}
                </ButtonUI>
              </div>
            </div>
          </div>

          <div className="card roomTableCard">
            <DataTable
              columns={columns}
              rows={rows}
              loading={tabLoading}
              error={tabError}
              emptyTitle="Chưa có dữ liệu phù hợp"
              emptyDescription={getEmptyDescription(activeTab)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
