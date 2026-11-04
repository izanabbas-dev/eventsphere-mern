import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, Clock, MapPin, Star, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import StatCard from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadError from "../../components/ui/LoadError";
import api from "../../api/axios";
import { fetchMyBookmarks, fetchMyRegistrations } from "../../api/attendeeApi";
import useAuth from "../../context/useAuth";
import useNotifications from "../../context/useNotifications";
import { formatDate, formatSessionTime, getErrorMessage, toInputDate } from "../../utils/helpers";

async function fetchDashboard() {
  const [registrations, bookmarks, exposRes] = await Promise.all([
    fetchMyRegistrations(),
    fetchMyBookmarks(),
    api.get("/expos", { params: { status: "published" } }),
  ]);

  const now = new Date();
  const today = toInputDate(now);

  // Expo tickets that are active and not over yet
  const upcomingExpos = registrations
    .filter((r) => !r.session && r.status === "registered" && toInputDate(r.expo.endDate) >= today)
    .sort((a, b) => new Date(a.expo.startDate) - new Date(b.expo.startDate));

  // Next 3 bookmarked sessions (already sorted by time)
  const nextBookmarks = bookmarks
    .filter((b) => b.session.status !== "cancelled" && new Date(b.session.startTime) > now)
    .slice(0, 3);

  return {
    upcomingExpos,
    nextBookmarks,
    bookmarkCount: bookmarks.length,
    openExpos: exposRes.data.expos,
  };
}

export default function AttendeeDashboard() {
  const { user } = useAuth();
  // Same live count as the bell in the top bar
  const { unreadCount } = useNotifications();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullPage />;

  if (!data) return <LoadError onRetry={() => window.location.reload()} />;

  const { upcomingExpos, nextBookmarks, bookmarkCount, openExpos } = data;
  const registeredIds = upcomingExpos.map((r) => r.expo._id);

  return (
    <>
      <div className="mb-6 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {user.name}</h1>
        <p className="mt-1 text-sm text-indigo-100">
          {upcomingExpos.length > 0
            ? `You have ${upcomingExpos.length} upcoming expo${upcomingExpos.length > 1 ? "s" : ""}. Enjoy your visit!`
            : "Find an expo, get your ticket and plan your day."}
        </p>
        <Button to="/attendee/expos" variant="secondary" size="sm" className="mt-4">
          Browse expos
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming expos" value={upcomingExpos.length} icon={Ticket} />
        <StatCard label="Bookmarked sessions" value={bookmarkCount} icon={Star} color="amber" />
        <StatCard
          label="Unread notifications"
          value={unreadCount}
          icon={Bell}
          color="sky"
          hint={
            <Link to="/notifications" className="font-semibold text-indigo-600 hover:underline">
              View notifications
            </Link>
          }
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0!">
          <ListHeader title="My upcoming expos" linkTo="/attendee/registrations" linkText="All tickets" />
          {upcomingExpos.length === 0 ? (
            <EmptyState icon={Ticket} title="No tickets yet" message="Register for an expo to see it here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingExpos.map((registration) => (
                <li key={registration._id}>
                  <Link
                    to={`/attendee/expos/${registration.expo._id}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{registration.expo.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                        <span>
                          {formatDate(registration.expo.startDate)} - {formatDate(registration.expo.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {registration.expo.location}
                        </span>
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-indigo-700">
                      {registration.ticketCode}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-0!">
          <ListHeader title="Next bookmarked sessions" linkTo="/attendee/bookmarks" linkText="All bookmarks" />
          {nextBookmarks.length === 0 ? (
            <EmptyState icon={Star} title="No upcoming bookmarks" message="Star sessions in the schedule to see them here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {nextBookmarks.map((bookmark) => (
                <li key={bookmark._id} className="px-5 py-4">
                  <p className="truncate font-semibold text-slate-900">{bookmark.session.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{bookmark.expo?.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {formatSessionTime(bookmark.session)}
                    </span>
                    {bookmark.session.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {bookmark.session.location}
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-0!">
        <ListHeader title="Open expos" linkTo="/attendee/expos" linkText="All expos" />
        {openExpos.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No open expos" message="New expos will show here when published." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {openExpos.map((expo) => (
              <li key={expo._id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{expo.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                    <span>
                      {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {expo.location}
                    </span>
                    {registeredIds.includes(expo._id) && <span className="font-semibold text-green-700">Registered</span>}
                  </p>
                </div>
                <Button to={`/attendee/expos/${expo._id}`} variant="secondary" size="sm">
                  View
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function ListHeader({ title, linkTo, linkText }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <Link to={linkTo} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
        {linkText}
      </Link>
    </div>
  );
}
