"use client";

import { useProfileBase } from "../../hooks/useProfileBase";
import { RefreshButton } from "../../components/common/buttonUI.jsx";

function ProfileField({ label, value }) {
  return (
    <div className="card">
      <p className="roomSectionText">{label}</p>
      <h3 className="roomSectionTitle">{value || "—"}</h3>
    </div>
  );
}

export default function StudentOverviewPage() {
  const { profile, isLoadingUser, userError, reloadProfile } = useProfileBase();

  return (
    <div className="adminPageStack">
      <section className="card">
        <div className="roomFilterBar">
          <div className="roomFilterSummary">
            <h2 className="roomSectionTitle">Tổng quan sinh viên</h2>
            <p className="roomSectionText">
              Thông tin tài khoản được tải từ endpoint GET /api/auth/me.
            </p>
          </div>

          <RefreshButton onClick={reloadProfile} disabled={isLoadingUser}>
            Đồng bộ hồ sơ
          </RefreshButton>
        </div>

        {userError ? (
          <div className="commonStateBox" role="alert">
            <h3 className="commonStateTitle">Không thể tải hồ sơ</h3>
            <p className="commonStateText">{userError}</p>
          </div>
        ) : null}
      </section>

      <section className="summaryCardGrid">
        <ProfileField label="Họ tên" value={isLoadingUser ? "Đang tải..." : profile.fullName} />
        <ProfileField label="Tên đăng nhập" value={isLoadingUser ? "Đang tải..." : profile.username} />
        <ProfileField label="Email" value={isLoadingUser ? "Đang tải..." : profile.email} />
        <ProfileField label="Vai trò" value={isLoadingUser ? "Đang tải..." : `${profile.roleName} (${profile.roleCode})`} />
      </section>
    </div>
  );
}
