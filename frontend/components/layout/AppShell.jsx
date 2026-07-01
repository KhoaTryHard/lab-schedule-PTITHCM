"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import SidebarNavItem from "./sidebarNavItem";
import { getUser } from "../../lib/authStorage";
import { changePassword } from "../../services/authService";
import { ButtonUI, LogoutButton } from "../common/buttonUI.jsx";

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

const CHANGE_PASSWORD_INITIAL_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function validateChangePasswordForm(form) {
  if (
    !form.currentPassword.trim() ||
    !form.newPassword.trim() ||
    !form.confirmPassword.trim()
  ) {
    return "Vui lòng nhập đầy đủ thông tin đổi mật khẩu.";
  }

  if (form.newPassword !== form.confirmPassword) {
    return "Mật khẩu mới và xác nhận mật khẩu không khớp.";
  }

  if (form.newPassword === form.currentPassword) {
    return "Mật khẩu mới không được trùng mật khẩu hiện tại.";
  }

  if (form.newPassword.length < 6 || form.newPassword.length > 72) {
    return "Mật khẩu mới phải có từ 6 đến 72 ký tự.";
  }

  return "";
}

function ChangePasswordDialog({ isOpen, onClose }) {
  const [form, setForm] = useState(CHANGE_PASSWORD_INITIAL_FORM);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeAfterSuccessTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeAfterSuccessTimerRef.current) {
        clearTimeout(closeAfterSuccessTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  function clearSuccessCloseTimer() {
    if (closeAfterSuccessTimerRef.current) {
      clearTimeout(closeAfterSuccessTimerRef.current);
      closeAfterSuccessTimerRef.current = null;
    }
  }

  function updateField(field, value) {
    clearSuccessCloseTimer();
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setMessage(null);
  }

  function handleClose() {
    if (isSubmitting) return;

    clearSuccessCloseTimer();
    setForm(CHANGE_PASSWORD_INITIAL_FORM);
    setMessage(null);
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationMessage = validateChangePasswordForm(form);
    if (validationMessage) {
      setMessage({ type: "error", text: validationMessage });
      return;
    }

    try {
      setIsSubmitting(true);
      clearSuccessCloseTimer();
      setMessage(null);

      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      setForm(CHANGE_PASSWORD_INITIAL_FORM);
      setMessage({ type: "success", text: "Đổi mật khẩu thành công." });

      closeAfterSuccessTimerRef.current = setTimeout(() => {
        closeAfterSuccessTimerRef.current = null;
        setMessage(null);
        onClose();
      }, 1200);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Không thể đổi mật khẩu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modalOverlay" role="presentation">
      <section
        className="modalPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        <div className="modalHeader">
          <div>
            <p className="modalEyebrow">Tài khoản</p>
            <h3 id="change-password-title" className="modalTitle">
              Đổi mật khẩu
            </h3>
          </div>
          <button
            type="button"
            className="modalCloseButton"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modalBody">
            {message ? (
              <p
                className={`academicAlert academicAlert--${message.type}`}
                role={message.type === "error" ? "alert" : "status"}
              >
                {message.text}
              </p>
            ) : null}

            <label className="modalFieldCard">
              Mật khẩu hiện tại
              <input
                className="input"
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  updateField("currentPassword", event.target.value)
                }
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </label>

            <label className="modalFieldCard">
              Mật khẩu mới
              <input
                className="input"
                type="password"
                value={form.newPassword}
                onChange={(event) =>
                  updateField("newPassword", event.target.value)
                }
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </label>

            <label className="modalFieldCard">
              Xác nhận mật khẩu mới
              <input
                className="input"
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  updateField("confirmPassword", event.target.value)
                }
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </label>
          </div>

          <div className="modalActions">
            <ButtonUI
              tone="outline"
              className="dangerOutlineButton"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </ButtonUI>
            <ButtonUI type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu mật khẩu"}
            </ButtonUI>
          </div>
        </form>
      </section>
    </div>
  );
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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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

          <div className="appShellTopBarActions">
            <ButtonUI
              tone="outline"
              shape="rounded"
              onClick={() => setIsChangePasswordOpen(true)}
            >
              Đổi mật khẩu
            </ButtonUI>
            <LogoutButton />
          </div>
        </header>

        <main className="appShellMainContent">{children}</main>
      </div>
      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
