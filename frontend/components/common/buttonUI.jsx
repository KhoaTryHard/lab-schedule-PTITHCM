"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clearAuth } from "../../lib/authStorage";
import { logout } from "../../services/authService";

export function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export function getButtonClassName({
  tone = "primary",
  shape = "rounded",
  size = "md",
  width = "auto",
  active = false,
  className = "",
} = {}) {
  return joinClassNames(
    "buttonUI",
    `buttonUI--${tone}`,
    `buttonUI--${shape}`,
    `buttonUI--${size}`,
    width === "full" ? "buttonUI--full" : "",
    active ? "buttonUI--active" : "",
    className,
  );
}

export function ButtonUI({
  as: Component = "button",
  children,
  tone = "primary",
  shape = "rounded",
  size = "md",
  width = "auto",
  active = false,
  className = "",
  type = "button",
  ...componentProps
}) {
  const resolvedClassName = getButtonClassName({
    tone,
    shape,
    size,
    width,
    active,
    className,
  });

  if (Component === "button") {
    return (
      <button type={type} className={resolvedClassName} {...componentProps}>
        {children}
      </button>
    );
  }

  return (
    <Component className={resolvedClassName} {...componentProps}>
      {children}
    </Component>
  );
}

export const UiButton = ButtonUI;

export function LogoutButton({ label = "Đăng xuất", className = "" }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
    } catch {
      // Backend logout là stateless trong MVP.
      // Nếu API logout lỗi, frontend vẫn phải xóa token local để thoát phiên.
    } finally {
      clearAuth();
      router.replace("/login");
    }
  }

  return (
    <ButtonUI
      tone="primary"
      shape="rounded"
      className={joinClassNames("uiButtonLogout", className)}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "Đang đăng xuất..." : label}
    </ButtonUI>
  );
}

export function RefreshButton({
  children = "Làm mới",
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <ButtonUI
      tone="primary"
      shape="rounded"
      className={joinClassNames("uiButtonRefresh", className)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </ButtonUI>
  );
}
