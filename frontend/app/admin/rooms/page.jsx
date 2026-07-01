"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  ActionCard,
  CardUI,
  UploadCard,
} from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import RoomStatusDialog from "../../../components/common/RoomStatusDialog.jsx";
import FilterSearchToolbar from "../../../components/common/FilterSearchToolbar.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { renderRoomIcon as renderSystemRoomIcon } from "../../../components/systemIcon.jsx";
import {
  createRoom,
  extractRoomScope,
  getMvpRoomCodes,
  getRoomById,
  getRooms,
  isMvpRoom,
  listScopeRooms,
  updateRoomById,
} from "../../../services/roomService";
import { createAdminDevice } from "../../../services/adminService";
import {
  listRoomBlockRequests,
  reviewRoomBlockRequest,
  submitRoomBlockRequest,
} from "../../../services/roomOperationService";

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
  {
    key: "room",
    title: "Phòng máy",
    iconName: "room",
    templateHref: "/api/template-download/createlab/rooms",
    templateDownloadName: "rooms.xlsx",
  },
  {
    key: "device",
    title: "Thiết bị",
    iconName: "device",
    templateHref: "/api/template-download/createlab/devices",
    templateDownloadName: "devices.xlsx",
  },
];

const CREATE_ROOM_INITIAL_FORM = {
  room_code: "",
  total_computers: "",
};

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
  roomBlocks: [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "draft", label: "Nháp" },
    { value: "submitted", label: "Chờ duyệt" },
    { value: "approved", label: "Đã duyệt" },
    { value: "rejected", label: "Từ chối" },
    { value: "cancelled", label: "Đã hủy" },
    { value: "expired", label: "Hết hạn" },
  ],
};

/**
 * Map placeholder tìm kiếm tương ứng với tab đang chọn.
 */
const searchPlaceholderMap = {
  rooms: "Tìm theo mã phòng: 2B11, 2B21, 2B31...",
  roomBlocks: "Tìm theo phòng, tiêu đề, người đề xuất...",
};

/**
 * Map tiêu đề bảng tương ứng với tab đang chọn.
 */
const roomTableTitleMap = {
  rooms: "Danh sách phòng máy MVP",
  roomBlocks: "Danh sách yêu cầu khóa phòng",
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

function isRoomInScope(roomCode, scopeCodes) {
  return (
    Array.isArray(scopeCodes) &&
    scopeCodes.includes(
      String(roomCode || "")
        .trim()
        .toUpperCase(),
    )
  );
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

const DEVICE_EXCEL_COLUMNS = [
  "room_id",
  "device_code",
  "device_name",
  "device_type",
  "spec_or_version",
  "device_status",
  "notes",
];

const VALID_DEVICE_TYPES = new Set([
  "computer",
  "projector",
  "network",
  "other",
]);

const VALID_DEVICE_STATUSES = new Set([
  "working",
  "minor_issue",
  "broken",
  "under_repair",
  "replaced",
]);

function getExcelTextValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function isEmptyDeviceRow(row) {
  return DEVICE_EXCEL_COLUMNS.every(
    (columnName) => !getExcelTextValue(row[columnName]),
  );
}

function buildDevicePayloadFromExcelRow(row, rowNumber) {
  const roomIdText = getExcelTextValue(row.room_id);
  const roomId = Number(roomIdText);

  const payload = {
    room_id: roomId,
    device_code: getExcelTextValue(row.device_code),
    device_name: getExcelTextValue(row.device_name),
  };

  const deviceType = getExcelTextValue(row.device_type);
  const specOrVersion = getExcelTextValue(row.spec_or_version);
  const deviceStatus = getExcelTextValue(row.device_status);
  const notes = getExcelTextValue(row.notes);

  if (!Number.isInteger(roomId) || roomId <= 0) {
    throw new Error(`Dòng ${rowNumber}: room_id phải là số nguyên dương.`);
  }

  if (!payload.device_code) {
    throw new Error(`Dòng ${rowNumber}: thiếu device_code.`);
  }

  if (!payload.device_name) {
    throw new Error(`Dòng ${rowNumber}: thiếu device_name.`);
  }

  if (deviceType) {
    if (!VALID_DEVICE_TYPES.has(deviceType)) {
      throw new Error(
        `Dòng ${rowNumber}: device_type không hợp lệ. Dùng: computer, projector, network, other.`,
      );
    }

    payload.device_type = deviceType;
  }

  if (specOrVersion) {
    payload.spec_or_version = specOrVersion;
  }

  if (deviceStatus) {
    if (!VALID_DEVICE_STATUSES.has(deviceStatus)) {
      throw new Error(
        `Dòng ${rowNumber}: device_status không hợp lệ. Dùng: working, minor_issue, broken, under_repair, replaced.`,
      );
    }

    payload.device_status = deviceStatus;
  }

  if (notes) {
    payload.notes = notes;
  }

  return payload;
}

async function readDeviceExcelFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("File Excel không có sheet dữ liệu.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  return rows
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => !isEmptyDeviceRow(row))
    .map(({ row, rowNumber }) =>
      buildDevicePayloadFromExcelRow(row, rowNumber),
    );
}

function CreateRoomDialog({
  isOpen,
  form,
  errorMessage,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modalOverlay" role="presentation">
      <section className="modalPanel modalPanelWide" role="dialog" aria-modal="true">
        <form onSubmit={onSubmit}>
          <div className="modalHeader">
            <div>
              <p className="modalEyebrow">QUẢN LÝ PHÒNG MÁY</p>
              <h2>Tạo phòng</h2>
            </div>

            <button
              type="button"
              className="modalCloseButton"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Đóng"
            >
              ×
            </button>
          </div>

          <div className="modalBody modalFieldGrid">
            {errorMessage ? (
              <p className="academicAlert academicAlert--error modalFieldCard--full">
                {errorMessage}
              </p>
            ) : null}

            <label className="modalFieldCard">
              <span>Mã phòng</span>
              <input
                className="input"
                value={form.room_code}
                onChange={(event) => onChange("room_code", event.target.value)}
                placeholder="Ví dụ: 2B11"
                disabled={isSubmitting}
              />
            </label>

            <label className="modalFieldCard">
              <span>Tổng máy</span>
              <input
                className="input"
                type="number"
                min="1"
                value={form.total_computers}
                onChange={(event) =>
                  onChange("total_computers", event.target.value)
                }
                placeholder="Ví dụ: 40"
                disabled={isSubmitting}
              />
            </label>
          </div>

          <div className="modalActions">
            <ButtonUI
              type="button"
              tone="outline"
              shape="rounded"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </ButtonUI>
            <ButtonUI
              type="submit"
              tone="primary"
              shape="rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu phòng"}
            </ButtonUI>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function RoomsPage() {
  const [activeTab, setActiveTab] = useState("rooms");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rooms, setRooms] = useState([]);
  const [roomScopeCodes, setRoomScopeCodes] = useState(getMvpRoomCodes());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isUpdatingRoomStatus, setIsUpdatingRoomStatus] = useState(false);
  const [isLoadingRoomDetail, setIsLoadingRoomDetail] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [createRoomForm, setCreateRoomForm] = useState(
    CREATE_ROOM_INITIAL_FORM,
  );
  const [createRoomError, setCreateRoomError] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [selectedDeviceUploadFile, setSelectedDeviceUploadFile] =
    useState(null);
  const [isImportingDevices, setIsImportingDevices] = useState(false);
  const [deviceUploadResetKey, setDeviceUploadResetKey] = useState(0);
  const [deviceImportDialog, setDeviceImportDialog] = useState({
    open: false,
    message: "",
  });
  const [roomBlockRequests, setRoomBlockRequests] = useState([]);
  const [isLoadingRoomBlocks, setIsLoadingRoomBlocks] = useState(false);

  function formatBlockStatus(status) {
    const map = {
      draft: "Nháp",
      submitted: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      cancelled: "Đã hủy",
      expired: "Hết hạn",
    };

    return map[status] || status || "—";
  }

  function buildBlockStatusBadge(status) {
    return (
      <span className="roomStatusBadge roomStatusNeutral">
        {formatBlockStatus(status)}
      </span>
    );
  }

  function formatDateOnly(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("vi-VN").format(date);
  }

  function formatBlockTime(row) {
    const dateRange = `${formatDateOnly(row.start_date)} - ${formatDateOnly(row.end_date)}`;
    const slot = row.slot_label || "Cả ngày";
    return `${dateRange} | ${slot}`;
  }
  async function loadRoomBlocks() {
    try {
      setIsLoadingRoomBlocks(true);
      setErrorMessage("");

      const response = await listRoomBlockRequests({
        status: statusFilter,
      });

      const items = Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setRoomBlockRequests(items);
    } catch (error) {
      setRoomBlockRequests([]);
      setErrorMessage(
        error.message || "Không thể tải danh sách yêu cầu khóa phòng.",
      );
    } finally {
      setIsLoadingRoomBlocks(false);
    }
  }
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
      const shouldQueryByRoomCode =
        isRoomInScope(roomCodeKeyword, roomScopeCodes) ||
        isMvpRoom(roomCodeKeyword);

      const [scopeResponse, response] = await Promise.all([
        listScopeRooms().catch(() => null),
        getRooms({
          room_status: statusFilter,
          room_code: shouldQueryByRoomCode ? roomCodeKeyword : "",
        }),
      ]);

      const backendScopeCodes = extractRoomScope(scopeResponse);
      const activeScopeCodes =
        backendScopeCodes.length > 0 ? backendScopeCodes : getMvpRoomCodes();

      setRoomScopeCodes(activeScopeCodes);

      const apiRooms = Array.isArray(response?.data) ? response.data : [];
      const scopedRooms = apiRooms.filter((room) =>
        isRoomInScope(room.room_code, activeScopeCodes),
      );

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
  async function handleOpenStatusDialog(room) {
    if (!room?.id) {
      setSelectedRoom(room);
      setIsStatusDialogOpen(true);
      return;
    }

    try {
      setIsLoadingRoomDetail(true);
      setErrorMessage("");

      const response = await getRoomById(room.id);
      setSelectedRoom(response?.data || room);
    } catch (error) {
      setSelectedRoom(room);
      setErrorMessage(
        error.message ||
          "Không tải được chi tiết phòng, đang dùng dữ liệu danh sách.",
      );
    } finally {
      setIsStatusDialogOpen(true);
      setIsLoadingRoomDetail(false);
    }
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

  function openCreateRoomDialog() {
    setCreateRoomForm(CREATE_ROOM_INITIAL_FORM);
    setCreateRoomError("");
    setIsCreateRoomOpen(true);
  }

  function closeCreateRoomDialog() {
    if (isCreatingRoom) {
      return;
    }

    setIsCreateRoomOpen(false);
    setCreateRoomForm(CREATE_ROOM_INITIAL_FORM);
    setCreateRoomError("");
  }

  function updateCreateRoomField(fieldName, value) {
    setCreateRoomForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
    setCreateRoomError("");
  }

  async function handleCreateRoom(event) {
    event.preventDefault();

    const roomCode = createRoomForm.room_code.trim().toUpperCase();
    const totalComputers = Number(createRoomForm.total_computers);

    if (!roomCode) {
      setCreateRoomError("Vui lòng nhập mã phòng.");
      return;
    }

    if (!Number.isInteger(totalComputers) || totalComputers <= 0) {
      setCreateRoomError("Tổng máy phải là số nguyên dương.");
      return;
    }

    try {
      setIsCreatingRoom(true);
      setCreateRoomError("");
      setErrorMessage("");

      const response = await createRoom({
        room_code: roomCode,
        total_computers: totalComputers,
        broken_computers: 0,
        reserved_teacher_computers: 1,
        has_projector: 1,
        has_wifi: 1,
        has_lan: 1,
        room_status: "available",
        primary_technician_user_id: null,
      });

      const createdRoom = response?.data;

      if (createdRoom?.id) {
        setRooms((currentRooms) => [createdRoom, ...currentRooms]);
      } else {
        await loadRooms();
      }

      setActiveTab("rooms");
      setStatusFilter("all");
      setSearchKeyword("");
      setIsCreateRoomOpen(false);
      setCreateRoomForm(CREATE_ROOM_INITIAL_FORM);
      setCreateRoomError("");
    } catch (error) {
      setCreateRoomError(error.message || "Không thể tạo phòng.");
    } finally {
      setIsCreatingRoom(false);
    }
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

  function handleDeviceUploadFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedDeviceUploadFile(file);
    setErrorMessage("");
  }

  function resetDeviceExcelUpload() {
    setSelectedDeviceUploadFile(null);
    setDeviceUploadResetKey((currentKey) => currentKey + 1);
  }

  function closeDeviceImportDialog() {
    setDeviceImportDialog({
      open: false,
      message: "",
    });
  }

  async function handleImportDevicesFromExcel() {
    if (!selectedDeviceUploadFile) {
      setErrorMessage("Vui lòng chọn file Excel thiết bị trước khi tải lên.");
      return;
    }

    try {
      setIsImportingDevices(true);
      setErrorMessage("");

      const devicePayloads = await readDeviceExcelFile(
        selectedDeviceUploadFile,
      );

      if (devicePayloads.length === 0) {
        throw new Error("File Excel chưa có dòng thiết bị hợp lệ.");
      }

      let successCount = 0;
      const failedMessages = [];

      for (const [index, payload] of devicePayloads.entries()) {
        try {
          await createAdminDevice(payload);
          successCount += 1;
        } catch (error) {
          failedMessages.push(
            `Dòng ${index + 2}: ${error.message || "Không tạo được thiết bị."}`,
          );
        }
      }

      resetDeviceExcelUpload();
      await loadRooms();

      if (failedMessages.length > 0) {
        setErrorMessage(failedMessages.join(" "));
        setDeviceImportDialog({
          open: true,
          message: `Tạo thành công ${successCount}/${devicePayloads.length} thiết bị. Có ${failedMessages.length} dòng lỗi, vui lòng kiểm tra thông báo bên dưới.`,
        });
        return;
      }

      setDeviceImportDialog({
        open: true,
        message: `Tạo thiết bị thành công: ${successCount} thiết bị.`,
      });
    } catch (error) {
      setErrorMessage(
        error.message || "Không thể đọc hoặc tải lên file Excel thiết bị.",
      );
    } finally {
      setIsImportingDevices(false);
    }
  }

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setStatusFilter("all");
    setSearchKeyword("");
    setErrorMessage("");
  }

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: reset bộ lọc và gọi lại API.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleRefreshRooms() {
    setSearchKeyword("");
    setStatusFilter("all");

    if (activeTab === "roomBlocks") {
      loadRoomBlocks();
      return;
    }

    loadRooms();
  }

  async function handleReviewBlock(row, nextStatus) {
    try {
      setErrorMessage("");

      await reviewRoomBlockRequest(row.id, {
        block_status: nextStatus,
        review_notes:
          nextStatus === "approved"
            ? "Quản trị viên duyệt yêu cầu khóa phòng."
            : "Quản trị viên từ chối yêu cầu khóa phòng.",
      });

      await loadRoomBlocks();
    } catch (error) {
      setErrorMessage(
        error.message || "Không thể cập nhật trạng thái yêu cầu khóa phòng.",
      );
    }
  }

  async function handleReopenBlock(row) {
    try {
      setErrorMessage("");

      await submitRoomBlockRequest(row.id, {
        submit_notes: "Quản trị viên mở lại yêu cầu để duyệt lại.",
      });

      await loadRoomBlocks();
    } catch (error) {
      setErrorMessage(error.message || "Không thể mở lại yêu cầu khóa phòng.");
    }
  }

  function handleOpenRoomStatusFromBlock(row) {
    handleOpenStatusDialog({
      id: row.room_id,
      room_code: row.room_code,
    });
  }

  const roomBlockRows = (() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return roomBlockRequests
      .filter((item) => {
        const target = normalizeText(
          [
            item.room_code,
            item.block_title,
            item.block_reason,
            item.requested_by_name,
            formatBlockStatus(item.block_status),
          ].join(" "),
        );

        return !normalizedKeyword || target.includes(normalizedKeyword);
      })
      .map((item) => ({
        ...item,
        time_label: formatBlockTime(item),
        status_label: item.block_status,
      }));
  })();

  const roomBlockColumns = [
    { key: "id", label: "Mã YC" },
    { key: "room_code", label: "Phòng" },
    { key: "block_title", label: "Tiêu đề" },
    { key: "block_reason", label: "Lý do" },
    { key: "time_label", label: "Thời gian khóa" },
    { key: "requested_by_name", label: "Người đề xuất" },
    {
      key: "status_label",
      label: "Trạng thái",
      render: (value) => buildBlockStatusBadge(value),
    },
    {
      key: "action",
      label: "Thao tác",
      render: (_, row) => (
        <div className="roomActionGroup">
          {row.block_status === "submitted" ? (
            <>
              <ButtonUI
                type="button"
                size="sm"
                onClick={() => handleReviewBlock(row, "approved")}
              >
                Duyệt
              </ButtonUI>
              <ButtonUI
                type="button"
                size="sm"
                tone="outline"
                onClick={() => handleReviewBlock(row, "rejected")}
              >
                Từ chối
              </ButtonUI>
            </>
          ) : null}

          {row.block_status === "approved" ? (
            <ButtonUI
              type="button"
              size="sm"
              onClick={() => handleOpenRoomStatusFromBlock(row)}
            >
              Cập nhật phòng
            </ButtonUI>
          ) : null}

          {row.block_status === "rejected" ? (
            <ButtonUI
              type="button"
              size="sm"
              tone="outline"
              onClick={() => handleReopenBlock(row)}
            >
              Duyệt lại
            </ButtonUI>
          ) : null}
        </div>
      ),
    },
  ];
  /**
   * Gọi API khi mở trang hoặc khi bộ lọc trạng thái thay đổi.
   */
  useEffect(() => {
    if (activeTab === "roomBlocks") {
      loadRoomBlocks();
      return;
    }

    loadRooms();
    // Chỉ tự tải lại khi đổi tab hoặc trạng thái; tìm kiếm dùng nút "Tìm kiếm".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter]);

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
      { iconName: "room", title: "Tổng phòng", value: totalRooms },
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
  const currentTableRowCount =
    activeTab === "roomBlocks" ? roomBlockRows.length : roomRows.length;
  const currentSearchSubmit =
    activeTab === "roomBlocks" ? loadRoomBlocks : loadRooms;

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
          <FilterSearchToolbar
            tabs={roomTabItems}
            activeKey={activeTab}
            onTabChange={handleTabChange}
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            onSearchSubmit={currentSearchSubmit}
            searchPlaceholder={currentSearchPlaceholder}
            searchButtonLabel="Tìm kiếm"
            className="roomToolbar"
          />

          <div className="card option roomFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">{currentTableTitle}</h3>
              <p className="roomSectionText">
                Hiển thị {currentTableRowCount} bản ghi theo bộ lọc hiện tại.
              </p>
            </div>

            <div className="roomFilterControls">
              {isLoadingRoomDetail ? (
                <span className="roomSectionText">
                  Đang tải chi tiết phòng...
                </span>
              ) : null}

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
            {activeTab === "roomBlocks" ? (
              errorMessage ? (
                <div className="roomEmptyState">
                  <h4>Không tải được dữ liệu</h4>
                  <p>{errorMessage}</p>
                </div>
              ) : (
                <DataTable
                  columns={roomBlockColumns}
                  rows={roomBlockRows}
                  loading={isLoadingRoomBlocks}
                  emptyTitle="Chưa có yêu cầu khóa phòng"
                  emptyDescription="Không có yêu cầu khóa phòng phù hợp bộ lọc hiện tại."
                  pageSize={8}
                />
              )
            ) : isLoading ? (
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
                  {roomScopeCodes.join(", ")}.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="card roomsSecondaryPanel">
          <SectionLayout
            title="TẠO PHÒNG VÀ THIẾT BỊ"
            message="Khai báo phòng máy và thiết bị."
            direction={1}
            className="card roomUploadPanel"
          >
            {roomUploadItems.map((uploadItem) => {
              const isDeviceUpload = uploadItem.key === "device";

              if (!isDeviceUpload) {
                return (
                  <ActionCard
                    key={uploadItem.key}
                    icon={renderRoomIcon(
                      uploadItem.iconName,
                      "uploadCardIconSvg",
                      22,
                    )}
                    title={uploadItem.title}
                    description="Khai báo phòng máy mới bằng mã phòng và tổng số máy."
                    primaryText="Tạo phòng"
                    onPrimaryClick={openCreateRoomDialog}
                  />
                );
              }

              const uploadKey = isDeviceUpload
                ? `device-${deviceUploadResetKey}`
                : uploadItem.key;

              const selectedFileName = isDeviceUpload
                ? selectedDeviceUploadFile?.name || ""
                : "";

              const isDisabled = isDeviceUpload ? isImportingDevices : false;

              const buttonLabel = isDisabled ? "Đang tải..." : "Tải";

              return (
                <UploadCard
                  key={uploadKey}
                  icon={renderRoomIcon(
                    uploadItem.iconName,
                    "uploadCardIconSvg",
                    22,
                  )}
                  title={uploadItem.title}
                  templateHref={uploadItem.templateHref}
                  templateDownloadName={uploadItem.templateDownloadName}
                  templateLabel="Tải biểu mẫu"
                  fileLabel="Excel"
                  buttonLabel={buttonLabel}
                  accept={isDeviceUpload ? ".xlsx,.xls" : undefined}
                  inputName={isDeviceUpload ? "devices_excel" : undefined}
                  selectedFileName={selectedFileName}
                  disabled={isDisabled}
                  onFileChange={
                    isDeviceUpload ? handleDeviceUploadFileChange : undefined
                  }
                  onButtonClick={
                    isDeviceUpload ? handleImportDevicesFromExcel : undefined
                  }
                />
              );
            })}
          </SectionLayout>
        </aside>
      </section>

      <RoomStatusDialog
        room={selectedRoom}
        isOpen={isStatusDialogOpen}
        isSubmitting={isUpdatingRoomStatus || isLoadingRoomDetail}
        onClose={handleCloseStatusDialog}
        onSubmit={handleSubmitRoomStatus}
      />
      <CreateRoomDialog
        isOpen={isCreateRoomOpen}
        form={createRoomForm}
        errorMessage={createRoomError}
        isSubmitting={isCreatingRoom}
        onChange={updateCreateRoomField}
        onClose={closeCreateRoomDialog}
        onSubmit={handleCreateRoom}
      />
      {deviceImportDialog.open ? (
        <div className="modalOverlay" role="presentation">
          <div className="modalDialog" role="dialog" aria-modal="true">
            <div className="modalHeader">
              <h3>Thông báo</h3>
            </div>

            <div className="modalBody">
              <p>{deviceImportDialog.message}</p>
            </div>

            <div className="modalActions">
              <ButtonUI
                tone="primary"
                shape="rounded"
                onClick={closeDeviceImportDialog}
              >
                OK
              </ButtonUI>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
