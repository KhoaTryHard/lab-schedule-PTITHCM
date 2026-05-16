"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import StatusBadge from "../../../components/common/StatusBadge.jsx";
import { ButtonUI, RefreshButton } from "../../../components/common/buttonUI.jsx";
import { listSchedules } from "../../../services/scheduleService";

const INITIAL_FILTERS = {
  status: "all",
  room_code: "",
  week_no: "",
  keyword: "",
};

const FIELD_STYLE = { display: "grid", gap: 6 };
const LABEL_STYLE = { fontSize: 13, fontWeight: 700, color: "#374151" };
const CONTROL_STYLE = {
  width: "100%",
  minHeight: 40,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "0 12px",
  background: "#ffffff",
  color: "#111827",
};
const FILTER_GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginTop: 16,
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "draft", label: "Nháp" },
  { value: "approved", label: "Đã duyệt" },
  { value: "published", label: "Đã công bố" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "completed", label: "Hoàn thành" },
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
  return dayMap[value] || value || "—";
}

function normalizeScheduleItem(item, index) {
  const courseCode = item?.course_code || item?.courseCode || "";
  const courseName = item?.course_name || item?.courseName || item?.course || "";
  const sectionCode = item?.section_code || item?.course_section_code || "";
  const groupNo = item?.group_no || "";
  const teamCode = item?.practice_team_code || item?.practice_team_name || "";
  const startDate = item?.start_date || item?.startDate;
  const endDate = item?.end_date || item?.endDate;
  const slot =
    item?.slot_label ||
    item?.time_slot_label ||
    (item?.start_period && item?.end_period
      ? `Tiết ${item.start_period}-${item.end_period}`
      : "");
  const day = formatDayOfWeek(item?.day_of_week || item?.dayOfWeek);

  return {
    id: item?.id || item?.schedule_id || index + 1,
    courseLabel:
      courseCode && courseName
        ? `${courseCode} - ${courseName}`
        : courseName || courseCode || `Lịch thực hành #${index + 1}`,
    teamLabel:
      [sectionCode, groupNo ? `Nhóm ${groupNo}` : "", teamCode]
        .filter(Boolean)
        .join(" / ") || "—",
    lecturerName:
      item?.lecturer_name ||
      item?.lecturer_full_name ||
      item?.lecturer ||
      item?.lecturer_user_id ||
      "—",
    roomLabel: item?.room_code || item?.room_name || item?.room || item?.room_id || "—",
    roomCode: item?.room_code || item?.room || "",
    weekNo: item?.week_no || item?.week || "",
    timeLabel: day !== "—" && slot ? `${day}, ${slot}` : slot || day,
    dateRange:
      startDate && endDate && startDate !== endDate
        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
        : formatDate(startDate || endDate),
    entryStatus: item?.entry_status || item?.status || "unknown",
  };
}

function extractScheduleItems(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function filterRows(rows, filters) {
  const keyword = normalizeText(filters.keyword);
  const status = filters.status;
  const roomCode = normalizeText(filters.room_code);
  const weekNo = String(filters.week_no || "").trim();

  return rows.filter((row) => {
    const searchableText = normalizeText(Object.values(row).join(" "));
    const matchesKeyword = !keyword || searchableText.includes(keyword);
    const matchesStatus = status === "all" || row.entryStatus === status;
    const matchesRoom =
      !roomCode || normalizeText(row.roomCode || row.roomLabel).includes(roomCode);
    const matchesWeek = !weekNo || !row.weekNo || String(row.weekNo) === weekNo;

    return matchesKeyword && matchesStatus && matchesRoom && matchesWeek;
  });
}

export default function AdminSchedulesPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [backendFilters, setBackendFilters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const visibleRows = useMemo(
    () => filterRows(scheduleRows, appliedFilters),
    [scheduleRows, appliedFilters],
  );

  async function loadScheduleData(activeFilters = appliedFilters) {
    try {
      setIsLoading(true);
      setLoadError(null);

      const response = await listSchedules(activeFilters);
      const items = extractScheduleItems(response);

      setScheduleRows(items.map(normalizeScheduleItem));
      setBackendFilters(response?.data?.filters || {});
    } catch (error) {
      setScheduleRows([]);
      setBackendFilters({});
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadScheduleData(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  function updateFilter(fieldName, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [fieldName]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setAppliedFilters(filters);
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
  }

  return (
    <div className="adminPageStack">
      <section className="card">
        <div className="roomFilterBar">
          <div className="roomFilterSummary">
            <h1 className="roomSectionTitle">Tra cứu lịch thực hành toàn hệ thống</h1>
            <p className="roomSectionText">
              Quản trị viên theo dõi toàn bộ lịch thực hành từ API thật GET /api/schedules.
            </p>
          </div>

          <RefreshButton onClick={() => loadScheduleData(appliedFilters)} disabled={isLoading}>
            Đồng bộ lịch
          </RefreshButton>
        </div>

        <form onSubmit={handleSubmit} style={FILTER_GRID_STYLE}>
          <label style={FIELD_STYLE}>
            <span style={LABEL_STYLE}>Trạng thái</span>
            <select
              style={CONTROL_STYLE}
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={FIELD_STYLE}>
            <span style={LABEL_STYLE}>Tuần</span>
            <input
              style={CONTROL_STYLE}
              value={filters.week_no}
              onChange={(event) => updateFilter("week_no", event.target.value)}
              placeholder="VD: 38"
            />
          </label>

          <label style={FIELD_STYLE}>
            <span style={LABEL_STYLE}>Phòng</span>
            <input
              style={CONTROL_STYLE}
              value={filters.room_code}
              onChange={(event) => updateFilter("room_code", event.target.value)}
              placeholder="VD: 2B11"
            />
          </label>

          <label style={FIELD_STYLE}>
            <span style={LABEL_STYLE}>Từ khóa</span>
            <input
              style={CONTROL_STYLE}
              value={filters.keyword}
              onChange={(event) => updateFilter("keyword", event.target.value)}
              placeholder="Học phần, giảng viên, lớp..."
            />
          </label>

          <div style={{ display: "flex", alignItems: "end", gap: 8, flexWrap: "wrap" }}>
            <ButtonUI type="submit">Áp dụng lọc</ButtonUI>
            <ButtonUI tone="secondary" type="button" onClick={handleReset}>
              Xóa lọc
            </ButtonUI>
          </div>
        </form>
      </section>

      <section className="card">
        <DataTable
          loading={isLoading}
          error={loadError}
          emptyTitle="Chưa có lịch thực hành"
          emptyDescription="API GET /api/schedules hiện chưa trả lịch hoặc backend vẫn đang ở trạng thái stub."
          columns={[
            { key: "courseLabel", label: "Học phần" },
            { key: "teamLabel", label: "Lớp / tổ" },
            { key: "lecturerName", label: "Giảng viên" },
            { key: "roomLabel", label: "Phòng" },
            { key: "timeLabel", label: "Thứ / ca" },
            { key: "dateRange", label: "Thời gian" },
            {
              key: "entryStatus",
              label: "Trạng thái",
              render: (value) => <StatusBadge value={value} />,
            },
          ]}
          rows={visibleRows}
        />
      </section>

      <section className="card">
        <h2 className="roomSectionTitle">Ghi chú tích hợp</h2>
        <p className="roomSectionText">
          Route này tách riêng khỏi /admin/lookups để tránh dùng màn mock làm minh chứng.
          Query backend hiện tại: <code>{JSON.stringify(backendFilters || appliedFilters)}</code>
        </p>
      </section>
    </div>
  );
}
