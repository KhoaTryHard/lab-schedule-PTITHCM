"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "../../../components/common/DataTable.jsx";
import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { getUser } from "../../../lib/authStorage";
import { listSchedules } from "../../../services/scheduleService";

const INITIAL_FORM_STATE = {
  lab_schedule_entry_id: "",
  device_id: "",
  issue_type: "computer",
  severity: "medium",
  issue_title: "",
  issue_description: "",
};

const ISSUE_TYPE_OPTIONS = [
  { value: "computer", label: "Máy tính" },
  { value: "network", label: "Mạng" },
  { value: "projector", label: "Máy chiếu" },
  { value: "power", label: "Điện" },
  { value: "software", label: "Phần mềm" },
  { value: "other", label: "Khác" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "critical", label: "Nghiêm trọng" },
];

const MOCK_REPORTS = [
  {
    id: "mock-1",
    room_code: "2B11",
    device_id: "PC-2B11-14",
    lab_schedule_entry_id: 4,
    issue_type: "computer",
    severity: "high",
    issue_title: "Máy không khởi động trong giờ thực hành",
    issue_description:
      "Máy sinh viên số 14 không lên nguồn, ảnh hưởng đến quá trình làm bài.",
    reported_by_name: "Giảng viên",
    assigned_to_name: "Kỹ thuật viên",
    issue_status: "new",
    detected_at: "2026-04-28T08:20:00",
    resolved_at: null,
    resolution_notes: "",
  },
  {
    id: "mock-2",
    room_code: "2B21",
    device_id: null,
    lab_schedule_entry_id: 5,
    issue_type: "network",
    severity: "medium",
    issue_title: "Mạng LAN không ổn định",
    issue_description:
      "Một nhóm máy bị mất kết nối tới máy chủ nội bộ trong ca thực hành.",
    reported_by_name: "Giảng viên",
    assigned_to_name: "Kỹ thuật viên",
    issue_status: "in_progress",
    detected_at: "2026-04-27T13:15:00",
    resolved_at: null,
    resolution_notes: "KTV đang kiểm tra switch và dây mạng.",
  },
];

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

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
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

function buildScheduleLabel(schedule) {
  return [
    `#${schedule?.id}`,
    schedule?.course_code,
    schedule?.course_name,
    schedule?.group_no ? `Nhóm ${schedule.group_no}` : "",
    schedule?.team_no ? `Tổ TH ${schedule.team_no}` : "",
    schedule?.room_code ? `Phòng ${schedule.room_code}` : "",
    formatDayOfWeek(schedule?.day_of_week),
    schedule?.time_slot,
  ]
    .filter(Boolean)
    .join(" | ");
}

function isPublishedSchedule(schedule) {
  return (
    String(schedule?.entry_status || schedule?.status || "")
      .trim()
      .toLowerCase() === "published"
  );
}

function buildSeverityBadge(value) {
  return (
    <span className={`lecturerStatusBadge lecturerSeverity--${value}`}>
      {translateSeverity(value)}
    </span>
  );
}

function buildIssueStatusBadge(value) {
  return (
    <span className={`lecturerStatusBadge lecturerIssueStatus--${value}`}>
      {translateIssueStatus(value)}
    </span>
  );
}

function buildIssuePayload(formState, selectedSchedule, currentUser) {
  return {
    room_code: selectedSchedule?.room_code || null,
    room_id: selectedSchedule?.room_id || null,
    device_id: formState.device_id.trim() || null,
    lab_schedule_entry_id: Number(formState.lab_schedule_entry_id),
    issue_type: formState.issue_type,
    severity: formState.severity,
    issue_title: formState.issue_title.trim(),
    issue_description: formState.issue_description.trim(),
    reported_by_user_id: currentUser?.id || null,
    reported_by_name: currentUser?.full_name || null,
    assigned_to_user_id: null,
    issue_status: "new",
    detected_at: new Date().toISOString(),
    resolved_at: null,
    resolution_notes: null,
  };
}

export default function LecturerRoomIssuesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLecturerSchedules() {
      const user = getUser();
      setCurrentUser(user);

      try {
        setIsLoadingSchedules(true);
        setLoadError("");

        const response = await listSchedules({
          status: "published",
          lecturer_user_id: user?.id,
        });

        const publishedSchedules =
          extractScheduleItems(response).filter(isPublishedSchedule);

        if (!isMounted) return;

        setSchedules(publishedSchedules);
        setFormState((current) => ({
          ...current,
          lab_schedule_entry_id:
            current.lab_schedule_entry_id ||
            String(publishedSchedules[0]?.id || ""),
        }));
      } catch (error) {
        if (!isMounted) return;

        setSchedules([]);
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
        device_id_label: formatFallback(report.device_id),
        issue_type_label: translateIssueType(report.issue_type),
        severity_label: report.severity,
        issue_status_label: report.issue_status,
        lab_schedule_entry_id_label: formatFallback(
          report.lab_schedule_entry_id,
        ),
        detected_at_label: formatDateTime(report.detected_at),
        resolved_at_label: formatDateTime(report.resolved_at),
        resolution_notes_label: formatFallback(report.resolution_notes),
      })),
    [reports],
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
    setLastPayload(null);
  }

  function handleSubmit(event) {
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

    const payload = buildIssuePayload(formState, selectedSchedule, currentUser);

    setLastPayload(payload);
    setReports((currentReports) => [
      {
        id: `local-${Date.now()}`,
        ...payload,
        reported_by_name: currentUser?.full_name || "Giảng viên",
        assigned_to_name: "Chưa phân công",
      },
      ...currentReports,
    ]);
    setStatusMessage({
      type: "success",
      title: "Đã gửi báo cáo thành công",
      text: "Frontend đã tạo báo cáo theo cấu trúc room_issue_reports. Backend hiện thiếu API ghi sự cố nên dữ liệu chỉ lưu tạm trên UI.",
    });
  }

  return (
    <div className="lecturerPageStack">
      <section className="lecturerHero">
        <div className="lecturerHeroBody">
          <p className="lecturerEyebrow">Giảng viên</p>
          <h1 className="lecturerHeroTitle">Báo cáo sự cố phòng máy</h1>
          <p className="lecturerHeroText">
            Báo cáo lỗi máy tính, mạng, máy chiếu, điện hoặc phần mềm trong ca
            thực hành đang phụ trách.
          </p>
        </div>

        <span className="lecturerDataBadge lecturerDataBadge--warning">
          Thiếu API room_issue_reports
        </span>
      </section>

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
              <p className="lecturerEyebrow">Phiếu báo cáo</p>
              <h2>Thông tin sự cố</h2>
              <p>
                Ca thực hành và phòng học lấy từ lịch thật đã công bố của giảng
                viên.
              </p>
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

            <label className="lecturerField">
              <span>Phòng xảy ra sự cố</span>
              <input
                className="lecturerControl lecturerReadonlyControl"
                value={formatFallback(selectedSchedule?.room_code)}
                readOnly
              />
            </label>

            <label className="lecturerField">
              <span>Người báo lỗi</span>
              <input
                className="lecturerControl lecturerReadonlyControl"
                value={currentUser?.full_name || "—"}
                readOnly
              />
            </label>

            <label className="lecturerField">
              <span>Thiết bị lỗi nếu có</span>
              <input
                className="lecturerControl"
                value={formState.device_id}
                onChange={(event) =>
                  updateField("device_id", event.target.value)
                }
                placeholder="VD: PC-2B11-14, máy chiếu, switch..."
              />
            </label>

            <label className="lecturerField">
              <span>Loại sự cố</span>
              <select
                className="lecturerControl"
                value={formState.issue_type}
                onChange={(event) =>
                  updateField("issue_type", event.target.value)
                }
              >
                {ISSUE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField">
              <span>Mức độ nghiêm trọng</span>
              <select
                className="lecturerControl"
                value={formState.severity}
                onChange={(event) =>
                  updateField("severity", event.target.value)
                }
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField">
              <span>Trạng thái mặc định</span>
              <input
                className="lecturerControl lecturerReadonlyControl"
                value="new"
                readOnly
              />
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
              disabled={isLoadingSchedules || schedules.length === 0}
            >
              Xác nhận gửi đi
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
              <p className="lecturerEyebrow">Đối chiếu</p>
              <h2>Thông tin ca thực hành</h2>
              <p>Dữ liệu lịch thật dùng để gắn báo cáo sự cố.</p>
            </div>
          </div>

          <div className="lecturerInfoGrid">
            <div className="lecturerInfoItem lecturerInfoItemHighlight">
              <span>Phòng</span>
              <strong>{formatFallback(selectedSchedule?.room_code)}</strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Mã lịch</span>
              <strong>{formatFallback(selectedSchedule?.id)}</strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Học phần</span>
              <strong>
                {formatFallback(
                  [selectedSchedule?.course_code, selectedSchedule?.course_name]
                    .filter(Boolean)
                    .join(" - "),
                )}
              </strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Thời gian</span>
              <strong>
                {formatDayOfWeek(selectedSchedule?.day_of_week)} •{" "}
                {formatFallback(selectedSchedule?.time_slot)}
              </strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Ngày áp dụng</span>
              <strong>
                {formatDate(selectedSchedule?.start_date)} →{" "}
                {formatDate(selectedSchedule?.end_date)}
              </strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Trạng thái lịch</span>
              <strong>{formatFallback(selectedSchedule?.entry_status)}</strong>
            </div>
          </div>

          {lastPayload ? (
            <div className="lecturerPayloadPreview">
              <h3>Payload frontend đã chuẩn bị</h3>
              <pre>{JSON.stringify(lastPayload, null, 2)}</pre>
            </div>
          ) : null}
        </aside>
      </section>

      <section className="lecturerPanel">
        <div className="lecturerPanelHeader">
          <div>
            <p className="lecturerEyebrow">Mock UI</p>
            <h2>Báo cáo sự cố gần đây</h2>
            <p>
              Chưa có API đọc/ghi room_issue_reports nên bảng dưới là dữ liệu
              mock và báo cáo vừa gửi chỉ lưu tạm trên UI.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey="id"
          emptyTitle="Chưa có báo cáo sự cố"
          emptyDescription="Không có báo cáo sự cố phù hợp."
          pageSize={8}
        />
      </section>
    </div>
  );
}
