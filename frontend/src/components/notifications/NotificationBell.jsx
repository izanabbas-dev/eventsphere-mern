import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, BellOff } from "lucide-react";
import toast from "react-hot-toast";
import NotificationItem from "./NotificationItem";
import useAuth from "../../context/useAuth";
import useNotifications from "../../context/useNotifications";
import { getErrorMessage, getNotificationPath } from "../../utils/helpers";

// Bell with the unread count. Opens a list of the latest 8 notifications.
export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (!boxRef.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleItemClick(notification) {
    markAsRead(notification._id);
    const path = getNotificationPath(notification.link, user.role);
    if (path) {
      setOpen(false);
      navigate(path);
    }
  }

  async function handleMarkAll() {
    try {
      await markAllAsRead();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAll} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center text-sm text-slate-500">
              <BellOff className="mb-2 h-6 w-6 text-slate-300" aria-hidden="true" />
              No notifications yet
            </div>
          ) : (
            <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
              {notifications.slice(0, 8).map((notification) => (
                <NotificationItem key={notification._id} notification={notification} onClick={handleItemClick} />
              ))}
            </div>
          )}

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 py-3 text-center text-sm font-semibold text-indigo-600 hover:bg-slate-50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
