"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import {
  extractRoomScope,
  getMvpRoomCodes,
  getRooms,
  isMvpRoom,
  listScopeRooms,
} from "../../../services/roomService";

const ROOM_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "available", label: "Khả dụng" },
  { value: "maintenance", label: "Bảo trì" },
  { value: "out_of_order", label: "Hỏng" },
  { value: "locked", label: "Tạm khóa" },
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatFallback(value) {
  return value === undefined || value === null || String(value).trim() === ""
    ? "—"
    : value;
}

function formatRoomStatus(status) {
  const statusMap = {
    available: "Khả dụng",
    maintenance: "Bảo trì",
    out_of_order: "Hỏng",
    locked: "Tạm khóa",
  };

  return statusMap[status] || status || "—";
}

function formatBoolean(value) {
  if (value === true || value === 1 || value === "1") {
    return "Có";
  }

  if (value === false || value === 0 || value === "0") {
    return "Không";
  }

  return "—";
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function buildStatusBadge(status) {
  const statusLabel = formatRoomStatus(status);
  const toneMap = {
    available: "success",
    maintenance: "warning",
    out_of_order: "danger",
    locked: "danger",
  };

  return (
    <span
      className={`technicianStatusBadge technicianStatusBadge--${
        toneMap[status] || "muted"
      }`}
    >
      {statusLabel}
    </span>
  );
}

function extractRooms(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

function getNumberValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

export default function TechnicianRoomStatusPage() {
  const [rooms, setRooms] = useState([]);
  const [roomScopeCodes, setRoomScopeCodes] = useState(getMvpRoomCodes());
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadRooms(overrides = {}) {
    const activeStatus = overrides.statusFilter ?? statusFilter;
    const activeKeyword = overrides.searchKeyword ?? searchKeyword;

    try {
      setIsLoading(true);
      setLoadError("");

      const scopeResponse = await listScopeRooms().catch(() => null);
      const backendScopeCodes = extractRoomScope(scopeResponse);
      const activeScopeCodes =
        backendScopeCodes.length > 0 ? backendScopeCodes : getMvpRoomCodes();

      const roomCodeKeyword = activeKeyword.trim().toUpperCase();
      const shouldSearchByRoomCode =
        roomCodeKeyword &&
        (activeScopeCodes.includes(roomCodeKeyword) ||
          isMvpRoom(roomCodeKeyword));

      const response = await getRooms({
        room_status: activeStatus,
        room_code: shouldSearchByRoomCode ? roomCodeKeyword : "",
      });

      const apiRooms = extractRooms(response);
      const scopedRooms = apiRooms.filter((room) =>
        activeScopeCodes.includes(
          String(room.room_code || "")
            .trim()
            .toUpperCase(),
        ),
      );

      setRoomScopeCodes(activeScopeCodes);
      setRooms(scopedRooms);
    } catch (error) {
      setRooms([]);
      setLoadError(error?.message || "Không thể tải tình trạng phòng từ API.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRooms({ statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function handleSearch(event) {
    event.preventDefault();
    loadRooms();
  }

  function handleReset() {
    setSearchKeyword("");
    setStatusFilter("all");
    loadRooms({ statusFilter: "all", searchKeyword: "" });
  }

  const filteredRooms = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return rooms.filter((room) => {
      const searchableText = normalizeText(
        [
          room.room_code,
          room.room_status,
          formatRoomStatus(room.room_status),
          room.notes,
          room.primary_technician_user_id,
        ].join(" "),
      );

      return !normalizedKeyword || searchableText.includes(normalizedKeyword);
    });
  }, [rooms, searchKeyword]);

  const summaryItems = useMemo(() => {
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(
      (room) => room.room_status === "available",
    ).length;
    const maintenanceRooms = rooms.filter((room) =>
      ["maintenance", "locked"].includes(room.room_status),
    ).length;
    const outOfOrderRooms = rooms.filter(
      (room) => room.room_status === "out_of_order",
    ).length;
    const totalComputers = rooms.reduce(
      (sum, room) => sum + Number(room.total_computers || 0),
      0,
    );
    const brokenComputers = rooms.reduce(
      (sum, room) => sum + Number(room.broken_computers || 0),
      0,
    );

    return [
      { label: "Tổng phòng", value: totalRooms, hint: "Theo scope backend" },
      { label: "Khả dụng", value: availableRooms, hint: "Có thể phục vụ lịch" },
      {
        label: "Bảo trì / khóa",
        value: maintenanceRooms,
        hint: "Không tự sửa từ KTV",
      },
      {
        label: "Phòng hỏng",
        value: outOfOrderRooms,
        hint: "Cần xử lý kỹ thuật",
      },
      { label: "Tổng máy", value: totalComputers, hint: "Thiết bị ghi nhận" },
      { label: "Máy hỏng", value: brokenComputers, hint: "Theo dữ liệu phòng" },
    ];
  }, [rooms]);

  const roomRows = useMemo(
    () =>
      filteredRooms.map((room) => ({
        id: room.id || room.room_code,
        room_code: formatFallback(room.room_code),
        total_computers: getNumberValue(room.total_computers),
        broken_computers: getNumberValue(room.broken_computers),
        reserved_teacher_computers: getNumberValue(
          room.reserved_teacher_computers,
        ),
        usable_student_computers: getNumberValue(room.usable_student_computers),
        has_projector: formatBoolean(room.has_projector),
        has_wifi: formatBoolean(room.has_wifi),
        has_lan: formatBoolean(room.has_lan),
        room_status: room.room_status,
        last_status_updated_at: formatDateTime(room.last_status_updated_at),
        last_condition_report_at: formatDateTime(room.last_condition_report_at),
        notes: formatFallback(room.notes),
      })),
    [filteredRooms],
  );

  const columns = useMemo(
    () => [
      { key: "room_code", label: "Mã phòng" },
      { key: "total_computers", label: "Tổng máy" },
      { key: "broken_computers", label: "Máy hỏng" },
      { key: "reserved_teacher_computers", label: "Máy GV" },
      { key: "usable_student_computers", label: "Máy SV dùng được" },
      { key: "has_projector", label: "Máy chiếu" },
      { key: "has_wifi", label: "Wi-Fi" },
      { key: "has_lan", label: "LAN" },
      {
        key: "room_status",
        label: "Trạng thái",
        render: (value) => buildStatusBadge(value),
      },
      { key: "last_status_updated_at", label: "Cập nhật trạng thái" },
      { key: "last_condition_report_at", label: "Báo cáo gần nhất" },
      { key: "notes", label: "Ghi chú" },
    ],
    [],
  );

  return (
    <div className="technicianPageStack">
      <section className="technicianHero">
        <div className="technicianHeroBody">
          <p className="technicianEyebrow">Kỹ thuật viên</p>
          <h1 className="technicianHeroTitle">Tình trạng phòng máy</h1>
          <p className="technicianHeroText">
            Theo dõi tình trạng phòng máy từ API thật. Trang này chỉ hiển thị dữ
            liệu, không cho kỹ thuật viên tự đổi phòng sang bảo trì, tạm khóa
            hoặc hỏng.
          </p>
        </div>

        <span className="technicianDataBadge">Dữ liệu thật từ /api/rooms</span>
      </section>

      <section className="technicianSummaryGrid">
        {summaryItems.map((item) => (
          <article key={item.label} className="technicianSummaryCard">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="technicianPanel">
        <div className="technicianPanelHeader">
          <div>
            <p className="technicianEyebrow">Bộ lọc</p>
            <h2>Danh sách phòng trong phạm vi quản lý</h2>
            <p>Scope phòng backend: {roomScopeCodes.join(", ") || "—"}</p>
          </div>

          <ButtonUI
            type="button"
            className="technicianPrimaryButton"
            onClick={() => loadRooms()}
            disabled={isLoading}
          >
            Đồng bộ phòng
          </ButtonUI>
        </div>

        <form className="technicianToolbar" onSubmit={handleSearch}>
          <label className="technicianField">
            <span>Tìm kiếm</span>
            <input
              className="technicianControl"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Nhập mã phòng, trạng thái, ghi chú..."
            />
          </label>

          <label className="technicianField">
            <span>Trạng thái phòng</span>
            <select
              className="technicianControl"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {ROOM_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="technicianToolbarActions">
            <ButtonUI type="submit" className="technicianPrimaryButton">
              Tìm kiếm
            </ButtonUI>

            <ButtonUI
              type="button"
              tone="outline"
              className="technicianGhostButton"
              onClick={handleReset}
            >
              Làm mới
            </ButtonUI>
          </div>
        </form>
      </section>

      <section className="technicianPanel">
        {loadError ? (
          <div className="technicianAlert technicianAlert--error">
            <h3>Không tải được dữ liệu phòng</h3>
            <p>{loadError}</p>
          </div>
        ) : null}

        <DataTable
          columns={columns}
          rows={roomRows}
          loading={isLoading}
          emptyTitle="Chưa có phòng phù hợp"
          emptyDescription="Không tìm thấy phòng máy theo bộ lọc hiện tại."
          pageSize={10}
        />
      </section>
    </div>
  );
}
