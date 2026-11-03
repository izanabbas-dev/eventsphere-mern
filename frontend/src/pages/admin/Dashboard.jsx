import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  MapPin,
  MessageSquareText,
  Plus,
  Ticket,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import StatCard from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadError from "../../components/ui/LoadError";
import ExpoFormModal from "../../components/expo/ExpoFormModal";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";
import { formatDate, getErrorMessage } from "../../utils/helpers";

// Expos that are published or running and have not ended yet
function getUpcomingExpos(expos) {
  const today = new Date().toISOString().slice(0, 10);
  return expos.filter(
    (expo) => ["published", "ongoing"].includes(expo.status) && expo.endDate.slice(0, 10) >= today
  );
}

// Overview numbers, upcoming expos and their pending applications (newest first)
async function fetchDashboard() {
  const [overviewRes, exposRes] = await Promise.all([api.get("/analytics/overview"), api.get("/expos")]);
  const upcoming = getUpcomingExpos(exposRes.data.expos);

  const results = await Promise.all(
    upcoming.map((expo) => api.get(`/expos/${expo._id}/applications`, { params: { status: "pending" } }))
  );
  const pending = results.flatMap((res, i) => res.data.applications.map((app) => ({ ...app, expo: upcoming[i] })));
  pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { overview: overviewRes.data.overview, upcoming, pending };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ overview: null, upcoming: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const loadData = useCallback(() => {
    fetchDashboard()
      .then(setData)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <Spinner fullPage />;

  // The overview is missing only when loading failed
  if (!data.overview) return <LoadError onRetry={() => window.location.reload()} />;

  const { overview, upcoming, pending } = data;
  const users = overview?.usersByRole || {};
  const expos = overview?.exposByStatus || {};
  const totalUsers = (users.admin || 0) + (users.exhibitor || 0) + (users.attendee || 0);
  const totalExpos = Object.values(expos).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle="Here is what is happening across your expos."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Create Expo
          </Button>
        }
      />

      {overview && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total users"
            value={totalUsers}
            icon={Users}
            hint={`${users.attendee} attendees · ${users.exhibitor} exhibitors · ${users.admin} admins`}
          />
          <StatCard
            label="Total expos"
            value={totalExpos}
            icon={CalendarDays}
            color="sky"
            hint={`${expos.draft} draft · ${expos.published} published · ${expos.ongoing} ongoing · ${expos.completed} completed · ${expos.cancelled} cancelled`}
          />
          <StatCard
            label="Registrations"
            value={overview.totalRegistrations}
            icon={Ticket}
            color="green"
            hint="Attendee registrations (not cancelled)"
          />
          <StatCard
            label="Feedback"
            value={overview.totalFeedback}
            icon={MessageSquareText}
            color="amber"
            hint={<Link to="/admin/feedback" className="font-semibold text-indigo-600 hover:underline">View feedback</Link>}
          />
        </div>
      )}

      {/* Quick actions */}
      <Card className="mb-6 p-4!">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setFormOpen(true)} variant="secondary">
            <Plus className="h-4 w-4" aria-hidden="true" /> Create Expo
          </Button>
          <Button to="/admin/sessions" variant="secondary">
            <CalendarClock className="h-4 w-4" aria-hidden="true" /> Add Session
          </Button>
          <Button to="/admin/analytics" variant="secondary">
            <BarChart3 className="h-4 w-4" aria-hidden="true" /> View Analytics
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0!">
          <ListHeader title="Upcoming expos" linkTo="/admin/expos" linkText="All expos" />
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming expos" message="Publish an expo to see it here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.slice(0, 5).map((expo) => (
                <li key={expo._id}>
                  <Link
                    to={`/admin/expos/${expo._id}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{expo.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                        <span>{formatDate(expo.startDate)} - {formatDate(expo.endDate)}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {expo.location}
                        </span>
                      </p>
                    </div>
                    <Badge status={expo.status} />
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-0!">
          <ListHeader title="Pending applications" linkTo="/admin/applications" linkText="All applications" />
          {pending.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No pending applications" message="New exhibitor applications will show here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.slice(0, 5).map((app) => (
                <li key={app._id}>
                  <Link
                    to={`/admin/applications?expo=${app.expo._id}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {app.profile?.companyName || app.exhibitor?.name || "Unknown company"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {app.expo.title} · Applied {formatDate(app.createdAt)}
                      </p>
                    </div>
                    <Badge status="pending" />
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {formOpen && (
        <ExpoFormModal
          expo={null}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            loadData();
          }}
        />
      )}
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
