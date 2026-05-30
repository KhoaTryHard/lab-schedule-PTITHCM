"use client";

import { useMemo, useState } from "react";

import { ButtonUI } from "../../../components/common/buttonUI.jsx";

const MOCK_TECHNICIAN_NOTIFICATIONS = [
  {
    id: 1,
    notification_type: "room_issue_assigned",
    title: "Bạn được giao xử lý sự cố phòng 2B21",
    message_body:
      "Có báo cáo máy tính không khởi động trong ca thực hành. Vui lòng kiểm tra thiết bị và cập nhật tiến độ xử lý.",
    related_entity_type: "room_issue_reports",
    related_entity_id: 1,
    created_by_user_id: 2,
    created_at: "2026-04-28 08:25:00",
    recipient_status: "unread",
    read_at: null,
    acknowledged_at: null,
  },
  {
    id: 2,
    notification_type: "room_block_reviewed",
    title: "Đề xuất khóa phòng đã được duyệt",
    message_body:
      "Đề xuất khóa phòng 2B21 để bảo trì đã được duyệt. Vui lòng phối hợp xử lý trong khung thời gian đã đăng ký.",
    related_entity_type: "room_block_requests",
    related_entity_id: 1,
    created_by_user_id: 2,
    created_at: "2026-04-27 22:15:00",
    recipient_status: "read",
    read_at: "2026-04-27 22:30:00",
    acknowledged_at: null,
  },
  {
    id: 3,
    notification_type: "schedule_published",
    title: "Lịch sử dụng phòng máy đã được công bố",
    message_body:
      "Lịch sử dụng các phòng 2B11, 2B21, 2B31 đã được công bố. Kỹ thuật viên cần theo dõi để chuẩn bị phòng.",
    related_entity_type: "lab_schedule_entries",
    related_entity_id: null,
    created_by_user_id: 2,
    created_at: "2026-04-27 21:40:00",
    recipient_status: "acknowledged",
    read_at: "2026-04-27 21:55:00",
    acknowledged_at: "2026-04-27 22:00:00",
  },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "unread", label: "Chưa đọc" },
  { value: "read", label: "Đã đọc" },
  { value: "acknowledged", label: "Đã xác nhận" },
  { value: "room_issue_assigned", label: "Sự cố phòng" },
  { value: "room_block_reviewed", label: "Khóa phòng" },
  { value: "schedule_published", label: "Lịch phòng" },
];

const TYPE_LABELS = {
  room_issue_assigned: "Sự cố phòng",
  room_block_reviewed: "Khóa phòng",
  schedule_published: "Lịch phòng",
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

  const date = new Date(String(value).replace(" ", "T"));
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

  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60000),
  );

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

  return `${Math.floor(diffHours / 24)} ngày trước`;
}

function getIcon(type) {
  const iconMap = {
    room_issue_assigned: "🛠️",
    room_block_reviewed: "🚧",
    schedule_published: "📅",
    system: "🔔",
  };

  return iconMap[type] || "🔔";
}

function getRelatedHref(notification) {
  if (notification.related_entity_type === "room_issue_reports") {
    return "/technician/issues";
  }

  if (notification.related_entity_type === "room_block_requests") {
    return "/technician/issues";
  }

  if (notification.related_entity_type === "lab_schedule_entries") {
    return "/technician/room-schedule";
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

export default function TechnicianNotificationsPage() {
  const [notifications, setNotifications] = useState(
    MOCK_TECHNICIAN_NOTIFICATIONS,
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
    <div className="technicianPageStack">
      <section className="technicianHero">
        <div className="technicianHeroBody">
          <p className="technicianEyebrow">Kỹ thuật viên</p>
          <h1 className="technicianHeroTitle">Thông báo</h1>
          <p className="technicianHeroText">
            Theo dõi thông báo về sự cố được giao, đề xuất khóa phòng và lịch sử
            dụng phòng máy đã công bố.
          </p>
        </div>

        <div className="technicianHeroActions">
          <span className="technicianDataBadge technicianDataBadge--warning">
            Thiếu API notifications
          </span>

          <ButtonUI
            type="button"
            className="technicianPrimaryButton"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Đánh dấu tất cả đã đọc
          </ButtonUI>
        </div>
      </section>

      <section className="technicianAlert technicianAlert--warning">
        <h3>Thiếu API notifications / notification_recipients</h3>
        <p>
          Backend chưa có endpoint lấy thông báo theo user và cập nhật trạng
          thái đọc/xác nhận. Danh sách bên dưới là mock để hoàn thiện UI kỹ
          thuật viên.
        </p>
      </section>

      {uiMessage ? (
        <section
          className="technicianAlert technicianAlert--info"
          role="status"
        >
          <button
            type="button"
            className="technicianAlertClose"
            onClick={() => setUiMessage("")}
            aria-label="Tắt thông báo"
          >
            ×
          </button>
          <h3>Thông tin thao tác</h3>
          <p>{uiMessage}</p>
        </section>
      ) : null}

      <section className="technicianNotificationToolbar">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              activeFilter === option.value
                ? "technicianNotificationFilter technicianNotificationFilter--active"
                : "technicianNotificationFilter"
            }
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </section>

      <section className="technicianNotificationList">
        {visibleNotifications.length === 0 ? (
          <div className="technicianEmptyBox">
            <h2>Không có thông báo</h2>
            <p>Không có thông báo phù hợp bộ lọc hiện tại.</p>
          </div>
        ) : null}

        {visibleNotifications.map((notification) => {
          const relatedHref = getRelatedHref(notification);

          return (
            <article
              key={notification.id}
              className={`technicianNotificationCard technicianNotificationCard--${notification.recipient_status}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="technicianNotificationIcon">
                {getIcon(notification.notification_type)}
              </div>

              <div className="technicianNotificationBody">
                <div className="technicianNotificationHeader">
                  <div>
                    <p className="technicianNotificationType">
                      {TYPE_LABELS[notification.notification_type] ||
                        notification.notification_type}
                    </p>
                    <h2>{notification.title}</h2>
                  </div>

                  <span>{formatRelativeTime(notification.created_at)}</span>
                </div>

                <p className="technicianNotificationMessage">
                  {notification.message_body}
                </p>

                <div className="technicianNotificationMeta">
                  <span
                    className={`technicianStatusBadge technicianRecipientStatus--${notification.recipient_status}`}
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

                <div className="technicianNotificationActions">
                  {relatedHref ? (
                    <a
                      href={relatedHref}
                      className="technicianTextLink"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Xem liên quan
                    </a>
                  ) : null}

                  <button
                    type="button"
                    className="technicianInlineButton"
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
