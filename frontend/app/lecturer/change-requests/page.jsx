"use client";

import { useEffect, useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { getUser } from "../../../lib/authStorage";
import { listSchedules } from "../../../services/scheduleService";
import { getRooms } from "../../../services/roomService";

const INITIAL_FORM_STATE = {
  course_key: "",
  practice_key: "",
  change_type: "reschedule",
  lab_schedule_entry_id: "",
  proposed_start_date: "",
  proposed_end_date: "",
  proposed_day_of_week: "",
  proposed_time_slot_id: "",
  proposed_room_id: "",
  proposed_room_code: "",
  reason_text: "",
};

const CHANGE_TYPE_OPTIONS = [
  {
    value: "reschedule",
    label: "Đổi lịch",
    description: "Chuyển buổi thực hành sang ngày, giờ hoặc phòng khác.",
  },
  {
    value: "makeup",
    label: "Học bù",
    description: "Tạo buổi học bù do nghỉ lễ, sự cố hoặc lý do bất khả kháng.",
  },
  {
    value: "cancel",
    label: "Hủy lịch",
    description: "Đề xuất hủy buổi thực hành, không học nữa.",
  },
];

const DAY_OPTIONS = [
  { value: "", label: "Chọn thứ..." },
  { value: "1", label: "Chủ nhật" },
  { value: "2", label: "Thứ 2" },
  { value: "3", label: "Thứ 3" },
  { value: "4", label: "Thứ 4" },
  { value: "5", label: "Thứ 5" },
  { value: "6", label: "Thứ 6" },
  { value: "7", label: "Thứ 7" },
];

const TIME_SLOT_OPTIONS = [
  { value: "", label: "Chọn ca/tiết..." },
  { value: "1", label: "Tiết 1-4" },
  { value: "2", label: "Tiết 7-10" },
];

function extractScheduleItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function extractRooms(response) {
  return Array.isArray(response?.data) ? response.data : [];
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

function getScheduleCourseKey(schedule) {
  return [
    schedule?.course_code || "NO_CODE",
    schedule?.course_name || "NO_NAME",
  ].join("|");
}

function getSchedulePracticeKey(schedule) {
  return [
    schedule?.course_code || "NO_CODE",
    schedule?.group_no || "NO_GROUP",
    schedule?.team_no || "NO_TEAM",
    schedule?.practice_team_id || "NO_TEAM_ID",
  ].join("|");
}

function buildCourseLabel(schedule) {
  return (
    [schedule?.course_code, schedule?.course_name]
      .filter(Boolean)
      .join(" - ") || "Học phần chưa rõ"
  );
}

function buildPracticeLabel(schedule) {
  const groupLabel = schedule?.group_no ? `Nhóm ${schedule.group_no}` : "";
  const teamLabel = schedule?.team_no ? `Tổ TH ${schedule.team_no}` : "";

  return [buildCourseLabel(schedule), groupLabel, teamLabel]
    .filter(Boolean)
    .join(" • ");
}

function buildScheduleLabel(schedule) {
  return [
    `#${schedule?.id}`,
    buildPracticeLabel(schedule),
    schedule?.room_code ? `Phòng ${schedule.room_code}` : "",
    formatDayOfWeek(schedule?.day_of_week),
    schedule?.time_slot,
    `${formatDate(schedule?.start_date)} → ${formatDate(schedule?.end_date)}`,
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

function buildChangeRequestPayload(
  formState,
  selectedSchedule,
  currentUser,
  rooms,
) {
  const selectedRoom = rooms.find(
    (room) => String(room.id) === String(formState.proposed_room_id),
  );

  return {
    lab_schedule_entry_id: Number(formState.lab_schedule_entry_id),
    change_type: formState.change_type,
    proposed_start_date: formState.proposed_start_date || null,
    proposed_end_date: formState.proposed_end_date || null,
    proposed_day_of_week: formState.proposed_day_of_week
      ? Number(formState.proposed_day_of_week)
      : null,
    proposed_time_slot_id: formState.proposed_time_slot_id
      ? Number(formState.proposed_time_slot_id)
      : null,
    proposed_room_id: formState.proposed_room_id
      ? Number(formState.proposed_room_id)
      : null,
    proposed_room_code:
      selectedRoom?.room_code || formState.proposed_room_code || null,
    reason_text: formState.reason_text.trim(),
    request_status: "draft",
    requested_by_user_id: currentUser?.id || null,
    lecturer_name: currentUser?.full_name || null,
    original_schedule_snapshot: selectedSchedule
      ? {
          id: selectedSchedule.id,
          course_code: selectedSchedule.course_code,
          course_name: selectedSchedule.course_name,
          room_code: selectedSchedule.room_code,
          day_of_week: selectedSchedule.day_of_week,
          time_slot: selectedSchedule.time_slot,
          start_date: selectedSchedule.start_date,
          end_date: selectedSchedule.end_date,
        }
      : null,
  };
}

export default function LecturerChangeRequestsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [scheduleError, setScheduleError] = useState("");
  const [roomError, setRoomError] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      const user = getUser();

      setCurrentUser(user);

      try {
        setIsLoadingSchedules(true);
        setScheduleError("");

        const response = await listSchedules({
          status: "published",
          lecturer_user_id: user?.id,
        });

        const publishedSchedules =
          extractScheduleItems(response).filter(isPublishedSchedule);

        if (!isMounted) return;

        setSchedules(publishedSchedules);

        const firstSchedule = publishedSchedules[0];

        if (firstSchedule) {
          setFormState((current) => ({
            ...current,
            course_key: getScheduleCourseKey(firstSchedule),
            practice_key: getSchedulePracticeKey(firstSchedule),
            lab_schedule_entry_id: String(firstSchedule.id),
            proposed_room_code: firstSchedule.room_code || "",
          }));
        }
      } catch (error) {
        if (!isMounted) return;

        setSchedules([]);
        setScheduleError(
          error?.message ||
            "Không thể tải lịch thực hành đã công bố của giảng viên.",
        );
      } finally {
        if (isMounted) setIsLoadingSchedules(false);
      }

      try {
        const roomResponse = await getRooms();
        const roomItems = extractRooms(roomResponse);

        if (!isMounted) return;

        setRooms(roomItems);

        if (roomItems[0]) {
          setFormState((current) => ({
            ...current,
            proposed_room_id:
              current.proposed_room_id || String(roomItems[0].id),
            proposed_room_code:
              current.proposed_room_code ||
              String(roomItems[0].room_code || ""),
          }));
        }
      } catch (error) {
        if (!isMounted) return;

        setRooms([]);
        setRoomError(
          error?.message ||
            "Không tải được danh sách phòng đề xuất. Nếu API /rooms không cấp quyền cho GV, frontend sẽ không tự suy ra proposed_room_id.",
        );
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const courseOptions = useMemo(() => {
    const map = new Map();

    schedules.forEach((schedule) => {
      const key = getScheduleCourseKey(schedule);

      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: buildCourseLabel(schedule),
        });
      }
    });

    return Array.from(map.values());
  }, [schedules]);

  const practiceOptions = useMemo(() => {
    const filteredByCourse = schedules.filter(
      (schedule) => getScheduleCourseKey(schedule) === formState.course_key,
    );
    const map = new Map();

    filteredByCourse.forEach((schedule) => {
      const key = getSchedulePracticeKey(schedule);

      if (!map.has(key)) {
        map.set(key, {
          value: key,
          label: buildPracticeLabel(schedule),
        });
      }
    });

    return Array.from(map.values());
  }, [formState.course_key, schedules]);

  const availableSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          getScheduleCourseKey(schedule) === formState.course_key &&
          getSchedulePracticeKey(schedule) === formState.practice_key,
      ),
    [formState.course_key, formState.practice_key, schedules],
  );

  const selectedSchedule = useMemo(
    () =>
      schedules.find(
        (schedule) => String(schedule.id) === formState.lab_schedule_entry_id,
      ) || null,
    [formState.lab_schedule_entry_id, schedules],
  );

  const selectedChangeType = CHANGE_TYPE_OPTIONS.find(
    (option) => option.value === formState.change_type,
  );

  const isCancelRequest = formState.change_type === "cancel";

  function updateField(fieldName, value) {
    setStatusMessage(null);
    setFormState((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  function handleCourseChange(value) {
    const nextPractice = schedules.find(
      (schedule) => getScheduleCourseKey(schedule) === value,
    );

    setFormState((current) => ({
      ...current,
      course_key: value,
      practice_key: nextPractice ? getSchedulePracticeKey(nextPractice) : "",
      lab_schedule_entry_id: nextPractice ? String(nextPractice.id) : "",
      proposed_room_code: nextPractice?.room_code || current.proposed_room_code,
    }));
  }

  function handlePracticeChange(value) {
    const nextSchedule = schedules.find(
      (schedule) =>
        getScheduleCourseKey(schedule) === formState.course_key &&
        getSchedulePracticeKey(schedule) === value,
    );

    setFormState((current) => ({
      ...current,
      practice_key: value,
      lab_schedule_entry_id: nextSchedule ? String(nextSchedule.id) : "",
      proposed_room_code: nextSchedule?.room_code || current.proposed_room_code,
    }));
  }

  function handleRoomChange(value) {
    const selectedRoom = rooms.find(
      (room) => String(room.id) === String(value),
    );

    setFormState((current) => ({
      ...current,
      proposed_room_id: value,
      proposed_room_code: selectedRoom?.room_code || "",
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedSchedule) {
      setStatusMessage({
        type: "error",
        title: "Chưa chọn ca thực hành",
        text: "Vui lòng chọn đúng ca thực hành đang bị ảnh hưởng.",
      });
      return;
    }

    if (!formState.reason_text.trim()) {
      setStatusMessage({
        type: "error",
        title: "Thiếu lý do",
        text: "reason_text là bắt buộc để CBDT/QTV có căn cứ xét duyệt.",
      });
      return;
    }

    if (!isCancelRequest) {
      if (
        !formState.proposed_start_date ||
        !formState.proposed_end_date ||
        !formState.proposed_day_of_week ||
        !formState.proposed_time_slot_id
      ) {
        setStatusMessage({
          type: "error",
          title: "Thiếu lịch mới đề xuất",
          text: "Yêu cầu đổi lịch hoặc học bù cần ngày, thứ và ca/tiết đề xuất.",
        });
        return;
      }

      if (formState.proposed_end_date < formState.proposed_start_date) {
        setStatusMessage({
          type: "error",
          title: "Khoảng ngày chưa hợp lệ",
          text: "Ngày kết thúc đề xuất phải lớn hơn hoặc bằng ngày bắt đầu.",
        });
        return;
      }
    }

    const payload = buildChangeRequestPayload(
      formState,
      selectedSchedule,
      currentUser,
      rooms,
    );

    setLastPayload(payload);
    setStatusMessage({
      type: "success",
      title: "Đã gửi yêu cầu thành công",
      text: "Frontend đã tạo đúng payload theo bảng lab_schedule_change_requests. Backend hiện thiếu API ghi yêu cầu nên dữ liệu chưa lưu vào database.",
    });
  }

  return (
    <div className="lecturerPageStack">
      <section className="lecturerHero">
        <div className="lecturerHeroBody">
          <p className="lecturerEyebrow">Giảng viên</p>
          <h1 className="lecturerHeroTitle">Đổi / bù / hủy lịch thực hành</h1>
          <p className="lecturerHeroText">
            Chọn học phần, lớp/tổ thực hành và ca đang bị ảnh hưởng từ lịch đã
            công bố của giảng viên. Form chỉ chuẩn bị yêu cầu ở trạng thái
            draft.
          </p>
        </div>

        <span className="lecturerDataBadge lecturerDataBadge--warning">
          Thiếu API change-requests
        </span>
      </section>

      {scheduleError ? (
        <section className="lecturerAlert lecturerAlert--error" role="alert">
          <h3>Không tải được lịch giảng viên</h3>
          <p>{scheduleError}</p>
        </section>
      ) : null}

      {roomError ? (
        <section className="lecturerAlert lecturerAlert--warning">
          <h3>Lưu ý về phòng đề xuất</h3>
          <p>{roomError}</p>
        </section>
      ) : null}

      <section className="lecturerTwoColumnLayout">
        <form className="lecturerPanel" onSubmit={handleSubmit}>
          <div className="lecturerPanelHeader">
            <div>
              <p className="lecturerEyebrow">Phiếu yêu cầu</p>
              <h2>Thông tin đổi / bù / hủy</h2>
              <p>
                Dữ liệu lịch gốc lấy từ API thật. Các trường lưu yêu cầu mới chỉ
                mock do thiếu API ghi bảng.
              </p>
            </div>
          </div>

          <div className="lecturerFormGrid">
            <label className="lecturerField">
              <span>Giảng viên yêu cầu</span>
              <input
                className="lecturerControl lecturerReadonlyControl"
                value={currentUser?.full_name || "—"}
                readOnly
              />
            </label>

            <label className="lecturerField">
              <span>Trạng thái mặc định</span>
              <input
                className="lecturerControl lecturerReadonlyControl"
                value="draft"
                readOnly
              />
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Môn học</span>
              <select
                className="lecturerControl"
                value={formState.course_key}
                onChange={(event) => handleCourseChange(event.target.value)}
                disabled={isLoadingSchedules || courseOptions.length === 0}
              >
                {isLoadingSchedules ? <option>Đang tải lịch...</option> : null}
                {!isLoadingSchedules && courseOptions.length === 0 ? (
                  <option value="">Chưa có lịch đã công bố</option>
                ) : null}
                {courseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Lớp / tổ thực hành phụ trách</span>
              <select
                className="lecturerControl"
                value={formState.practice_key}
                onChange={(event) => handlePracticeChange(event.target.value)}
                disabled={practiceOptions.length === 0}
              >
                {practiceOptions.length === 0 ? (
                  <option value="">Chưa có lớp/tổ phù hợp</option>
                ) : null}
                {practiceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Kiểu yêu cầu</span>
              <select
                className="lecturerControl"
                value={formState.change_type}
                onChange={(event) =>
                  updateField("change_type", event.target.value)
                }
              >
                {CHANGE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}: {option.label}
                  </option>
                ))}
              </select>
              <small>{selectedChangeType?.description}</small>
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Ca thực hành gốc bị ảnh hưởng</span>
              <select
                className="lecturerControl"
                value={formState.lab_schedule_entry_id}
                onChange={(event) =>
                  updateField("lab_schedule_entry_id", event.target.value)
                }
                disabled={availableSchedules.length === 0}
              >
                {availableSchedules.length === 0 ? (
                  <option value="">Chưa có ca thực hành phù hợp</option>
                ) : null}
                {availableSchedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {buildScheduleLabel(schedule)}
                  </option>
                ))}
              </select>
            </label>

            <div className="lecturerFormSubhead lecturerFieldFull">
              <h3>Lịch mới đề xuất</h3>
              <p>
                Chỉ bắt buộc với yêu cầu đổi lịch hoặc học bù. Nếu hủy lịch, có
                thể để trống phần này.
              </p>
            </div>

            <label className="lecturerField">
              <span>Ngày bắt đầu đề xuất</span>
              <input
                type="date"
                className="lecturerControl"
                value={formState.proposed_start_date}
                onChange={(event) =>
                  updateField("proposed_start_date", event.target.value)
                }
                disabled={isCancelRequest}
              />
            </label>

            <label className="lecturerField">
              <span>Ngày kết thúc đề xuất</span>
              <input
                type="date"
                className="lecturerControl"
                value={formState.proposed_end_date}
                onChange={(event) =>
                  updateField("proposed_end_date", event.target.value)
                }
                disabled={isCancelRequest}
              />
            </label>

            <label className="lecturerField">
              <span>Thứ trong tuần đề xuất</span>
              <select
                className="lecturerControl"
                value={formState.proposed_day_of_week}
                onChange={(event) =>
                  updateField("proposed_day_of_week", event.target.value)
                }
                disabled={isCancelRequest}
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField">
              <span>Ca/tiết đề xuất</span>
              <select
                className="lecturerControl"
                value={formState.proposed_time_slot_id}
                onChange={(event) =>
                  updateField("proposed_time_slot_id", event.target.value)
                }
                disabled={isCancelRequest}
              >
                {TIME_SLOT_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Phòng máy đề xuất</span>
              <select
                className="lecturerControl"
                value={formState.proposed_room_id}
                onChange={(event) => handleRoomChange(event.target.value)}
                disabled={isCancelRequest || rooms.length === 0}
              >
                {rooms.length === 0 ? (
                  <option value="">
                    Không tải được danh sách phòng có room_id từ API
                  </option>
                ) : null}
                {rooms.map((room) => (
                  <option key={room.id || room.room_code} value={room.id}>
                    {room.room_code} — ID {room.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="lecturerField lecturerFieldFull">
              <span>Lý do yêu cầu</span>
              <textarea
                className="lecturerControl lecturerTextarea"
                value={formState.reason_text}
                onChange={(event) =>
                  updateField("reason_text", event.target.value)
                }
                placeholder="Nhập lý do đổi lịch, học bù hoặc hủy lịch..."
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
              onClick={() => {
                setStatusMessage(null);
                setLastPayload(null);
              }}
            >
              Làm mới thông báo
            </ButtonUI>
          </div>
        </form>

        <aside className="lecturerPanel lecturerAsidePanel">
          <div className="lecturerPanelHeader">
            <div>
              <p className="lecturerEyebrow">Lịch gốc</p>
              <h2>Thông tin ca thực hành</h2>
              <p>Giảng viên đối chiếu trước khi gửi yêu cầu.</p>
            </div>
          </div>

          <div className="lecturerInfoGrid">
            <div className="lecturerInfoItem lecturerInfoItemHighlight">
              <span>Phòng hiện tại</span>
              <strong>{formatFallback(selectedSchedule?.room_code)}</strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Mã lịch</span>
              <strong>{formatFallback(selectedSchedule?.id)}</strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Học phần</span>
              <strong>
                {formatFallback(buildCourseLabel(selectedSchedule))}
              </strong>
            </div>
            <div className="lecturerInfoItem">
              <span>Nhóm / tổ</span>
              <strong>
                {formatFallback(buildPracticeLabel(selectedSchedule))}
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
          </div>

          {lastPayload ? (
            <div className="lecturerPayloadPreview">
              <h3>Payload frontend đã chuẩn bị</h3>
              <pre>{JSON.stringify(lastPayload, null, 2)}</pre>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
