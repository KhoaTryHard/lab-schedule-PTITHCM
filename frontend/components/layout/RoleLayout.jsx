"use client";

import AppShell from "./AppShell";
import RoleGuard from "./RoleGuard";
import { getLayoutConfigByRole } from "../../lib/roleConfig";

export default function RoleLayout({ roleCode, children }) {
  const config = getLayoutConfigByRole(roleCode);

  if (!config) {
    return <main style={{ padding: 24 }}>Vai trò không hợp lệ.</main>;
  }

  return (
    <RoleGuard allowedRoles={config.allowedRoles}>
      <AppShell
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
