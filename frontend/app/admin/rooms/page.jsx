"use client";

import { useEffect, useMemo, useState } from "react";

import { CardUI, UploadCard } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import {
  getMvpRoomCodes,
  getRooms,
  isMvpRoom,
} from "../../../services/roomService";

// Mảng dữ liệu mock cho danh sách phòng máy, bám gần các field chính trong DB.

// Mảng dữ liệu mock cho thiết bị, giữ tên field gần DB để dễ nối API sau.

// Mảng dữ liệu mock cho phần mềm theo phòng.

// Mảng tab quản lý chính ở cột trái.
const roomTabItems = [{ key: "rooms", label: "Phòng máy" }];

// Mảng thẻ khai báo nhanh dùng giao diện upload giống trang tài khoản.
const roomUploadItems = [
  { key: "room", title: "Phòng máy", iconName: "room" },
  { key: "device", title: "Thiết bị", iconName: "device" },
  { key: "software", title: "Phần mềm", iconName: "software" },
];

// Mảng tùy chọn lọc trạng thái theo từng tab.
const statusOptionMap = {
  rooms: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "available", label: "Khả dụng" },
    { value: "maintenance", label: "Bảo trì" },
    { value: "out_of_order", label: "Hỏng" },
    { value: "locked", label: "Tạm khóa" },
  ],
};

// Map placeholder tìm kiếm tương ứng với tab đang chọn.
const searchPlaceholderMap = {
  rooms: "Tìm theo mã phòng: 2B11, 2B21, 2B31...",
};

// Map tiêu đề bảng tương ứng với tab đang chọn.
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
 * Hàm nhận vào: dateValue là chuỗi ngày ở dạng YYYY-MM-DD.
 * Hàm xử lý: đổi chuỗi ngày sang định dạng DD/MM/YYYY để hiển thị trên bảng.
 * Hàm trả về: chuỗi ngày đã format hoặc dấu gạch ngang nếu không có dữ liệu.
 */
function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const [year, month, day] = String(dateValue).split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  return `${day}/${month}/${year}`;
}

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

function getNumberValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

/**
 * Hàm nhận vào: iconName là mã icon cần hiển thị, className là class CSS bổ sung, size là kích thước icon.
 * Hàm xử lý: chọn SVG phù hợp cho card thống kê, thẻ upload và badge hỗ trợ của trang rooms.
 * Hàm trả về: JSX của icon SVG tương ứng với mã đã truyền.
 */
function renderRoomIcon(iconName, className = "", size = 24) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    className,
    "aria-hidden": "true",
  };

  switch (iconName) {
    case "room":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 4v16" />
          <path d="M15 10h.01" />
        </svg>
      );
    case "available":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="m8.5 12 2.2 2.2 4.8-4.8" />
        </svg>
      );
    case "maintenance":
      return (
        <svg {...commonProps}>
          <path d="M14.5 4.5a4 4 0 0 0 4.7 4.7L11 17.4 6.6 13l7.9-7.9Z" />
          <path d="M4.5 19.5 6.6 17.4" />
        </svg>
      );
    case "computer":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );
    case "usable":
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="m10 11 2 2 4-4" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );
    case "alert":
      return (
        <svg {...commonProps}>
          <path d="M12 4 3.5 19h17L12 4Z" />
          <path d="M12 9v4" />
          <path d="M12 16h.01" />
        </svg>
      );
    case "device":
      return (
        <svg {...commonProps}>
          <path d="M14 7 17 10" />
          <path d="M3 21 10 14" />
          <path d="M14.5 3C16.9853 3 19 5.01472 19 7.5c0 .87873-.252 1.6986-.6875 2.39062L10 18.2031 5.79688 14l8.31252-8.3125C14.8014 5.25205 15.6213 5 16.5 5" />
        </svg>
      );
    case "software":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8" />
          <path d="M8 12h8" />
          <path d="M8 15h5" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

/**
 * Hàm nhận vào: status là chuỗi trạng thái của phòng, thiết bị hoặc phần mềm.
 * Hàm xử lý: ánh xạ trạng thái sang màu badge phù hợp để dễ nhìn trên bảng.
 * Hàm trả về: JSX của badge trạng thái.
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
 * Hàm nhận vào: iconName là mã icon, title là tên card, value là số liệu hiển thị.
 * Hàm xử lý: dựng card thống kê ở đầu trang theo phong cách đồng bộ với admin/accounts.
 * Hàm trả về: JSX của một card thống kê.
 */
/**
 * Hàm nhận vào: không nhận props.
 * Hàm xử lý: dựng giao diện quản lý phòng máy và thiết bị cho quản trị viên bằng mock data, hỗ trợ tab, tìm kiếm, lọc trạng thái và khối khai báo bên phải.
 * Hàm trả về: JSX hoàn chỉnh của trang /admin/rooms.
 */
export default function RoomsPage() {
  const [activeTab, setActiveTab] = useState("rooms");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

  useEffect(() => {
    loadRooms();
  }, [statusFilter]);

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

  const roomColumns = useMemo(
    () => [
      { key: "room_code", label: "Mã phòng" },
      { key: "total_computers", label: "Tổng máy" },
      { key: "broken_computers", label: "Máy hỏng" },
      { key: "usable_student_computers", label: "Máy dùng được" },
      { key: "room_status", label: "Trạng thái" },
    ],
    [],
  );

  const roomRows = useMemo(
    () =>
      filteredRoomItems.map((room) => ({
        id: room.id || room.room_code,
        room_code: room.room_code,
        total_computers: getNumberValue(room.total_computers),
        broken_computers: getNumberValue(room.broken_computers),
        usable_student_computers: getNumberValue(room.usable_student_computers),
        room_status: buildStatusBadge(room.room_status),
      })),
    [filteredRoomItems],
  );

  const currentColumns = roomColumns;
  const currentRows = roomRows;
  const currentStatusOptions = statusOptionMap[activeTab];
  const currentSearchPlaceholder = searchPlaceholderMap[activeTab];
  const currentTableTitle = roomTableTitleMap[activeTab];

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setStatusFilter("all");
  }

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
                  <button
                    key={tabItem.key}
                    type="button"
                    className={
                      isActive
                        ? "roomTabButton roomTabButtonActive"
                        : "roomTabButton"
                    }
                    onClick={() => handleTabChange(tabItem.key)}
                  >
                    {tabItem.label}
                  </button>
                );
              })}
            </div>

            <div className="inputFind roomSearchGroup">
              <button type="button" className="button roomSearchButton">
                Tìm kiếm
              </button>
              <input
                type="text"
                className="input roomSearchInput"
                placeholder={currentSearchPlaceholder}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </div>
          </div>

          <div className="card option roomFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">{currentTableTitle}</h3>
              <p className="roomSectionText">
                Hiển thị {currentRows.length} bản ghi theo bộ lọc hiện tại.
              </p>
            </div>

            <div className="roomFilterControls">
              <button
                type="button"
                className="button secondary roomRefreshButton"
                onClick={() => {
                  setSearchKeyword("");
                  setStatusFilter("all");
                  loadRooms();
                }}
              >
                Làm mới
              </button>

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
            ) : currentRows.length > 0 ? (
              <DataTable columns={currentColumns} rows={currentRows} />
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
    </div>
  );
}
