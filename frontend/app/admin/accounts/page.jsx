"use client";

import { useMemo, useState } from "react";

import { CardUI, UploadCard } from "../../../components/common/cardUI.jsx";
import {
  UsersIcon,
  AdminIcon,
  AcademicIcon,
  LecturerIcon,
  TechnicianIcon,
  StudentIcon,
} from "../../../components/systemIcon.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import FilterSearchToolbar from "../../../components/common/FilterSearchToolbar.jsx";
import { RefreshButton } from "../../../components/common/buttonUI.jsx";

// Mảng dữ liệu mock cho danh sách tài khoản, giữ field gần bảng users để nối API sau dễ hơn.
const accountMockItems = [
  {
    id: 1,
    code: "ADM001",
    lastName: "Nguyễn Văn",
    firstName: "An",
    email: "admin01@ptithcm.edu.vn",
    role: "Admin",
    status: "Hoạt động",
  },
  {
    id: 2,
    code: "ADM002",
    lastName: "Trần Thị",
    firstName: "Linh",
    email: "admin02@ptithcm.edu.vn",
    role: "Admin",
    status: "Hoạt động",
  },
  {
    id: 3,
    code: "CB001",
    lastName: "Phạm Minh",
    firstName: "Đào Tạo",
    email: "cbdt01@ptithcm.edu.vn",
    role: "Cán bộ đào tạo",
    status: "Hoạt động",
  },
  {
    id: 4,
    code: "KTV001",
    lastName: "Lê Quốc",
    firstName: "Bảo",
    email: "ktv01@ptithcm.edu.vn",
    role: "Kỹ thuật viên",
    status: "Hoạt động",
  },
  {
    id: 5,
    code: "GV001",
    lastName: "Ngô Thanh",
    firstName: "Giảng",
    email: "gv01@ptithcm.edu.vn",
    role: "Giảng viên",
    status: "Bị khóa",
  },
  {
    id: 6,
    code: "GV002",
    lastName: "Đặng Bảo",
    firstName: "Ngọc",
    email: "gv02@ptithcm.edu.vn",
    role: "Giảng viên",
    status: "Hoạt động",
  },
  {
    id: 7,
    code: "SV001",
    lastName: "Phan Hải",
    firstName: "Nam",
    email: "sv01@ptithcm.edu.vn",
    role: "Sinh viên",
    status: "Ngừng hoạt động",
  },
  {
    id: 8,
    code: "SV002",
    lastName: "Trương Gia",
    firstName: "Hân",
    email: "sv02@ptithcm.edu.vn",
    role: "Sinh viên",
    status: "Hoạt động",
  },
];

// Mảng tab vai trò để truyền vào FilterSearchToolbar, có thể thêm/xóa nút mà không sửa component.
const accountRoleTabs = [
  { key: "all", label: "Tất cả" },
  { key: "Admin", label: "Admin" },
  { key: "Cán bộ đào tạo", label: "Cán bộ đào tạo" },
  { key: "Kỹ thuật viên", label: "Kỹ thuật viên" },
  { key: "Giảng viên", label: "Giảng viên" },
  { key: "Sinh viên", label: "Sinh viên" },
];

// Mảng thống kê tổng quan của trang tài khoản.
const accountSummaryItems = [
  { icon: UsersIcon, title: "Tổng tài khoản", value: 148 },
  { icon: AdminIcon, title: "Quản trị viên", value: 5 },
  { icon: AcademicIcon, title: "Cán bộ đào tạo", value: 12 },
  { icon: LecturerIcon, title: "Giảng viên", value: 18 },
  { icon: TechnicianIcon, title: "Kỹ thuật viên", value: 4 },
  { icon: StudentIcon, title: "Sinh viên", value: 109 },
];

// Mảng cấu hình thẻ upload tạo tài khoản theo từng vai trò.
const accountUploadItems = [
  { icon: AdminIcon, title: "Quản trị viên" },
  { icon: AcademicIcon, title: "Cán bộ đào tạo" },
  { icon: TechnicianIcon, title: "Kỹ thuật viên" },
  { icon: LecturerIcon, title: "Giảng viên" },
  { icon: StudentIcon, title: "Sinh viên" },
];

// Mảng trạng thái tài khoản để lọc ở thanh điều khiển phụ.
const accountStatusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "Hoạt động", label: "Hoạt động" },
  { value: "Bị khóa", label: "Bị khóa" },
  { value: "Ngừng hoạt động", label: "Ngừng hoạt động" },
];

/**
 * Hàm nhận vào: value là chuỗi cần chuẩn hóa.
 * Hàm xử lý: loại bỏ dấu tiếng Việt và đưa về chữ thường để tìm kiếm mềm.
 * Hàm trả về: chuỗi đã chuẩn hóa.
 */
function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Hàm nhận vào: status là trạng thái tài khoản.
 * Hàm xử lý: ánh xạ trạng thái sang badge màu phù hợp.
 * Hàm trả về: JSX badge trạng thái trong bảng.
 */
function buildAccountStatusBadge(status) {
  const toneClassMap = {
    "Hoạt động": "roomStatusPositive",
    "Bị khóa": "roomStatusDanger",
    "Ngừng hoạt động": "roomStatusWarning",
  };

  const toneClassName = toneClassMap[status] || "roomStatusNeutral";

  return <span className={`roomStatusBadge ${toneClassName}`}>{status}</span>;
}

/**
 * Component nhận vào: không nhận props.
 * Component xử lý: render trang quản lý tài khoản gồm thống kê, upload, toolbar lọc/tìm kiếm và bảng dữ liệu.
 * Component trả về: JSX hoàn chỉnh cho route /admin/accounts.
 */
export default function AccountsPage() {
  const [activeRole, setActiveRole] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAccountItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return accountMockItems.filter((accountItem) => {
      const searchTarget = normalizeText(
        [
          accountItem.code,
          accountItem.lastName,
          accountItem.firstName,
          accountItem.email,
          accountItem.role,
          accountItem.status,
        ].join(" "),
      );

      const matchedRole =
        activeRole === "all" || accountItem.role === activeRole;
      const matchedStatus =
        statusFilter === "all" || accountItem.status === statusFilter;
      const matchedKeyword =
        !normalizedKeyword || searchTarget.includes(normalizedKeyword);

      return matchedRole && matchedStatus && matchedKeyword;
    });
  }, [activeRole, searchKeyword, statusFilter]);

  const accountColumns = useMemo(
    () => [
      { key: "code", label: "Mã" },
      { key: "lastName", label: "Họ" },
      { key: "firstName", label: "Tên" },
      { key: "email", label: "Email" },
      { key: "status", label: "Trạng thái" },
    ],
    [],
  );

  const accountRows = useMemo(
    () =>
      filteredAccountItems.map((accountItem) => ({
        id: accountItem.id,
        code: accountItem.code,
        lastName: accountItem.lastName,
        firstName: accountItem.firstName,
        email: accountItem.email,
        status: buildAccountStatusBadge(accountItem.status),
      })),
    [filteredAccountItems],
  );

  /**
   * Hàm nhận vào: không nhận tham số.
   * Hàm xử lý: đưa toàn bộ bộ lọc tài khoản về trạng thái mặc định.
   * Hàm trả về: không trả về dữ liệu.
   */
  function handleResetFilters() {
    setActiveRole("all");
    setSearchKeyword("");
    setStatusFilter("all");
  }

  return (
    <div className="adminPageStack">
      <section className="card summaryCardGrid">
        {accountSummaryItems.map((summaryItem) => (
          <CardUI
            key={summaryItem.title}
            icon={summaryItem.icon}
            title={summaryItem.title}
            number={summaryItem.value}
          />
        ))}
      </section>

      <section className="card managementAccount">
        <SectionLayout
          title="TẠO TÀI KHOẢN"
          message="Chuẩn bị biểu mẫu Excel theo từng vai trò để nhập nhanh tài khoản cho cán bộ và sinh viên."
          direction={0}
          className="card accountUploadSection"
        >
          {accountUploadItems.map((uploadItem) => (
            <UploadCard
              key={uploadItem.title}
              icon={uploadItem.icon}
              title={uploadItem.title}
              fileLabel="File excel"
              buttonLabel="Tải"
            />
          ))}
        </SectionLayout>

        <div className="card accountsView accountPrimaryPanel">
          <FilterSearchToolbar
            tabs={accountRoleTabs}
            activeKey={activeRole}
            onTabChange={setActiveRole}
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            searchPlaceholder="Tìm theo mã, họ tên hoặc email..."
            searchButtonLabel="Tìm kiếm"
          />

          <div className="card option roomFilterBar accountFilterBar">
            <div className="roomFilterSummary">
              <h3 className="roomSectionTitle">Danh sách tài khoản</h3>
              <p className="roomSectionText">
                Hiển thị {accountRows.length} tài khoản theo bộ lọc hiện tại.
              </p>
            </div>

            <div className="roomFilterControls">
              <RefreshButton onClick={handleResetFilters}>
                Làm mới
              </RefreshButton>

              <select
                className="select roomStatusSelect"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {accountStatusOptions.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card roomTableCard">
            {accountRows.length > 0 ? (
              <DataTable columns={accountColumns} rows={accountRows} />
            ) : (
              <div className="roomEmptyState">
                <h4>Chưa có dữ liệu phù hợp</h4>
                <p>
                  Không tìm thấy tài khoản phù hợp với vai trò, trạng thái hoặc
                  từ khóa hiện tại.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
