"use client";

import { useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";

const MOCK_ACADEMIC_NOTIFICATIONS = [
  {
    id: 1,
    notification_type: "schedule_request_submitted",
    title: "Có yêu cầu xếp lịch mới cần duyệt",
    message_body:
      "Một yêu cầu xếp lịch thực hành mới đã được gửi. CBDT cần kiểm tra dữ liệu đào tạo, phòng và ca học trước khi xếp lịch.",
    related_entity_type: "lab_schedule_requests",
    related_entity_id: 6,
    created_by_user_id: 2,
    created_at: "2026-04-28 08:10:00",
    recipient_status: "unread",
    read_at: null,
    acknowledged_at: null,
  },
  {
    id: 2,
    notification_type: "change_request_submitted",
    title: "Giảng viên gửi yêu cầu đổi/bù/hủy lịch",
    message_body:
      "Có yêu cầu thay đổi lịch thực hành từ giảng viên. Vui lòng xem chi tiết để duyệt hoặc từ chối.",
    related_entity_type: "lab_schedule_change_requests",
    related_entity_id: 1,
    created_by_user_id: 4,
    created_at: "2026-04-28 09:00:00",
    recipient_status: "unread",
    read_at: null,
    acknowledged_at: null,
  },
  {
    id: 3,
    notification_type: "room_issue_reported",
    title: "Có báo cáo sự cố phòng máy",
    message_body:
      "Giảng viên hoặc kỹ thuật viên vừa báo cáo sự cố phòng máy. CBDT cần cân nhắc ảnh hưởng đến lịch thực hành đã công bố.",
    related_entity_type: "room_issue_reports",
    related_entity_id: 1,
    created_by_user_id: 9,
    created_at: "2026-04-27 15:25:00",
    recipient_status: "read",
    read_at: "2026-04-27 15:40:00",
    acknowledged_at: null,
  },
  {
    id: 4,
    notification_type: "room_block_submitted",
    title: "KTV đề xuất khóa phòng để bảo trì",
    message_body:
      "Kỹ thuật viên đã gửi đề xuất khóa phòng. CBDT/QTV cần xem xét để tránh ảnh hưởng lịch học toàn trường.",
    related_entity_type: "room_block_requests",
    related_entity_id: 1,
    created_by_user_id: 9,
    created_at: "2026-04-27 11:10:00",
    recipient_status: "acknowledged",
    read_at: "2026-04-27 11:20:00",
    acknowledged_at: "2026-04-27 11:25:00",
  },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
  { value: "read", label: "Đã đọc" },
  { value: "acknowledged", label: "Đã xác nhận" },
  { value: "schedule_request_submitted", label: "Yêu cầu xếp lịch" },
  { value: "change_request_submitted", label: "Đổi/bù/hủy lịch" },
  { value: "room_issue_reported", label: "Sự cố phòng" },
  { value: "room_block_submitted", label: "Khóa phòng" },
];

const TYPE_LABELS = {
  schedule_request_submitted: "Yêu cầu xếp lịch",
  change_request_submitted: "Đổi/bù/hủy lịch",
  room_issue_reported: "Sự cố phòng",
  room_block_submitted: "Khóa phòng",
  system: "Hệ thống",
};

const STATUS_LABELS = {
  unread: "Chưa đọc",
  read: "Đã đọc",
  acknowledged: "Đã xác nhận",
};

function normalizeDate(value) {
  if (!value) return null;

  const date = new Date(String(value).replace(" ", "T"));

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = normalizeDate(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatRelativeTime(value) {
  const date = normalizeDate(value);

  if (!date) return "—";

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60000),
  );

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours} giờ trước`;

  return `${Math.floor(diffHours / 24)} ngày trước`;
}

function getNotificationIcon(type) {
  const iconMap = {
    schedule_request_submitted: "🧾",
    change_request_submitted: "🔁",
    room_issue_reported: "🛠️",
    room_block_submitted: "🚧",
    system: "🔔",
  };

  return iconMap[type] || "🔔";
}

function getRelatedHref(notification) {
  if (notification.related_entity_type === "lab_schedule_requests") {
    return "/academic/schedule-requests";
  }

  if (notification.related_entity_type === "lab_schedule_change_requests") {
    return "/academic/change-requests";
  }

  if (
    notification.related_entity_type === "room_issue_reports" ||
    notification.related_entity_type === "room_block_requests"
  ) {
    return "/academic/reports";
  }

  return "";
}

function getNowIsoString() {
  return new Date().toISOString();
}

function filterNotifications(notifications, activeFilter) {
  if (activeFilter === "all") {
    return notifications;
  }

  if (["unread", "read", "acknowledged"].includes(activeFilter)) {
    return notifications.filter(
      (notification) => notification.recipient_status === activeFilter,
    );
  }

  return notifications.filter(
    (notification) => notification.notification_type === activeFilter,
  );
}

export default function AcademicNotificationsPage() {
  const [notifications, setNotifications] = useState(
    MOCK_ACADEMIC_NOTIFICATIONS,
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [uiMessage, setUiMessage] = useState("");

  const visibleNotifications = useMemo(
    () => filterNotifications(notifications, activeFilter),
    [activeFilter, notifications],
  );

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => notification.recipient_status === "unread",
      ).length,
    [notifications],
  );

  function markAsRead(notificationId) {
    setUiMessage("Chỉ cập nhật trạng thái trên UI mock vì backend thiếu API.");

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => {
        if (
          notification.id !== notificationId ||
          notification.recipient_status !== "unread"
        ) {
          return notification;
        }

        return {
          ...notification,
          recipient_status: "read",
          read_at: getNowIsoString(),
        };
      }),
    );
  }

  function acknowledgeNotification(notificationId) {
    setUiMessage("Đã xác nhận trên UI mock. Chưa ghi notification_recipients.");

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => {
        if (notification.id !== notificationId) {
          return notification;
        }

        return {
          ...notification,
          recipient_status: "acknowledged",
          read_at: notification.read_at || getNowIsoString(),
          acknowledged_at: getNowIsoString(),
        };
      }),
    );
  }

  function markAllAsRead() {
    setUiMessage("Đã đánh dấu tất cả là đã đọc trên UI mock.");

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => {
        if (notification.recipient_status !== "unread") {
          return notification;
        }

        return {
          ...notification,
          recipient_status: "read",
          read_at: getNowIsoString(),
        };
      }),
    );
  }

  return (
    <div className="academicPageStack">
      <section className="academicHero">
        <div className="academicHeroBody">
          <p className="academicEyebrow">Cán bộ đào tạo</p>
          <h1 className="academicHeroTitle">Thông báo</h1>
          <p className="academicHeroText">
            Theo dõi các việc CBDT cần xử lý: yêu cầu xếp lịch, yêu cầu
            đổi/bù/hủy, sự cố phòng máy và đề xuất khóa phòng.
          </p>
        </div>

        <div className="academicHeroActions">
          <span className="academicDataBadge academicDataBadge--warning">
            Thiếu API notifications
          </span>

          <ButtonUI
            type="button"
            className="academicPrimaryButton"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Đánh dấu tất cả đã đọc
          </ButtonUI>
        </div>
      </section>

      <section className="academicAlert academicAlert--warning">
        <h3>Thiếu API notifications / notification_recipients</h3>
        <p>
          Backend chưa có endpoint lấy thông báo theo CBDT/QTV và cập nhật trạng
          thái đọc/xác nhận. Danh sách bên dưới là mock để hoàn thiện UI.
        </p>
      </section>

      {uiMessage ? (
        <section className="academicAlert academicAlert--info" role="status">
          <button
            type="button"
            className="academicAlertClose"
            onClick={() => setUiMessage("")}
            aria-label="Tắt thông báo"
          >
            ×
          </button>
          <h3>Thông tin thao tác</h3>
          <p>{uiMessage}</p>
        </section>
      ) : null}

      <section className="academicNotificationToolbar">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              activeFilter === option.value
                ? "academicNotificationFilter academicNotificationFilter--active"
                : "academicNotificationFilter"
            }
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </section>

      <section className="academicNotificationList">
        {visibleNotifications.length === 0 ? (
          <div className="academicEmptyBox">
            <h2>Không có thông báo</h2>
            <p>Không có thông báo phù hợp bộ lọc hiện tại.</p>
          </div>
        ) : null}

        {visibleNotifications.map((notification) => {
          const relatedHref = getRelatedHref(notification);

          return (
            <article
              key={notification.id}
              className={`academicNotificationCard academicNotificationCard--${notification.recipient_status}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="academicNotificationIcon">
                {getNotificationIcon(notification.notification_type)}
              </div>

              <div className="academicNotificationBody">
                <div className="academicNotificationHeader">
                  <div>
                    <p className="academicNotificationType">
                      {TYPE_LABELS[notification.notification_type] ||
                        notification.notification_type}
                    </p>
                    <h2>{notification.title}</h2>
                  </div>

                  <span>{formatRelativeTime(notification.created_at)}</span>
                </div>

                <p className="academicNotificationMessage">
                  {notification.message_body}
                </p>

                <div className="academicNotificationMeta">
                  <span
                    className={`academicStatusBadge academicRecipientStatus--${notification.recipient_status}`}
                  >
                    {STATUS_LABELS[notification.recipient_status] ||
                      notification.recipient_status}
                  </span>
                  <span>
                    Phát hành: {formatDateTime(notification.created_at)}
                  </span>
                  {notification.read_at ? (
                    <span>Đọc lúc: {formatDateTime(notification.read_at)}</span>
                  ) : null}
                  {notification.acknowledged_at ? (
                    <span>
                      Xác nhận: {formatDateTime(notification.acknowledged_at)}
                    </span>
                  ) : null}
                </div>

                <div className="academicNotificationActions">
                  {relatedHref ? (
                    <a
                      href={relatedHref}
                      className="academicTextLink"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Xem liên quan
                    </a>
                  ) : null}

                  <button
                    type="button"
                    className="academicInlineButton"
                    onClick={(event) => {
                      event.stopPropagation();
                      acknowledgeNotification(notification.id);
                    }}
                    disabled={notification.recipient_status === "acknowledged"}
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
