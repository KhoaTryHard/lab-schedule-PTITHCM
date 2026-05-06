"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

import styles from "./appShell.module.css";
import SidebarNavItem from "./sidebarNavItem";

// Mảng menu mặc định để giữ ổn định các route cũ đang dùng AppShell.
const defaultNavItems = [
  { icon: "dashboard", itemName: "Phòng máy", href: "/admin/rooms" },
  {
    icon: "person",
    itemName: "Yêu cầu xếp lịch",
    href: "/academic/schedule-requests",
  },
  {
    icon: "chart",
    itemName: "Xếp lịch tự động",
    href: "/academic/auto-arrange",
  },
  { icon: "school", itemName: "Lịch thực hành", href: "/academic/schedules" },
  {
    icon: "search",
    itemName: "Lịch giảng viên",
    href: "/lecturer/my-schedule",
  },
  {
    icon: "equipment",
    itemName: "Lịch kỹ thuật viên",
    href: "/technician/room-schedule",
  },
  {
    icon: "settings",
    itemName: "Lịch sinh viên",
    href: "/student/my-schedule",
  },
];

/**
 * Hàm nhận vào: fullName là tên đầy đủ của người dùng.
 * Hàm xử lý: tách các từ đầu tiên trong tên để tạo chữ viết tắt cho avatar.
 * Hàm trả về: chuỗi gồm tối đa 2 ký tự viết hoa, dùng hiển thị trong avatar.
 */
function createAvatarText(fullName) {
  if (!fullName) {
    return "AD";
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join("");
}

/**
 * Hàm nhận vào: pathname là đường dẫn hiện tại, href là đường dẫn của mục menu.
 * Hàm xử lý: kiểm tra mục menu có đang được chọn hay không.
 * Hàm trả về: true nếu mục đang active, ngược lại trả về false.
 */
function checkActivePath(pathname, href) {
  if (!href) {
    return false;
  }

  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Hàm nhận vào: navItems là danh sách menu, pathname là đường dẫn hiện tại.
 * Hàm xử lý: tìm mục menu phù hợp nhất với route đang mở.
 * Hàm trả về: object menu đang active, nếu không có thì trả về phần tử đầu tiên.
 */
function findCurrentNavItem(navItems, pathname) {
  const matchedItem = navItems.find((item) =>
    checkActivePath(pathname, item.href),
  );

  return matchedItem || navItems[0] || null;
}

/**
 * Hàm nhận vào:
 * - children là nội dung trang sẽ hiển thị trong khu vực chính.
 * - navItems là mảng menu sidebar.
 * - brandTitle là tên hệ thống ở đầu sidebar.
 * - brandSubtitle là mô tả vai trò ngay dưới tên hệ thống.
 * - userName là tên người dùng ở cuối sidebar.
 * - userRole là vai trò người dùng ở cuối sidebar.
 * - pageTitle là tiêu đề trang muốn ép hiển thị thủ công nếu cần.
 * Hàm xử lý: dựng layout có sidebar trái, top bar và vùng nội dung bên phải.
 * Hàm trả về: JSX của toàn bộ khung làm việc.
 */
export default function AppShell({
  children,
  navItems = [],
  brandTitle = "PTIT HCM Management System",
  brandSubtitle = "Không gian làm việc",
  userName = "Admin PTIT HCM",
  userRole = "Quản trị viên",
  pageTitle,
}) {
  const pathname = usePathname();
  const sidebarItems = navItems.length > 0 ? navItems : defaultNavItems;
  const currentNavItem = findCurrentNavItem(sidebarItems, pathname);
  const currentPageTitle = pageTitle || currentNavItem?.itemName || "Tổng quan";
  const avatarText = createAvatarText(userName);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
            aria-label={
              isSidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"
            }
            aria-expanded={!isSidebarCollapsed}
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

        <nav className={styles.navList} aria-label="Điều hướng vai trò">
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
              <p className={styles.userName}>{userName}</p>
              <p className={styles.userRole}>{userRole}</p>
            </div>
          )}
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topBar}>
          <div className={styles.topBarHeading}>
            <span className={styles.topBarBadge}>BẢNG ĐIỀU KHIỂN QUẢN TRỊ</span>
            <h1 className={styles.topBarTitle}>{currentPageTitle}</h1>
          </div>
        </header>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
