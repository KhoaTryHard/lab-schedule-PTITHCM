"use client";

import { RefreshButton } from "./buttonUI.jsx";
import { useProfileBase } from "../../hooks/useProfileBase";

function getSafeValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

export default function UserOverview() {
  const { profile, isLoadingUser, userError, reloadProfile } = useProfileBase();

  const username = getSafeValue(profile.username);
  const roleName = getSafeValue(profile.roleName);

  const overviewItems = [
    {
      label: "Mã số",
      value: getSafeValue(profile.id),
    },
    {
      label: "Tên đăng nhập",
      value: username,
    },
    {
      label: "Họ và tên",
      value: getSafeValue(profile.fullName),
    },
    {
      label: "Email",
      value: getSafeValue(profile.email),
    },
  ];

  return (
    <div className="adminPageStack">
      <section className="accountOverviewCard">
        <div className="accountOverviewHeader">
          <div className="accountOverviewHeading">
            <p className="commonEyebrow">Thông tin tài khoản</p>
            <h2 className="commonTitle">Tổng quan {roleName}</h2>
            <p className="commonDescription">
              Thông tin {username} đang đăng nhập.
            </p>
          </div>

          <RefreshButton onClick={reloadProfile} disabled={isLoadingUser}>
            Đồng bộ hồ sơ
          </RefreshButton>
        </div>

        {userError ? (
          <div className="commonStateBox accountOverviewError" role="alert">
            <h3 className="commonStateTitle">Không thể tải hồ sơ</h3>
            <p className="commonStateText">{userError}</p>
          </div>
        ) : null}

        <div className="accountOverviewGrid">
          {overviewItems.map((item) => (
            <article className="accountOverviewItem" key={item.label}>
              <span className="accountOverviewLabel">{item.label}</span>
              <strong className="accountOverviewValue">
                {isLoadingUser ? "Đang tải..." : item.value}
              </strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
