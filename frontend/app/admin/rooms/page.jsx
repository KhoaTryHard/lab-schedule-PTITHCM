"use client";

import { useEffect, useMemo, useState } from "react";

import { CardUI, UploadCard } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import RoomStatusDialog from "../../../components/common/RoomStatusDialog.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { renderRoomIcon as renderSystemRoomIcon } from "../../../components/systemIcon.jsx";
import {
  getMvpRoomCodes,
  getRooms,
  isMvpRoom,
  updateRoomById,
} from "../../../services/roomService";

/**
 * Mảng tab quản lý chính của trang phòng máy.
 * Hiện tại MVP chỉ dùng tab "Phòng máy".
 */
const roomTabItems = [{ key: "rooms", label: "Phòng máy" }];

/**
 * Mảng thẻ khai báo nhanh.
 * Các item này dùng để render UploadCard ở panel bên phải.
 */
const roomUploadItems = [
  { key: "room", title: "Phòng máy", iconName: "room" },
  { key: "device", title: "Thiết bị", iconName: "device" },
  { key: "software", title: "Phần mềm", iconName: "software" },
];

/**
 * Mảng tùy chọn lọc trạng thái theo từng tab.
 * Backend hiện hỗ trợ room_status: available, maintenance, out_of_order, locked.
 */
const statusOptionMap = {
  rooms: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "available", label: "Khả dụng" },
    { value: "maintenance", label: "Bảo trì" },
    { value: "out_of_order", label: "Hỏng" },
    { value: "locked", label: "Tạm khóa" },
  ],
};

/**
 * Map placeholder tìm kiếm tương ứng với tab đang chọn.
 */
const searchPlaceholderMap = {
  rooms: "Tìm theo mã phòng: 2B11, 2B21, 2B31...",
};

/**
 * Map tiêu đề bảng tương ứng với tab đang chọn.
 */
const roomTableTitleMap = {
  rooms: "Danh sách phòng máy MVP",
};

/**
 * Hàm nhận vào: value là chuỗi hoặc giá trị bất kỳ dùng để tìm kiếm.
 * Hàm xử lý: chuẩn hóa chữ thường và loại bỏ dấu tiếng Việt để so khớp mềm.
 * Hàm trả về: chuỗi đã chuẩn hóa để dùng trong filter/search.
 */
function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Hàm nhận vào: status là mã trạng thái từ backend hoặc nhãn tiếng Việt.
 * Hàm xử lý: đổi mã trạng thái backend thành nhãn tiếng Việt.
 * Hàm trả về: chuỗi nhãn trạng thái dùng để hiển thị.
 */
function formatRoomStatus(status) {
  const statusMap = {
    available: "Khả dụng",
    maintenance: "Bảo trì",
    out_of_order: "Hỏng",
    locked: "Tạm khóa",
    "Khả dụng": "Khả dụng",
    "Bảo trì": "Bảo trì",
    Hỏng: "Hỏng",
    "Tạm khóa": "Tạm khóa",
  };

  return statusMap[status] || status || "—";
}

/**
 * Hàm nhận vào: value là số hoặc giá trị rỗng.
 * Hàm xử lý: nếu không có dữ liệu thì hiển thị dấu gạch ngang.
 * Hàm trả về: số gốc hoặc "—".
 */
function getNumberValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

/**
 * Hàm nhận vào:
 * - iconName: mã icon cần hiển thị.
 * - className: class CSS bổ sung.
 * - size: kích thước icon.
 * Hàm xử lý: chọn SVG phù hợp cho card thống kê, thẻ upload.
 * Hàm trả về: JSX icon SVG.
 */
function renderRoomIcon(iconName, className = "", size = 24) {
  return renderSystemRoomIcon(iconName, className, size);
}

/**
 * Hàm nhận vào: status là chuỗi trạng thái phòng.
 * Hàm xử lý: ánh xạ trạng thái sang badge màu phù hợp.
 * Hàm trả về: JSX badge trạng thái.
 */
function buildStatusBadge(status) {
  const statusLabel = formatRoomStatus(status);

  const toneClassMap = {
    "Khả dụng": "roomStatusPositive",
    "Bảo trì": "roomStatusWarning",
    "Tạm khóa": "roomStatusDanger",
    Hỏng: "roomStatusDanger",
  };

  const toneClassName = toneClassMap[statusLabel] || "roomStatusNeutral";

  return (
    <span className={`roomStatusBadge ${toneClassName}`}>{statusLabel}</span>
  );
}

/**
 * Component nhận vào: không nhận props.
 * Component xử lý:
 * - Gọi API lấy danh sách phòng MVP.
 * - Hiển thị thống kê phòng.
 * - Hiển thị bảng phòng.
 * - Cho bấm vào badge trạng thái để mở popup cập nhật trạng thái.
 * - Gửi PATCH /rooms/:id khi xác nhận khóa phòng.
 * Component trả về: JSX trang /admin/rooms.
 */
export default function RoomsPage() {
  const [activeTab, setActiveTab] = useState("rooms");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isUpdatingRoomStatus, setIsUpdatingRoomStatus] = useState(false);

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý:
   * - Gọi API GET /rooms để lấy danh sách phòng.
   * - Truyền room_status và room_code nếu có bộ lọc.
   * - Lọc lại đúng scope MVP ở frontend để an toàn.
   * Hàm trả về: không trả về dữ liệu trực tiếp, chỉ cập nhật state rooms.
   */
  async function loadRooms() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const roomCodeKeyword = searchKeyword.trim().toUpperCase();

      const response = await getRooms({
        room_status: statusFilter,
        room_code: isMvpRoom(roomCodeKeyword) ? roomCodeKeyword : "",
      });

      const apiRooms = Array.isArray(response?.data) ? response.data : [];
      const scopedRooms = apiRooms.filter((room) => isMvpRoom(room.room_code));

      setRooms(scopedRooms);
    } catch (error) {
      setErrorMessage(error.message || "Không thể tải danh sách phòng từ API.");
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Hàm nhận vào: room là object phòng đang được bấm trên bảng.
   * Hàm xử lý: lưu phòng đang chọn và mở popup cập nhật trạng thái.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleOpenStatusDialog(room) {
    setSelectedRoom(room);
    setIsStatusDialogOpen(true);
  }

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: đóng popup và xóa phòng đang chọn.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleCloseStatusDialog() {
    setIsStatusDialogOpen(false);
    setSelectedRoom(null);
  }

  /**
   * Hàm nhận vào: payload gồm room_status và notes.
   * Hàm xử lý:
   * - Gọi API PATCH /rooms/:id để cập nhật trạng thái phòng.
   * - Đóng popup.
   * - Gọi lại loadRooms() để lấy dữ liệu mới nhất từ backend.
   * Hàm trả về: không trả về dữ liệu trực tiếp.
   */
  async function handleSubmitRoomStatus(payload) {
    if (!selectedRoom?.id) {
      setErrorMessage("Không xác định được phòng cần cập nhật.");
      return;
    }

    try {
      setIsUpdatingRoomStatus(true);
      setErrorMessage("");

      await updateRoomById(selectedRoom.id, payload);

      handleCloseStatusDialog();

      await loadRooms();
    } catch (error) {
      setErrorMessage(error.message || "Không thể cập nhật trạng thái phòng.");
    } finally {
      setIsUpdatingRoomStatus(false);
    }
  }

  /**
   * Hàm nhận vào: nextTab là key tab mới.
   * Hàm xử lý: đổi tab và reset trạng thái lọc về all.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setStatusFilter("all");
  }

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: reset bộ lọc và gọi lại API.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleRefreshRooms() {
    setSearchKeyword("");
    setStatusFilter("all");
    loadRooms();
  }

  /**
   * Gọi API khi mở trang hoặc khi bộ lọc trạng thái thay đổi.
   */
  useEffect(() => {
    loadRooms();
  }, [statusFilter]);

  /**
   * Tính toán các card thống kê dựa trên danh sách phòng hiện tại.
   */
  const roomStats = useMemo(() => {
    const totalRooms = rooms.length;

    const availableRooms = rooms.filter(
      (room) =>
        room.room_status === "available" || room.room_status === "Khả dụng",
    ).length;

    const maintenanceRooms = rooms.filter((room) =>
      ["maintenance", "locked", "Bảo trì", "Tạm khóa"].includes(
        room.room_status,
      ),
    ).length;

    const totalComputers = rooms.reduce(
      (sum, room) => sum + Number(room.total_computers || 0),
      0,
    );

    const usableComputers = rooms.reduce(
      (sum, room) => sum + Number(room.usable_student_computers || 0),
      0,
    );

    const brokenComputers = rooms.reduce(
      (sum, room) => sum + Number(room.broken_computers || 0),
      0,
    );

    return [
      { iconName: "room", title: "Tổng phòng MVP", value: totalRooms },
      { iconName: "available", title: "Phòng khả dụng", value: availableRooms },
      {
        iconName: "maintenance",
        title: "Bảo trì / tạm khóa",
        value: maintenanceRooms,
      },
      { iconName: "computer", title: "Tổng máy", value: totalComputers },
      { iconName: "usable", title: "Máy dùng được", value: usableComputers },
      { iconName: "alert", title: "Máy hỏng", value: brokenComputers },
    ];
  }, [rooms]);

  /**
   * Lọc phòng theo keyword, scope MVP và trạng thái đang chọn.
   */
  const filteredRoomItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return rooms.filter((room) => {
      const matchedScope = isMvpRoom(room.room_code);

      const searchTarget = normalizeText(
        [
          room.room_code,
          formatRoomStatus(room.room_status),
          room.room_status,
          room.notes,
        ].join(" "),
      );

      const matchedKeyword =
        !normalizedKeyword || searchTarget.includes(normalizedKeyword);

      const matchedStatus =
        statusFilter === "all" || room.room_status === statusFilter;

      return matchedScope && matchedKeyword && matchedStatus;
    });
  }, [rooms, searchKeyword, statusFilter]);

  /**
   * Cấu hình cột bảng.
   * Cột trạng thái có render custom để badge có thể bấm mở popup.
   */
  const roomColumns = useMemo(
    () => [
      { key: "room_code", label: "Mã phòng" },
      { key: "total_computers", label: "Tổng máy" },
      { key: "broken_computers", label: "Máy hỏng" },
      { key: "usable_student_computers", label: "Máy dùng được" },
      {
        key: "room_status",
        label: "Trạng thái",
        render: (value, row) => (
          <button
            type="button"
            className="roomStatusClickable"
            onClick={() => handleOpenStatusDialog(row.rawRoom)}
            title="Bấm để cập nhật trạng thái phòng"
          >
            {buildStatusBadge(value)}
          </button>
        ),
      },
    ],
    [],
  );

  /**
   * Chuyển dữ liệu phòng từ API thành rows cho DataTable.
   * rawRoom giữ lại object gốc để khi bấm trạng thái có đủ id, room_code, room_status.
   */
  const roomRows = useMemo(
    () =>
      filteredRoomItems.map((room) => ({
        id: room.id || room.room_code,
        room_code: room.room_code,
        total_computers: getNumberValue(room.total_computers),
        broken_computers: getNumberValue(room.broken_computers),
        usable_student_computers: getNumberValue(room.usable_student_computers),
        room_status: room.room_status,
        rawRoom: room,
      })),
    [filteredRoomItems],
  );

  const currentStatusOptions =
    statusOptionMap[activeTab] || statusOptionMap.rooms;
  const currentSearchPlaceholder =
    searchPlaceholderMap[activeTab] || searchPlaceholderMap.rooms;
  const currentTableTitle = roomTableTitleMap[activeTab] || "Danh sách phòng";

  return (
    <div>
      <section className="card summaryCardGrid">
        {roomStats.map((statItem) => (
          <CardUI
            key={statItem.title}
            icon={renderRoomIcon(statItem.iconName, "summaryCardIcon", 20)}
            title={statItem.title}
            number={statItem.value}
          />
        ))}
      </section>

      <section className="card managementAccount roomsManagement">
        <div className="card accountsView roomsPrimaryPanel">
          <div className="card optionView roomToolbar">
            <div className="buttonsView roomTabList">
              {roomTabItems.map((tabItem) => {
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
                onClick={loadRooms}
              >
                Tìm kiếm
              </ButtonUI>

              <input
                type="text"
                className="input roomSearchInput"
                placeholder={currentSearchPlaceholder}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadRooms();
                  }
                }}
              />
            </div>
          </div>

          <div className="card option roomFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">{currentTableTitle}</h3>
              <p className="roomSectionText">
                Hiển thị {roomRows.length} bản ghi theo bộ lọc hiện tại.
              </p>
            </div>

            <div className="roomFilterControls">
              <ButtonUI
                tone="secondary"
                shape="rounded"
                className="roomRefreshButton"
                onClick={handleRefreshRooms}
              >
                Làm mới
              </ButtonUI>

              <select
                className="select roomStatusSelect"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {currentStatusOptions.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card roomTableCard">
            {isLoading ? (
              <div className="roomEmptyState">
                <h4>Đang tải dữ liệu phòng...</h4>
                <p>Frontend đang gọi API thật từ backend.</p>
              </div>
            ) : errorMessage ? (
              <div className="roomEmptyState">
                <h4>Không tải được dữ liệu</h4>
                <p>{errorMessage}</p>
              </div>
            ) : roomRows.length > 0 ? (
              <DataTable columns={roomColumns} rows={roomRows} />
            ) : (
              <div className="roomEmptyState">
                <h4>Chưa có dữ liệu phù hợp</h4>
                <p>
                  Không tìm thấy phòng thuộc scope MVP:{" "}
                  {getMvpRoomCodes().join(", ")}.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="card roomsSecondaryPanel">
          <SectionLayout
            title="KHAI BÁO NHANH"
            message="Tải nhanh tệp khai báo cho phòng máy, thiết bị và phần mềm theo mẫu của khoa."
            direction={1}
            className="card roomUploadPanel"
          >
            {roomUploadItems.map((uploadItem) => (
              <UploadCard
                key={uploadItem.key}
                icon={renderRoomIcon(
                  uploadItem.iconName,
                  "uploadCardIconSvg",
                  22,
                )}
                title={uploadItem.title}
                fileLabel="Excel"
                buttonLabel="Tải"
              />
            ))}
          </SectionLayout>
        </aside>
      </section>

      <RoomStatusDialog
        room={selectedRoom}
        isOpen={isStatusDialogOpen}
        isSubmitting={isUpdatingRoomStatus}
        onClose={handleCloseStatusDialog}
        onSubmit={handleSubmitRoomStatus}
      />
    </div>
  );
}
