"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { listSchedules } from "../../../services/scheduleService";
import {
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
    schedule.time_slot,
    `${formatDate(schedule.start_date)} → ${formatDate(schedule.end_date)}`,
  ]
    .filter(Boolean)
    .join(" | ");
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

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
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

        if (!isMounted) return;

        setSchedules(publishedSchedules);
        setRequests(apiRequests);
        setSelectedRequestId(String(apiRequests[0]?.id || ""));
        setReviewNotes(apiRequests[0]?.review_notes || "");
      } catch (error) {
        if (!isMounted) return;

        setLoadError(
          error?.message ||
            "Không thể tải danh sách yêu cầu đổi/bù/hủy lịch từ API.",
        );
        setSchedules([]);
        setRequests([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedRequest = useMemo(
    () => requests.find((request) => String(request.id) === selectedRequestId),
    [requests, selectedRequestId],
  );

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
        proposed_time_slot:
          request.proposed_time_slot ||
          (request.proposed_time_slot_id === 1
            ? "Tiết 1-4"
            : request.proposed_time_slot_id === 2
              ? "Tiết 7-10"
              : "—"),
        proposed_room: formatFallback(request.proposed_room_code),
        request_status_label: request.request_status,
        reviewed_at_label: formatDateTime(request.reviewed_at),
        implemented_at_label: formatDateTime(request.implemented_at),
        implemented_by_label: formatFallback(request.implemented_by_name),
        review_notes_label: formatFallback(request.review_notes),
      })),
    [visibleRequests],
  );

  const columns = useMemo(
    () => [
      { key: "id", label: "Mã YC" },
      {
        key: "change_type_label",
        label: "Loại yêu cầu",
        render: (value) => buildTypeBadge(value),
      },
      { key: "lab_schedule_entry_id", label: "Mã ca gốc" },
      { key: "original_schedule", label: "Ca thực hành gốc" },
      { key: "proposed_date_range", label: "Ngày đề xuất" },
      { key: "proposed_day", label: "Thứ đề xuất" },
      { key: "proposed_time_slot", label: "Ca/tiết đề xuất" },
      { key: "proposed_room", label: "Phòng đề xuất" },
      { key: "reason_text", label: "Lý do" },
      { key: "requested_by_user_id", label: "Người tạo ID" },
      { key: "requested_by_name", label: "Người tạo" },
      { key: "implemented_by_label", label: "Người cập nhật lịch" },
      { key: "reviewed_at_label", label: "Thời điểm duyệt" },
      { key: "implemented_at_label", label: "Thời điểm cập nhật" },
      { key: "review_notes_label", label: "Ghi chú duyệt" },
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

  function updateRequestInList(updatedRequest) {
    if (!updatedRequest) return;

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        String(request.id) === String(updatedRequest.id)
          ? updatedRequest
          : request,
      ),
    );
    setSelectedRequestId(String(updatedRequest.id));
    setReviewNotes(updatedRequest.review_notes || "");
  }

  async function handleReview(nextStatus) {
    if (!selectedRequest) {
      setUiMessage({
        type: "error",
        title: "Chưa chọn yêu cầu",
        text: "Vui lòng chọn một yêu cầu đổi/bù/hủy lịch để thao tác.",
      });
      return;
    }

    try {
      setIsMutating(true);

      const response =
        nextStatus === "implemented"
          ? await implementScheduleChangeRequest(selectedRequest.id, {
              review_notes: reviewNotes,
            })
          : await reviewScheduleChangeRequest(selectedRequest.id, {
              request_status: nextStatus,
              review_notes: reviewNotes,
            });

      const updatedRequest =
        response?.data?.change_request || response?.data || selectedRequest;

      updateRequestInList(updatedRequest);
      setUiMessage({
        type: "success",
        title: "Đã cập nhật yêu cầu",
        text: `Yêu cầu #${updatedRequest.id} đang ở trạng thái ${updatedRequest.request_status}.`,
      });
    } catch (error) {
      setUiMessage({
        type: "error",
        title: "Không thể cập nhật yêu cầu",
        text:
          error?.message ||
          "API schedule-change-requests từ chối thao tác hiện tại.",
      });
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="academicPageStack">
      <section className="academicHero">
        <div className="academicHeroBody">
          <p className="academicEyebrow">Cán bộ đào tạo</p>
          <h1 className="academicHeroTitle">Yêu cầu đổi / bù / hủy lịch</h1>
          <p className="academicHeroText">
            Theo dõi các đề xuất từ giảng viên. Lịch gốc và phòng máy được lấy
            từ API thật, bảng yêu cầu được tải trực tiếp từ backend.
          </p>
        </div>

        <span className="academicDataBadge academicDataBadge--warning">
          API lab_schedule_change_requests
        </span>
      </section>

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
        <div className="academicPanelHeader">
          <div>
            <p className="academicEyebrow">Bộ lọc</p>
            <h2>Danh sách yêu cầu từ giảng viên</h2>
            <p>
              Hiển thị đầy đủ thông tin theo bảng lab_schedule_change_requests.
            </p>
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
            <span>Loại yêu cầu</span>
            <select
              className="academicControl"
              value={changeTypeFilter}
              onChange={(event) => setChangeTypeFilter(event.target.value)}
            >
              {CHANGE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {buildScheduleLabel(schedule)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="academicTwoColumnLayout">
        <section className="academicPanel">
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

        <aside className="academicPanel academicAsidePanel">
          <div className="academicPanelHeader">
            <div>
              <p className="academicEyebrow">Chi tiết xử lý</p>
              <h2>Thông tin yêu cầu</h2>
              <p>CBDT/QTV xem chi tiết, duyệt và cập nhật trạng thái bằng API thật.</p>
            </div>
          </div>

          {selectedRequest ? (
            <>
              <div className="academicInfoGrid">
                <div className="academicInfoItem academicInfoItemHighlight">
                  <span>Loại yêu cầu</span>
                  <strong>
                    {translateChangeType(selectedRequest.change_type)}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Ca gốc</span>
                  <strong>
                    {formatFallback(selectedRequest.schedule?.id)}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Người tạo</span>
                  <strong>
                    {formatFallback(selectedRequest.requested_by_name)}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Lịch gốc</span>
                  <strong>
                    {buildScheduleLabel(selectedRequest.schedule)}
                  </strong>
                </div>
                <div className="academicInfoItem">
                  <span>Phòng đề xuất</span>
                  <strong>
                    {formatFallback(selectedRequest.proposed_room_code)}
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

              <label className="academicField">
                <span>Lý do giảng viên nhập</span>
                <textarea
                  className="academicControl academicTextarea"
                  value={selectedRequest.reason_text}
                  readOnly
                />
              </label>

              <label className="academicField">
                <span>Ghi chú của người duyệt</span>
                <textarea
                  className="academicControl academicTextarea"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Nhập ghi chú duyệt/từ chối/cập nhật lịch..."
                />
              </label>

              <div className="academicFormActions">
                <ButtonUI
                  type="button"
                  className="academicPrimaryButton"
                  onClick={() => handleReview("approved")}
                  disabled={isMutating || selectedRequest.request_status !== "submitted"}
                >
                  {isMutating ? "Đang xử lý..." : "Duyệt yêu cầu"}
                </ButtonUI>

                <ButtonUI
                  type="button"
                  tone="outline"
                  className="academicGhostButton"
                  onClick={() => handleReview("rejected")}
                  disabled={isMutating || selectedRequest.request_status !== "submitted"}
                >
                  Từ chối
                </ButtonUI>

                <ButtonUI
                  type="button"
                  tone="outline"
                  className="academicGhostButton"
                  onClick={() => handleReview("implemented")}
                  disabled={isMutating || selectedRequest.request_status !== "approved"}
                >
                  Đánh dấu đã cập nhật lịch
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
    </div>
  );
}
