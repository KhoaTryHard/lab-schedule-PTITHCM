"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { getUser } from "../../../lib/authStorage";
import {
  extractRoomScope,
  getMvpRoomCodes,
  getRooms,
  listScopeRooms,
} from "../../../services/roomService";
import {
  createRoomBlockRequest,
  listRoomIssues,
} from "../../../services/roomOperationService";

const ISSUE_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả loại sự cố" },
  { value: "computer", label: "Máy tính" },
  { value: "network", label: "Mạng" },
  { value: "projector", label: "Máy chiếu" },
  { value: "power", label: "Điện" },
  { value: "software", label: "Phần mềm" },
  { value: "other", label: "Khác" },
];

const ISSUE_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "new", label: "Mới báo cáo" },
  { value: "in_progress", label: "Đang xử lý" },
  { value: "resolved", label: "Đã khắc phục" },
  { value: "closed", label: "Đã đóng" },
];

const BLOCK_TYPE_OPTIONS = [
  { value: "maintenance", label: "Bảo trì" },
  { value: "repair", label: "Sửa chữa" },
  { value: "incident", label: "Sự cố đột xuất" },
  { value: "exam", label: "Tổ chức thi" },
  { value: "reserved", label: "Đặt trước" },
  { value: "other", label: "Khác" },
];

const DAY_OPTIONS = [
  { value: "", label: "Áp dụng mọi ngày trong khoảng" },
  { value: "1", label: "Chủ nhật" },
  { value: "2", label: "Thứ 2" },
  { value: "3", label: "Thứ 3" },
  { value: "4", label: "Thứ 4" },
  { value: "5", label: "Thứ 5" },
  { value: "6", label: "Thứ 6" },
  { value: "7", label: "Thứ 7" },
];

const TIME_SLOT_OPTIONS = [
  { value: "", label: "Cả ngày" },
  { value: "1", label: "Tiết 1-4" },
  { value: "2", label: "Tiết 7-10" },
];

const INITIAL_BLOCK_FORM = {
  related_issue_id: "",
  room_code: "",
  block_type: "incident",
  block_title: "",
  block_reason: "",
  start_date: "",
  end_date: "",
  day_of_week: "",
  time_slot_id: "",
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatFallback(value) {
  return value === undefined || value === null || String(value).trim() === ""
    ? "—"
    : value;
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function translateIssueType(value) {
  const map = {
    computer: "Máy tính",
    network: "Mạng",
    projector: "Máy chiếu",
    power: "Điện",
    software: "Phần mềm",
    other: "Khác",
  };

  return map[value] || value || "—";
}

function translateSeverity(value) {
  const map = {
    low: "Thấp",
    medium: "Trung bình",
    high: "Cao",
    critical: "Nghiêm trọng",
  };

  return map[value] || value || "—";
}

function translateIssueStatus(value) {
  const map = {
    new: "Mới báo cáo",
    in_progress: "Đang xử lý",
    resolved: "Đã khắc phục",
    closed: "Đã đóng",
  };

  return map[value] || value || "—";
}

function buildSeverityBadge(value) {
  return (
    <span className={`technicianStatusBadge technicianSeverity--${value}`}>
      {translateSeverity(value)}
    </span>
  );
}

function buildIssueStatusBadge(value) {
  return (
    <span className={`technicianStatusBadge technicianIssueStatus--${value}`}>
      {translateIssueStatus(value)}
    </span>
  );
}

function extractRooms(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

function extractItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function buildBlockPayload(formState, currentUser) {
  return {
    room_code: formState.room_code,
    related_issue_id: formState.related_issue_id || null,
    block_type: formState.block_type,
    block_title: formState.block_title.trim(),
    block_reason: formState.block_reason.trim(),
    start_date: formState.start_date,
    end_date: formState.end_date,
    day_of_week: formState.day_of_week || null,
    time_slot_id: formState.time_slot_id || null,
    block_status: "submitted",
    requested_by_user_id: currentUser?.id || null,
  };
}

export default function TechnicianIssuesPage() {
  const [rooms, setRooms] = useState([]);
  const [roomScopeCodes, setRoomScopeCodes] = useState(getMvpRoomCodes());
  const [issues, setIssues] = useState([]);
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);
  const [blockForm, setBlockForm] = useState(INITIAL_BLOCK_FORM);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setCurrentUser(getUser());

    async function loadPageData() {
      try {
        setIsLoadingIssues(true);
        setLoadError("");

        const [scopeResponse, roomResponse, issueResponse] = await Promise.all([
          listScopeRooms().catch(() => null),
          getRooms(),
          listRoomIssues(),
        ]);

        const backendScopeCodes = extractRoomScope(scopeResponse);
        const activeScopeCodes =
          backendScopeCodes.length > 0 ? backendScopeCodes : getMvpRoomCodes();

        const apiRooms = extractRooms(roomResponse);
        const scopedRooms = apiRooms.filter((room) =>
          activeScopeCodes.includes(
            String(room.room_code || "")
              .trim()
              .toUpperCase(),
          ),
        );
        const apiIssues = extractItems(issueResponse);

        setRoomScopeCodes(activeScopeCodes);
        setRooms(scopedRooms);
        setIssues(apiIssues);
        setBlockForm((current) => ({
          ...current,
          room_code:
            current.room_code ||
            String(apiIssues[0]?.room_code || scopedRooms[0]?.room_code || ""),
        }));
      } catch (error) {
        setRooms([]);
        setIssues([]);
        setLoadError(
          error?.message ||
            "Không thể tải danh sách sự cố phòng máy từ API.",
        );
      } finally {
        setIsLoadingIssues(false);
      }
    }

    loadPageData();
  }, []);

  function updateBlockForm(fieldName, value) {
    setBlockForm((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  const openBlockForm = useCallback((issue = null) => {
    setSuccessMessage(null);
    setLastPayload(null);
    setIsBlockFormOpen(true);

    setBlockForm({
      ...INITIAL_BLOCK_FORM,
      related_issue_id: issue?.id || "",
      room_code: issue?.room_code || rooms[0]?.room_code || "",
      block_type: issue?.severity === "critical" ? "incident" : "repair",
      block_title: issue ? `Đề xuất khóa phòng ${issue.room_code}` : "",
      block_reason: issue
        ? `Đề xuất khóa phòng do sự cố: ${issue.issue_title}`
        : "",
    });
  }, [rooms]);

  function closeBlockForm() {
    setIsBlockFormOpen(false);
  }

  async function handleSubmitBlockRequest(event) {
    event.preventDefault();

    if (
      !blockForm.room_code ||
      !blockForm.block_title.trim() ||
      !blockForm.block_reason.trim() ||
      !blockForm.start_date ||
      !blockForm.end_date
    ) {
      setSuccessMessage({
        type: "error",
        title: "Thiếu thông tin đề xuất",
        text: "Vui lòng nhập đủ phòng, tiêu đề, lý do và khoảng ngày cần khóa.",
      });
      return;
    }

    if (blockForm.end_date < blockForm.start_date) {
      setSuccessMessage({
        type: "error",
        title: "Khoảng ngày chưa hợp lệ",
        text: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.",
      });
      return;
    }

    const payload = buildBlockPayload(blockForm, currentUser);

    try {
      setIsSubmittingBlock(true);
      const response = await createRoomBlockRequest(payload);
      const createdBlock = response?.data || payload;

      setLastPayload(createdBlock);
      setSuccessMessage({
        type: "success",
        title: "Đã gửi đề xuất thành công",
        text: `Đề xuất #${createdBlock.id || ""} đã được lưu với trạng thái ${createdBlock.block_status || "submitted"}.`,
      });
    } catch (error) {
      setSuccessMessage({
        type: "error",
        title: "Không thể gửi đề xuất",
        text:
          error?.message ||
          "API room-block-requests từ chối đề xuất khóa phòng.",
      });
    } finally {
      setIsSubmittingBlock(false);
    }
  }

  const visibleIssues = useMemo(() => {
    const normalizedKeyword = normalizeText(searchKeyword);

    return issues.filter((issue) => {
      const matchedType =
        issueTypeFilter === "all" || issue.issue_type === issueTypeFilter;
      const matchedStatus =
        statusFilter === "all" || issue.issue_status === statusFilter;
      const matchedKeyword =
        !normalizedKeyword ||
        normalizeText(
          [
            issue.room_code,
            issue.device_id,
            issue.issue_title,
            issue.issue_description,
            issue.reported_by_name,
            issue.assigned_to_name,
          ].join(" "),
        ).includes(normalizedKeyword);

      return matchedType && matchedStatus && matchedKeyword;
    });
  }, [issueTypeFilter, issues, searchKeyword, statusFilter]);

  const rows = useMemo(
    () =>
      visibleIssues.map((issue) => ({
        ...issue,
        issue_type_label: translateIssueType(issue.issue_type),
        severity_label: issue.severity,
        issue_status_label: issue.issue_status,
        detected_at_label: formatDateTime(issue.detected_at),
        resolved_at_label: formatDateTime(issue.resolved_at),
        device_id_label: formatFallback(issue.device_id),
        lab_schedule_entry_id_label: formatFallback(
          issue.lab_schedule_entry_id,
        ),
        resolution_notes_label: formatFallback(issue.resolution_notes),
      })),
    [visibleIssues],
  );

  const columns = useMemo(
    () => [
      { key: "room_code", label: "Phòng" },
      { key: "device_id_label", label: "Thiết bị" },
      { key: "lab_schedule_entry_id_label", label: "Ca thực hành" },
      { key: "issue_type_label", label: "Loại lỗi" },
      {
        key: "severity_label",
        label: "Mức độ",
        render: (value) => buildSeverityBadge(value),
      },
      { key: "issue_title", label: "Tiêu đề" },
      { key: "issue_description", label: "Mô tả" },
      {
        key: "issue_status_label",
        label: "Trạng thái",
        render: (value) => buildIssueStatusBadge(value),
      },
      { key: "reported_by_name", label: "Người báo" },
      { key: "assigned_to_name", label: "KTV phụ trách" },
      { key: "detected_at_label", label: "Phát hiện" },
      { key: "resolved_at_label", label: "Sửa xong" },
      { key: "resolution_notes_label", label: "Ghi chú xử lý" },
      {
        key: "action",
        label: "Thao tác",
        render: (_, row) => (
          <ButtonUI
            type="button"
            size="sm"
            className="technicianPrimaryButton"
            onClick={() => openBlockForm(row)}
          >
            Đề xuất khóa phòng
          </ButtonUI>
        ),
      },
    ],
    [openBlockForm],
  );

  return (
    <div className="technicianPageStack">
      <section className="technicianHero">
        <div className="technicianHeroBody">
          <p className="technicianEyebrow">Kỹ thuật viên</p>
          <h1 className="technicianHeroTitle">Sự cố phòng máy</h1>
          <p className="technicianHeroText">
            Quản lý báo cáo sự cố theo cấu trúc bảng room_issue_reports và tạo
            đề xuất khóa phòng theo room_block_requests khi sự cố ảnh hưởng đến
            lịch thực hành.
          </p>
        </div>

        <ButtonUI
          type="button"
          className="technicianPrimaryButton"
          onClick={() => openBlockForm()}
        >
          Đề xuất khóa phòng
        </ButtonUI>
      </section>

      {loadError ? (
        <section className="technicianAlert technicianAlert--error" role="alert">
          <h3>Không tải được dữ liệu sự cố</h3>
          <p>{loadError}</p>
        </section>
      ) : null}

      <section className="technicianPanel">
        <div className="technicianPanelHeader">
          <div>
            <p className="technicianEyebrow">Bộ lọc sự cố</p>
            <h2>Quản lý báo cáo sự cố chi tiết</h2>
            <p>
              Scope phòng thật từ backend: {roomScopeCodes.join(", ") || "—"}
            </p>
          </div>
        </div>

        <div className="technicianToolbar">
          <label className="technicianField">
            <span>Tìm kiếm</span>
            <input
              className="technicianControl"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm theo phòng, thiết bị, tiêu đề, mô tả..."
            />
          </label>

          <label className="technicianField">
            <span>Loại sự cố</span>
            <select
              className="technicianControl"
              value={issueTypeFilter}
              onChange={(event) => setIssueTypeFilter(event.target.value)}
            >
              {ISSUE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="technicianField">
            <span>Trạng thái xử lý</span>
            <select
              className="technicianControl"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {ISSUE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {isBlockFormOpen ? (
        <section className="technicianPanel technicianBlockFormPanel">
          <div className="technicianPanelHeader">
            <div>
              <p className="technicianEyebrow">Room block request</p>
              <h2>Khóa phòng vì sự cố hoặc bảo trì</h2>
              <p>
                Form này chỉ gửi đề xuất. Trạng thái nghiệp vụ mặc định là
                submitted và cần CBDT/QTV duyệt.
              </p>
            </div>

            <button
              type="button"
              className="technicianCloseButton"
              onClick={closeBlockForm}
              aria-label="Đóng form đề xuất khóa phòng"
            >
              ×
            </button>
          </div>

          {successMessage ? (
            <div
              className={`technicianAlert technicianAlert--${successMessage.type}`}
              role={successMessage.type === "error" ? "alert" : "status"}
            >
              <button
                type="button"
                className="technicianAlertClose"
                onClick={() => setSuccessMessage(null)}
                aria-label="Tắt thông báo"
              >
                ×
              </button>
              <h3>{successMessage.title}</h3>
              <p>{successMessage.text}</p>
            </div>
          ) : null}

          <form
            className="technicianFormGrid"
            onSubmit={handleSubmitBlockRequest}
          >
            <label className="technicianField">
              <span>Phòng cần khóa</span>
              <select
                className="technicianControl"
                value={blockForm.room_code}
                onChange={(event) =>
                  updateBlockForm("room_code", event.target.value)
                }
              >
                {rooms.length === 0 ? (
                  <option value="">Không tải được danh sách phòng</option>
                ) : null}

                {rooms.map((room) => (
                  <option
                    key={room.id || room.room_code}
                    value={room.room_code}
                  >
                    {room.room_code}
                  </option>
                ))}
              </select>
            </label>

            <label className="technicianField">
              <span>Loại chặn</span>
              <select
                className="technicianControl"
                value={blockForm.block_type}
                onChange={(event) =>
                  updateBlockForm("block_type", event.target.value)
                }
              >
                {BLOCK_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="technicianField technicianFieldFull">
              <span>Tiêu đề đề xuất</span>
              <input
                className="technicianControl"
                value={blockForm.block_title}
                onChange={(event) =>
                  updateBlockForm("block_title", event.target.value)
                }
                placeholder="VD: Khóa phòng 2B21 để sửa mạng LAN"
              />
            </label>

            <label className="technicianField technicianFieldFull">
              <span>Lý do khóa phòng</span>
              <textarea
                className="technicianControl technicianTextarea"
                value={blockForm.block_reason}
                onChange={(event) =>
                  updateBlockForm("block_reason", event.target.value)
                }
                placeholder="Mô tả lý do cần khóa phòng, mức độ ảnh hưởng và hướng xử lý..."
              />
            </label>

            <label className="technicianField">
              <span>Ngày bắt đầu</span>
              <input
                type="date"
                className="technicianControl"
                value={blockForm.start_date}
                onChange={(event) =>
                  updateBlockForm("start_date", event.target.value)
                }
              />
            </label>

            <label className="technicianField">
              <span>Ngày kết thúc</span>
              <input
                type="date"
                className="technicianControl"
                value={blockForm.end_date}
                onChange={(event) =>
                  updateBlockForm("end_date", event.target.value)
                }
              />
            </label>

            <label className="technicianField">
              <span>Thứ trong tuần</span>
              <select
                className="technicianControl"
                value={blockForm.day_of_week}
                onChange={(event) =>
                  updateBlockForm("day_of_week", event.target.value)
                }
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="technicianField">
              <span>Ca / tiết</span>
              <select
                className="technicianControl"
                value={blockForm.time_slot_id}
                onChange={(event) =>
                  updateBlockForm("time_slot_id", event.target.value)
                }
              >
                {TIME_SLOT_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="technicianFormActions technicianFieldFull">
              <ButtonUI
                type="submit"
                className="technicianPrimaryButton"
                disabled={isSubmittingBlock}
              >
                {isSubmittingBlock ? "Đang gửi..." : "Xác nhận gửi đi"}
              </ButtonUI>

              <ButtonUI
                type="button"
                tone="outline"
                className="technicianGhostButton"
                onClick={closeBlockForm}
              >
                Hủy
              </ButtonUI>
            </div>
          </form>

          {lastPayload ? (
            <div className="technicianPayloadPreview">
              <h3>Đề xuất API vừa ghi nhận</h3>
              <pre>{JSON.stringify(lastPayload, null, 2)}</pre>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="technicianPanel">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey="id"
          loading={isLoadingIssues}
          emptyTitle="Chưa có sự cố phù hợp"
          emptyDescription="Không có báo cáo sự cố phù hợp bộ lọc hiện tại."
          pageSize={8}
        />
      </section>
    </div>
  );
}
