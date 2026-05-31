"use client";

import { useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";
import { useNotifications } from "../../../hooks/useNotifications";

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
  { value: "read", label: "Đã đọc" },
  { value: "acknowledged", label: "Đã xác nhận" },
  { value: "schedule_request_submitted", label: "Yêu cầu xếp lịch" },
  { value: "change_request_submitted", label: "Đổi/bù/hủy lịch" },
  { value: "room_issue_reported", label: "Sự cố phòng" },
  { value: "room_block_submitted", label: "Khóa phòng" },
  { value: "student_feedback_submitted", label: "Phản ánh SV" },
];

const TYPE_LABELS = {
  schedule_request_submitted: "Yêu cầu xếp lịch",
  change_request_submitted: "Đổi/bù/hủy lịch",
  room_issue_reported: "Sự cố phòng",
  room_block_submitted: "Khóa phòng",
  student_feedback_submitted: "Phản ánh SV",
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
    student_feedback_submitted: "💬",
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

  if (notification.related_entity_type === "student_feedback") {
    return "/academic/notifications";
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

export default function AcademicNotificationsPage() {
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
            API notifications
          </span>

          <ButtonUI
            type="button"
            className="academicPrimaryButton"
            onClick={markAllAsRead}
            disabled={isLoading || unreadCount === 0}
          >
            Đánh dấu tất cả đã đọc
          </ButtonUI>
        </div>
      </section>

      {loadError ? (
        <section className="academicAlert academicAlert--error" role="alert">
          <h3>Không tải được thông báo</h3>
          <p>{loadError}</p>
        </section>
      ) : null}

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
        {isLoading ? (
          <div className="academicEmptyBox">
            <h2>Đang tải thông báo</h2>
            <p>Hệ thống đang lấy danh sách thông báo của tài khoản hiện tại.</p>
          </div>
        ) : null}

        {!isLoading && visibleNotifications.length === 0 ? (
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
