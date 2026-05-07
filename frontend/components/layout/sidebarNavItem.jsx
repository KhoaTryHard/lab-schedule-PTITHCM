import Link from "next/link";

import { renderSidebarIcon } from "../icons/systemIcon.jsx";
import styles from "./appShell.module.css";

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
