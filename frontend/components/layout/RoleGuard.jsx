"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "../../services/authService";
import { clearAuth, getToken, saveUser } from "../../lib/authStorage";
import { normalizeRoleCode } from "../../lib/roleConfig";
import { LoadingState } from "../common/UiState";

export default function RoleGuard({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const allowedRoleKey = useMemo(() => allowedRoles.join("|"), [allowedRoles]);

  useEffect(() => {
    let isMounted = true;

    async function verifyUser() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await getMe();
        const currentUser = response?.data;
        const currentRole = normalizeRoleCode(currentUser?.role_code);
        const normalizedAllowedRoles = allowedRoles.map(normalizeRoleCode);

        if (!currentRole) {
          clearAuth();
          router.replace("/login");
          return;
        }

        saveUser({ ...currentUser, role_code: currentRole });

        if (!normalizedAllowedRoles.includes(currentRole)) {
          router.replace("/unauthorized");
          return;
        }

        if (isMounted) {
          setIsChecking(false);
        }
      } catch {
        clearAuth();
        router.replace("/login");
      }
    }

    verifyUser();

    return () => {
      isMounted = false;
    };
  }, [allowedRoleKey, allowedRoles, router]);

  if (isChecking) {
    return <LoadingState title="Đang kiểm tra quyền truy cập..." />;
  }

  return children;
}
