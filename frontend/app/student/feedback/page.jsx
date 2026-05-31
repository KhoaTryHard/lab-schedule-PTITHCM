"use client";

import { useEffect, useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { getUser } from "../../../lib/authStorage";
import { listSchedules } from "../../../services/scheduleService";
import {
  createStudentFeedback,
  listStudentFeedback,
} from "../../../services/feedbackNotificationService";

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

function translateFeedbackStatus(value) {
  const map = {
    submitted: "Đã gửi",
    under_review: "Đang xử lý",
    responded: "Đã phản hồi",
    closed: "Đã đóng",
  };

  return map[value] || value || "—";
}

function translateFeedbackType(value) {
  return (
    FEEDBACK_TYPE_OPTIONS.find((option) => option.value === value)?.label ||
    value ||
    "—"
  );
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
    return true;
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue);
  const phoneValue = normalizedValue.replace(/[\s.-]/g, "");
  const isPhone = /^(\+84|0)\d{8,10}$/.test(phoneValue);

  return isEmail || isPhone;
}

function buildFeedbackPayload(formState) {
  return {
    lab_schedule_entry_id: Number(formState.lab_schedule_entry_id),
    feedback_type: formState.feedback_type,
    content: formState.content.trim(),
    contact_info: formState.contact_info.trim() || null,
  };
}

export default function StudentFeedbackPage() {
  const [schedules, setSchedules] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [lastDraftPayload, setLastDraftPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

        const [scheduleResponse, feedbackResponse] = await Promise.all([
          listSchedules({
            status: "published",
            student_user_id: user?.id,
          }),
          listStudentFeedback().catch(() => ({ data: { items: [] } })),
        ]);

        const publishedSchedules =
          extractScheduleItems(scheduleResponse).filter(isPublishedSchedule);
        const apiFeedbackItems = extractScheduleItems(feedbackResponse);

        if (!isMounted) {
          return;
        }

        setSchedules(publishedSchedules);
        setFeedbackItems(apiFeedbackItems);
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
        setFeedbackItems([]);
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

  async function handleSubmit(event) {
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

    const payload = buildFeedbackPayload(formState);

    try {
      setIsSubmitting(true);
      const response = await createStudentFeedback(payload);
      const createdFeedback = response?.data || payload;

      setLastDraftPayload(createdFeedback);
      setFeedbackItems((currentItems) => [createdFeedback, ...currentItems]);
      setStatusMessage({
        type: "success",
        title: "Đã gửi phản ánh thành công",
        text: `Phản ánh #${createdFeedback.id || ""} đã được lưu với trạng thái ${createdFeedback.feedback_status || "submitted"}.`,
      });
      setFormState((current) => ({
        ...current,
        content: "",
        contact_info: "",
      }));
    } catch (error) {
      setStatusMessage({
        type: "error",
        title: "Không thể gửi phản ánh",
        text:
          error?.message ||
          "API student-feedback từ chối phản ánh. Vui lòng kiểm tra buổi học đã chọn.",
      });
    } finally {
      setIsSubmitting(false);
    }
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

        <span className="studentApiBadge">API student_feedback</span>
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
              disabled={isSubmitting || isLoading || schedules.length === 0}
            >
              {isSubmitting ? "Đang gửi..." : "Xác nhận gửi"}
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
              <h3>Phản ánh API vừa ghi nhận</h3>
              <pre>{JSON.stringify(lastDraftPayload, null, 2)}</pre>
            </div>
          ) : null}
        </aside>
      </section>

      <section className="studentInfoCard">
        <div className="studentCardHeader">
          <p className="studentEyebrow">Phản ánh đã gửi</p>
          <h2>Lịch sử phản ánh của sinh viên</h2>
          <p>Danh sách được tải từ API student_feedback theo tài khoản hiện tại.</p>
        </div>

        {feedbackItems.length === 0 ? (
          <div className="studentEmptyBox">
            <h2>Chưa có phản ánh</h2>
            <p>Sau khi gửi thành công, phản ánh sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="studentInfoGrid">
            {feedbackItems.map((feedback) => (
              <div key={feedback.id} className="studentInfoItem">
                <span>
                  #{feedback.id} - {translateFeedbackType(feedback.feedback_type)}
                </span>
                <strong>{translateFeedbackStatus(feedback.feedback_status)}</strong>
                <p>{feedback.content}</p>
                <small>Gửi lúc: {formatDateTime(feedback.created_at)}</small>
                {feedback.response_text ? (
                  <small>Phản hồi: {feedback.response_text}</small>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
