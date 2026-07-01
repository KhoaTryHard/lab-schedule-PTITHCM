"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import {
  createAdminDevice,
  listAdminDevices,
  updateAdminDevice,
} from "../../../services/adminService.js";
import { listRooms } from "../../../services/roomService.js";

const EMPTY_FORM = {
  room_id: "",
  device_code: "",
  device_name: "",
  device_type: "computer",
  spec_or_version: "",
  device_status: "working",
  notes: "",
};

const DEVICE_TYPES = [
  ["computer", "Máy tính"],
  ["projector", "Máy chiếu"],
  ["network", "Thiết bị mạng"],
  ["other", "Khác"],
];

const DEVICE_STATUSES = [
  ["working", "Hoạt động"],
  ["minor_issue", "Lỗi nhẹ"],
  ["broken", "Hỏng"],
  ["under_repair", "Đang sửa"],
  ["replaced", "Đã thay thế"],
];

function formatLabel(items, value) {
  return items.find(([key]) => key === value)?.[1] || value || "-";
}

function DeviceDialog({
  device,
  form,
  rooms,
  error,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!form) return null;

  return (
    <div className="modalOverlay" role="presentation">
      <section
        className="modalPanel modalPanelWide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-dialog-title"
      >
        <div className="modalHeader">
          <div>
            <p className="modalEyebrow">Quản lý thiết bị</p>
            <h3 id="device-dialog-title" className="modalTitle">
              {device ? `Cập nhật ${device.device_code}` : "Tạo thiết bị"}
            </h3>
          </div>
          <button
            type="button"
            className="modalCloseButton"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Đóng"
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
              Phòng máy
              <select
                className="select"
                name="room_id"
                value={form.room_id}
                onChange={(event) => onChange("room_id", event.target.value)}
                required
              >
                <option value="">Chọn phòng</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_code}
                  </option>
                ))}
              </select>
            </label>
            <label className="modalFieldCard">
              Mã thiết bị
              <input
                className="input"
                name="device_code"
                value={form.device_code}
                onChange={(event) =>
                  onChange("device_code", event.target.value)
                }
                required
              />
            </label>
            <label className="modalFieldCard">
              Tên thiết bị
              <input
                className="input"
                name="device_name"
                value={form.device_name}
                onChange={(event) =>
                  onChange("device_name", event.target.value)
                }
                required
              />
            </label>
            <label className="modalFieldCard">
              Loại thiết bị
              <select
                className="select"
                name="device_type"
                value={form.device_type}
                onChange={(event) =>
                  onChange("device_type", event.target.value)
                }
              >
                {DEVICE_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="modalFieldCard">
              Cấu hình / phiên bản
              <input
                className="input"
                name="spec_or_version"
                value={form.spec_or_version}
                onChange={(event) =>
                  onChange("spec_or_version", event.target.value)
                }
              />
            </label>
            <label className="modalFieldCard">
              Trạng thái
              <select
                className="select"
                name="device_status"
                value={form.device_status}
                onChange={(event) =>
                  onChange("device_status", event.target.value)
                }
              >
                {DEVICE_STATUSES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="modalFieldCard modalFieldCard--full">
              Ghi chú
              <input
                className="input"
                name="notes"
                value={form.notes}
                onChange={(event) => onChange("notes", event.target.value)}
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
              {isSaving ? "Đang lưu..." : "Lưu thiết bị"}
            </ButtonUI>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dialogError, setDialogError] = useState("");

  async function loadData() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const [deviceResponse, roomResponse] = await Promise.all([
        listAdminDevices(),
        listRooms(),
      ]);
      setDevices(
        Array.isArray(deviceResponse?.data) ? deviceResponse.data : [],
      );
      setRooms(Array.isArray(roomResponse?.data) ? roomResponse.data : []);
    } catch (error) {
      setErrorMessage(error.message || "Không thể tải danh mục thiết bị.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const rows = devices.map((device) => ({
    ...device,
    device_type_label: formatLabel(DEVICE_TYPES, device.device_type),
    status: (
      <span
        className={`roomStatusBadge ${
          device.device_status === "working"
            ? "roomStatusPositive"
            : device.device_status === "minor_issue" ||
                device.device_status === "under_repair"
              ? "roomStatusWarning"
              : "roomStatusDanger"
        }`}
      >
        {formatLabel(DEVICE_STATUSES, device.device_status)}
      </span>
    ),
    actions: (
      <ButtonUI size="sm" tone="primary" onClick={() => openEdit(device)}>
        Cập nhật
      </ButtonUI>
    ),
  }));

  const columns = useMemo(
    () => [
      { key: "room_code", label: "Phòng" },
      { key: "device_code", label: "Mã thiết bị" },
      { key: "device_name", label: "Tên thiết bị" },
      { key: "device_type_label", label: "Loại" },
      { key: "spec_or_version", label: "Cấu hình / phiên bản" },
      { key: "status", label: "Trạng thái" },
      { key: "actions", label: "Thao tác" },
    ],
    [],
  );

  function closeDialog() {
    if (isSaving) return;
    setSelectedDevice(null);
    setForm(null);
    setDialogError("");
  }

  function openCreate() {
    setSelectedDevice(null);
    setForm({
      ...EMPTY_FORM,
      room_id: rooms[0]?.id ? String(rooms[0].id) : "",
    });
    setDialogError("");
  }

  function openEdit(device) {
    setSelectedDevice(device);
    setForm({
      room_id: String(device.room_id || ""),
      device_code: device.device_code || "",
      device_name: device.device_name || "",
      device_type: device.device_type || "computer",
      spec_or_version: device.spec_or_version || "",
      device_status: device.device_status || "working",
      notes: device.notes || "",
    });
    setDialogError("");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveDevice(event) {
    event.preventDefault();
    const payload = {
      ...form,
      room_id: Number(form.room_id),
      spec_or_version: form.spec_or_version.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      setIsSaving(true);
      setDialogError("");
      if (selectedDevice) await updateAdminDevice(selectedDevice.id, payload);
      else await createAdminDevice(payload);
      setSelectedDevice(null);
      setForm(null);
      await loadData();
    } catch (error) {
      setDialogError(error.message || "Không thể lưu thiết bị.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="adminPageStack">
      <section className="academicPanel">
        <div className="academicPanelHeader">
          <ButtonUI onClick={openCreate}>Tạo thiết bị</ButtonUI>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={errorMessage}
          emptyTitle="Chưa có thiết bị"
        />
      </section>
      <DeviceDialog
        device={selectedDevice}
        form={form}
        rooms={rooms}
        error={dialogError}
        isSaving={isSaving}
        onChange={updateForm}
        onClose={closeDialog}
        onSubmit={saveDevice}
      />
    </div>
  );
}
