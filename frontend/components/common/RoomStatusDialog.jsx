"use client";

import { useEffect, useState } from "react";

import { ButtonUI } from "./buttonUI.jsx";

/**
 * Danh sách trạng thái phòng đúng theo enum rooms.room_status trong CSDL.
 */
const ROOM_STATUS_OPTIONS = [
  {
    value: "available",
    label: "Khả dụng",
    description: "Phòng sẵn sàng đưa vào xếp lịch thực hành.",
  },
  {
    value: "maintenance",
    label: "Bảo trì",
    description: "Phòng đang bảo trì, không nên đưa vào xếp lịch mới.",
  },
  {
    value: "out_of_order",
    label: "Hỏng",
    description: "Phòng gặp sự cố nghiêm trọng, cần xử lý trước khi sử dụng.",
  },
  {
    value: "locked",
    label: "Tạm khóa",
    description: "Phòng bị khóa tạm thời theo yêu cầu quản trị.",
  },
];

const ROOM_STATUS_LABEL_MAP = ROOM_STATUS_OPTIONS.reduce((statusMap, option) => {
  statusMap[option.value] = option.label;
  return statusMap;
}, {});

/**
 * Map bổ sung để phòng trường hợp dữ liệu cũ đang là nhãn tiếng Việt.
 */
const ROOM_STATUS_VALUE_MAP = {
  "Khả dụng": "available",
  "Bảo trì": "maintenance",
  Hỏng: "out_of_order",
  "Tạm khóa": "locked",
};

function normalizeRoomStatus(status) {
  return ROOM_STATUS_VALUE_MAP[status] || status || "available";
}

function getRoomStatusLabel(status) {
  return ROOM_STATUS_LABEL_MAP[normalizeRoomStatus(status)] || status || "Không rõ";
}

function getRoomStatusDescription(status) {
  const normalizedStatus = normalizeRoomStatus(status);
  const matchedOption = ROOM_STATUS_OPTIONS.find(
    (option) => option.value === normalizedStatus,
  );

  return matchedOption?.description || "";
}

function getSubmitButtonTone(status) {
  const normalizedStatus = normalizeRoomStatus(status);

  if (["locked", "out_of_order"].includes(normalizedStatus)) {
    return "danger";
  }

  if (normalizedStatus === "maintenance") {
    return "secondary";
  }

  return "primary";
}

/**
 * Component nhận vào:
 * - room: phòng đang được chọn để cập nhật.
 * - isOpen: true/false để quyết định có hiển thị popup hay không.
 * - isSubmitting: true/false khi đang gửi request lên backend.
 * - onClose: hàm đóng popup.
 * - onSubmit: hàm xử lý gửi trạng thái mới lên backend.
 *
 * Component xử lý:
 * - Hiển thị trạng thái hiện tại.
 * - Cho chọn trạng thái mới theo enum CSDL.
 * - Cho nhập ghi chú cập nhật.
 * - Gửi PATCH /rooms/:id thông qua callback từ page.
 */
export default function RoomStatusDialog({
  room,
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}) {
  const [selectedStatus, setSelectedStatus] = useState("available");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && room) {
      setSelectedStatus(normalizeRoomStatus(room.room_status));
      setNotes("");
    }
  }, [isOpen, room]);

  if (!isOpen || !room) {
    return null;
  }

  const currentStatusLabel = getRoomStatusLabel(room.room_status);
  const selectedStatusLabel = getRoomStatusLabel(selectedStatus);
  const selectedStatusDescription = getRoomStatusDescription(selectedStatus);

  /**
   * Hàm xử lý gửi trạng thái đã chọn lên parent page.
   */
  function handleSubmitStatus() {
    onSubmit({
      room_status: selectedStatus,
      notes:
        notes.trim() ||
        `Cập nhật trạng thái phòng sang ${selectedStatusLabel}`,
    });
  }

  return (
    <div className="modalOverlay" role="presentation">
      <section className="modalPanel" role="dialog" aria-modal="true">
        <div className="modalHeader">
          <div>
            <p className="modalEyebrow">Cập nhật trạng thái phòng</p>
            <h3 className="modalTitle">Phòng {room.room_code}</h3>
          </div>

          <button
            type="button"
            className="modalCloseButton"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng popup"
          >
            ×
          </button>
        </div>

        <div className="modalBody">
          <p className="modalText">
            Trạng thái hiện tại: <strong>{currentStatusLabel}</strong>
          </p>

          <label className="label" htmlFor="room-status-select">
            Trạng thái mới
            <select
              id="room-status-select"
              className="select"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              disabled={isSubmitting}
            >
              {ROOM_STATUS_OPTIONS.map((statusOption) => (
                <option key={statusOption.value} value={statusOption.value}>
                  {statusOption.label}
                </option>
              ))}
            </select>
          </label>

          {selectedStatusDescription ? (
            <p className="modalText">{selectedStatusDescription}</p>
          ) : null}

          <label className="label" htmlFor="room-status-notes">
            Ghi chú cập nhật
            <textarea
              id="room-status-notes"
              className="textarea"
              value={notes}
              maxLength={255}
              placeholder="Ví dụ: Bảo trì máy chiếu, mở lại sau khi kiểm tra thiết bị..."
              onChange={(event) => setNotes(event.target.value)}
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div className="modalActions">
          <ButtonUI
            tone="secondary"
            shape="rounded"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </ButtonUI>

          <ButtonUI
            tone={getSubmitButtonTone(selectedStatus)}
            shape="rounded"
            onClick={handleSubmitStatus}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi cập nhật trạng thái"}
          </ButtonUI>
        </div>
      </section>
    </div>
  );
}
