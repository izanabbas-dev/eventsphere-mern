import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellOff, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Tabs from "../../components/ui/Tabs";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import NotificationItem from "../../components/notifications/NotificationItem";
import useAuth from "../../context/useAuth";
import useNotifications from "../../context/useNotifications";
import { getErrorMessage, getNotificationPath } from "../../utils/helpers";

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [marking, setMarking] = useState(false);

  const shown = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  function handleClick(notification) {
    markAsRead(notification._id);
    const path = getNotificationPath(notification.link, user.role);
    if (path) navigate(path);
  }

  async function handleMarkAll() {
    setMarking(true);
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMarking(false);
    }
  }

  const tabs = [
    { value: "all", label: `All (${notifications.length})` },
    { value: "unread", label: `Unread (${unreadCount})` },
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Updates about your expos, applications, sessions and messages."
        actions={
          unreadCount > 0 && (
            <Button variant="secondary" onClick={handleMarkAll} loading={marking}>
              <CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark all as read
            </Button>
          )
        }
      />

      <Card className="p-0!">
        <div className="px-2 sm:px-4">
          <Tabs tabs={tabs} active={filter} onChange={setFilter} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-indigo-600">
            <Spinner />
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
            message={filter === "unread" ? "You are all caught up." : "New updates will show here."}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {shown.map((notification) => (
              <NotificationItem key={notification._id} notification={notification} onClick={handleClick} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
