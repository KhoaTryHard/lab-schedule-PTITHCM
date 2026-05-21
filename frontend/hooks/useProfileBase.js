"use client";

import { useEffect, useMemo, useState } from "react";

import { getMe } from "../services/authService";
import { ALIASES_NAME, normalizeRoleCode } from "../lib/roleConfig";

export function useProfileBase() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");

  async function loadCurrentUser() {
    try {
      setIsLoadingUser(true);
      setUserError("");

      const response = await getMe();
      const user = response?.data || null;

      setCurrentUser(user);
    } catch (error) {
      setUserError(error.message || "Không thể tải hồ sơ người dùng.");
    } finally {
      setIsLoadingUser(false);
    }
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const profile = useMemo(() => {
    const roleCode = normalizeRoleCode(currentUser?.role_code || "");
    const roleName = ALIASES_NAME[roleCode] || roleCode || "Chưa xác định";

    return {
      id: currentUser?.id || null,
      username: currentUser?.username || "",
      fullName: currentUser?.full_name || currentUser?.fullName || "",
      email: currentUser?.email || "",
      roleCode,
      roleName,
      rawUser: currentUser,
    };
  }, [currentUser]);

  return {
    currentUser,
    profile,
    isLoadingUser,
    userError,
    reloadProfile: loadCurrentUser,
  };
}
