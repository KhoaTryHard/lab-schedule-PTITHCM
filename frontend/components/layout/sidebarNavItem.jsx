import Link from "next/link";

import { renderSidebarIcon } from "../systemIcon.jsx";

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
    "appShellNavItem",
    isActive ? "appShellNavItemActive" : "",
    isCollapsed ? "appShellNavItemCollapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={href}
      className={itemClassName}
      title={isCollapsed ? itemName : undefined}
    >
      <span className="appShellNavIcon">{iconContent}</span>
      {!isCollapsed && <span className="appShellNavLabel">{itemName}</span>}
    </Link>
  );
}
