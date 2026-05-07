"use client";

import { useMemo, useState } from "react";

import { CardUI, UploadCard } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";

// Mảng dữ liệu mock cho danh sách phòng máy, bám gần các field chính trong DB.
const roomMockItems = [
  {
    id: 1,
    room_code: "2B11",
    total_computers: 40,
    broken_computers: 2,
    reserved_teacher_computers: 1,
    usable_student_computers: 37,
    has_projector: true,
    has_wifi: true,
    has_lan: true,
    room_status: "Khả dụng",
    primary_technician_user_id: 301,
    primary_technician_name: "Nguyễn Minh Kỹ Thuật",
    notes: "Ưu tiên cho các ca thực hành lập trình web.",
  },
  {
    id: 2,
    room_code: "2B21",
    total_computers: 40,
    broken_computers: 3,
    reserved_teacher_computers: 1,
    usable_student_computers: 36,
    has_projector: true,
    has_wifi: true,
    has_lan: true,
    room_status: "Khả dụng",
    primary_technician_user_id: 302,
    primary_technician_name: "Lê Hoàng Bảo",
    notes: "Ổn định cho thực hành hệ quản trị cơ sở dữ liệu.",
  },
  {
    id: 3,
    room_code: "2B31",
    total_computers: 40,
    broken_computers: 8,
    reserved_teacher_computers: 1,
    usable_student_computers: 31,
    has_projector: true,
    has_wifi: false,
    has_lan: true,
    room_status: "Bảo trì",
    primary_technician_user_id: 303,
    primary_technician_name: "Trần Quốc Thiết Bị",
    notes: "Đang thay thế switch mạng và kiểm tra máy hỏng.",
  },
];

// Mảng dữ liệu mock cho thiết bị, giữ tên field gần DB để dễ nối API sau.
const deviceMockItems = [
  {
    id: 1,
    room_id: 1,
    room_code: "2B11",
    device_code: "PC-2B11-01",
    device_name: "Máy trạm 01",
    device_type: "Máy tính",
    spec_or_version: "Core i5 / RAM 8GB / SSD 256GB",
    device_status: "Hoạt động",
    last_updated_at: "2026-05-02",
    notes: "Cấu hình dùng cho thực hành Node.js.",
  },
  {
    id: 2,
    room_id: 1,
    room_code: "2B11",
    device_code: "PC-2B11-02",
    device_name: "Máy trạm 02",
    device_type: "Máy tính",
    spec_or_version: "Core i5 / RAM 8GB / SSD 256GB",
    device_status: "Lỗi nhẹ",
    last_updated_at: "2026-05-03",
    notes: "Bàn phím cần thay mới.",
  },
  {
    id: 3,
    room_id: 1,
    room_code: "2B11",
    device_code: "PROJECTOR-2B11",
    device_name: "Máy chiếu phòng 2B11",
    device_type: "Máy chiếu",
    spec_or_version: "Epson EB-X06",
    device_status: "Hoạt động",
    last_updated_at: "2026-05-01",
    notes: "Độ sáng ổn định.",
  },
  {
    id: 4,
    room_id: 2,
    room_code: "2B21",
    device_code: "LAN-2B21",
    device_name: "Thiết bị mạng 2B21",
    device_type: "Mạng",
    spec_or_version: "Switch 48 port Gigabit",
    device_status: "Đang sửa",
    last_updated_at: "2026-05-04",
    notes: "Đang thay 1 cổng uplink.",
  },
  {
    id: 5,
    room_id: 3,
    room_code: "2B31",
    device_code: "PC-2B31-01",
    device_name: "Máy trạm 01",
    device_type: "Máy tính",
    spec_or_version: "Core i3 / RAM 8GB / SSD 256GB",
    device_status: "Hỏng",
    last_updated_at: "2026-05-05",
    notes: "Không lên nguồn.",
  },
];

// Mảng dữ liệu mock cho phần mềm theo phòng.
const softwareInstallationMockItems = [
  {
    id: 1,
    room_id: 1,
    room_code: "2B11",
    software_name: "Visual Studio Code",
    software_version: "1.99",
    installed_version: "1.99",
    installed_on: "2026-04-20",
    installation_status: "Sẵn sàng",
  },
  {
    id: 2,
    room_id: 1,
    room_code: "2B11",
    software_name: "Node.js",
    software_version: "22 LTS",
    installed_version: "22 LTS",
    installed_on: "2026-04-20",
    installation_status: "Sẵn sàng",
  },
  {
    id: 3,
    room_id: 2,
    room_code: "2B21",
    software_name: "MySQL Workbench",
    software_version: "8.0.41",
    installed_version: "8.0.41",
    installed_on: "2026-04-21",
    installation_status: "Cần cập nhật",
  },
  {
    id: 4,
    room_id: 3,
    room_code: "2B31",
    software_name: "XAMPP",
    software_version: "8.2.12",
    installed_version: "8.2.12",
    installed_on: "2026-04-18",
    installation_status: "Tạm ngưng",
  },
  {
    id: 5,
    room_id: 3,
    room_code: "2B31",
    software_name: "Chrome",
    software_version: "136",
    installed_version: "136",
    installed_on: "2026-04-18",
    installation_status: "Sẵn sàng",
  },
];

// Mảng tab quản lý chính ở cột trái.
const roomTabItems = [
  { key: "rooms", label: "Phòng máy" },
  { key: "devices", label: "Thiết bị" },
  { key: "software", label: "Phần mềm theo phòng" },
];

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
    { value: "Khả dụng", label: "Khả dụng" },
    { value: "Bảo trì", label: "Bảo trì" },
    { value: "Tạm khóa", label: "Tạm khóa" },
  ],
  devices: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Hoạt động", label: "Hoạt động" },
    { value: "Lỗi nhẹ", label: "Lỗi nhẹ" },
    { value: "Hỏng", label: "Hỏng" },
    { value: "Đang sửa", label: "Đang sửa" },
    { value: "Đã thay", label: "Đã thay" },
  ],
  software: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "Sẵn sàng", label: "Sẵn sàng" },
    { value: "Cần cập nhật", label: "Cần cập nhật" },
    { value: "Tạm ngưng", label: "Tạm ngưng" },
  ],
};

// Map placeholder tìm kiếm tương ứng với tab đang chọn.
const searchPlaceholderMap = {
  rooms: "Tìm theo mã phòng, KTV phụ trách hoặc ghi chú...",
  devices: "Tìm theo mã thiết bị, tên thiết bị hoặc mã phòng...",
  software: "Tìm theo tên phần mềm, phiên bản hoặc mã phòng...",
};

// Map tiêu đề bảng tương ứng với tab đang chọn.
const roomTableTitleMap = {
  rooms: "Danh sách phòng máy",
  devices: "Danh sách thiết bị",
  software: "Danh sách phần mềm theo phòng",
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
  const toneClassMap = {
    "Khả dụng": "roomStatusPositive",
    "Sẵn sàng": "roomStatusPositive",
    "Hoạt động": "roomStatusPositive",
    "Bảo trì": "roomStatusWarning",
    "Cần cập nhật": "roomStatusWarning",
    "Lỗi nhẹ": "roomStatusWarning",
    "Đang sửa": "roomStatusWarning",
    "Tạm khóa": "roomStatusDanger",
    "Tạm ngưng": "roomStatusDanger",
    "Hỏng": "roomStatusDanger",
    "Đã thay": "roomStatusNeutral",
  };

  const toneClassName = toneClassMap[status] || "roomStatusNeutral";

  return <span className={`roomStatusBadge ${toneClassName}`}>{status}</span>;
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

  const roomStats = useMemo(() => {
    const totalRooms = roomMockItems.length;
    const availableRooms = roomMockItems.filter(
      (room) => room.room_status === "Khả dụng",
    ).length;
    const maintenanceRooms = roomMockItems.filter((room) =>
      ["Bảo trì", "Tạm khóa"].includes(room.room_status),
    ).length;
    const totalComputers = roomMockItems.reduce(
      (sum, room) => sum + room.total_computers,
      0,
    );
    const usableComputers = roomMockItems.reduce(
      (sum, room) => sum + room.usable_student_computers,
      0,
    );
    const faultyDevices = deviceMockItems.filter((device) =>
      ["Lỗi nhẹ", "Hỏng", "Đang sửa"].includes(device.device_status),
    ).length;

    return [
      { iconName: "room", title: "Tổng phòng", value: totalRooms },
      { iconName: "available", title: "Phòng khả dụng", value: availableRooms },
      {
        iconName: "maintenance",
        title: "Bảo trì / tạm khóa",
        value: maintenanceRooms,
      },
      { iconName: "computer", title: "Tổng máy", value: totalComputers },
      { iconName: "usable", title: "Máy dùng được", value: usableComputers },
      { iconName: "alert", title: "Thiết bị lỗi", value: faultyDevices },
    ];
  }, []);

  const filteredRoomItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return roomMockItems.filter((room) => {
      const searchTarget = normalizeText(
        [
          room.room_code,
          room.primary_technician_name,
          room.room_status,
          room.notes,
        ].join(" "),
      );

      const matchedKeyword =
        !normalizedKeyword || searchTarget.includes(normalizedKeyword);
      const matchedStatus =
        statusFilter === "all" || room.room_status === statusFilter;

      return matchedKeyword && matchedStatus;
    });
  }, [searchKeyword, statusFilter]);

  const filteredDeviceItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return deviceMockItems.filter((device) => {
      const searchTarget = normalizeText(
        [
          device.device_code,
          device.device_name,
          device.room_code,
          device.device_type,
          device.spec_or_version,
          device.notes,
        ].join(" "),
      );

      const matchedKeyword =
        !normalizedKeyword || searchTarget.includes(normalizedKeyword);
      const matchedStatus =
        statusFilter === "all" || device.device_status === statusFilter;

      return matchedKeyword && matchedStatus;
    });
  }, [searchKeyword, statusFilter]);

  const filteredSoftwareItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return softwareInstallationMockItems.filter((software) => {
      const searchTarget = normalizeText(
        [
          software.room_code,
          software.software_name,
          software.software_version,
          software.installed_version,
          software.installation_status,
        ].join(" "),
      );

      const matchedKeyword =
        !normalizedKeyword || searchTarget.includes(normalizedKeyword);
      const matchedStatus =
        statusFilter === "all" ||
        software.installation_status === statusFilter;

      return matchedKeyword && matchedStatus;
    });
  }, [searchKeyword, statusFilter]);

  const roomColumns = useMemo(
    () => [
      { key: "room_code", label: "Mã phòng" },
      { key: "total_computers", label: "Tổng máy" },
      { key: "broken_computers", label: "Máy hỏng" },
      { key: "usable_student_computers", label: "Máy dùng được" },
      { key: "reserved_teacher_computers", label: "Máy GV" },
      { key: "has_projector", label: "Máy chiếu" },
      { key: "has_wifi", label: "WiFi" },
      { key: "has_lan", label: "LAN" },
      { key: "room_status", label: "Trạng thái" },
      { key: "primary_technician_name", label: "KTV phụ trách" },
      { key: "action", label: "Hành động" },
    ],
    [],
  );

  const deviceColumns = useMemo(
    () => [
      { key: "device_code", label: "Mã thiết bị" },
      { key: "device_name", label: "Tên thiết bị" },
      { key: "room_code", label: "Phòng" },
      { key: "device_type", label: "Loại thiết bị" },
      { key: "spec_or_version", label: "Cấu hình / phiên bản" },
      { key: "device_status", label: "Trạng thái" },
      { key: "last_updated_at", label: "Cập nhật lần cuối" },
      { key: "notes", label: "Ghi chú" },
    ],
    [],
  );

  const softwareColumns = useMemo(
    () => [
      { key: "room_code", label: "Phòng" },
      { key: "software_name", label: "Phần mềm" },
      { key: "installed_version", label: "Phiên bản" },
      { key: "installed_on", label: "Ngày cài" },
      { key: "installation_status", label: "Trạng thái" },
      { key: "action", label: "Hành động" },
    ],
    [],
  );

  const roomRows = useMemo(
    () =>
      filteredRoomItems.map((room) => ({
        id: room.id,
        room_code: room.room_code,
        total_computers: room.total_computers,
        broken_computers: room.broken_computers,
        usable_student_computers: room.usable_student_computers,
        reserved_teacher_computers: room.reserved_teacher_computers,
        has_projector: room.has_projector ? "Có" : "Không",
        has_wifi: room.has_wifi ? "Có" : "Không",
        has_lan: room.has_lan ? "Có" : "Không",
        room_status: buildStatusBadge(room.room_status),
        primary_technician_name: room.primary_technician_name,
        action: (
          <button type="button" className="roomLinkButton">
            Xem chi tiết
          </button>
        ),
      })),
    [filteredRoomItems],
  );

  const deviceRows = useMemo(
    () =>
      filteredDeviceItems.map((device) => ({
        id: device.id,
        device_code: device.device_code,
        device_name: device.device_name,
        room_code: device.room_code,
        device_type: device.device_type,
        spec_or_version: device.spec_or_version,
        device_status: buildStatusBadge(device.device_status),
        last_updated_at: formatDateLabel(device.last_updated_at),
        notes: device.notes || "—",
      })),
    [filteredDeviceItems],
  );

  const softwareRows = useMemo(
    () =>
      filteredSoftwareItems.map((software) => ({
        id: software.id,
        room_code: software.room_code,
        software_name: software.software_name,
        installed_version: software.installed_version,
        installed_on: formatDateLabel(software.installed_on),
        installation_status: buildStatusBadge(software.installation_status),
        action: (
          <button type="button" className="roomLinkButton">
            Đồng bộ
          </button>
        ),
      })),
    [filteredSoftwareItems],
  );

  const currentColumns =
    activeTab === "rooms"
      ? roomColumns
      : activeTab === "devices"
        ? deviceColumns
        : softwareColumns;

  const currentRows =
    activeTab === "rooms"
      ? roomRows
      : activeTab === "devices"
        ? deviceRows
        : softwareRows;

  const currentStatusOptions = statusOptionMap[activeTab];
  const currentSearchPlaceholder = searchPlaceholderMap[activeTab];
  const currentTableTitle = roomTableTitleMap[activeTab];

  /**
   * Hàm nhận vào: nextTab là key của tab cần chuyển sang.
   * Hàm xử lý: cập nhật tab hiện tại và reset bộ lọc trạng thái về mặc định.
   * Hàm trả về: không trả về dữ liệu.
   */
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
            icon={renderRoomIcon(statItem.iconName, "summaryCardIcon", 24)}
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
            {currentRows.length > 0 ? (
              <DataTable columns={currentColumns} rows={currentRows} />
            ) : (
              <div className="roomEmptyState">
                <h4>Chưa có dữ liệu phù hợp</h4>
                <p>
                  Không tìm thấy bản ghi phù hợp với từ khóa hoặc trạng thái hiện
                  tại.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="card roomsSecondaryPanel">
          <div className="card roomUploadPanel">
            <h5 className="accountUploadTitle">KHAI BÁO NHANH</h5>
            <p className="roomSectionText roomUploadText">
              Tải nhanh tệp khai báo cho phòng máy, thiết bị và phần mềm theo
              mẫu của khoa.
            </p>

            <div className="roomUploadGrid">
              {roomUploadItems.map((uploadItem) => (
                <UploadCard
                  key={uploadItem.key}
                  icon={renderRoomIcon(uploadItem.iconName, "uploadCardIconSvg", 22)}
                  title={uploadItem.title}
                  fileLabel="Excel"
                  buttonLabel="Tải"
                />
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
