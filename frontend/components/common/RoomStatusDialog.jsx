"use client";

import { useState } from "react";

import { ButtonUI } from "./buttonUI.jsx";

/**
 * Map trạng thái backend sang nhãn tiếng Việt để hiển thị cho người dùng.
 */
const ROOM_STATUS_LABEL_MAP = {
  available: "Khả dụng",
  maintenance: "Bảo trì",
  out_of_order: "Hỏng",
  locked: "Tạm khóa",
};

/**
 * Component nhận vào:
 * - room: phòng đang được chọn để cập nhật.
 * - isOpen: true/false để quyết định có hiển thị popup hay không.
 * - isSubmitting: true/false khi đang gửi request lên backend.
 * - onClose: hàm đóng popup.
 * - onSubmit: hàm xử lý gửi trạng thái mới lên backend.
 *
 * Component xử lý:
 * - Hiển thị thông tin phòng.
 * - Cho nhập ghi chú.
 * - Có nút "Gửi trạng thái khóa phòng".
 *
 * Component trả về:
 * - null nếu isOpen = false hoặc chưa có room.
 * - JSX popup nếu isOpen = true.
 */
export default function RoomStatusDialog({
  room,
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}) {
  const [notes, setNotes] = useState("");

  if (!isOpen || !room) {
    return null;
  }

  const currentStatusLabel =
    ROOM_STATUS_LABEL_MAP[room.room_status] || room.room_status || "Không rõ";

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: gọi onSubmit với trạng thái locked và ghi chú hiện tại.
   * Hàm trả về: không trả về dữ liệu trực tiếp.
   */
  function handleLockRoom() {
    onSubmit({
      room_status: "locked",
      notes: notes.trim() || "Khóa phòng từ giao diện quản trị",
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

          <label className="label">
            Ghi chú cập nhật
            <textarea
              className="textarea"
              value={notes}
              placeholder="Ví dụ: Khóa phòng để bảo trì thiết bị..."
              onChange={(event) => setNotes(event.target.value)}
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div className="modalActions">
          <ButtonUI tone="secondary" shape="rounded" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </ButtonUI>

          <ButtonUI
            tone="danger"
            shape="rounded"
            onClick={handleLockRoom}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi trạng thái khóa phòng"}
          </ButtonUI>
        </div>
      </section>
    </div>
  );
}
