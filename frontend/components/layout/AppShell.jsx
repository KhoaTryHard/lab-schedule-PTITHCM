"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import SidebarNavItem from "./sidebarNavItem";
import { getUser } from "../../lib/authStorage";
import { LogoutButton } from "../common/buttonUI.jsx";

const fallbackNavItems = [
  { icon: "dashboard", itemName: "Tổng quan", href: "/admin" },
];

/**
 * Hàm nhận vào: fullName là họ tên người dùng.
 * Hàm xử lý: lấy tối đa 2 chữ cái cuối trong tên để làm avatar.
 * Hàm trả về: chuỗi viết tắt, ví dụ "Quản trị viên hệ thống" -> "HT".
 */
function createAvatarText(fullName) {
  if (!fullName) return "PT";

  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join("");
}

/**
 * Hàm nhận vào:
 * - pathname: đường dẫn hiện tại của trình duyệt.
 * - href: đường dẫn của một mục sidebar.
 * Hàm xử lý: kiểm tra href có khớp route hiện tại hoặc là route cha hay không.
 * Hàm trả về: true nếu href khớp, false nếu không khớp.
 */
function checkActivePath(pathname, href) {
  if (!href) return false;
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Hàm nhận vào: danh sách menu và pathname hiện tại.
 * Hàm xử lý: tìm menu khớp sâu nhất, ví dụ /admin/accounts ưu tiên hơn /admin.
 * Hàm trả về: object menu active duy nhất để tránh 2 mục sidebar cùng sáng màu.
 */
function findCurrentNavItem(navItems, pathname) {
  const matchedItems = navItems
    .filter((item) => checkActivePath(pathname, item.href))
    .sort((first, second) => second.href.length - first.href.length);

  return matchedItems[0] || navItems[0] || null;
}

/**
 * Component nhận vào:
 * - children: nội dung trang con cần render ở vùng main.
 * - navItems: danh sách menu sidebar theo vai trò.
 * - brandTitle, brandSubtitle: tiêu đề và mô tả sidebar.
 * - userName, userRole: thông tin mặc định khi localStorage chưa có user.
 * - pageTitle: tiêu đề ép cứng nếu trang cần override.
 * - topBarBadge: nhãn vai trò ở topbar.
 * Component xử lý: render layout sidebar/topbar/main và xác định active menu duy nhất.
 * Component trả về: JSX khung layout dùng chung cho Admin/CBDT/GV/KTV/SV.
 */
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

  return (
    <div
      className={
        isSidebarCollapsed
          ? "appShell appShellCollapsed"
          : "appShell"
      }
    >
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
            aria-label={isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
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
