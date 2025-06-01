import { useState, useEffect, useCallback } from "react";
import { Notification } from "@/types";
import { notificationStorage } from "@/utils/storage";

export const useNotificationStore = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const loadNotifications = useCallback(() => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const allNotifications = notificationStorage.getNotifications();
    const userNotifications = allNotifications.filter(
      (notification) => notification.userId === userId,
    );

    // Sort by creation date (newest first)
    userNotifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setNotifications(userNotifications);
    setIsLoading(false);
  }, [userId]);

  const markAsRead = (notificationId: string): void => {
    notificationStorage.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
  };

  const markAllAsRead = (): void => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    unreadNotifications.forEach((notification) => {
      notificationStorage.markAsRead(notification.id);
    });

    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  };

  const getUnreadCount = (): number => {
    return notifications.filter((notification) => !notification.read).length;
  };

  const getNotificationsByType = (
    type: Notification["type"],
  ): Notification[] => {
    return notifications.filter((notification) => notification.type === type);
  };

  const deleteNotification = (notificationId: string): void => {
    const allNotifications = notificationStorage.getNotifications();
    const updatedNotifications = allNotifications.filter(
      (n) => n.id !== notificationId,
    );
    notificationStorage.setNotifications(updatedNotifications);

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const clearAllNotifications = (): void => {
    const allNotifications = notificationStorage.getNotifications();
    const otherUsersNotifications = allNotifications.filter(
      (n) => n.userId !== userId,
    );
    notificationStorage.setNotifications(otherUsersNotifications);

    setNotifications([]);
  };

  return {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    getNotificationsByType,
    deleteNotification,
    clearAllNotifications,
    loadNotifications,
  };
};
