"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import {
  createSoftwarePackage,
  listSoftwarePackages,
  updateSoftwarePackage,
} from "../../../services/adminService.js";

const EMPTY_FORM = { software_name: "", software_version: "" };

function SoftwareDialog({ softwarePackage, form, error, isSaving, onChange, onClose, onSubmit }) {
  if (!form) return null;

  return (
    <div className="modalOverlay" role="presentation">
      <section className="modalPanel" role="dialog" aria-modal="true" aria-labelledby="software-dialog-title">
        <div className="modalHeader">
          <div>
            <p className="modalEyebrow">QTV / Phần mềm</p>
            <h3 id="software-dialog-title" className="modalTitle">
              {softwarePackage ? `Cập nhật ${softwarePackage.software_name}` : "Tạo gói phần mềm"}
            </h3>
          </div>
          <button type="button" className="modalCloseButton" onClick={onClose} disabled={isSaving} aria-label="Đóng">
            x
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modalBody">
            {error ? <p className="academicAlert academicAlert--error">{error}</p> : null}
            <label className="label">
              Tên phần mềm
              <input className="input" name="software_name" value={form.software_name} onChange={(event) => onChange("software_name", event.target.value)} required />
            </label>
            <label className="label">
              Phiên bản
              <input className="input" name="software_version" value={form.software_version} onChange={(event) => onChange("software_version", event.target.value)} />
            </label>
          </div>
          <div className="modalActions">
            <ButtonUI tone="secondary" onClick={onClose} disabled={isSaving}>Hủy</ButtonUI>
            <ButtonUI type="submit" disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu phần mềm"}</ButtonUI>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AdminSoftwarePage() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dialogError, setDialogError] = useState("");

  async function loadPackages() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await listSoftwarePackages();
      setPackages(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(error.message || "Không thể tải danh mục phần mềm.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPackages();
  }, []);

  const columns = useMemo(() => [
    { key: "software_name", label: "Tên phần mềm" },
    { key: "software_version", label: "Phiên bản" },
    { key: "actions", label: "Thao tác" },
  ], []);

  const rows = packages.map((softwarePackage) => ({
    ...softwarePackage,
    actions: <ButtonUI size="sm" tone="secondary" onClick={() => openEdit(softwarePackage)}>Sửa</ButtonUI>,
  }));

  function closeDialog() {
    if (isSaving) return;
    setSelectedPackage(null);
    setForm(null);
    setDialogError("");
  }

  function openCreate() {
    setSelectedPackage(null);
    setForm({ ...EMPTY_FORM });
    setDialogError("");
  }

  function openEdit(softwarePackage) {
    setSelectedPackage(softwarePackage);
    setForm({
      software_name: softwarePackage.software_name || "",
      software_version: softwarePackage.software_version || "",
    });
    setDialogError("");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveSoftware(event) {
    event.preventDefault();
    const payload = {
      software_name: form.software_name.trim(),
      software_version: form.software_version.trim() || null,
    };

    try {
      setIsSaving(true);
      setDialogError("");
      if (selectedPackage) await updateSoftwarePackage(selectedPackage.id, payload);
      else await createSoftwarePackage(payload);
      setSelectedPackage(null);
      setForm(null);
      await loadPackages();
    } catch (error) {
      setDialogError(error.message || "Không thể lưu phần mềm.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="adminPageStack">
      <section className="academicPanel">
        <div className="academicPanelHeader">
          <div>
            <p className="academicEyebrow">QTV / Cơ sở vật chất</p>
            <h1>Danh mục phần mềm</h1>
            <p>Quản lý tên và phiên bản phần mềm dùng cho kiểm tra điều kiện xếp lịch.</p>
          </div>
          <ButtonUI onClick={openCreate}>Tạo phần mềm</ButtonUI>
        </div>
        <DataTable columns={columns} rows={rows} loading={isLoading} error={errorMessage} emptyTitle="Chưa có phần mềm" />
      </section>
      <SoftwareDialog softwarePackage={selectedPackage} form={form} error={dialogError} isSaving={isSaving} onChange={updateForm} onClose={closeDialog} onSubmit={saveSoftware} />
    </div>
  );
}
