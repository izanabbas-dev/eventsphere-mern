import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, Clock, MapPin, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../api/axios";
import { fetchMyBookmarks } from "../../api/attendeeApi";
import { formatSessionTime, getErrorMessage } from "../../utils/helpers";

export default function AttendeeBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    // The backend already sorts them by session time
    fetchMyBookmarks()
      .then(setBookmarks)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(bookmark) {
    setRemovingId(bookmark._id);
    try {
      const res = await api.delete(`/sessions/${bookmark.session._id}/bookmark`);
      toast.success(res.data.message);
      setBookmarks((prev) => prev.filter((b) => b._id !== bookmark._id));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) return <Spinner fullPage />;

  return (
    <>
      <PageHeader title="Bookmarks" subtitle="Sessions you saved. You get a reminder before each one starts." />

      {bookmarks.length === 0 ? (
        <Card>
          <EmptyState
            icon={Star}
            title="No bookmarks yet"
            message="Tap the star on a session to save it here."
            action={<Button to="/attendee/schedule">Open schedule</Button>}
          />
        </Card>
      ) : (
        <Card className="p-0!">
          <ul className="divide-y divide-slate-100">
            {bookmarks.map((bookmark) => (
              <BookmarkRow
                key={bookmark._id}
                bookmark={bookmark}
                removing={removingId === bookmark._id}
                onRemove={() => handleRemove(bookmark)}
              />
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function BookmarkRow({ bookmark, removing, onRemove }) {
  const { session, expo } = bookmark;
  const cancelled = session.status === "cancelled";
  const ended = new Date(session.endTime) < new Date();

  return (
    <li className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center ${cancelled || ended ? "opacity-60" : ""}`}>
      <Star className="hidden h-5 w-5 shrink-0 fill-amber-400 text-amber-500 sm:block" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-semibold text-slate-900 ${cancelled ? "line-through" : ""}`}>{session.title}</p>
          {cancelled && <Badge status="cancelled">Cancelled</Badge>}
          {!cancelled && ended && <Badge color="gray">Ended</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          {expo && (
            <Link to={`/attendee/expos/${expo._id}?tab=schedule`} className="flex items-center gap-1.5 hover:text-indigo-600">
              <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {expo.title}
            </Link>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {formatSessionTime(session)}
          </span>
          {session.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {session.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Remind {bookmark.remindBeforeMinutes} min before
          </span>
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={onRemove} loading={removing}>
        {!removing && <Trash2 className="h-4 w-4" aria-hidden="true" />} Remove
      </Button>
    </li>
  );
}
