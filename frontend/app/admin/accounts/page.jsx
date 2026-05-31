"use client";

import { useEffect, useMemo, useState } from "react";

import { CardUI, UploadCard } from "../../../components/common/cardUI.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import FilterSearchToolbar from "../../../components/common/FilterSearchToolbar.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import { ButtonUI, RefreshButton } from "../../../components/common/buttonUI.jsx";
import {
  AcademicIcon,
  AdminIcon,
  LecturerIcon,
  StudentIcon,
  TechnicianIcon,
  UsersIcon,
} from "../../../components/systemIcon.jsx";
import {
  createAdminAccount,
  listAdminAccounts,
  updateAdminAccount,
} from "../../../services/adminService";

const ROLE_LABELS = {
  QTV: "Quản trị viên",
  CBDT: "Cán bộ đào tạo",
  GV: "Giảng viên",
  KTV: "Kỹ thuật viên",
  SV: "Sinh viên",
};

const STATUS_LABELS = {
  active: "Hoạt động",
  locked: "Bị khóa",
  inactive: "Ngừng hoạt động",
};

const accountRoleTabs = [
  { key: "all", label: "Tất cả" },
  { key: "QTV", label: "QTV" },
  { key: "CBDT", label: "CBDT" },
  { key: "GV", label: "GV" },
  { key: "KTV", label: "KTV" },
  { key: "SV", label: "SV" },
];

const accountStatusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Hoạt động" },
  { value: "locked", label: "Bị khóa" },
  { value: "inactive", label: "Ngừng hoạt động" },
];

const accountUploadItems = [
  {
    icon: AdminIcon,
    title: "Quản trị viên",
    templateHref: "/api/template-download/createaccounts/admin",
    templateDownloadName: "createadmin.xlsx",
  },
  {
    icon: AcademicIcon,
    title: "Cán bộ đào tạo",
    templateHref: "/api/template-download/createaccounts/academic",
    templateDownloadName: "createacademic.xlsx",
  },
  {
    icon: TechnicianIcon,
    title: "Kỹ thuật viên",
    templateHref: "/api/template-download/createaccounts/technician",
    templateDownloadName: "createtechnician.xlsx",
  },
  {
    icon: LecturerIcon,
    title: "Giảng viên",
    templateHref: "/api/template-download/createaccounts/lecturer",
    templateDownloadName: "createlecturer.xlsx",
  },
  {
    icon: StudentIcon,
    title: "Sinh viên",
    templateHref: "/api/template-download/createaccounts/student",
    templateDownloadName: "createstudent.xlsx",
  },
];

const EMPTY_ACCOUNT_FORM = {
  username: "",
  full_name: "",
  email: "",
  phone_number: "",
  role_code: "GV",
  account_status: "active",
  password: "",
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildAccountStatusBadge(status) {
  const label = STATUS_LABELS[status] || status || "Không rõ";
  const toneClassMap = {
    active: "roomStatusPositive",
    locked: "roomStatusDanger",
    inactive: "roomStatusWarning",
  };

  return (
    <span className={`roomStatusBadge ${toneClassMap[status] || "roomStatusNeutral"}`}>
      {label}
    </span>
  );
}

function formatRoleLabel(roleCode) {
  return ROLE_LABELS[roleCode] || roleCode || "Không rõ";
}

function AccountDialog({
  account,
  form,
  error,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!form) return null;

  const isEditing = Boolean(account?.id);

  return (
    <div className="modalOverlay" role="presentation">
      <section className="modalPanel" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
        <div className="modalHeader">
          <div>
            <p className="modalEyebrow">Quản lý tài khoản</p>
            <h3 id="account-dialog-title" className="modalTitle">
              {isEditing ? `Cập nhật ${account.username}` : "Tạo tài khoản"}
            </h3>
          </div>
          <button
            type="button"
            className="modalCloseButton"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Đóng popup"
          >
            x
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modalBody">
            {error ? <p className="academicAlert academicAlert--error">{error}</p> : null}

            <label className="label">
              Tên đăng nhập
              <input
                className="input"
                value={form.username}
                onChange={(event) => onChange("username", event.target.value)}
                disabled={isSaving || isEditing}
                required
              />
            </label>
            <label className="label">
              Họ tên
              <input
                className="input"
                value={form.full_name}
                onChange={(event) => onChange("full_name", event.target.value)}
                disabled={isSaving}
                required
              />
            </label>
            <label className="label">
              Email
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                disabled={isSaving}
                required
              />
            </label>
            <label className="label">
              Số điện thoại
              <input
                className="input"
                value={form.phone_number}
                onChange={(event) => onChange("phone_number", event.target.value)}
                disabled={isSaving}
              />
            </label>
            <label className="label">
              Vai trò
              <select
                className="select"
                value={form.role_code}
                onChange={(event) => onChange("role_code", event.target.value)}
                disabled={isSaving}
              >
                {Object.keys(ROLE_LABELS).map((roleCode) => (
                  <option key={roleCode} value={roleCode}>
                    {formatRoleLabel(roleCode)}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              Mật khẩu {isEditing ? "(để trống nếu giữ nguyên)" : ""}
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(event) => onChange("password", event.target.value)}
                disabled={isSaving}
                required={!isEditing}
              />
            </label>
          </div>

          <div className="modalActions">
            <ButtonUI tone="secondary" onClick={onClose} disabled={isSaving}>
              Hủy
            </ButtonUI>
            <ButtonUI type="submit" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu tài khoản"}
            </ButtonUI>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [activeRole, setActiveRole] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountForm, setAccountForm] = useState(null);
  const [dialogError, setDialogError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadAccounts() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await listAdminAccounts();
      setAccounts(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(error.message || "Không thể tải danh sách tài khoản từ API.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccountItems = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return accounts.filter((accountItem) => {
      const searchTarget = normalizeText(
        [
          accountItem.username,
          accountItem.full_name,
          accountItem.email,
          accountItem.phone_number,
          accountItem.role_code,
          formatRoleLabel(accountItem.role_code),
          STATUS_LABELS[accountItem.account_status],
        ].join(" "),
      );

      const matchedRole =
        activeRole === "all" || accountItem.role_code === activeRole;
      const matchedStatus =
        statusFilter === "all" || accountItem.account_status === statusFilter;
      const matchedKeyword =
        !normalizedKeyword || searchTarget.includes(normalizedKeyword);

      return matchedRole && matchedStatus && matchedKeyword;
    });
  }, [accounts, activeRole, searchKeyword, statusFilter]);

  const accountSummaryItems = useMemo(
    () => [
      { icon: UsersIcon, title: "Tổng tài khoản", value: accounts.length },
      {
        icon: AdminIcon,
        title: "Quản trị viên",
        value: accounts.filter((item) => item.role_code === "QTV").length,
      },
      {
        icon: AcademicIcon,
        title: "Cán bộ đào tạo",
        value: accounts.filter((item) => item.role_code === "CBDT").length,
      },
      {
        icon: LecturerIcon,
        title: "Giảng viên",
        value: accounts.filter((item) => item.role_code === "GV").length,
      },
      {
        icon: TechnicianIcon,
        title: "Kỹ thuật viên",
        value: accounts.filter((item) => item.role_code === "KTV").length,
      },
      {
        icon: StudentIcon,
        title: "Sinh viên",
        value: accounts.filter((item) => item.role_code === "SV").length,
      },
    ],
    [accounts],
  );

  const accountColumns = useMemo(
    () => [
      { key: "username", label: "Username" },
      { key: "full_name", label: "Họ tên" },
      { key: "email", label: "Email" },
      { key: "role", label: "Vai trò" },
      { key: "status", label: "Trạng thái" },
      { key: "actions", label: "Thao tác" },
    ],
    [],
  );

  const accountRows = filteredAccountItems.map((accountItem) => ({
    id: accountItem.id,
    username: accountItem.username,
    full_name: accountItem.full_name,
    email: accountItem.email || "—",
    role: formatRoleLabel(accountItem.role_code),
    status: buildAccountStatusBadge(accountItem.account_status),
    actions: (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <ButtonUI size="sm" tone="secondary" onClick={() => openEditDialog(accountItem)}>
          Sửa
        </ButtonUI>
        <ButtonUI
          size="sm"
          tone={accountItem.account_status === "active" ? "danger" : "primary"}
          onClick={() =>
            handleAccountStatusChange(
              accountItem,
              accountItem.account_status === "active" ? "locked" : "active",
            )
          }
        >
          {accountItem.account_status === "active" ? "Khóa" : "Mở khóa"}
        </ButtonUI>
      </div>
    ),
  }));

  function handleResetFilters() {
    setActiveRole("all");
    setSearchKeyword("");
    setStatusFilter("all");
    loadAccounts();
  }

  function closeAccountDialog() {
    if (isSaving) return;
    setSelectedAccount(null);
    setAccountForm(null);
    setDialogError("");
  }

  function openCreateDialog() {
    setSelectedAccount(null);
    setAccountForm({ ...EMPTY_ACCOUNT_FORM });
    setDialogError("");
  }

  function openEditDialog(account) {
    setSelectedAccount(account);
    setAccountForm({
      username: account.username || "",
      full_name: account.full_name || "",
      email: account.email || "",
      phone_number: account.phone_number || "",
      role_code: account.role_code || "GV",
      account_status: account.account_status || "active",
      password: "",
    });
    setDialogError("");
  }

  function updateAccountForm(field, value) {
    setAccountForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function saveAccount(event) {
    event.preventDefault();

    if (!accountForm?.email.trim()) {
      setDialogError("Email là bắt buộc.");
      return;
    }

    const payload = {
      full_name: accountForm.full_name.trim(),
      email: accountForm.email.trim(),
      phone_number: accountForm.phone_number.trim() || null,
      role_code: accountForm.role_code,
    };

    if (!selectedAccount) {
      payload.username = accountForm.username.trim();
      payload.password = accountForm.password;
      payload.account_status = accountForm.account_status;
    } else if (accountForm.password) {
      payload.password = accountForm.password;
    }

    try {
      setIsSaving(true);
      setDialogError("");

      if (selectedAccount) {
        await updateAdminAccount(selectedAccount.id, payload);
      } else {
        await createAdminAccount(payload);
      }

      setSelectedAccount(null);
      setAccountForm(null);
      await loadAccounts();
    } catch (error) {
      setDialogError(error.message || "Không thể lưu tài khoản.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAccountStatusChange(account, accountStatus) {
    const actionLabel = accountStatus === "active" ? "mở khóa" : "khóa";

    if (!window.confirm(`Xác nhận ${actionLabel} tài khoản ${account.username}?`)) {
      return;
    }

    try {
      setErrorMessage("");
      await updateAdminAccount(account.id, { account_status: accountStatus });
      await loadAccounts();
    } catch (error) {
      setErrorMessage(error.message || `Không thể ${actionLabel} tài khoản.`);
    }
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
          message="API tài khoản đã đọc dữ liệu thật từ MySQL; Excel import vẫn nằm ngoài phạm vi #48."
          direction={0}
          className="card accountUploadSection"
        >
          {accountUploadItems.map((uploadItem) => (
            <UploadCard
              key={uploadItem.title}
              icon={uploadItem.icon}
              title={uploadItem.title}
              templateHref={uploadItem.templateHref}
              templateDownloadName={uploadItem.templateDownloadName}
              templateLabel="Tải biểu mẫu"
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
            onSearchSubmit={loadAccounts}
            searchPlaceholder="Tìm theo username, họ tên hoặc email..."
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
              <ButtonUI onClick={openCreateDialog}>Tạo tài khoản</ButtonUI>
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
            <DataTable
              columns={accountColumns}
              rows={accountRows}
              loading={isLoading}
              error={errorMessage}
              emptyTitle="Chưa có dữ liệu phù hợp"
              emptyDescription="Không tìm thấy tài khoản phù hợp với vai trò, trạng thái hoặc từ khóa hiện tại."
            />
          </div>
        </div>
      </section>

      <AccountDialog
        account={selectedAccount}
        form={accountForm}
        error={dialogError}
        isSaving={isSaving}
        onChange={updateAccountForm}
        onClose={closeAccountDialog}
        onSubmit={saveAccount}
      />
    </div>
  );
}
