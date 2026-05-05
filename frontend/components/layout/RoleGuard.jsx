"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "../../services/authService";
import { clearAuth, getToken, saveUser } from "../../lib/authStorage";

/**
 * Hàm nhận vào:
 * - children: nội dung route được bảo vệ.
 * - allowedRoles: danh sách vai trò được phép truy cập route.
 * Hàm xử lý: kiểm tra token, gọi /auth/me, chặn user chưa đăng nhập hoặc sai quyền.
 * Hàm trả về: children nếu hợp lệ, loading state nếu đang kiểm tra.
 */
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

        if (!currentUser?.role_code) {
          clearAuth();
          router.replace("/login");
          return;
        }

        saveUser(currentUser);

        if (!allowedRoles.includes(currentUser.role_code)) {
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
    return (
      <main style={{ padding: 24 }}>
        <p>Đang kiểm tra quyền truy cập...</p>
      </main>
    );
  }

  return children;
}
