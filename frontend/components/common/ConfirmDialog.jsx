"use client";

import { ButtonUI } from "./buttonUI.jsx";

export default function ConfirmDialog({
  open,
  eyebrow = "Xác nhận thao tác",
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  isSubmitting = false,
  tone = "danger",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="modalOverlay" role="presentation">
      <section
        className="modalPanel confirmDialogPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="modalHeader">
          <div>
            <p className="modalEyebrow">{eyebrow}</p>
            <h3 id="confirm-dialog-title" className="modalTitle">
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="modalCloseButton"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Đóng popup xác nhận"
          >
            ×
          </button>
        </div>

        <div className="modalBody">
          <p className="modalText">{message}</p>
        </div>

        <div className="modalActions">
          <ButtonUI
            tone="outline"
            className="dangerOutlineButton"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </ButtonUI>
          <ButtonUI tone={tone} onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : confirmLabel}
          </ButtonUI>
        </div>
      </section>
    </div>
  );
}
