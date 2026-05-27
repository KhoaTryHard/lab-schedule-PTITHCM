"use client";

import { useEffect, useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { getUser } from "../../../lib/authStorage";
import { listSchedules } from "../../../services/scheduleService";

const FEEDBACK_TYPE_OPTIONS = [
  { value: "schedule_error", label: "Sai thông tin lịch thực hành" },
  { value: "room_error", label: "Phòng học / thiết bị có vấn đề" },
  { value: "other", label: "Nội dung khác" },
];

const INITIAL_FORM_STATE = {
  lab_schedule_entry_id: "",
  feedback_type: "schedule_error",
  content: "",
  contact_info: "",
};

function extractScheduleItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.schedules)) {
    return data.schedules;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function getScheduleField(schedule, ...keys) {
  for (const key of keys) {
    const value = schedule?.[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

function formatFallback(value) {
  return value === undefined || value === null || String(value).trim() === ""
    ? "—"
    : value;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
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

function buildPracticeSessionName(schedule) {
  if (!schedule) {
    return "";
  }

  const courseCode = getScheduleField(schedule, "course_code");
  const courseName = getScheduleField(schedule, "course_name");
  const groupNo = getScheduleField(schedule, "group_no");
  const teamNo = getScheduleField(
    schedule,
    "team_no",
    "practice_team_code",
    "practice_team_name",
  );

  const courseLabel = [courseCode, courseName].filter(Boolean).join(" - ");
  const groupLabel = groupNo ? `Nhóm ${groupNo}` : "";
  const teamLabel = teamNo ? `Tổ TH ${teamNo}` : "";

  return (
    [courseLabel, groupLabel, teamLabel].filter(Boolean).join(" • ") ||
    `Buổi thực hành #${schedule.id}`
  );
}

function buildPracticeTime(schedule) {
  if (!schedule) {
    return "—";
  }

  const dayLabel = formatDayOfWeek(schedule.day_of_week);
  const slotLabel = getScheduleField(schedule, "time_slot", "time_slot_label");

  return [dayLabel, slotLabel].filter(Boolean).join(" • ") || "—";
}

function buildScheduleOptionLabel(schedule) {
  return [
    buildPracticeSessionName(schedule),
    getScheduleField(schedule, "room_code"),
    buildPracticeTime(schedule),
  ]
    .filter(Boolean)
    .join(" | ");
}

function isPublishedSchedule(schedule) {
  const status = String(schedule?.entry_status || schedule?.status || "")
    .trim()
    .toLowerCase();

  return status === "published";
}

function isValidContactInfo(value) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return false;
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue);
  const phoneValue = normalizedValue.replace(/[\s.-]/g, "");
  const isPhone = /^(\+84|0)\d{8,10}$/.test(phoneValue);

  return isEmail || isPhone;
}

function buildFeedbackPayload({ formState, selectedSchedule, currentUser }) {
  return {
    student_user_id: currentUser?.id || null,
    lab_schedule_entry_id: Number(formState.lab_schedule_entry_id),
    room_code: selectedSchedule?.room_code || "",
    practice_session_name: buildPracticeSessionName(selectedSchedule),
    lecturer_name: selectedSchedule?.lecturer_name || "",
    feedback_type: formState.feedback_type,
    content: formState.content.trim(),
    contact_info: formState.contact_info.trim(),
  };
}

export default function StudentFeedbackPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [lastDraftPayload, setLastDraftPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const selectedSchedule = useMemo(
    () =>
      schedules.find(
        (schedule) => String(schedule.id) === formState.lab_schedule_entry_id,
      ) || null,
    [schedules, formState.lab_schedule_entry_id],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadStudentPublishedSchedules() {
      const user = getUser();

      try {
        setIsLoading(true);
        setLoadError(null);
        setCurrentUser(user);

        const response = await listSchedules({
          status: "published",
          student_user_id: user?.id,
        });

        const publishedSchedules =
          extractScheduleItems(response).filter(isPublishedSchedule);

        if (!isMounted) {
          return;
        }

        setSchedules(publishedSchedules);
        setFormState((current) => ({
          ...current,
          lab_schedule_entry_id:
            current.lab_schedule_entry_id ||
            String(publishedSchedules[0]?.id || ""),
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSchedules([]);
        setLoadError(error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStudentPublishedSchedules();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateFormField(fieldName, value) {
    setStatusMessage(null);
    setFormState((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  function resetForm() {
    setStatusMessage(null);
    setLastDraftPayload(null);
    setFormState({
      ...INITIAL_FORM_STATE,
      lab_schedule_entry_id: String(schedules[0]?.id || ""),
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedSchedule) {
      setStatusMessage({
        type: "error",
        title: "Chưa chọn buổi thực hành",
        text: "Vui lòng chọn một lịch thực hành đã công bố trước khi gửi phản ánh.",
      });
      return;
    }

    if (!formState.content.trim()) {
      setStatusMessage({
        type: "error",
        title: "Thiếu nội dung phản ánh",
        text: "Vui lòng mô tả rõ vấn đề để cán bộ đào tạo hoặc kỹ thuật viên có thể xử lý.",
      });
      return;
    }

    if (!isValidContactInfo(formState.contact_info)) {
      setStatusMessage({
        type: "error",
        title: "Thông tin liên hệ chưa hợp lệ",
        text: "Vui lòng nhập email hoặc số điện thoại hợp lệ để nhà trường liên hệ lại.",
      });
      return;
    }

    const draftPayload = buildFeedbackPayload({
      formState,
      selectedSchedule,
      currentUser,
    });

    setLastDraftPayload(draftPayload);
    setStatusMessage({
      type: "warning",
      title: "Thiếu API gửi phản ánh",
      text: "Frontend đã gom đúng dữ liệu từ lịch thật, nhưng backend hiện chưa có endpoint ghi bảng student_feedback nên chưa thể lưu phản ánh vào database.",
    });
  }

  return (
    <div className="studentPageStack">
      <section className="studentHero">
        <div className="studentHeroBody">
          <p className="studentEyebrow">Sinh viên</p>
          <h1 className="studentHeroTitle">
            Gửi phản ánh lịch / phòng thực hành
          </h1>
          <p className="studentHeroText">
            Chọn đúng buổi thực hành đã công bố, kiểm tra thông tin phòng học ở
            khung bên phải rồi mô tả vấn đề cần hỗ trợ.
          </p>
        </div>

        <span className="studentApiBadge">Thiếu API gửi phản ánh</span>
      </section>

      {loadError ? (
        <section className="studentAlert studentAlert--error" role="alert">
          <h2>Không tải được lịch thực hành</h2>
          <p>
            {loadError?.message ||
              "Không thể lấy dữ liệu lịch thực hành đã công bố của sinh viên."}
          </p>
        </section>
      ) : null}

      <section className="studentTwoColumnLayout">
        <form className="studentFormCard" onSubmit={handleSubmit}>
          <div className="studentCardHeader">
            <p className="studentEyebrow">Phiếu phản ánh</p>
            <h2>Thông tin sinh viên cung cấp</h2>
            <p>
              Các trường phòng học, buổi thực hành và giảng viên được lấy từ
              lịch đã công bố để tránh nhập sai dữ liệu.
            </p>
          </div>

          <div className="studentFormGrid">
            <label className="studentField studentFieldFull">
              <span>Buổi học liên quan</span>
              <select
                className="studentControl"
                value={formState.lab_schedule_entry_id}
                onChange={(event) =>
                  updateFormField("lab_schedule_entry_id", event.target.value)
                }
                disabled={isLoading || schedules.length === 0}
              >
                {isLoading ? <option>Đang tải lịch thực hành...</option> : null}
                {!isLoading && schedules.length === 0 ? (
                  <option value="">Chưa có lịch thực hành đã công bố</option>
                ) : null}
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {buildScheduleOptionLabel(schedule)}
                  </option>
                ))}
              </select>
            </label>

            <label className="studentField">
              <span>Mã phòng</span>
              <input
                className="studentControl studentReadonlyControl"
                value={formatFallback(selectedSchedule?.room_code)}
                readOnly
              />
            </label>

            <label className="studentField">
              <span>Giảng viên phụ trách</span>
              <input
                className="studentControl studentReadonlyControl"
                value={formatFallback(selectedSchedule?.lecturer_name)}
                readOnly
              />
            </label>

            <label className="studentField studentFieldFull">
              <span>Tên buổi thực hành</span>
              <input
                className="studentControl studentReadonlyControl"
                value={formatFallback(
                  buildPracticeSessionName(selectedSchedule),
                )}
                readOnly
              />
            </label>

            <label className="studentField studentFieldFull">
              <span>Loại phản ánh</span>
              <select
                className="studentControl"
                value={formState.feedback_type}
                onChange={(event) =>
                  updateFormField("feedback_type", event.target.value)
                }
              >
                {FEEDBACK_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="studentField studentFieldFull">
              <span>Nội dung chi tiết</span>
              <textarea
                className="studentControl studentTextarea"
                value={formState.content}
                onChange={(event) =>
                  updateFormField("content", event.target.value)
                }
                placeholder="Mô tả rõ vấn đề: sai lịch, không thấy buổi học, máy hỏng, phần mềm thiếu..."
              />
            </label>

            <label className="studentField studentFieldFull">
              <span>Thông tin liên hệ</span>
              <input
                className="studentControl"
                value={formState.contact_info}
                onChange={(event) =>
                  updateFormField("contact_info", event.target.value)
                }
                placeholder="Email sinh viên hoặc số điện thoại"
              />
            </label>
          </div>

          {statusMessage ? (
            <div
              className={`studentAlert studentAlert--${statusMessage.type}`}
              role={statusMessage.type === "error" ? "alert" : "status"}
            >
              <h3>{statusMessage.title}</h3>
              <p>{statusMessage.text}</p>
            </div>
          ) : null}

          <div className="studentFormActions">
            <ButtonUI
              type="submit"
              className="studentActionButton"
              disabled={isLoading || schedules.length === 0}
            >
              Xác nhận gửi
            </ButtonUI>

            <ButtonUI
              type="button"
              tone="outline"
              className="studentGhostButton"
              onClick={resetForm}
            >
              Làm mới
            </ButtonUI>
          </div>
        </form>

        <aside className="studentInfoCard">
          <div className="studentCardHeader">
            <p className="studentEyebrow">Thông tin đối chiếu</p>
            <h2>Phòng học & buổi thực hành</h2>
            <p>
              Dữ liệu bên dưới lấy trực tiếp từ lịch đã công bố của sinh viên.
            </p>
          </div>

          <div className="studentInfoGrid">
            <div className="studentInfoItem studentInfoItemHighlight">
              <span>Phòng học</span>
              <strong>{formatFallback(selectedSchedule?.room_code)}</strong>
            </div>

            <div className="studentInfoItem">
              <span>Mã lịch</span>
              <strong>{formatFallback(selectedSchedule?.id)}</strong>
            </div>

            <div className="studentInfoItem">
              <span>Học phần</span>
              <strong>
                {formatFallback(
                  [selectedSchedule?.course_code, selectedSchedule?.course_name]
                    .filter(Boolean)
                    .join(" - "),
                )}
              </strong>
            </div>

            <div className="studentInfoItem">
              <span>Nhóm / tổ</span>
              <strong>
                {formatFallback(
                  [
                    selectedSchedule?.group_no
                      ? `Nhóm ${selectedSchedule.group_no}`
                      : "",
                    selectedSchedule?.team_no
                      ? `Tổ TH ${selectedSchedule.team_no}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" • "),
                )}
              </strong>
            </div>

            <div className="studentInfoItem">
              <span>Thời gian</span>
              <strong>{buildPracticeTime(selectedSchedule)}</strong>
            </div>

            <div className="studentInfoItem">
              <span>Ngày bắt đầu / kết thúc</span>
              <strong>
                {formatDate(selectedSchedule?.start_date)} →{" "}
                {formatDate(selectedSchedule?.end_date)}
              </strong>
            </div>

            <div className="studentInfoItem">
              <span>Sĩ số tổ</span>
              <strong>{formatFallback(selectedSchedule?.planned_size)}</strong>
            </div>

            <div className="studentInfoItem">
              <span>Trạng thái lịch</span>
              <strong>{formatFallback(selectedSchedule?.entry_status)}</strong>
            </div>
          </div>

          {lastDraftPayload ? (
            <div className="studentPayloadPreview">
              <h3>Payload frontend đã chuẩn bị</h3>
              <pre>{JSON.stringify(lastDraftPayload, null, 2)}</pre>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
