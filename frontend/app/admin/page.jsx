"use client";

import { useProfileBase } from "../../hooks/useProfileBase";

export default function AdminPage() {
  const { profile, isLoadingUser, userError } = useProfileBase();

  return (
    <div className="page">
      <div className="grid grid-2">
        <section className="card">
          <h2>Hồ sơ cá nhân</h2>

          <h5>
            {isLoadingUser
              ? "Đang tải vai trò..."
              : userError
                ? "Không tải được vai trò"
                : profile.roleName}
          </h5>

          <p>
            Xin chào <strong>{profile.fullName || "Người dùng"}</strong>.
          </p>
        </section>

        <section className="card">
          <h2>Việc cần xử lý</h2>
          <p>
            Kiểm tra yêu cầu cấp quyền mới, đồng bộ dữ liệu nền và rà soát các
            thay đổi ảnh hưởng đến lịch thực hành.
          </p>
        </section>
      </div>
    </div>
  );
}