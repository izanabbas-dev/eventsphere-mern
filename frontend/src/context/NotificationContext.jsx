import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "./useAuth";
import { useSocketEvent } from "./useSocket";
import { NotificationContext } from "./useNotifications";

// My notifications and unread count, shared by the top bar bell and the Notifications page.
// It lives in DashboardLayout, so it starts empty again after a logout.
export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const { pathname } = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load again when the token changes (for example after a password change)
  useEffect(() => {
    api
      .get("/notifications/my")
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Live: a new notification goes to the top
  const handleNew = useCallback(
    (notification) => {
      setNotifications((list) => [notification, ...list]);
      setUnreadCount((count) => count + 1);

      // The chat page already shows new messages, so no toast there
      const onChatPage = pathname.endsWith("/messages");
      if (!(notification.type === "message" && onChatPage)) {
        toast(notification.title, { icon: "🔔" });
      }
    },
    [pathname]
  );
  useSocketEvent("notification", handleNew);

  async function markAsRead(id) {
    const item = notifications.find((n) => n._id === id);
    if (!item || item.isRead) return;

    setNotifications((list) => list.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // Not important enough to show an error
    }
  }

  async function markAllAsRead() {
    await api.patch("/notifications/read-all");
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}
