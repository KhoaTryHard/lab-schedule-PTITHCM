"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { CardUI, UploadCard } from "../../../components/common/cardUI.jsx";
import ConfirmDialog from "../../../components/common/ConfirmDialog.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import FilterSearchToolbar from "../../../components/common/FilterSearchToolbar.jsx";
import SectionLayout from "../../../components/common/SectionLayout.jsx";
import {
  ButtonUI,
  RefreshButton,
} from "../../../components/common/buttonUI.jsx";
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

const accountUploadItem = {
  icon: UsersIcon,
  title: "Tạo tài khoản",
  templateHref: "/api/template-download/createaccounts",
  templateDownloadName: "createaccounts.xlsx",
};

const ACCOUNT_EXCEL_COLUMNS = [
  "username",
  "password",
  "full_name",
  "email",
  "phone_number",
  "role_code",
  "account_status",
];

const VALID_ACCOUNT_ROLE_CODES = new Set(["QTV", "CBDT", "GV", "KTV", "SV"]);
const VALID_ACCOUNT_STATUSES = new Set(["active", "locked", "inactive"]);

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
    <span
      className={`roomStatusBadge ${toneClassMap[status] || "roomStatusNeutral"}`}
    >
      {label}
    </span>
  );
}

function formatRoleLabel(roleCode) {
  return ROLE_LABELS[roleCode] || roleCode || "Không rõ";
}
function canChangeAccountStatus(account) {
  return account?.role_code !== "QTV";
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
      <section
        className="modalPanel modalPanelWide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-dialog-title"
      >
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
          <div className="modalBody modalFieldGrid">
            {error ? (
              <p className="academicAlert academicAlert--error modalFieldCard--full">
                {error}
              </p>
            ) : null}

            <label className="modalFieldCard">
              Tên đăng nhập
              <input
                className="input"
                value={form.username}
                onChange={(event) => onChange("username", event.target.value)}
                disabled={isSaving || isEditing}
                required
              />
            </label>
            <label className="modalFieldCard">
              Họ và tên
              <input
                className="input"
                value={form.full_name}
                onChange={(event) => onChange("full_name", event.target.value)}
                disabled={isSaving}
                required
              />
            </label>
            <label className="modalFieldCard">
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
            <label className="modalFieldCard">
              Số điện thoại
              <input
                className="input"
                value={form.phone_number}
                onChange={(event) =>
                  onChange("phone_number", event.target.value)
                }
                disabled={isSaving}
              />
            </label>
            <label className="modalFieldCard">
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
            <label className="modalFieldCard">
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
            <ButtonUI
              tone="outline"
              className="dangerOutlineButton"
              onClick={onClose}
              disabled={isSaving}
            >
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
  const [pendingStatusAction, setPendingStatusAction] = useState(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [isImportingAccounts, setIsImportingAccounts] = useState(false);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [importSuccessDialog, setImportSuccessDialog] = useState({
    open: false,
    message: "",
  });

  async function loadAccounts() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await listAdminAccounts();
      setAccounts(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(
        error.message || "Không thể tải danh sách tài khoản từ API.",
      );
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
      { key: "username", label: "Tên đăng nhập" },
      { key: "full_name", label: "Họ và tên" },
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
      <div className="actionButtonGroup">
        <ButtonUI
          size="sm"
          tone="primary"
          onClick={() => openEditDialog(accountItem)}
        >
          Cập nhật
        </ButtonUI>

        {canChangeAccountStatus(accountItem) ? (
          <ButtonUI
            size="sm"
            tone="primary"
            onClick={() =>
              handleAccountStatusChange(
                accountItem,
                accountItem.account_status === "active" ? "locked" : "active",
              )
            }
          >
            {accountItem.account_status === "active" ? "Khóa" : "Mở khóa"}
          </ButtonUI>
        ) : null}
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

      if (!selectedAccount) {
        setDialogError(
          "Chức năng tạo tài khoản thủ công đã được tắt. Vui lòng import bằng Excel.",
        );
        return;
      }

      await updateAdminAccount(selectedAccount.id, payload);

      setSelectedAccount(null);
      setAccountForm(null);
      await loadAccounts();
    } catch (error) {
      setDialogError(error.message || "Không thể lưu tài khoản.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleAccountStatusChange(account, accountStatus) {
    if (!canChangeAccountStatus(account)) {
      setStatusActionResult({
        open: true,
        type: "error",
        message: "Không cho phép khóa hoặc mở khóa tài khoản quản trị viên.",
      });
      return;
    }
    setPendingStatusAction({ account, accountStatus });
  }

  function closeStatusConfirm() {
    if (isSaving) return;
    setPendingStatusAction(null);
  }

  async function confirmAccountStatusChange() {
    if (!pendingStatusAction?.account?.id) return;

    const { account, accountStatus } = pendingStatusAction;
    const actionLabel = accountStatus === "active" ? "mở khóa" : "khóa";

    try {
      setIsSaving(true);
      setErrorMessage("");
      await updateAdminAccount(account.id, { account_status: accountStatus });
      setPendingStatusAction(null);
      await loadAccounts();
    } catch (error) {
      setErrorMessage(error.message || `Không thể ${actionLabel} tài khoản.`);
    } finally {
      setIsSaving(false);
    }
  }

  function getCellText(value) {
    return String(value ?? "").trim();
  }

  function isEmptyExcelRow(row) {
    return ACCOUNT_EXCEL_COLUMNS.every((column) => !getCellText(row[column]));
  }

  function buildAccountPayloadFromExcelRow(row, rowNumber) {
    const payload = {
      username: getCellText(row.username),
      password: getCellText(row.password),
      full_name: getCellText(row.full_name),
      email: getCellText(row.email),
      phone_number: getCellText(row.phone_number) || null,
      role_code: getCellText(row.role_code).toUpperCase(),
      account_status: getCellText(row.account_status) || "active",
    };

    const errors = [];

    if (!payload.username) errors.push("thiếu username");
    if (!payload.password) errors.push("thiếu password");
    if (!payload.full_name) errors.push("thiếu full_name");
    if (!payload.email) errors.push("thiếu email");

    if (!VALID_ACCOUNT_ROLE_CODES.has(payload.role_code)) {
      errors.push("role_code phải là QTV, CBDT, GV, KTV hoặc SV");
    }

    if (!VALID_ACCOUNT_STATUSES.has(payload.account_status)) {
      errors.push("account_status phải là active, locked hoặc inactive");
    }

    return {
      rowNumber,
      payload,
      errors,
    };
  }

  async function readAccountExcelFile(file) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      throw new Error("File Excel không có sheet dữ liệu.");
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
    });

    return rows
      .map((row, index) => ({ row, rowNumber: index + 2 }))
      .filter(({ row }) => !isEmptyExcelRow(row))
      .map(({ row, rowNumber }) =>
        buildAccountPayloadFromExcelRow(row, rowNumber),
      );
  }

  function resetAccountExcelUpload() {
    setSelectedUploadFile(null);
    setUploadResetKey((currentKey) => currentKey + 1);
  }

  function closeImportSuccessDialog() {
    setImportSuccessDialog({
      open: false,
      message: "",
    });
  }

  function handleUploadFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedUploadFile(file);
    setErrorMessage("");
  }

  async function handleImportAccountsFromExcel() {
    if (!selectedUploadFile) {
      setErrorMessage("Vui lòng chọn file Excel trước khi tải lên.");
      return;
    }

    try {
      setIsImportingAccounts(true);
      setErrorMessage("");

      const parsedRows = await readAccountExcelFile(selectedUploadFile);

      if (parsedRows.length === 0) {
        setErrorMessage("File Excel không có dòng tài khoản hợp lệ để tạo.");
        return;
      }

      const invalidRows = parsedRows.filter((item) => item.errors.length > 0);

      if (invalidRows.length > 0) {
        setErrorMessage(
          invalidRows
            .map((item) => `Dòng ${item.rowNumber}: ${item.errors.join(", ")}`)
            .join(" | "),
        );
        return;
      }

      let successCount = 0;
      const failedRows = [];

      for (const item of parsedRows) {
        try {
          await createAdminAccount(item.payload);
          successCount += 1;
        } catch (error) {
          failedRows.push(
            `Dòng ${item.rowNumber} (${item.payload.username}): ${
              error.message || "không tạo được tài khoản"
            }`,
          );
        }
      }

      await loadAccounts();

      if (failedRows.length > 0) {
        resetAccountExcelUpload();
        setImportSuccessDialog({
          open: true,
          message: `Đã tạo thành công ${successCount} tài khoản. Một số dòng bị lỗi, vui lòng kiểm tra thông báo bên dưới.`,
        });
        setErrorMessage(failedRows.join(" | "));
        return;
      }

      resetAccountExcelUpload();
      setImportSuccessDialog({
        open: true,
        message: `Tạo tài khoản thành công: ${successCount} tài khoản.`,
      });
    } catch (error) {
      setErrorMessage(error.message || "Không thể đọc hoặc import file Excel.");
    } finally {
      setIsImportingAccounts(false);
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
          direction={0}
          className="card accountUploadSection"
        >
          <UploadCard
            key={uploadResetKey}
            icon={accountUploadItem.icon}
            title={accountUploadItem.title}
            templateHref={accountUploadItem.templateHref}
            templateDownloadName={accountUploadItem.templateDownloadName}
            templateLabel="Tải biểu mẫu"
            fileLabel="File excel"
            inputName="createaccounts_excel"
            accept=".xlsx,.xls"
            selectedFileName={selectedUploadFile?.name || ""}
            onFileChange={handleUploadFileChange}
            onButtonClick={handleImportAccountsFromExcel}
            buttonLabel={isImportingAccounts ? "Đang tải lên..." : "Tải lên"}
            disabled={isImportingAccounts}
          />
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
      <ConfirmDialog
        open={Boolean(pendingStatusAction)}
        eyebrow="Quản lý tài khoản"
        title={
          pendingStatusAction?.accountStatus === "active"
            ? "Mở khóa tài khoản"
            : "Khóa tài khoản"
        }
        message={`Bạn có chắc muốn ${
          pendingStatusAction?.accountStatus === "active" ? "mở khóa" : "khóa"
        } tài khoản ${pendingStatusAction?.account?.username || "này"}?`}
        confirmLabel={
          pendingStatusAction?.accountStatus === "active" ? "Mở khóa" : "Khóa"
        }
        tone={
          pendingStatusAction?.accountStatus === "active" ? "primary" : "danger"
        }
        isSubmitting={isSaving}
        onCancel={closeStatusConfirm}
        onConfirm={confirmAccountStatusChange}
      />
      {importSuccessDialog.open ? (
        <div className="modalOverlay" role="presentation">
          <section
            className="modalPanel confirmDialogPanel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-import-success-title"
          >
            <div className="modalHeader">
              <div>
                <p className="modalEyebrow">Tạo tài khoản</p>
                <h3 id="account-import-success-title" className="modalTitle">
                  Hoàn tất
                </h3>
              </div>
              <button
                type="button"
                className="modalCloseButton"
                onClick={closeImportSuccessDialog}
                aria-label="Đóng thông báo"
              >
                ×
              </button>
            </div>

            <div className="modalBody">
              <p className="modalText">{importSuccessDialog.message}</p>
            </div>

            <div className="modalActions">
              <ButtonUI tone="primary" onClick={closeImportSuccessDialog}>
                OK
              </ButtonUI>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
