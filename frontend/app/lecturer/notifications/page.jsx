"use client";

import { useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";

const MOCK_LECTURER_NOTIFICATIONS = [
  {
    id: 1,
    notification_type: "schedule_published",
    title: "Lịch thực hành đã được công bố",
    message_body:
      "Lịch thực hành của giảng viên đã được công bố. Vui lòng kiểm tra lịch giảng viên để chuẩn bị buổi dạy.",
    related_entity_type: "lab_schedule_entries",
    related_entity_id: null,
    created_by_user_id: 2,
    created_at: "2026-04-28 07:35:00",
    recipient_status: "unread",
    read_at: null,
    acknowledged_at: null,
  },
  {
    id: 2,
    notification_type: "change_request_reviewed",
    title: "Yêu cầu đổi lịch đã được tiếp nhận",
    message_body:
      "CBDT đã tiếp nhận yêu cầu đổi/bù/hủy lịch. Trạng thái xử lý sẽ được cập nhật khi backend có API.",
    related_entity_type: "lab_schedule_change_requests",
    related_entity_id: 1,
    created_by_user_id: 2,
    created_at: "2026-04-27 16:20:00",
    recipient_status: "read",
    read_at: "2026-04-27 16:35:00",
    acknowledged_at: null,
  },
  {
    id: 3,
    notification_type: "room_issue_updated",
    title: "Sự cố phòng máy đã được kỹ thuật viên cập nhật",
    message_body:
      "Báo cáo sự cố phòng máy đã chuyển sang trạng thái đang xử lý. Vui lòng theo dõi trước buổi thực hành tiếp theo.",
    related_entity_type: "room_issue_reports",
    related_entity_id: 1,
    created_by_user_id: 9,
    created_at: "2026-04-27 10:05:00",
    recipient_status: "acknowledged",
    read_at: "2026-04-27 10:12:00",
    acknowledged_at: "2026-04-27 10:15:00",
  },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
  { value: "read", label: "Đã đọc" },
  { value: "acknowledged", label: "Đã xác nhận" },
  { value: "schedule_published", label: "Lịch thực hành" },
  { value: "change_request_reviewed", label: "Đổi/bù/hủy" },
  { value: "room_issue_updated", label: "Sự cố phòng" },
];

const TYPE_LABELS = {
  schedule_published: "Lịch thực hành",
  change_request_reviewed: "Đổi/bù/hủy",
  room_issue_updated: "Sự cố phòng",
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
    schedule_published: "📅",
    change_request_reviewed: "🔁",
    room_issue_updated: "🛠️",
    system: "🔔",
  };

  return iconMap[type] || "🔔";
}

function getRelatedHref(notification) {
  if (notification.related_entity_type === "lab_schedule_entries") {
    return "/lecturer/my-schedule";
  }

  if (notification.related_entity_type === "lab_schedule_change_requests") {
    return "/lecturer/change-requests";
  }

  if (notification.related_entity_type === "room_issue_reports") {
    return "/lecturer/room-issues";
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

export default function LecturerNotificationsPage() {
  const [notifications, setNotifications] = useState(
    MOCK_LECTURER_NOTIFICATIONS,
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
    <div className="lecturerPageStack">
      <section className="lecturerHero">
        <div className="lecturerHeroBody">
          <p className="lecturerEyebrow">Giảng viên</p>
          <h1 className="lecturerHeroTitle">Thông báo</h1>
          <p className="lecturerHeroText">
            Theo dõi thông báo về lịch thực hành, yêu cầu đổi/bù/hủy và trạng
            thái xử lý sự cố phòng máy.
          </p>
        </div>

        <div className="lecturerHeroActions">
          <span className="lecturerDataBadge lecturerDataBadge--warning">
            Thiếu API notifications
          </span>

          <ButtonUI
            type="button"
            className="lecturerPrimaryButton"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Đánh dấu tất cả đã đọc
          </ButtonUI>
        </div>
      </section>

      <section className="lecturerAlert lecturerAlert--warning">
        <h3>Thiếu API notifications / notification_recipients</h3>
        <p>
          Backend chưa có endpoint lấy thông báo theo giảng viên và cập nhật
          trạng thái đọc/xác nhận. Danh sách bên dưới là mock để hoàn thiện UI.
        </p>
      </section>

      {uiMessage ? (
        <section className="lecturerAlert lecturerAlert--info" role="status">
          <button
            type="button"
            className="lecturerAlertClose"
            onClick={() => setUiMessage("")}
            aria-label="Tắt thông báo"
          >
            ×
          </button>
          <h3>Thông tin thao tác</h3>
          <p>{uiMessage}</p>
        </section>
      ) : null}

      <section className="lecturerNotificationToolbar">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              activeFilter === option.value
                ? "lecturerNotificationFilter lecturerNotificationFilter--active"
                : "lecturerNotificationFilter"
            }
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </section>

      <section className="lecturerNotificationList">
        {visibleNotifications.length === 0 ? (
          <div className="lecturerEmptyBox">
            <h2>Không có thông báo</h2>
            <p>Không có thông báo phù hợp bộ lọc hiện tại.</p>
          </div>
        ) : null}

        {visibleNotifications.map((notification) => {
          const relatedHref = getRelatedHref(notification);

          return (
            <article
              key={notification.id}
              className={`lecturerNotificationCard lecturerNotificationCard--${notification.recipient_status}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="lecturerNotificationIcon">
                {getNotificationIcon(notification.notification_type)}
              </div>

              <div className="lecturerNotificationBody">
                <div className="lecturerNotificationHeader">
                  <div>
                    <p className="lecturerNotificationType">
                      {TYPE_LABELS[notification.notification_type] ||
                        notification.notification_type}
                    </p>
                    <h2>{notification.title}</h2>
                  </div>

                  <span>{formatRelativeTime(notification.created_at)}</span>
                </div>

                <p className="lecturerNotificationMessage">
                  {notification.message_body}
                </p>

                <div className="lecturerNotificationMeta">
                  <span
                    className={`lecturerStatusBadge lecturerRecipientStatus--${notification.recipient_status}`}
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

                <div className="lecturerNotificationActions">
                  {relatedHref ? (
                    <a
                      href={relatedHref}
                      className="lecturerTextLink"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Xem liên quan
                    </a>
                  ) : null}

                  <button
                    type="button"
                    className="lecturerInlineButton"
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
