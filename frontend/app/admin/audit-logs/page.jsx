"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { listAdminAuditLogs } from "../../../services/adminService.js";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [entityType, setEntityType] = useState("");
  const [actionType, setActionType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadAuditLogs() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await listAdminAuditLogs({
        entity_type: entityType,
        action_type: actionType,
        limit: 200,
      });
      setAuditLogs(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(error.message || "Không thể tải nhật ký thao tác.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
    // Filters are applied explicitly with the button to avoid a request per keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      { key: "action_at", label: "Thời điểm" },
      { key: "actor", label: "Người thao tác" },
      { key: "entity_type", label: "Nhóm dữ liệu" },
      { key: "entity_id", label: "ID" },
      { key: "action_type", label: "Hành động" },
      { key: "status_change", label: "Trạng thái" },
      { key: "action_notes", label: "Chi tiết" },
    ],
    [],
  );

  const rows = useMemo(
    () =>
      auditLogs.map((log) => ({
        ...log,
        action_at: formatDateTime(log.action_at),
        actor: log.action_by_name || log.action_by_username || "Hệ thống",
        status_change:
          log.old_status || log.new_status
            ? `${log.old_status || "-"} -> ${log.new_status || "-"}`
            : "-",
      })),
    [auditLogs],
  );

  return (
    <div className="adminPageStack">
      <section className="academicPanel">
        <div className="academicPanelHeader">
          <div>
            <p className="academicEyebrow">QTV</p>
            <h1>Nhật ký thao tác</h1>
            <p>Theo dõi các thay đổi nghiệp vụ quan trọng đã ghi vào `workflow_audit_logs`.</p>
          </div>
        </div>

        <div className="roomFilterBar">
          <label className="label">
            Nhóm dữ liệu
            <input
              className="input"
              name="entity_type"
              value={entityType}
              placeholder="Ví dụ: users, rooms"
              onChange={(event) => setEntityType(event.target.value)}
            />
          </label>
          <label className="label">
            Hành động
            <input
              className="input"
              name="action_type"
              value={actionType}
              placeholder="Ví dụ: create, update"
              onChange={(event) => setActionType(event.target.value)}
            />
          </label>
          <ButtonUI onClick={loadAuditLogs}>Lọc nhật ký</ButtonUI>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          error={errorMessage}
          emptyTitle="Chưa có nhật ký"
          emptyDescription="Không có thao tác phù hợp với bộ lọc hiện tại."
          pageSize={15}
        />
      </section>
    </div>
  );
}
