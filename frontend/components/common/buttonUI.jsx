"use client";

import { useRouter } from "next/navigation";

import { clearAuth } from "../../lib/authStorage";

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

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <ButtonUI
      tone="dark"
      shape="rounded"
      className={joinClassNames("uiButtonLogout", className)}
      onClick={handleLogout}
    >
      {label}
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
      tone="secondary"
      shape="rounded"
      className={joinClassNames("uiButtonRefresh", className)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </ButtonUI>
  );
}
