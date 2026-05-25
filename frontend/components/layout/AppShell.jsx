"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import SidebarNavItem from "./sidebarNavItem";
import { getUser } from "../../lib/authStorage";
import { LogoutButton } from "../common/buttonUI.jsx";

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

function normalizeRoleClassValue(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

function buildAppShellClassName(isCollapsed, roleCode) {
  return [
    "appShell",
    roleCode ? `appShellRole${roleCode}` : "",
    isCollapsed ? "appShellCollapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function AppShell({
  children,
  navItems = [],
  brandTitle = "PTIT HCM",
  brandSubtitle = "Lab Schedule",
  userName = "Người dùng",
  userRole = "Vai trò",
  roleCode = "",
  pageTitle,
  topBarBadge = "HỆ THỐNG",
}) {
  const pathname = usePathname();
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
  const shellRoleCode = normalizeRoleClassValue(
    currentUser?.role_code || roleCode || topBarBadge,
  );

  return (
    <div className={buildAppShellClassName(isSidebarCollapsed, shellRoleCode)}>
      <aside
        className={
          isSidebarCollapsed
            ? "appShellSidebar appShellSidebarCollapsed"
            : "appShellSidebar"
        }
      >
        <div className="appShellBrandBlock">
          <button
            type="button"
            className="appShellBrandMark"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={
              isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"
            }
          >
            PT
          </button>

          {!isSidebarCollapsed && (
            <div className="appShellBrandContent">
              <p className="appShellBrandTitle">{brandTitle}</p>
              <p className="appShellBrandSubtitle">{brandSubtitle}</p>
            </div>
          )}
        </div>

        <nav className="appShellNavList" aria-label="Điều hướng theo vai trò">
          {sidebarItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              icon={item.icon}
              itemName={item.itemName}
              href={item.href}
              badge={item.badge}
              isActive={currentNavItem?.href === item.href}
              isCollapsed={isSidebarCollapsed}
            />
          ))}
        </nav>

        <div
          className={
            isSidebarCollapsed
              ? "appShellSidebarFooter appShellSidebarFooterCollapsed"
              : "appShellSidebarFooter"
          }
        >
          <div className="appShellUserAvatar">{avatarText}</div>
          {!isSidebarCollapsed && (
            <div className="appShellUserContent">
              <p className="appShellUserName">{resolvedUserName}</p>
              <p className="appShellUserRole">{resolvedUserRole}</p>
            </div>
          )}
        </div>
      </aside>

      <div className="appShellWorkspace">
        <header className="appShellTopBar">
          <div className="appShellTopBarHeading">
            <span className="appShellTopBarBadge">{topBarBadge}</span>
            <h1 className="appShellTopBarTitle">{currentPageTitle}</h1>
          </div>

          <LogoutButton />
        </header>

        <main className="appShellMainContent">{children}</main>
      </div>
    </div>
  );
}
