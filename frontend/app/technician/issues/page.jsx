"use client";

import { useEffect, useMemo, useState } from "react";

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
  cancelRoomBlockRequest,
  createRoomBlockRequest,
  listRoomBlockRequests,
  listRoomIssues,
  submitRoomBlockRequest,
  updateRoomBlockRequest,
} from "../../../services/roomOperationService";
import { listScheduleWeeks } from "../../../services/scheduleService";

const ISSUE_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả loại sự cố" },
  { value: "computer", label: "Máy tính" },
  { value: "network", label: "Mạng" },
  { value: "projector", label: "Máy chiếu" },
  { value: "power", label: "Điện" },
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
  block_request_id: "",
  block_status: "draft",
  related_issue_id: "",
  room_code: "",
  block_week_key: "",
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

function formatDateOnly(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function extractWeekItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.weeks)) return data.weeks;

  return [];
}

function getIssueSchedule(issue) {
  return issue?.schedule || {};
}

function getWeekKey(week) {
  return String(
    week?.id ||
      `${week?.semester_id || ""}-${week?.week_no || ""}-${week?.start_date || ""}-${week?.end_date || ""}`,
  );
}

function buildWeekLabel(week) {
  return `Tuần ${week?.week_no || ""} [${formatDateOnly(week?.start_date)} - ${formatDateOnly(week?.end_date)}]`;
}

function findDefaultWeek(weeks, issue) {
  const schedule = getIssueSchedule(issue);
  const targetDate = schedule.start_date || schedule.end_date;

  return (
    weeks.find(
      (week) =>
        targetDate &&
        week?.start_date &&
        week?.end_date &&
        week.start_date <= targetDate &&
        targetDate <= week.end_date,
    ) ||
    weeks[0] ||
    null
  );
}

function buildFallbackWeekOptions(issue) {
  const schedule = getIssueSchedule(issue);

  if (!schedule.start_date || !schedule.end_date) return [];

  return [
    {
      id: "schedule-range",
      semester_id: schedule.semester_id || "",
      week_no: "",
      start_date: schedule.start_date,
      end_date: schedule.end_date,
    },
  ];
}

function translateIssueType(value) {
  const map = {
    computer: "Máy tính",
    network: "Mạng",
    projector: "Máy chiếu",
    power: "Điện",
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
    block_status: "draft",
    requested_by_user_id: currentUser?.id || null,
  };
}

export default function TechnicianIssuesPage() {
  const [rooms, setRooms] = useState([]);
  const [issues, setIssues] = useState([]);
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);
  const [blockForm, setBlockForm] = useState(INITIAL_BLOCK_FORM);
  const [successMessage, setSuccessMessage] = useState(null);
  const [blockWeekOptions, setBlockWeekOptions] = useState([]);
  const [isLoadingBlockWeeks, setIsLoadingBlockWeeks] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [blockRequests, setBlockRequests] = useState([]);

  useEffect(() => {
    setCurrentUser(getUser());

    async function loadPageData() {
      try {
        setIsLoadingIssues(true);
        setLoadError("");

        const [scopeResponse, roomResponse, issueResponse, blockResponse] =
          await Promise.all([
            listScopeRooms().catch(() => null),
            getRooms(),
            listRoomIssues(),
            listRoomBlockRequests().catch(() => ({ data: { items: [] } })),
          ]);

        setBlockRequests(extractItems(blockResponse));

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

        setRooms(scopedRooms);
        setIssues(apiIssues);
        setBlockForm((current) => ({
          ...current,
          room_code:
            current.room_code ||
            String(apiIssues[0]?.room_code || scopedRooms[0]?.room_code || ""),
        }));
      } catch (error) {
        setBlockRequests([]);
        setRooms([]);
        setIssues([]);
        setLoadError(
          error?.message || "Không thể tải danh sách sự cố phòng máy từ API.",
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

  function handleBlockWeekChange(value) {
    const selectedWeek = blockWeekOptions.find(
      (week) => getWeekKey(week) === value,
    );

    setBlockForm((current) => ({
      ...current,
      block_week_key: value,
      start_date: selectedWeek?.start_date || "",
      end_date: selectedWeek?.end_date || "",
    }));
  }

  function buildIssueBlockTitle(issue) {
    return issue?.id
      ? `Đề xuất khóa phòng ${issue.room_code} từ sự cố #${issue.id}`
      : "";
  }

  function findBlockRequestForIssue(issue) {
    const expectedTitle = buildIssueBlockTitle(issue);

    return blockRequests.find(
      (block) =>
        expectedTitle &&
        block.block_title === expectedTitle &&
        ["draft", "submitted", "rejected"].includes(block.block_status),
    );
  }

  function upsertBlockRequest(nextBlock) {
    if (!nextBlock?.id) return;

    setBlockRequests((current) => {
      const existed = current.some(
        (item) => Number(item.id) === Number(nextBlock.id),
      );

      if (existed) {
        return current.map((item) =>
          Number(item.id) === Number(nextBlock.id) ? nextBlock : item,
        );
      }

      return [nextBlock, ...current];
    });
  }

  async function openBlockForm(issue = null) {
    setSuccessMessage(null);
    setIsBlockFormOpen(true);
    setIsLoadingBlockWeeks(true);

    let weeks = [];

    try {
      const semesterId = issue?.schedule?.semester_id;

      if (semesterId) {
        const weekResponse = await listScheduleWeeks({
          semester_id: semesterId,
        });
        weeks = extractWeekItems(weekResponse);
      }
    } catch {
      weeks = [];
    }

    if (weeks.length === 0) {
      weeks = buildFallbackWeekOptions(issue);
    }

    const defaultWeek = findDefaultWeek(weeks, issue);
    const selectedWeekKey = defaultWeek ? getWeekKey(defaultWeek) : "";

    setBlockWeekOptions(weeks);
    const existingBlock = issue ? findBlockRequestForIssue(issue) : null;
    setBlockForm({
      ...INITIAL_BLOCK_FORM,
      related_issue_id: issue?.id || "",
      room_code: issue?.room_code || rooms[0]?.room_code || "",
      block_week_key: selectedWeekKey,
      block_type: issue?.severity === "critical" ? "incident" : "repair",
      start_date: defaultWeek?.start_date || "",
      end_date: defaultWeek?.end_date || "",
      block_request_id: existingBlock?.id || "",
      block_status: existingBlock?.block_status || "draft",
      block_title:
        existingBlock?.block_title ||
        (issue ? buildIssueBlockTitle(issue) : ""),
      block_reason:
        existingBlock?.block_reason ||
        (issue ? `Đề xuất khóa phòng do sự cố: ${issue.issue_title}` : ""),
    });
    setIsLoadingBlockWeeks(false);
  }

  function closeBlockForm() {
    setIsBlockFormOpen(false);
  }

  async function handleSubmitBlockRequest(event) {
    event.preventDefault();

    if (
      !blockForm.room_code ||
      !blockForm.block_title.trim() ||
      !blockForm.block_reason.trim() ||
      !blockForm.block_week_key ||
      !blockForm.start_date ||
      !blockForm.end_date
    ) {
      setSuccessMessage({
        type: "error",
        title: "Thiếu thông tin đề xuất",
        text: "Vui lòng nhập đủ phòng, tiêu đề, lý do và chọn tuần cần khóa.",
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
      const response = blockForm.block_request_id
        ? await updateRoomBlockRequest(blockForm.block_request_id, payload)
        : await createRoomBlockRequest(payload);
      const createdBlock = response?.data || payload;
      upsertBlockRequest(createdBlock);
      setBlockForm((current) => ({
        ...current,
        block_request_id: createdBlock?.id || current.block_request_id,
        block_status: createdBlock?.block_status || current.block_status,
      }));

      setSuccessMessage({
        type: "success",
        title: "Đã lưu đề xuất",
        text: `Đề xuất #${createdBlock.id || ""} đang ở trạng thái ${createdBlock.block_status || "draft"}.`,
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

  async function handleSubmitSavedBlock() {
    if (!blockForm.block_request_id) {
      setSuccessMessage({
        type: "error",
        title: "Chưa có đề xuất để gửi",
        text: "Vui lòng bấm Đề xuất để lưu nháp trước.",
      });
      return;
    }

    try {
      setIsSubmittingBlock(true);
      const response = await submitRoomBlockRequest(blockForm.block_request_id);
      const submittedBlock = response?.data;

      upsertBlockRequest(submittedBlock);
      setBlockForm((current) => ({
        ...current,
        block_status: submittedBlock?.block_status || "submitted",
      }));

      setSuccessMessage({
        type: "success",
        title: "Đã gửi cho cán bộ đào tạo",
        text: "Đề xuất khóa phòng đã chuyển sang trạng thái chờ duyệt.",
      });
    } catch (error) {
      setSuccessMessage({
        type: "error",
        title: "Không thể gửi đề xuất",
        text: error?.message || "Backend từ chối gửi đề xuất khóa phòng.",
      });
    } finally {
      setIsSubmittingBlock(false);
    }
  }

  async function handleCancelSavedBlock() {
    if (!blockForm.block_request_id) {
      closeBlockForm();
      return;
    }

    try {
      setIsSubmittingBlock(true);
      const response = await cancelRoomBlockRequest(
        blockForm.block_request_id,
        {
          review_notes: "Kỹ thuật viên hủy đề xuất trước khi xử lý.",
        },
      );
      const cancelledBlock = response?.data;

      upsertBlockRequest(cancelledBlock);
      setSuccessMessage({
        type: "success",
        title: "Đã hủy đề xuất",
        text: "Đề xuất khóa phòng đã được hủy.",
      });
    } catch (error) {
      setSuccessMessage({
        type: "error",
        title: "Không thể hủy đề xuất",
        text: error?.message || "Backend từ chối hủy đề xuất khóa phòng.",
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

  const columns = [
    { key: "room_code", label: "Phòng" },
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
    { key: "detected_at_label", label: "Ngày gửi" },
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
          {findBlockRequestForIssue(row) ? "Cập nhật" : "Đề xuất khóa phòng"}
        </ButtonUI>
      ),
    },
  ];

  return (
    <div className="technicianPageStack">
      {loadError ? (
        <section
          className="technicianAlert technicianAlert--error"
          role="alert"
        >
          <h3>Không tải được dữ liệu sự cố</h3>
          <p>{loadError}</p>
        </section>
      ) : null}

      <section className="technicianPanel">
        <div className="technicianPanelHeader">
          <div>
            <h2>Danh sách báo cáo sự cố</h2>
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

      {isBlockFormOpen ? (
        <section className="technicianPanel technicianBlockFormPanel">
          <div className="technicianPanelHeader">
            <div>
              <h2>Đề xuất khóa phòng</h2>
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
              <input
                value={blockForm.room_code}
                className="technicianControl"
                readOnly
              />
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

            <label className="technicianField technicianFieldFull">
              <span>Tuần cần khóa</span>
              <select
                className="technicianControl"
                value={blockForm.block_week_key}
                onChange={(event) => handleBlockWeekChange(event.target.value)}
                disabled={isLoadingBlockWeeks}
              >
                {isLoadingBlockWeeks ? (
                  <option value="">Đang tải tuần học...</option>
                ) : null}

                {!isLoadingBlockWeeks && blockWeekOptions.length === 0 ? (
                  <option value="">Không có tuần học phù hợp</option>
                ) : null}

                {blockWeekOptions.map((week) => (
                  <option key={getWeekKey(week)} value={getWeekKey(week)}>
                    {buildWeekLabel(week)}
                  </option>
                ))}
              </select>
            </label>

            <label className="technicianField">
              <span>Ngày bắt đầu</span>
              <input
                className="technicianControl"
                value={formatDateOnly(blockForm.start_date)}
                readOnly
              />
            </label>

            <label className="technicianField">
              <span>Ngày kết thúc</span>
              <input
                className="technicianControl"
                value={formatDateOnly(blockForm.end_date)}
                readOnly
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
                {isSubmittingBlock
                  ? "Đang lưu..."
                  : blockForm.block_request_id
                    ? "Cập nhật"
                    : "Đề xuất"}
              </ButtonUI>
              {blockForm.block_request_id ? (
                <>
                  <ButtonUI
                    type="button"
                    className="technicianPrimaryButton"
                    disabled={
                      isSubmittingBlock ||
                      !["draft", "rejected"].includes(blockForm.block_status)
                    }
                    onClick={handleSubmitSavedBlock}
                  >
                    Gửi cán bộ đào tạo
                  </ButtonUI>

                  <ButtonUI
                    type="button"
                    tone="outline"
                    className="technicianGhostButton"
                    disabled={
                      isSubmittingBlock ||
                      !["draft", "submitted"].includes(blockForm.block_status)
                    }
                    onClick={handleCancelSavedBlock}
                  >
                    Hủy đề xuất
                  </ButtonUI>
                </>
              ) : null}

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
        </section>
      ) : null}
    </div>
  );
}
