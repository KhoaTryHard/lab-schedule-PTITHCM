"use client";

import AppShell from "./AppShell";
import RoleGuard from "./RoleGuard";
import { getLayoutConfigByRole } from "../../lib/roleConfig";

export default function RoleLayout({ roleCode, allowedRoles, children }) {
  const config = getLayoutConfigByRole(roleCode);

  if (!config) {
    return <main style={{ padding: 24 }}>Vai trò không hợp lệ.</main>;
  }

  const resolvedAllowedRoles =
    Array.isArray(allowedRoles) && allowedRoles.length > 0
      ? allowedRoles
      : config.allowedRoles;

  return (
    <RoleGuard allowedRoles={resolvedAllowedRoles}>
      <AppShell
        roleCode={config.roleCode}
        navItems={config.navItems}
        brandTitle={config.brandTitle}
        brandSubtitle={config.brandSubtitle}
        userName={config.defaultUserName}
        userRole={config.defaultUserRole}
        topBarBadge={config.topBarBadge}
      >
        {children}
      </AppShell>
    </RoleGuard>
  );
}
