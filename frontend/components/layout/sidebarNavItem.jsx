import Link from "next/link";

import styles from "./appShell.module.css";

/**
 * Hàm nhận vào: iconName là tên icon cần hiển thị.
 * Hàm xử lý: chọn icon SVG phù hợp với từng mã icon của sidebar.
 * Hàm trả về: JSX của icon, nếu không có mã phù hợp thì trả về null.
 */
function renderSidebarIcon(iconName) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
  };

  switch (iconName) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
          <rect x="13.5" y="11" width="7" height="9.5" rx="1.5" />
          <rect x="3.5" y="13" width="7" height="7.5" rx="1.5" />
        </svg>
      );
    case "person":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5 19.25c0-3.15 3.1-5 7-5s7 1.85 7 5" />
        </svg>
      );
    case "equipment":
      return (
        <svg {...commonProps}>
          <path d="M4 20.5h9" />
          <path d="M8 20.5V11" />
          <path d="M8 11 5.5 6.5l2.5-1.5L10.5 9 13 7.5" />
          <path d="m13 7.5 2-2 3.5 3.5-2 2" />
          <path d="M14.5 12.5 20 18" />
        </svg>
      );
    case "school":
      return (
        <svg {...commonProps}>
          <path d="m3 9 9-5 9 5-9 5-9-5Z" />
          <path d="M7 11.25v4.5c0 1.2 2.25 2.75 5 2.75s5-1.55 5-2.75v-4.5" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.25" />
          <path d="m16 16 4.25 4.25" />
        </svg>
      );
    case "chart":
      return (
        <svg {...commonProps}>
          <path d="M4 20.5h16" />
          <path d="M7 20.5v-8" />
          <path d="M12 20.5V6.5" />
          <path d="M17 20.5v-11" />
        </svg>
      );
    case "settings":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3.25" />
          <path d="M19.1 15a1 1 0 0 0 .2 1.1l.05.05a2 2 0 0 1 0 2.8 2 2 0 0 1-2.8 0l-.05-.05a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.1a1 1 0 0 0-.65-.95 1 1 0 0 0-1.1.2l-.05.05a2 2 0 1 1-2.8-2.8l.05-.05a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .95-.65 1 1 0 0 0-.2-1.1L4.8 8.2a2 2 0 1 1 2.8-2.8l.05.05a1 1 0 0 0 1.1.2H8.8a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.1a1 1 0 0 0 .65.95 1 1 0 0 0 1.1-.2l.05-.05a2 2 0 0 1 2.8 2.8l-.05.05a1 1 0 0 0-.2 1.1v.05a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.1a1 1 0 0 0-.8.65Z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Hàm nhận vào:
 * - icon là mã icon hoặc JSX icon.
 * - itemName là tên mục hiển thị trên sidebar.
 * - href là đường dẫn điều hướng.
 * - isActive là trạng thái mục hiện tại có đang được chọn hay không.
 * Hàm xử lý: dựng một item menu sidebar có thể tái sử dụng cho nhiều vai trò.
 * Hàm trả về: JSX của một mục điều hướng.
 */
export default function SidebarNavItem({
  icon,
  itemName,
  href,
  isActive = false,
  isCollapsed = false,
}) {
  const iconContent = typeof icon === "string" ? renderSidebarIcon(icon) : icon;
  const itemClassName = [
    styles.navItem,
    isActive ? styles.navItemActive : "",
    isCollapsed ? styles.navItemCollapsed : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={href}
      className={itemClassName}
      title={isCollapsed ? itemName : undefined}
    >
      <span className={styles.navIcon}>{iconContent}</span>
      {!isCollapsed && <span className={styles.navLabel}>{itemName}</span>}
    </Link>
  );
}
