"use client";

import { useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { useNotifications } from "../../../hooks/useNotifications";

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
  const {
    acknowledge,
    isLoading,
    loadError,
    markAllAsRead: markAllAsReadApi,
    markAsRead: markAsReadApi,
    notifications,
  } = useNotifications();
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

  async function markAsRead(notificationId) {
    try {
      await markAsReadApi(notificationId);
      setUiMessage("Đã đánh dấu thông báo là đã đọc.");
    } catch (error) {
      setUiMessage(error?.message || "Không thể đánh dấu đã đọc.");
    }
  }

  async function acknowledgeNotification(notificationId) {
    try {
      await acknowledge(notificationId);
      setUiMessage("Đã xác nhận thông báo.");
    } catch (error) {
      setUiMessage(error?.message || "Không thể xác nhận thông báo.");
    }
  }

  async function markAllAsRead() {
    try {
      const result = await markAllAsReadApi();
      setUiMessage(
        `Đã đánh dấu ${result?.updated_count ?? unreadCount} thông báo là đã đọc.`,
      );
    } catch (error) {
      setUiMessage(error?.message || "Không thể đánh dấu tất cả đã đọc.");
    }
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
            API notifications
          </span>

          <ButtonUI
            type="button"
            className="lecturerPrimaryButton"
            onClick={markAllAsRead}
            disabled={isLoading || unreadCount === 0}
          >
            Đánh dấu tất cả đã đọc
          </ButtonUI>
        </div>
      </section>

      {loadError ? (
        <section className="lecturerAlert lecturerAlert--error" role="alert">
          <h3>Không tải được thông báo</h3>
          <p>{loadError}</p>
        </section>
      ) : null}

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
        {isLoading ? (
          <div className="lecturerEmptyBox">
            <h2>Đang tải thông báo</h2>
            <p>Hệ thống đang lấy danh sách thông báo của tài khoản hiện tại.</p>
          </div>
        ) : null}

        {!isLoading && visibleNotifications.length === 0 ? (
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
