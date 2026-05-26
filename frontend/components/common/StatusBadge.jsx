const STATUS_VIEW = {
  active: ["Đang hoạt động", "success"],
  available: ["Khả dụng", "success"],
  approved: ["Đã duyệt", "success"],
  published: ["Đã công bố", "published"],
  completed: ["Hoàn thành", "success"],
  resolved: ["Đã xử lý", "success"],

  draft: ["Nháp", "warning"],
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

const FORCED_STATUS_VARIANT = {
  draft: "warning",
  approved: "success",
  published: "published",
  cancelled: "danger",
};

const VARIANT_CLASS = {
  success: "commonBadgeSuccess",
  warning: "commonBadgeWarning",
  danger: "commonBadgeDanger",
  info: "commonBadgeInfo",
  muted: "commonBadgeMuted",
  published: "commonBadgeSuccess",
};

const VARIANT_STYLE = {
  published: {
    background: "#064e3b",
    color: "#ffffff",
  },
};

export default function StatusBadge({ value, children, variant }) {
  const normalizedValue = value ? String(value).trim().toLowerCase() : "";
  const [label, mappedVariant] = STATUS_VIEW[normalizedValue] || [
    children || value || "Không rõ",
    "muted",
  ];

  const resolvedVariant =
    FORCED_STATUS_VARIANT[normalizedValue] || variant || mappedVariant;

  return (
    <span
      className={`commonBadge ${
        VARIANT_CLASS[resolvedVariant] || "commonBadgeMuted"
      }`}
      style={VARIANT_STYLE[resolvedVariant]}
    >
      {children || label}
    </span>
  );
}
