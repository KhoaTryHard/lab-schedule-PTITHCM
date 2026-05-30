"use client";

import { useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    notification_type: "schedule_published",
    title: "Đã công bố lịch thực hành phòng máy",
    message_body:
      "Lịch thực hành trong phạm vi phòng 2B11, 2B21, 2B31 đã được seed từ dữ liệu UIS thật.",
    related_entity_type: "lab_schedule_entries",
    related_entity_id: null,
    created_by_user_id: 2,
    created_at: "2026-04-27 22:05:00",
    recipient_status: "unread",
    read_at: null,
    acknowledged_at: null,
  },
  {
    id: 2,
    notification_type: "schedule_changed",
    title: "Cập nhật lịch thực hành",
    message_body:
      "Một buổi thực hành có thay đổi về thời gian hoặc phòng học. Vui lòng kiểm tra lại lịch sinh viên.",
    related_entity_type: "lab_schedule_entries",
    related_entity_id: null,
    created_by_user_id: 2,
    created_at: "2026-04-28 09:15:00",
    recipient_status: "read",
    read_at: "2026-04-28 09:30:00",
    acknowledged_at: null,
  },
  {
    id: 3,
    notification_type: "feedback_received",
    title: "Phản ánh đã được tiếp nhận",
    message_body:
      "Ban quản lý đã ghi nhận nội dung phản ánh và sẽ xử lý khi có đủ API backend.",
    related_entity_type: "student_feedback",
    related_entity_id: null,
    created_by_user_id: 2,
    created_at: "2026-04-29 14:20:00",
    recipient_status: "acknowledged",
    read_at: "2026-04-29 14:24:00",
    acknowledged_at: "2026-04-29 14:25:00",
  },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
  { value: "read", label: "Đã đọc" },
  { value: "acknowledged", label: "Đã xác nhận" },
  { value: "schedule_published", label: "Lịch thực hành" },
  { value: "feedback_received", label: "Phản ánh" },
];

const TYPE_LABELS = {
  schedule_published: "Lịch thực hành",
  schedule_changed: "Thay đổi lịch",
  feedback_received: "Phản ánh",
  system: "Hệ thống",
};

const STATUS_LABELS = {
  unread: "Chưa đọc",
  read: "Đã đọc",
  acknowledged: "Đã xác nhận",
};

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = String(value).replace(" ", "T");
  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = normalizeDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatRelativeTime(value) {
  const date = normalizeDate(value);

  if (!date) {
    return "—";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Vừa xong";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays} ngày trước`;
}

function getNotificationIcon(type) {
  const iconMap = {
    schedule_published: "📅",
    schedule_changed: "🔁",
    feedback_received: "💬",
    system: "⚙️",
  };

  return iconMap[type] || "🔔";
}

function getRelatedLink(notification) {
  if (notification.related_entity_type === "lab_schedule_entries") {
    return "/student/my-schedule";
  }

  if (notification.related_entity_type === "student_feedback") {
    return "/student/feedback";
  }

  return "";
}

function getVisibleNotifications(notifications, activeFilter) {
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

function getNowIsoString() {
  return new Date().toISOString();
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState("all");
  const [uiMessage, setUiMessage] = useState("");

  const visibleNotifications = useMemo(
    () => getVisibleNotifications(notifications, activeFilter),
    [notifications, activeFilter],
  );

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => notification.recipient_status === "unread",
      ).length,
    [notifications],
  );

  function markAsRead(notificationId) {
    setUiMessage(
      "Thao tác chỉ cập nhật mock UI vì backend thiếu API thông báo.",
    );

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
    setUiMessage(
      "Thao tác chỉ cập nhật mock UI vì backend thiếu API thông báo.",
    );

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
    setUiMessage(
      "Đã đánh dấu đọc trên UI mock. Chưa ghi notification_recipients.",
    );

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
    <div className="studentPageStack">
      <section className="studentHero studentNotificationHero">
        <div className="studentHeroBody">
          <p className="studentEyebrow">Sinh viên</p>
          <h1 className="studentHeroTitle">Thông báo</h1>
          <p className="studentHeroText">
            Cập nhật thông tin mới nhất về lịch thực hành, thay đổi lịch và phản
            hồi từ hệ thống.
          </p>
        </div>

        <div className="studentHeroActions">
          <span className="studentApiBadge">Thiếu API notifications</span>
          <ButtonUI
            type="button"
            className="studentActionButton"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Đánh dấu tất cả là đã đọc
          </ButtonUI>
        </div>
      </section>

      <section className="studentAlert studentAlert--warning">
        <h2>Thiếu API</h2>
        <p>
          Backend hiện chưa có endpoint lấy notifications và cập nhật
          notification_recipients. Danh sách bên dưới là mock để chốt giao diện.
        </p>
      </section>

      {uiMessage ? (
        <section className="studentAlert studentAlert--info" role="status">
          <h2>Thông tin thao tác</h2>
          <p>{uiMessage}</p>
        </section>
      ) : null}

      <section className="studentNotificationToolbar">
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={
                isActive
                  ? "studentNotificationFilter studentNotificationFilter--active"
                  : "studentNotificationFilter"
              }
              onClick={() => setActiveFilter(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </section>

      <section className="studentNotificationList">
        {visibleNotifications.length === 0 ? (
          <div className="studentEmptyBox">
            <h2>Không có thông báo</h2>
            <p>Không có thông báo phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : null}

        {visibleNotifications.map((notification) => {
          const relatedLink = getRelatedLink(notification);

          return (
            <article
              key={notification.id}
              className={`studentNotificationCard studentNotificationCard--${notification.recipient_status}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="studentNotificationIcon">
                {getNotificationIcon(notification.notification_type)}
              </div>

              <div className="studentNotificationBody">
                <div className="studentNotificationHeader">
                  <div>
                    <p className="studentNotificationType">
                      {TYPE_LABELS[notification.notification_type] ||
                        notification.notification_type}
                    </p>
                    <h2>{notification.title}</h2>
                  </div>

                  <span className="studentNotificationTime">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </div>

                <p className="studentNotificationMessage">
                  {notification.message_body}
                </p>

                <div className="studentNotificationMeta">
                  <span
                    className={`studentStatusPill studentStatusPill--${notification.recipient_status}`}
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

                <div className="studentNotificationActions">
                  {relatedLink ? (
                    <a
                      href={relatedLink}
                      className="studentTextLink"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Xem liên quan
                    </a>
                  ) : null}

                  <button
                    type="button"
                    className="studentInlineButton"
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
