import { useCallback, useEffect, useState } from "react";

import {
  acknowledgeNotification as acknowledgeNotificationApi,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/feedbackNotificationService";

function extractItems(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function upsertNotification(items, updatedNotification) {
  if (!updatedNotification) return items;

  return items.map((notification) =>
    String(notification.id) === String(updatedNotification.id)
      ? updatedNotification
      : notification,
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const reloadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const response = await listNotifications();
      setNotifications(extractItems(response));
    } catch (error) {
      setNotifications([]);
      setLoadError(error?.message || "Không thể tải thông báo từ API.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadNotifications();
  }, [reloadNotifications]);

  async function markAsRead(notificationId) {
    const response = await markNotificationRead(notificationId);
    const updatedNotification = response?.data;

    setNotifications((currentItems) =>
      upsertNotification(currentItems, updatedNotification),
    );

    return updatedNotification;
  }

  async function acknowledge(notificationId) {
    const response = await acknowledgeNotificationApi(notificationId);
    const updatedNotification = response?.data;

    setNotifications((currentItems) =>
      upsertNotification(currentItems, updatedNotification),
    );

    return updatedNotification;
  }

  async function markAllAsRead() {
    const response = await markAllNotificationsRead();

    setNotifications((currentItems) =>
      currentItems.map((notification) =>
        notification.recipient_status === "unread"
          ? {
              ...notification,
              recipient_status: "read",
              read_at: notification.read_at || new Date().toISOString(),
            }
          : notification,
      ),
    );

    return response?.data;
  }

  return {
    acknowledge,
    isLoading,
    loadError,
    markAllAsRead,
    markAsRead,
    notifications,
    reloadNotifications,
  };
}
