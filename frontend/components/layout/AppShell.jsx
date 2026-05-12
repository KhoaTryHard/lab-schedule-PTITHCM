"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import styles from "./appShell.module.css";
import SidebarNavItem from "./sidebarNavItem";
import { clearAuth, getUser } from "../../lib/authStorage";

const fallbackNavItems = [
  { icon: "dashboard", itemName: "Tổng quan", href: "/admin" },
];

function createAvatarText(fullName) {
  if (!fullName) return "PT";

  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join("");
}

function checkActivePath(pathname, href) {
  if (!href) return false;
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function findCurrentNavItem(navItems, pathname) {
  const matchedItems = navItems
    .filter((item) => checkActivePath(pathname, item.href))
    .sort((first, second) => second.href.length - first.href.length);

  return matchedItems[0] || navItems[0] || null;
}

export default function AppShell({
  children,
  navItems = [],
  brandTitle = "PTIT HCM",
  brandSubtitle = "Lab Schedule",
  userName = "Người dùng",
  userRole = "Vai trò",
  pageTitle,
  topBarBadge = "HỆ THỐNG",
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  const sidebarItems = navItems.length > 0 ? navItems : fallbackNavItems;
  const currentNavItem = useMemo(
    () => findCurrentNavItem(sidebarItems, pathname),
    [pathname, sidebarItems],
  );

  const resolvedUserName = currentUser?.full_name || userName;
  const resolvedUserRole = currentUser?.role_code || userRole;
  const currentPageTitle = pageTitle || currentNavItem?.itemName || "Tổng quan";
  const avatarText = createAvatarText(resolvedUserName);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div
      className={
        isSidebarCollapsed
          ? `${styles.shell} ${styles.shellCollapsed}`
          : styles.shell
      }
    >
      <aside
        className={
          isSidebarCollapsed
            ? `${styles.sidebar} ${styles.sidebarCollapsed}`
            : styles.sidebar
        }
      >
        <div className={styles.brandBlock}>
          <button
            type="button"
            className={styles.brandMark}
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            PT
          </button>

          {!isSidebarCollapsed && (
            <div className={styles.brandContent}>
              <p className={styles.brandTitle}>{brandTitle}</p>
              <p className={styles.brandSubtitle}>{brandSubtitle}</p>
            </div>
          )}
        </div>

        <nav className={styles.navList} aria-label="Điều hướng theo vai trò">
          {sidebarItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              icon={item.icon}
              itemName={item.itemName}
              href={item.href}
              isActive={checkActivePath(pathname, item.href)}
              isCollapsed={isSidebarCollapsed}
            />
          ))}
        </nav>

        <div
          className={
            isSidebarCollapsed
              ? `${styles.sidebarFooter} ${styles.sidebarFooterCollapsed}`
              : styles.sidebarFooter
          }
        >
          <div className={styles.userAvatar}>{avatarText}</div>
          {!isSidebarCollapsed && (
            <div className={styles.userContent}>
              <p className={styles.userName}>{resolvedUserName}</p>
              <p className={styles.userRole}>{resolvedUserRole}</p>
            </div>
          )}
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topBar}>
          <div className={styles.topBarHeading}>
            <span className={styles.topBarBadge}>{topBarBadge}</span>
            <h1 className={styles.topBarTitle}>{currentPageTitle}</h1>
          </div>

          <button type="button" className="button secondary" onClick={handleLogout}>
            Đăng xuất
          </button>
        </header>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
