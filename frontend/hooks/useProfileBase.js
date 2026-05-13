"use client";

import { useEffect, useMemo, useState } from "react";

import { getMe } from "../services/authService";

const ROLE_LABEL_MAP = {
  QTV: "Quản trị viên",
  CBDT: "Cán bộ đào tạo",
  GV: "Giảng viên",
  KTV: "Kỹ thuật viên",
  SV: "Sinh viên",
};

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
    const roleCode = currentUser?.role_code || "";
    const roleName = ROLE_LABEL_MAP[roleCode] || roleCode || "Chưa xác định";

    return {
      id: currentUser?.id || null,
      username: currentUser?.username || "",
      fullName: currentUser?.full_name || "",
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