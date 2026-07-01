import Link from "next/link";

import { renderSidebarIcon } from "../systemIcon.jsx";

export default function SidebarNavItem({
  icon,
  itemName,
  href,
  badge,
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

  const titleText = badge ? `${itemName} - ${badge}` : itemName;

  return (
    <Link
      href={href}
      className={itemClassName}
      title={isCollapsed ? titleText : undefined}
    >
      <span className="appShellNavIcon">{iconContent}</span>
      {!isCollapsed && (
        <>
          <span className="appShellNavLabel">{itemName}</span>
          {badge ? (
            <span className="commonBadge commonBadgeWarning">{badge}</span>
          ) : null}
        </>
      )}
    </Link>
  );
}
