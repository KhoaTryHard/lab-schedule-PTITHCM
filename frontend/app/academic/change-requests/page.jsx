"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import ConfirmDialog from "../../../components/common/ConfirmDialog.jsx";
import DataTable from "../../../components/common/DataTable.jsx";
import {
  ButtonUI,
  RefreshButton,
} from "../../../components/common/buttonUI.jsx";
import { listSchedules } from "../../../services/scheduleService";
import {
  getScheduleChangeOptions,
  implementScheduleChangeRequest,
  listScheduleChangeRequests,
  reviewScheduleChangeRequest,
} from "../../../services/scheduleChangeRequestService";

const CHANGE_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả loại yêu cầu" },
  { value: "reschedule", label: "Đổi lịch" },
  { value: "makeup", label: "Học bù" },
  { value: "cancel", label: "Hủy lịch" },
];

const REQUEST_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "draft", label: "Nháp" },
  { value: "submitted", label: "Đã gửi" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
  { value: "implemented", label: "Đã cập nhật lịch" },
  { value: "cancelled", label: "Đã hủy" },
];

const ACTION_CONFIG = {
  approved: {
    eyebrow: "Xác nhận duyệt",
    title: "Duyệt yêu cầu này?",
    confirmLabel: "Duyệt yêu cầu",
    tone: "primary",
  },
  rejected: {
    eyebrow: "Xác nhận từ chối",
    title: "Từ chối yêu cầu này?",
    confirmLabel: "Từ chối",
    tone: "danger",
  },
  implemented: {
    eyebrow: "Xác nhận triển khai",
    title: "Áp dụng thay đổi vào lịch?",
    confirmLabel: "Triển khai",
    tone: "primary",
  },
};

function extractItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.schedules)) return data.schedules;

  return [];
}

function formatFallback(value) {
  return value === undefined || value === null || String(value).trim() === ""
    ? "—"
    : value;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
  }).format(date);
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

function formatDayOfWeek(value) {
  const dayMap = {
    1: "Chủ nhật",
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
  };

  return dayMap[value] || value || "—";
}

function formatTimeSlotLabel(value, valueId) {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();
  const numericId = Number(valueId);

  if (
    numericId === 1 ||
    normalizedValue === "1" ||
    normalizedValue.includes("1-4") ||
    normalizedValue.includes("sáng")
  ) {
    return "Ca sáng";
  }

  if (
    numericId === 2 ||
    normalizedValue === "2" ||
    normalizedValue.includes("7-10") ||
    normalizedValue.includes("chiều")
  ) {
    return "Ca chiều";
  }

  return formatFallback(value);
}

function translateChangeType(value) {
  const map = {
    reschedule: "Yêu cầu đổi lịch",
    makeup: "Yêu cầu học bù",
    cancel: "Yêu cầu hủy lịch",
  };

  return map[value] || value || "—";
}

function translateStatus(value) {
  const map = {
    draft: "Nháp",
    submitted: "Đã gửi",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    implemented: "Đã cập nhật lịch",
    cancelled: "Đã hủy",
  };

  return map[value] || value || "—";
}

function getActionDescription(action, request) {
  if (!request) return "";

  if (action === "approved") {
    return `Yêu cầu #${request.id} sẽ chuyển sang trạng thái Đã duyệt. Lịch chỉ thay đổi sau khi bạn bấm Triển khai.`;
  }

  if (action === "rejected") {
    return `Yêu cầu #${request.id} sẽ bị từ chối và không thể triển khai vào lịch.`;
  }

  const implementationMessages = {
    reschedule:
      "Backend sẽ cập nhật trực tiếp phòng, thứ, ca và khoảng ngày của lịch gốc.",
    makeup: "Backend sẽ tạo thêm một lịch học bù mới và giữ nguyên lịch gốc.",
    cancel: "Backend sẽ chuyển lịch gốc sang trạng thái Đã hủy.",
  };

  return `${implementationMessages[request.change_type] || "Backend sẽ áp dụng thay đổi vào lịch."} Thao tác được kiểm tra xung đột trước khi ghi dữ liệu.`;
}

function getApiErrorMessage(error) {
  const details = error?.details;

  if (Array.isArray(details) && details.length > 0) {
    return details
      .map((item) => item?.msg || item?.message || String(item))
      .filter(Boolean)
      .join(", ");
  }

  const conflictMessages = {
    ROOM_CONFLICT: "Lịch đề xuất đang trùng với lịch sử dụng phòng.",
    LECTURER_CONFLICT: "Lịch đề xuất đang trùng lịch của giảng viên.",
    ROOM_BLOCKED: "Phòng đề xuất đang bị khóa trong thời gian này.",
    HOLIDAY_BLOCKED: "Lịch đề xuất trùng với ngày nghỉ không được xếp lịch.",
  };

  if (details?.code && conflictMessages[details.code]) {
    return conflictMessages[details.code];
  }

  if (details?.current_status) {
    return `${error?.message || "Không thể thực hiện thao tác."} Trạng thái hiện tại: ${translateStatus(details.current_status)}.`;
  }

  return (
    error?.message || "API schedule-change-requests từ chối thao tác hiện tại."
  );
}

function buildCourseLabel(schedule) {
  return (
    [schedule?.course_code, schedule?.course_name]
      .filter(Boolean)
      .join(" - ") || "Học phần chưa rõ"
  );
}

function buildScheduleLabel(schedule) {
  if (!schedule) return "—";

  return [
    `#${schedule.id}`,
    buildCourseLabel(schedule),
    schedule.group_no ? `Nhóm ${schedule.group_no}` : "",
    schedule.team_no ? `Tổ TH ${schedule.team_no}` : "",
    schedule.room_code ? `Phòng ${schedule.room_code}` : "",
    formatDayOfWeek(schedule.day_of_week),
    formatTimeSlotLabel(schedule.time_slot, schedule.time_slot_id),
    `${formatDate(schedule.start_date)} → ${formatDate(schedule.end_date)}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function renderCompactCell(value) {
  const displayValue = formatFallback(value);

  return (
    <span className="academicChangeOneLine" title={String(displayValue)}>
      {displayValue}
    </span>
  );
}

function normalizeChangeOptionResult(response) {
  const apiData = response?.data || {};
  const options = Array.isArray(apiData.ranked_options)
    ? apiData.ranked_options
    : [];

  return {
    option_status:
      apiData.option_status ||
      (options.length > 0 ? "success" : "no_valid_option"),
    ranked_options: options.map((option, index) => ({
      option_key:
        option.option_key ||
        `${option.room_id}-${option.day_of_week}-${option.time_slot_id}-${option.start_date}-${index}`,
      room_id: option.room_id,
      room_code: option.room_code,
      day_of_week: option.day_of_week,
      time_slot_id: option.time_slot_id,
      time_slot: option.time_slot,
      start_date: option.start_date,
      end_date: option.end_date,
      score: Number(option.score || 0),
      reasons: Array.isArray(option.reasons) ? option.reasons : [],
    })),
    failed_reasons: Array.isArray(apiData.failed_reasons)
      ? apiData.failed_reasons
      : [],
  };
}

function buildStoredOptionFromRequest(request) {
  if (
    !request?.proposed_room_id ||
    !request?.proposed_day_of_week ||
    !request?.proposed_time_slot_id ||
    !request?.proposed_start_date ||
    !request?.proposed_end_date
  ) {
    return null;
  }

  return {
    option_key: `stored-${request.id}`,
    room_id: request.proposed_room_id,
    room_code: request.proposed_room_code,
    day_of_week: request.proposed_day_of_week,
    time_slot_id: request.proposed_time_slot_id,
    time_slot: request.proposed_time_slot,
    start_date: request.proposed_start_date,
    end_date: request.proposed_end_date,
    score: 100,
    reasons: ["Phương án đã được lưu khi duyệt yêu cầu."],
  };
}

function buildImplementationOptionPayload(option) {
  if (!option) return null;

  return {
    room_id: option.room_id,
    day_of_week: option.day_of_week,
    time_slot_id: option.time_slot_id,
    start_date: option.start_date,
    end_date: option.end_date,
  };
}

function buildStatusBadge(status) {
  return (
    <span className={`academicStatusBadge academicStatusBadge--${status}`}>
      {translateStatus(status)}
    </span>
  );
}

function buildTypeBadge(type) {
  return (
    <span className={`academicStatusBadge academicChangeType--${type}`}>
      {translateChangeType(type)}
    </span>
  );
}

export default function AcademicChangeRequestsPage() {
  const [schedules, setSchedules] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [changeTypeFilter, setChangeTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entryFilter, setEntryFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [uiMessage, setUiMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [changeOptionResult, setChangeOptionResult] = useState(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [isCheckingOptions, setIsCheckingOptions] = useState(false);

  const loadPageData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const [changeRequestResponse, scheduleResponse] = await Promise.all([
        listScheduleChangeRequests(),
        listSchedules({ status: "published" }).catch(() => ({ data: [] })),
      ]);

      const publishedSchedules = extractItems(scheduleResponse).filter(
        (schedule) =>
          String(
            schedule.entry_status || schedule.status || "",
          ).toLowerCase() === "published",
      );
      const apiRequests = extractItems(changeRequestResponse);

      setSchedules(publishedSchedules);
      setRequests(apiRequests);
      setSelectedRequestId((currentId) => {
        const selectedStillExists = apiRequests.some(
          (request) => String(request.id) === String(currentId),
        );

        return selectedStillExists
          ? String(currentId)
          : String(apiRequests[0]?.id || "");
      });
    } catch (error) {
      setLoadError(
        error?.message ||
          "Không thể tải danh sách yêu cầu đổi/bù/hủy lịch từ API.",
      );
      setSchedules([]);
      setRequests([]);
      setSelectedRequestId("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const selectedRequest = useMemo(
    () => requests.find((request) => String(request.id) === selectedRequestId),
    [requests, selectedRequestId],
  );

  const storedChangeOption = useMemo(
    () => buildStoredOptionFromRequest(selectedRequest),
    [selectedRequest],
  );

  const changeOptions = useMemo(
    () => changeOptionResult?.ranked_options || [],
    [changeOptionResult],
  );

  const selectedChangeOption = useMemo(() => {
    const selectedOption = changeOptions.find(
      (option) => String(option.option_key) === String(selectedOptionKey),
    );

    return (
      selectedOption || (changeOptions.length === 0 ? storedChangeOption : null)
    );
  }, [changeOptions, selectedOptionKey, storedChangeOption]);

  useEffect(() => {
    setReviewNotes(selectedRequest?.review_notes || "");
    setChangeOptionResult(null);
    setSelectedOptionKey("");
  }, [selectedRequest]);

  const visibleRequests = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    return requests.filter((request) => {
      const matchedType =
        changeTypeFilter === "all" || request.change_type === changeTypeFilter;
      const matchedStatus =
        statusFilter === "all" || request.request_status === statusFilter;
      const matchedEntry =
        entryFilter === "all" ||
        String(request.schedule?.id) === String(entryFilter);
      const searchableText = [
        request.id,
        request.requested_by_name,
        request.reason_text,
        request.review_notes,
        buildScheduleLabel(request.schedule),
        request.proposed_room_code,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchedType &&
        matchedStatus &&
        matchedEntry &&
        (!normalizedKeyword || searchableText.includes(normalizedKeyword))
      );
    });
  }, [changeTypeFilter, entryFilter, requests, searchKeyword, statusFilter]);

  const scheduleFilterOptions = useMemo(() => {
    const scheduleMap = new Map();

    schedules.forEach((schedule) => {
      if (schedule?.id) scheduleMap.set(String(schedule.id), schedule);
    });

    requests.forEach((request) => {
      if (request?.schedule?.id) {
        scheduleMap.set(String(request.schedule.id), request.schedule);
      }
    });

    return Array.from(scheduleMap.values());
  }, [requests, schedules]);

  const rows = useMemo(
    () =>
      visibleRequests.map((request) => ({
        ...request,
        lab_schedule_entry_id: request.schedule?.id,
        original_schedule: buildScheduleLabel(request.schedule),
        change_type_label: request.change_type,
        proposed_date_range:
          request.proposed_start_date || request.proposed_end_date
            ? `${formatDate(request.proposed_start_date)} → ${formatDate(
                request.proposed_end_date,
              )}`
            : "—",
        proposed_day: formatDayOfWeek(request.proposed_day_of_week),
        proposed_time_slot: formatTimeSlotLabel(
          request.proposed_time_slot,
          request.proposed_time_slot_id,
        ),
        proposed_room: formatFallback(request.proposed_room_code),
        request_status_label: request.request_status,
        reviewed_at_label: formatDateTime(request.reviewed_at),
        implemented_at_label: formatDateTime(request.implemented_at),
        implemented_by_label: formatFallback(request.implemented_by_name),
        review_notes_label: formatFallback(request.review_notes),
        updated_at_label: formatDateTime(
          request.updated_at || request.implemented_at || request.reviewed_at,
        ),
      })),
    [visibleRequests],
  );

  const columns = useMemo(
    () => [
      {
        key: "change_type_label",
        label: "Loại yêu cầu",
        render: (value) => buildTypeBadge(value),
      },
      {
        key: "original_schedule",
        label: "Ca thực hành gốc",
        render: renderCompactCell,
      },
      {
        key: "proposed_date_range",
        label: "Ngày đề xuất",
        render: renderCompactCell,
      },
      { key: "proposed_day", label: "Thứ đề xuất", render: renderCompactCell },
      {
        key: "proposed_time_slot",
        label: "Ca/tiết đề xuất",
        render: renderCompactCell,
      },
      { key: "reason_text", label: "Lý do", render: renderCompactCell },
      {
        key: "requested_by_name",
        label: "Người tạo",
        render: renderCompactCell,
      },
      {
        key: "updated_at_label",
        label: "Thời điểm cập nhật",
        render: renderCompactCell,
      },
      {
        key: "request_status_label",
        label: "Trạng thái",
        render: (value) => buildStatusBadge(value),
      },
      {
        key: "action",
        label: "Chi tiết",
        render: (_, row) => (
          <ButtonUI
            type="button"
            size="sm"
            className="academicPrimaryButton"
            onClick={() => {
              setSelectedRequestId(String(row.id));
              setReviewNotes(row.review_notes || "");
              setUiMessage(null);
            }}
          >
            Xem
          </ButtonUI>
        ),
      },
    ],
    [],
  );

  const optionColumns = useMemo(
    () => [
      {
        key: "room_code",
        label: "Phòng",
        render: (value) => <strong>{value}</strong>,
      },
      {
        key: "day_of_week",
        label: "Thứ",
        render: (value) => formatDayOfWeek(value),
      },
      {
        key: "time_slot",
        label: "Ca",
        render: (value, row) => formatTimeSlotLabel(value, row.time_slot_id),
      },
      {
        key: "start_date",
        label: "Thời gian",
        render: (value, row) =>
          `${formatDate(value)} → ${formatDate(row.end_date)}`,
      },
      {
        key: "score",
        label: "Điểm",
        render: (value) => <strong>{Math.min(Number(value || 0), 100)}</strong>,
      },
      {
        key: "action",
        label: "Chọn",
        render: (_, row) => {
          const isSelected =
            String(row.option_key) === String(selectedOptionKey);

          return (
            <ButtonUI
              type="button"
              size="sm"
              tone={isSelected ? "primary" : "outline"}
              className={
                isSelected ? "academicPrimaryButton" : "academicGhostButton"
              }
              onClick={() => setSelectedOptionKey(row.option_key)}
            >
              {isSelected ? "Đã chọn" : "Chọn"}
            </ButtonUI>
          );
        },
      },
    ],
    [selectedOptionKey],
  );

  function requestAction(nextStatus) {
    if (!selectedRequest) {
      setUiMessage({
        type: "error",
        title: "Chưa chọn yêu cầu",
        text: "Vui lòng chọn một yêu cầu đổi/bù/hủy lịch để thao tác.",
      });
      return;
    }

    setUiMessage(null);
    setPendingAction(nextStatus);
  }

  async function handleCheckValidOptions() {
    if (!selectedRequest) {
      setUiMessage({
        type: "error",
        title: "Chưa chọn yêu cầu",
        text: "Vui lòng chọn một yêu cầu trước khi kiểm tra hợp lệ.",
      });
      return;
    }

    if (selectedRequest.change_type === "cancel") {
      setUiMessage({
        type: "error",
        title: "Không hỗ trợ hủy độc lập",
        text: "Yêu cầu hủy lịch nên được xử lý bằng đổi lịch hoặc học bù.",
      });
      return;
    }

    try {
      setIsCheckingOptions(true);
      setUiMessage(null);
      setChangeOptionResult(null);
      setSelectedOptionKey("");

      const response = await getScheduleChangeOptions(selectedRequest.id);
      const normalized = normalizeChangeOptionResult(response);

      setChangeOptionResult(normalized);

      if (normalized.ranked_options.length > 0) {
        setSelectedOptionKey(normalized.ranked_options[0].option_key);
        setUiMessage({
          type: "success",
          title: "Có phương án hợp lệ",
          text: `Backend tìm thấy ${normalized.ranked_options.length} phương án có thể triển khai.`,
        });
      } else {
        setUiMessage({
          type: "error",
          title: "Không có phương án hợp lệ",
          text: "Không thể duyệt yêu cầu vì backend không tìm thấy phương án triển khai phù hợp.",
        });
      }
    } catch (error) {
      setUiMessage({
        type: "error",
        title: "Không thể kiểm tra hợp lệ",
        text: getApiErrorMessage(error),
      });
    } finally {
      setIsCheckingOptions(false);
    }
  }

  async function handleConfirmedAction() {
    if (!selectedRequest || !pendingAction) return;

    try {
      setIsMutating(true);

      const implementationOptionPayload =
        buildImplementationOptionPayload(selectedChangeOption);
      const response =
        pendingAction === "implemented"
          ? await implementScheduleChangeRequest(selectedRequest.id, {
              review_notes: reviewNotes,
              implementation_option: implementationOptionPayload,
            })
          : await reviewScheduleChangeRequest(selectedRequest.id, {
              request_status: pendingAction,
              review_notes: reviewNotes,
              implementation_option:
                pendingAction === "approved"
                  ? implementationOptionPayload
                  : undefined,
            });

      const updatedRequest =
        response?.data?.change_request || response?.data || selectedRequest;

      setPendingAction("");
      await loadPageData();
      setUiMessage({
        type: "success",
        title:
          pendingAction === "implemented"
            ? "Đã triển khai vào lịch"
            : "Đã cập nhật yêu cầu",
        text: `Yêu cầu #${updatedRequest.id} đang ở trạng thái ${translateStatus(updatedRequest.request_status)}.`,
      });
    } catch (error) {
      setPendingAction("");
      setUiMessage({
        type: "error",
        title: "Không thể cập nhật yêu cầu",
        text: getApiErrorMessage(error),
      });
    } finally {
      setIsMutating(false);
    }
  }

  const pendingActionConfig = ACTION_CONFIG[pendingAction] || null;
  const hasValidChangeOption = changeOptions.length > 0;
  const canCheckOptions =
    selectedRequest &&
    selectedRequest.change_type !== "cancel" &&
    ["submitted", "approved"].includes(selectedRequest.request_status);
  const canReview = selectedRequest?.request_status === "submitted";
  const canApprove =
    canReview && hasValidChangeOption && Boolean(selectedChangeOption);
  const canImplement =
    selectedRequest?.request_status === "approved" &&
    Boolean(selectedChangeOption);
  const canEditReviewNotes = canReview || canImplement;

  return (
    <div className="academicPageStack academicChangeRequestPage">
      {loadError ? (
        <section className="academicAlert academicAlert--error" role="alert">
          <h3>Không tải được dữ liệu</h3>
          <p>{loadError}</p>
        </section>
      ) : null}

      {uiMessage ? (
        <section className={`academicAlert academicAlert--${uiMessage.type}`}>
          <button
            type="button"
            className="academicAlertClose"
            onClick={() => setUiMessage(null)}
            aria-label="Tắt thông báo"
          >
            ×
          </button>
          <h3>{uiMessage.title}</h3>
          <p>{uiMessage.text}</p>
        </section>
      ) : null}

      <section className="academicPanel">
        <div className="academicPanelHeader academicChangeRequestHeader">
          <div>
            <h2>Danh sách yêu cầu từ giảng viên</h2>
            <p>
              Hiển thị {visibleRequests.length} trong tổng số {requests.length}{" "}
              yêu cầu.
            </p>
          </div>

          <div className="academicHeroActions academicChangeHeaderActions">
            <RefreshButton
              onClick={loadPageData}
              disabled={isLoading || isMutating}
            >
              {isLoading ? "Đang tải..." : "Làm mới"}
            </RefreshButton>
            <span className="academicDataBadge academicDataBadge--warning">
              {requests.length} yêu cầu
            </span>
          </div>
        </div>

        <div className="academicToolbar">
          <label className="academicField">
            <span>Tìm kiếm</span>
            <input
              className="academicControl"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm theo giảng viên, lý do, phòng, mã yêu cầu..."
            />
          </label>

          <label className="academicField">
            <span>Trạng thái</span>
            <select
              className="academicControl"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {REQUEST_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="academicField">
            <span>Ca thực hành gốc</span>
            <select
              className="academicControl"
              value={entryFilter}
              onChange={(event) => setEntryFilter(event.target.value)}
            >
              <option value="all">Tất cả ca thực hành</option>
              {scheduleFilterOptions.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {buildScheduleLabel(schedule)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="academicTwoColumnLayout">
        <section className="academicPanel academicChangeRequestTablePanel">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey="id"
            loading={isLoading}
            emptyTitle="Chưa có yêu cầu phù hợp"
            emptyDescription="Không có yêu cầu đổi/bù/hủy lịch phù hợp bộ lọc hiện tại."
            pageSize={6}
          />
        </section>

        <aside className="academicPanel academicAsidePanel academicChangeDetailPanel">
          <div className="academicPanelHeader academicChangeDetailHeader">
            <div>
              <h2>Thông tin yêu cầu</h2>
            </div>
          </div>

          {selectedRequest ? (
            <>
              <div className="academicInfoGrid academicChangeDetailGrid">
                <div className="academicInfoItem academicInfoItemHighlight academicChangeTypeItem">
                  <span>Loại yêu cầu</span>
                  <strong>
                    {translateChangeType(selectedRequest.change_type)}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Trạng thái</span>
                  <strong>
                    {buildStatusBadge(selectedRequest.request_status)}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Ca gốc</span>
                  <strong>
                    {formatTimeSlotLabel(
                      selectedRequest.schedule?.time_slot,
                      selectedRequest.schedule?.time_slot_id,
                    )}
                  </strong>
                </div>
                <div className="academicInfoItem academicFieldFull academicChangeOriginalSchedule">
                  <span>Lịch gốc</span>
                  <strong>
                    {buildScheduleLabel(selectedRequest.schedule)}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Người tạo</span>
                  <strong>
                    {formatFallback(selectedRequest.requested_by_name)}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Thời điểm cập nhật</span>
                  <strong>
                    {formatDateTime(
                      selectedRequest.updated_at ||
                        selectedRequest.implemented_at ||
                        selectedRequest.reviewed_at,
                    )}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Phòng đề xuất</span>
                  <strong>
                    {formatFallback(selectedRequest.proposed_room_code)}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Thứ / ca đề xuất</span>
                  <strong>
                    {formatDayOfWeek(selectedRequest.proposed_day_of_week)}
                    {" | "}
                    {formatTimeSlotLabel(
                      selectedRequest.proposed_time_slot,
                      selectedRequest.proposed_time_slot_id,
                    )}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Ngày đề xuất</span>
                  <strong>
                    {formatDate(selectedRequest.proposed_start_date)} →{" "}
                    {formatDate(selectedRequest.proposed_end_date)}
                  </strong>
                </div>
              </div>

              <section className="academicPanel" style={{ padding: 12 }}>
                <div className="academicPanelHeader">
                  <div>
                    <h2>Kết quả</h2>
                  </div>
                </div>

                {changeOptions.length > 0 ? (
                  <DataTable
                    columns={optionColumns}
                    rows={changeOptions}
                    rowKey="option_key"
                    pageSize={3}
                    enablePagination={false}
                  />
                ) : storedChangeOption ? null : (
                  <div className="academicEmptyBox">
                    <h2>Chưa có kết quả</h2>
                  </div>
                )}
              </section>
              <label className="academicField">
                <span>Lý do giảng viên nhập</span>
                <textarea
                  className="academicControl academicTextarea academicChangeTextarea"
                  value={selectedRequest.reason_text}
                  readOnly
                />
              </label>

              <label className="academicField">
                <span>Ghi chú của người duyệt</span>
                <textarea
                  className="academicControl academicTextarea academicChangeTextarea"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Nhập ghi chú duyệt/từ chối/cập nhật lịch..."
                  disabled={isMutating || !canEditReviewNotes}
                />
              </label>

              <div className="academicFormActions">
                <ButtonUI
                  type="button"
                  tone="outline"
                  className="academicGhostButton"
                  onClick={handleCheckValidOptions}
                  disabled={isMutating || isCheckingOptions || !canCheckOptions}
                >
                  {isCheckingOptions ? "Đang kiểm tra..." : "Kiểm tra hợp lệ"}
                </ButtonUI>
                <ButtonUI
                  type="button"
                  className="academicPrimaryButton"
                  onClick={() => requestAction("approved")}
                  disabled={isMutating || !canApprove}
                >
                  {isMutating ? "Đang xử lý..." : "Duyệt yêu cầu"}
                </ButtonUI>

                <ButtonUI
                  type="button"
                  tone="outline"
                  className="academicGhostButton"
                  onClick={() => requestAction("rejected")}
                  disabled={isMutating || !canReview}
                >
                  Từ chối
                </ButtonUI>

                <ButtonUI
                  type="button"
                  tone="outline"
                  className="academicGhostButton"
                  onClick={() => requestAction("implemented")}
                  disabled={isMutating || !canImplement}
                >
                  Triển khai vào lịch
                </ButtonUI>
              </div>
            </>
          ) : (
            <div className="academicEmptyBox">
              <h2>Chưa chọn yêu cầu</h2>
              <p>Bấm “Xem” trên bảng để mở chi tiết xử lý.</p>
            </div>
          )}
        </aside>
      </section>

      <ConfirmDialog
        open={Boolean(pendingActionConfig)}
        eyebrow={pendingActionConfig?.eyebrow}
        title={pendingActionConfig?.title}
        message={getActionDescription(pendingAction, selectedRequest)}
        confirmLabel={pendingActionConfig?.confirmLabel}
        tone={pendingActionConfig?.tone}
        isSubmitting={isMutating}
        onCancel={() => {
          if (!isMutating) setPendingAction("");
        }}
        onConfirm={handleConfirmedAction}
      />
    </div>
  );
}
