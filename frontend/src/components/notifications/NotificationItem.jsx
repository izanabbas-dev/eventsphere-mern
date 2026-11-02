import { timeAgo } from "../../utils/helpers";

// One notification row: title, message, time ago and an unread dot
export default function NotificationItem({ notification, onClick }) {
  const unread = !notification.isRead;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${unread ? "bg-indigo-50/40" : ""}`}
    >
      <span
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-indigo-600" : "bg-transparent"}`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${unread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
          {notification.title}
          {unread && <span className="sr-only"> (unread)</span>}
        </span>
        <span className="mt-0.5 block text-sm break-words text-slate-500">{notification.message}</span>
        <span className="mt-1 block text-xs text-slate-400">{timeAgo(notification.createdAt)}</span>
      </span>
    </button>
  );
}
