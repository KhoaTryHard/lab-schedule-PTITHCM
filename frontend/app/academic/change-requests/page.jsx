"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { getUser } from "../../../lib/authStorage";
import { listSchedules } from "../../../services/scheduleService";
import { getRooms } from "../../../services/roomService";

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

function buildMockChangeRequests(schedules, rooms) {
  const [firstSchedule, secondSchedule, thirdSchedule] = schedules;
  const [firstRoom, secondRoom] = rooms;

  const baseItems = [
    {
      id: "mock-cr-1",
      schedule: firstSchedule,
      change_type: "reschedule",
      proposed_start_date: "2026-05-06",
      proposed_end_date: "2026-05-06",
      proposed_day_of_week: 4,
      proposed_time_slot_id: 2,
      proposed_room_id: secondRoom?.id || firstSchedule?.room_id || null,
      proposed_room_code:
        secondRoom?.room_code || firstSchedule?.room_code || "—",
      reason_text:
        "Giảng viên bận công tác đột xuất, đề xuất chuyển sang ca khác trong cùng tuần.",
      request_status: "submitted",
      requested_by_user_id: firstSchedule?.lecturer_user_id || 4,
      requested_by_name: firstSchedule?.lecturer_name || "Giảng viên phụ trách",
      implemented_by_user_id: null,
      implemented_by_name: null,
      reviewed_at: null,
      implemented_at: null,
      review_notes: "",
      created_at: "2026-04-28T08:30:00",
    },
    {
      id: "mock-cr-2",
      schedule: secondSchedule || firstSchedule,
      change_type: "makeup",
      proposed_start_date: "2026-05-09",
      proposed_end_date: "2026-05-09",
      proposed_day_of_week: 7,
      proposed_time_slot_id: 1,
      proposed_room_id: firstRoom?.id || secondSchedule?.room_id || null,
      proposed_room_code:
        firstRoom?.room_code || secondSchedule?.room_code || "—",
      reason_text:
        "Buổi học bị ảnh hưởng do sự cố mạng, giảng viên đề xuất tổ chức học bù.",
      request_status: "approved",
      requested_by_user_id: secondSchedule?.lecturer_user_id || 5,
      requested_by_name:
        secondSchedule?.lecturer_name || "Giảng viên phụ trách",
      implemented_by_user_id: null,
      implemented_by_name: null,
      reviewed_at: "2026-04-28T09:15:00",
      implemented_at: null,
      review_notes: "Đã kiểm tra phòng đề xuất, chờ cập nhật lịch chính thức.",
      created_at: "2026-04-28T08:45:00",
    },
    {
      id: "mock-cr-3",
      schedule: thirdSchedule || firstSchedule,
      change_type: "cancel",
      proposed_start_date: null,
      proposed_end_date: null,
      proposed_day_of_week: null,
      proposed_time_slot_id: null,
      proposed_room_id: null,
      proposed_room_code: null,
      reason_text:
        "Nội dung thực hành đã được gộp vào buổi trước, giảng viên đề xuất hủy buổi còn lại.",
      request_status: "implemented",
      requested_by_user_id: thirdSchedule?.lecturer_user_id || 6,
      requested_by_name: thirdSchedule?.lecturer_name || "Giảng viên phụ trách",
      implemented_by_user_id: 2,
      implemented_by_name: "Cán bộ đào tạo HVCS",
      reviewed_at: "2026-04-28T10:20:00",
      implemented_at: "2026-04-28T10:45:00",
      review_notes: "Đã cập nhật lịch và ghi chú lý do hủy.",
      created_at: "2026-04-28T09:40:00",
    },
  ];

  return baseItems.filter((item) => item.schedule);
}

export default function AcademicChangeRequestsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [changeTypeFilter, setChangeTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entryFilter, setEntryFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [uiMessage, setUiMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      setCurrentUser(getUser());

      try {
        setIsLoading(true);
        setLoadError("");

        const [scheduleResponse, roomResponse] = await Promise.all([
          listSchedules({ status: "published" }),
          getRooms().catch(() => ({ data: [] })),
        ]);

        const publishedSchedules = extractItems(scheduleResponse).filter(
          (schedule) =>
            String(
              schedule.entry_status || schedule.status || "",
            ).toLowerCase() === "published",
        );
        const roomItems = extractItems(roomResponse);
        const mockRequests = buildMockChangeRequests(
          publishedSchedules,
          roomItems,
        );

        if (!isMounted) return;

        setSchedules(publishedSchedules);
        setRooms(roomItems);
        setRequests(mockRequests);
        setSelectedRequestId(String(mockRequests[0]?.id || ""));
        setReviewNotes(mockRequests[0]?.review_notes || "");
      } catch (error) {
        if (!isMounted) return;

        setLoadError(
          error?.message ||
            "Không thể tải dữ liệu lịch/phòng thật để dựng danh sách yêu cầu.",
        );
        setSchedules([]);
        setRooms([]);
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
          request.proposed_time_slot_id === 1
            ? "Tiết 1-4"
            : request.proposed_time_slot_id === 2
              ? "Tiết 7-10"
              : "—",
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

  function mockReview(nextStatus) {
    if (!selectedRequest) {
      setUiMessage({
        type: "error",
        title: "Chưa chọn yêu cầu",
        text: "Vui lòng chọn một yêu cầu đổi/bù/hủy lịch để thao tác.",
      });
      return;
    }

    const nextImplementedAt =
      nextStatus === "implemented"
        ? new Date().toISOString()
        : selectedRequest.implemented_at;

    setRequests((currentRequests) =>
      currentRequests.map((request) => {
        if (request.id !== selectedRequest.id) return request;

        return {
          ...request,
          request_status: nextStatus,
          reviewed_at: request.reviewed_at || new Date().toISOString(),
          implemented_at: nextImplementedAt,
          implemented_by_user_id:
            nextStatus === "implemented"
              ? currentUser?.id || request.implemented_by_user_id
              : request.implemented_by_user_id,
          implemented_by_name:
            nextStatus === "implemented"
              ? currentUser?.full_name || "Cán bộ đào tạo"
              : request.implemented_by_name,
          review_notes: reviewNotes,
        };
      }),
    );

    setUiMessage({
      type: "success",
      title: "Đã cập nhật trên UI mock",
      text: "Backend hiện thiếu API lab_schedule_change_requests nên thao tác duyệt/chỉnh trạng thái chưa ghi xuống database.",
    });
  }

  return (
    <div className="academicPageStack">
      <section className="academicHero">
        <div className="academicHeroBody">
          <p className="academicEyebrow">Cán bộ đào tạo</p>
          <h1 className="academicHeroTitle">Yêu cầu đổi / bù / hủy lịch</h1>
          <p className="academicHeroText">
            Theo dõi các đề xuất từ giảng viên. Lịch gốc và phòng máy được lấy
            từ API thật, còn bảng yêu cầu đang mock vì backend chưa có endpoint.
          </p>
        </div>

        <span className="academicDataBadge academicDataBadge--warning">
          Thiếu API lab_schedule_change_requests
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
              <p>CBDT/QTV xem chi tiết và ghi chú duyệt trên UI mock.</p>
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
                  onClick={() => mockReview("approved")}
                >
                  Duyệt yêu cầu
                </ButtonUI>

                <ButtonUI
                  type="button"
                  tone="outline"
                  className="academicGhostButton"
                  onClick={() => mockReview("rejected")}
                >
                  Từ chối
                </ButtonUI>

                <ButtonUI
                  type="button"
                  tone="outline"
                  className="academicGhostButton"
                  onClick={() => mockReview("implemented")}
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
