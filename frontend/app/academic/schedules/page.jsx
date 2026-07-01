"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import RoomStatusDialog from "../../../components/common/RoomStatusDialog.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import WeeklyScheduleTable from "../../../components/schedules/WeeklyScheduleTable.jsx";
import {
  applyRoomBlockStatus,
  listRoomBlockRequests,
  reviewRoomBlockRequest,
} from "../../../services/roomOperationService";
import { getRoomById } from "../../../services/roomService";

const BLOCK_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "submitted", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

const BLOCK_STATUS_LABELS = {
  draft: "Nháp",
  submitted: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function buildStatusBadge(status) {
  const toneMap = {
    submitted: "roomStatusWarning",
    approved: "roomStatusPositive",
    rejected: "roomStatusDanger",
  };

  return (
    <span
      className={`roomStatusBadge ${toneMap[status] || "roomStatusNeutral"}`}
    >
      {BLOCK_STATUS_LABELS[status] || status || "—"}
    </span>
  );
}

export default function AcademicSchedulesPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomBlocks, setRoomBlocks] = useState([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [blockError, setBlockError] = useState("");
  const [blockMessage, setBlockMessage] = useState("");

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomBlock, setSelectedRoomBlock] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [roomSubmitError, setRoomSubmitError] = useState("");

  async function loadRoomBlocks() {
    try {
      setIsLoadingBlocks(true);
      setBlockError("");
      const response = await listRoomBlockRequests({ status: statusFilter });
      setRoomBlocks(
        Array.isArray(response?.data?.items) ? response.data.items : [],
      );
    } catch (error) {
      setBlockError(error.message || "Không thể tải yêu cầu khóa phòng.");
    } finally {
      setIsLoadingBlocks(false);
    }
  }

  useEffect(() => {
    loadRoomBlocks();
  }, [statusFilter]);

  async function handleOpenRoomStatus(block) {
    if (!block?.room_id) {
      setBlockError("Không xác định được phòng cần cập nhật.");
      return;
    }

    try {
      setBlockError("");
      setRoomSubmitError("");

      const response = await getRoomById(block.room_id);

      setSelectedRoomBlock(block);
      setSelectedRoom(
        response?.data || {
          id: block.room_id,
          room_code: block.room_code,
        },
      );
      setIsStatusDialogOpen(true);
    } catch (error) {
      setBlockError(error.message || "Không thể tải thông tin phòng.");
    }
  }

  async function handleReviewBlock(block, nextStatus) {
    try {
      setBlockMessage("");
      setBlockError("");

      const response = await reviewRoomBlockRequest(block.id, {
        block_status: nextStatus,
      });

      const reviewedBlock = {
        ...block,
        ...(response?.data || {}),
        block_status: nextStatus,
      };

      if (nextStatus === "approved") {
        setBlockMessage(
          "Đã duyệt yêu cầu khóa phòng. Vui lòng cập nhật trạng thái phòng.",
        );
        await loadRoomBlocks();
        await handleOpenRoomStatus(reviewedBlock);
        return;
      }

      setBlockMessage("Đã từ chối yêu cầu khóa phòng.");
      await loadRoomBlocks();
    } catch (error) {
      setBlockError(error.message || "Không thể xử lý yêu cầu khóa phòng.");
    }
  }

  async function handleSubmitRoomStatus(payload) {
    if (!selectedRoom?.id || !selectedRoomBlock?.id) return;

    try {
      setIsUpdatingRoom(true);
      setRoomSubmitError("");

      await applyRoomBlockStatus(selectedRoomBlock.id, payload);

      setIsStatusDialogOpen(false);
      setSelectedRoom(null);
      setSelectedRoomBlock(null);
      setBlockMessage("Đã cập nhật trạng thái phòng từ yêu cầu khóa phòng.");
      await loadRoomBlocks();
    } catch (error) {
      setRoomSubmitError(
        error.message || "Không thể cập nhật trạng thái phòng.",
      );
    } finally {
      setIsUpdatingRoom(false);
    }
  }

  const columns = useMemo(
    () => [
      { key: "room_code", label: "Phòng" },
      { key: "block_title", label: "Tiêu đề" },
      { key: "block_reason", label: "Lý do" },
      { key: "date_range", label: "Khoảng khóa" },
      { key: "schedule_label", label: "Thứ / ca" },
      { key: "requested_by_name", label: "Người gửi" },
      { key: "created_at_label", label: "Ngày gửi" },
      {
        key: "block_status",
        label: "Trạng thái",
        render: (value) => buildStatusBadge(value),
      },
      {
        key: "actions",
        label: "Thao tác",
        render: (_, row) => (
          <div className="actionButtonGroup">
            {row.block_status === "submitted" ? (
              <>
                <ButtonUI
                  size="sm"
                  onClick={() => handleReviewBlock(row, "approved")}
                >
                  Duyệt
                </ButtonUI>
                <ButtonUI
                  size="sm"
                  tone="outline"
                  className="dangerOutlineButton"
                  onClick={() => handleReviewBlock(row, "rejected")}
                >
                  Từ chối
                </ButtonUI>
              </>
            ) : null}

            {row.block_status === "approved" ? (
              <ButtonUI size="sm" onClick={() => handleOpenRoomStatus(row)}>
                Cập nhật phòng
              </ButtonUI>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  const rows = roomBlocks.map((item) => ({
    ...item,
    date_range: `${formatDate(item.start_date)} → ${formatDate(item.end_date)}`,
    schedule_label: `${item.day_of_week ? `Thứ ${item.day_of_week}` : "Cả tuần"} · ${
      item.slot_label || "Cả ngày"
    }`,
    created_at_label: formatDateTime(item.created_at),
  }));

  return (
    <>
      <WeeklyScheduleTable
        title="Thời khóa biểu dạng tuần"
        roleVariant="academic"
        accentTone="red"
        useAcademicWeeksEndpoint
        emptyTitle="Chưa có lịch thực hành"
        emptyDescription="Không có lịch thực hành phù hợp trong tuần đang chọn."
      />

      <section className="card roomTableCard" style={{ marginTop: 16 }}>
        <div className="card option roomFilterBar">
          <div className="roomFilterSummary">
            <h3 className="roomSectionTitle">Yêu cầu khóa phòng</h3>
          </div>

          <div className="roomFilterControls">
            <ButtonUI tone="secondary" shape="rounded" onClick={loadRoomBlocks}>
              Làm mới
            </ButtonUI>

            <select
              className="select roomStatusSelect"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {BLOCK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {blockMessage ? (
          <p className="academicAlert academicAlert--success">{blockMessage}</p>
        ) : null}

        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoadingBlocks}
          error={blockError}
          emptyTitle="Chưa có yêu cầu khóa phòng"
          emptyDescription="Không có yêu cầu phù hợp với bộ lọc hiện tại."
          pageSize={6}
        />
      </section>

      <RoomStatusDialog
        room={selectedRoom}
        isOpen={isStatusDialogOpen}
        isSubmitting={isUpdatingRoom}
        submitError={roomSubmitError}
        onClose={() => {
          setIsStatusDialogOpen(false);
          setSelectedRoom(null);
          setSelectedRoomBlock(null);
          setRoomSubmitError("");
        }}
        onSubmit={handleSubmitRoomStatus}
      />
    </>
  );
}
