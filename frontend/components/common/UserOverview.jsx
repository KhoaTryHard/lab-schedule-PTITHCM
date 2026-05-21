"use client";

import { RefreshButton } from "./buttonUI.jsx";
import { useProfileBase } from "../../hooks/useProfileBase";

const PRIORITY_FIELD_KEYS = [
  "id",
  "username",
  "full_name",
  "fullName",
  "email",
  "role_code",
  "roleCode",
  "student_code",
  "studentCode",
  "lecturer_code",
  "lecturerCode",
  "employee_code",
  "employeeCode",
  "staff_code",
  "staffCode",
  "department",
  "department_name",
  "departmentName",
  "faculty",
  "faculty_name",
  "facultyName",
  "unit",
  "unit_name",
  "unitName",
];

const HIDDEN_FIELD_KEYS = new Set([
  "password",
  "password_hash",
  "token",
  "access_token",
  "refresh_token",
  "rawUser",
]);

const FIELD_LABEL_MAP = {
  id: "Mã số",
  username: "Tên đăng nhập",
  full_name: "Họ tên",
  fullName: "Họ tên",
  email: "Email",
  role_code: "Vai trò",
  roleCode: "Vai trò",
  student_code: "Mã sinh viên",
  studentCode: "Mã sinh viên",
  lecturer_code: "Mã giảng viên",
  lecturerCode: "Mã giảng viên",
  employee_code: "Mã nhân sự",
  employeeCode: "Mã nhân sự",
  staff_code: "Mã cán bộ",
  staffCode: "Mã cán bộ",
  department: "Đơn vị",
  department_name: "Đơn vị",
  departmentName: "Đơn vị",
  faculty: "Khoa",
  faculty_name: "Khoa",
  facultyName: "Khoa",
  unit: "Đơn vị",
  unit_name: "Đơn vị",
  unitName: "Đơn vị",
  created_at: "Ngày tạo",
  createdAt: "Ngày tạo",
  updated_at: "Cập nhật lần cuối",
  updatedAt: "Cập nhật lần cuối",
};

function formatFieldLabel(key) {
  if (FIELD_LABEL_MAP[key]) {
    return FIELD_LABEL_MAP[key];
  }

  return String(key)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/^./, (firstChar) => firstChar.toUpperCase());
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatFieldValue(key, value, profile) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (key === "role_code" || key === "roleCode") {
    return `${profile.roleName} (${profile.roleCode})`;
  }

  if (
    key === "created_at" ||
    key === "updated_at" ||
    key === "createdAt" ||
    key === "updatedAt"
  ) {
    return formatDateTime(value);
  }

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function normalizeProfileFields(rawUser, profile) {
  const safeRawUser = rawUser || {};
  const seenKeys = new Set();
  const fields = [];

  function addField(key) {
    if (
      !key ||
      seenKeys.has(key) ||
      HIDDEN_FIELD_KEYS.has(key) ||
      !(key in safeRawUser)
    ) {
      return;
    }

    seenKeys.add(key);

    fields.push({
      key,
      label: formatFieldLabel(key),
      value: formatFieldValue(key, safeRawUser[key], profile),
    });
  }

  PRIORITY_FIELD_KEYS.forEach(addField);
  Object.keys(safeRawUser).forEach(addField);

  if (
    !fields.some(
      (field) => field.key === "full_name" || field.key === "fullName",
    )
  ) {
    fields.unshift({
      key: "profile_full_name",
      label: "Họ tên",
      value: profile.fullName || "—",
    });
  }

  if (!fields.some((field) => field.key === "email")) {
    fields.push({
      key: "profile_email",
      label: "Email",
      value: profile.email || "—",
    });
  }

  if (
    !fields.some(
      (field) => field.key === "role_code" || field.key === "roleCode",
    )
  ) {
    fields.push({
      key: "profile_role",
      label: "Vai trò",
      value: `${profile.roleName} (${profile.roleCode || "—"})`,
    });
  }

  return fields;
}

function ProfileInfoCard({ label, value, highlight = false }) {
  return (
    <article
      className={
        highlight
          ? "profileInfoCard profileInfoCardHighlight"
          : "profileInfoCard"
      }
    >
      <p className="profileInfoLabel">{label}</p>
      <h3 className="profileInfoValue">{value || "—"}</h3>
    </article>
  );
}

export default function UserOverview({ title = "Tổng quan tài khoản" }) {
  const { profile, currentUser, isLoadingUser, userError, reloadProfile } =
    useProfileBase();

  const fields = normalizeProfileFields(currentUser, profile);
  const primaryFields = fields.slice(0, 4);
  const detailFields = fields.slice(4);

  return (
    <div className="adminPageStack">
      <section className="commonPageHeader">
        <div className="commonPageHeaderBody">
          <p className="commonEyebrow">Thông tin tài khoản</p>
          <h2 className="commonTitle">{title}</h2>
          <p className="commonDescription">
            Thông tin cá nhân và vai trò hiện tại của tài khoản đang đăng nhập.
          </p>
        </div>

        <RefreshButton onClick={reloadProfile} disabled={isLoadingUser}>
          Đồng bộ hồ sơ
        </RefreshButton>
      </section>

      {userError ? (
        <div className="commonStateBox" role="alert">
          <h3 className="commonStateTitle">Không thể tải hồ sơ</h3>
          <p className="commonStateText">{userError}</p>
        </div>
      ) : null}

      <section className="profileInfoGrid">
        {primaryFields.map((field, index) => (
          <ProfileInfoCard
            key={field.key}
            label={field.label}
            value={isLoadingUser ? "Đang tải..." : field.value}
            highlight={index === 0}
          />
        ))}
      </section>

      {detailFields.length > 0 ? (
        <section className="commonPanel">
          <div className="profileDetailHeader">
            <h3 className="profileDetailTitle">Chi tiết hồ sơ</h3>
          </div>

          <div className="profileDetailGrid">
            {detailFields.map((field) => (
              <div className="profileDetailItem" key={field.key}>
                <span className="profileDetailLabel">{field.label}</span>
                <strong className="profileDetailValue">
                  {isLoadingUser ? "Đang tải..." : field.value}
                </strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
