"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { getUser } from "../../../lib/authStorage";
import { listSchedules } from "../../../services/scheduleService";
import {
  createRoomIssue,
  listRoomIssues,
} from "../../../services/roomOperationService";

const INITIAL_FORM_STATE = {
  lab_schedule_entry_id: "",
  issue_type: "other",
  severity: "critical",
  issue_title: "",
  issue_description: "",
};

function extractScheduleItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function formatFallback(value) {
  return value === undefined || value === null || String(value).trim() === ""
    ? "—"
    : value;
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

function getScheduleSource(item) {
  return item?.schedule || item || {};
}

function formatTimeSlotLabel(value) {
  const rawValue = String(value || "").toLowerCase();

  if (
    rawValue.includes("chiều") ||
    rawValue.includes("7") ||
    rawValue.includes("10")
  ) {
    return "Ca chiều";
  }

  if (
    rawValue.includes("sáng") ||
    rawValue.includes("1") ||
    rawValue.includes("4")
  ) {
    return "Ca sáng";
  }

  return value || "—";
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

function translateIssueStatus(value) {
  const map = {
    new: "Mới báo cáo",
    in_progress: "Đang xử lý",
    resolved: "Đã khắc phục",
    closed: "Đã đóng",
  };

  return map[value] || value || "—";
}

function buildCoursePracticeLabel(item) {
  const schedule = getScheduleSource(item);
  const groupTeamLabel = [schedule?.group_no, schedule?.team_no]
    .filter(Boolean)
    .join("-");

  return [schedule?.course_name || schedule?.course_code, groupTeamLabel]
    .filter(Boolean)
    .join(" | ");
}

function buildScheduleSlotLabel(item) {
  const schedule = getScheduleSource(item);

  return [
    schedule?.room_code ? `Phòng ${schedule.room_code}` : "",
    formatDayOfWeek(schedule?.day_of_week),
    formatTimeSlotLabel(schedule?.time_slot),
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildScheduleLabel(schedule) {
  return [buildCoursePracticeLabel(schedule), buildScheduleSlotLabel(schedule)]
    .filter(Boolean)
    .join(" | ");
}

function buildReportScheduleLabel(report) {
  const schedule = getScheduleSource(report);
  const groupTeamLabel = [schedule?.group_no, schedule?.team_no]
    .filter(Boolean)
    .join("-");

  return [
    schedule?.course_name || schedule?.course_code,
    groupTeamLabel,
    formatDateOnly(schedule?.start_date),
    formatTimeSlotLabel(schedule?.time_slot),
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildIssueStatusBadge(value) {
  return (
    <span className={`lecturerStatusBadge lecturerIssueStatus--${value}`}>
      {translateIssueStatus(value)}
    </span>
  );
}

function isPublishedSchedule(schedule) {
  return (
    String(schedule?.entry_status || schedule?.status || "")
      .trim()
      .toLowerCase() === "published"
  );
}

function buildIssuePayload(formState) {
  return {
    lab_schedule_entry_id: Number(formState.lab_schedule_entry_id),
    issue_type: "other",
    severity: "critical",
    issue_title: formState.issue_title.trim(),
    issue_description: formState.issue_description.trim(),
    issue_status: "new",
    detected_at: new Date().toISOString(),
  };
}

export default function LecturerRoomIssuesPage() {
  const [schedules, setSchedules] = useState([]);
  const [reports, setReports] = useState([]);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLecturerSchedules() {
      const user = getUser();

      try {
        setIsLoadingSchedules(true);
        setLoadError("");

        const [scheduleResponse, issueResponse] = await Promise.all([
          listSchedules({
            status: "published",
            lecturer_user_id: user?.id,
          }),
          listRoomIssues().catch(() => ({ data: { items: [] } })),
        ]);

        const publishedSchedules =
          extractScheduleItems(scheduleResponse).filter(isPublishedSchedule);
        const apiReports = extractScheduleItems(issueResponse);

        if (!isMounted) return;

        setSchedules(publishedSchedules);
        setReports(apiReports);
        setFormState((current) => ({
          ...current,
          lab_schedule_entry_id:
            current.lab_schedule_entry_id ||
            String(publishedSchedules[0]?.id || ""),
        }));
      } catch (error) {
        if (!isMounted) return;

        setSchedules([]);
        setReports([]);
        setLoadError(
          error?.message ||
            "Không thể tải lịch thực hành đã công bố của giảng viên.",
        );
      } finally {
        if (isMounted) setIsLoadingSchedules(false);
      }
    }

    loadLecturerSchedules();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSchedule = useMemo(
    () =>
      schedules.find(
        (schedule) => String(schedule.id) === formState.lab_schedule_entry_id,
      ) || null,
    [formState.lab_schedule_entry_id, schedules],
  );

  const rows = useMemo(
    () =>
      reports.map((report) => ({
        ...report,
        report_schedule_label: buildReportScheduleLabel(report),
        issue_title_label: formatFallback(report.issue_title),
        issue_description_label: formatFallback(report.issue_description),
        issue_status_label: report.issue_status,
        detected_at_label: formatDateTime(report.detected_at),
      })),
    [reports],
  );

  const columns = useMemo(
    () => [
      {
        key: "report_schedule_label",
        label: "Thông tin ca báo cáo",
        render: (value) => (
          <span className="academicChangeOneLine" title={String(value || "")}>
            {formatFallback(value)}
          </span>
        ),
      },
      {
        key: "issue_title_label",
        label: "Tiêu đề",
        render: (value) => (
          <span className="academicChangeOneLine" title={String(value || "")}>
            {formatFallback(value)}
          </span>
        ),
      },
      {
        key: "issue_description_label",
        label: "Mô tả",
        render: (value) => (
          <span className="academicChangeOneLine" title={String(value || "")}>
            {formatFallback(value)}
          </span>
        ),
      },
      { key: "detected_at_label", label: "Ngày báo cáo" },
      {
        key: "issue_status_label",
        label: "Trạng thái",
        render: (value) => buildIssueStatusBadge(value),
      },
    ],
    [],
  );

  function updateField(fieldName, value) {
    setStatusMessage(null);
    setFormState((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  function resetForm() {
    setFormState({
      ...INITIAL_FORM_STATE,
      lab_schedule_entry_id: String(schedules[0]?.id || ""),
    });
    setStatusMessage(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedSchedule) {
      setStatusMessage({
        type: "error",
        title: "Chưa chọn ca thực hành",
        text: "Vui lòng chọn ca thực hành xảy ra sự cố.",
      });
      return;
    }

    if (!formState.issue_title.trim() || !formState.issue_description.trim()) {
      setStatusMessage({
        type: "error",
        title: "Thiếu nội dung sự cố",
        text: "Vui lòng nhập tiêu đề và mô tả chi tiết sự cố.",
      });
      return;
    }

    const payload = buildIssuePayload(formState);

    try {
      setIsSubmitting(true);
      const response = await createRoomIssue(payload);
      const createdIssue = response?.data || payload;

      setReports((currentReports) => [createdIssue, ...currentReports]);
      setStatusMessage({
        type: "success",
        title: "Đã gửi báo cáo thành công",
        text: `Báo cáo #${createdIssue.id || ""} đã được lưu với trạng thái ${createdIssue.issue_status || "new"}.`,
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        title: "Không thể gửi báo cáo",
        text:
          error?.message || "Vui lòng kiểm tra ca thực hành và nội dung sự cố.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="lecturerPageStack">
      {loadError ? (
        <section className="lecturerAlert lecturerAlert--error" role="alert">
          <h3>Không tải được lịch giảng viên</h3>
          <p>{loadError}</p>
        </section>
      ) : null}

      <section className="lecturerTwoColumnLayout">
        <form className="lecturerPanel" onSubmit={handleSubmit}>
          <div className="lecturerPanelHeader">
            <div>
              <h2>Báo cáo sự cố</h2>
            </div>
          </div>

          <div className="lecturerFormGrid">
            <label className="lecturerField lecturerFieldFull">
              <span>Ca thực hành xảy ra sự cố</span>
              <select
                className="lecturerControl"
                value={formState.lab_schedule_entry_id}
                onChange={(event) =>
                  updateField("lab_schedule_entry_id", event.target.value)
                }
                disabled={isLoadingSchedules || schedules.length === 0}
              >
                {isLoadingSchedules ? <option>Đang tải lịch...</option> : null}
                {!isLoadingSchedules && schedules.length === 0 ? (
                  <option value="">Chưa có lịch đã công bố</option>
                ) : null}
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {buildScheduleLabel(schedule)}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Tiêu đề sự cố</span>
              <input
                className="lecturerControl"
                value={formState.issue_title}
                onChange={(event) =>
                  updateField("issue_title", event.target.value)
                }
                placeholder="VD: Máy sinh viên không khởi động"
              />
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Mô tả chi tiết</span>
              <textarea
                className="lecturerControl lecturerTextarea"
                value={formState.issue_description}
                onChange={(event) =>
                  updateField("issue_description", event.target.value)
                }
                placeholder="Mô tả tình huống, mức độ ảnh hưởng, số lượng máy lỗi..."
              />
            </label>
          </div>

          {statusMessage ? (
            <div
              className={`lecturerAlert lecturerAlert--${statusMessage.type}`}
              role={statusMessage.type === "error" ? "alert" : "status"}
            >
              <button
                type="button"
                className="lecturerAlertClose"
                onClick={() => setStatusMessage(null)}
                aria-label="Tắt thông báo"
              >
                ×
              </button>
              <h3>{statusMessage.title}</h3>
              <p>{statusMessage.text}</p>
            </div>
          ) : null}

          <div className="lecturerFormActions">
            <ButtonUI
              type="submit"
              className="lecturerPrimaryButton"
              disabled={
                isSubmitting || isLoadingSchedules || schedules.length === 0
              }
            >
              {isSubmitting ? "Đang gửi..." : "Xác nhận gửi đi"}
            </ButtonUI>

            <ButtonUI
              type="button"
              tone="outline"
              className="lecturerGhostButton"
              onClick={resetForm}
            >
              Làm mới
            </ButtonUI>
          </div>
        </form>

        <aside className="lecturerPanel lecturerAsidePanel">
          <div className="lecturerPanelHeader">
            <div>
              <h2>Phiếu sự cố</h2>
            </div>
          </div>

          <div className="lecturerInfoGrid">
            <div className="lecturerInfoItem">
              <span>Ca thực hành</span>
              <strong>
                {formatFallback(buildScheduleLabel(selectedSchedule))}
              </strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Tiêu đề</span>
              <strong>{formatFallback(formState.issue_title)}</strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Mô tả</span>
              <strong>{formatFallback(formState.issue_description)}</strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Trạng thái</span>
              <strong>{translateIssueStatus("new")}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="lecturerPanel">
        <div className="lecturerPanelHeader">
          <div>
            <h2>Báo cáo sự cố gần đây</h2>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey="id"
          loading={isLoadingSchedules}
          emptyTitle="Chưa có báo cáo sự cố"
          emptyDescription="Không có báo cáo sự cố phù hợp."
          pageSize={8}
        />
      </section>
    </div>
  );
}
