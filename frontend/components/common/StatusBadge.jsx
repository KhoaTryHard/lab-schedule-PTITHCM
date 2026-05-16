const STATUS_VIEW = {
  active: ["Đang hoạt động", "success"],
  available: ["Khả dụng", "success"],
  approved: ["Đã duyệt", "success"],
  published: ["Đã công bố", "success"],
  completed: ["Hoàn thành", "success"],
  resolved: ["Đã xử lý", "success"],

  draft: ["Nháp", "muted"],
  pending_review: ["Chờ duyệt", "warning"],
  submitted: ["Đã gửi", "warning"],
  scheduled: ["Đã xếp", "info"],
  in_progress: ["Đang xử lý", "info"],
  under_review: ["Đang xem xét", "info"],

  maintenance: ["Bảo trì", "warning"],
  under_maintenance: ["Bảo trì", "warning"],
  locked: ["Tạm khóa", "danger"],
  temporarily_locked: ["Tạm khóa", "danger"],
  out_of_order: ["Hỏng", "danger"],
  rejected: ["Từ chối", "danger"],
  cancelled: ["Đã hủy", "danger"],
  closed: ["Đã đóng", "muted"],
  inactive: ["Ngừng hoạt động", "muted"],
};

const VARIANT_CLASS = {
  success: "commonBadgeSuccess",
  warning: "commonBadgeWarning",
  danger: "commonBadgeDanger",
  info: "commonBadgeInfo",
  muted: "commonBadgeMuted",
};

export default function StatusBadge({ value, children, variant }) {
  const normalizedValue = value ? String(value).trim().toLowerCase() : "";
  const [label, mappedVariant] = STATUS_VIEW[normalizedValue] || [children || value || "Không rõ", "muted"];
  const resolvedVariant = variant || mappedVariant;

  return (
    <span className={`commonBadge ${VARIANT_CLASS[resolvedVariant] || "commonBadgeMuted"}`}>
      {children || label}
    </span>
  );
}
