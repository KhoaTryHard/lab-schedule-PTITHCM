"use client";

import { useProfileBase } from "../../hooks/useProfileBase";

export default function AdminPage() {
  const { profile, isLoadingUser, userError } = useProfileBase();

  return (
    <div className="page">
      <div className="grid">
        <section className="card">
          <h2>HỒ SƠ:              {isLoadingUser
              ? "Đang tải vai trò..."
              : userError
                ? "Không tải được vai trò"
                : profile.roleName}</h2>

          <p>
            Xin chào <strong>{profile.fullName || "Người dùng"}</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}