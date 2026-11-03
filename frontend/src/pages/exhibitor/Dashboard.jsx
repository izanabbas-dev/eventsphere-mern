import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, MapPin, Store } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import StatCard from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadError from "../../components/ui/LoadError";
import CompanyLogo from "../../components/applications/CompanyLogo";
import api from "../../api/axios";
import { fetchMyBooths, fetchMyProfile } from "../../api/exhibitorApi";
import useAuth from "../../context/useAuth";
import useNotifications from "../../context/useNotifications";
import { formatDate, getErrorMessage, getProfileChecklist } from "../../utils/helpers";

async function fetchDashboard(userId) {
  const [profile, appsRes, exposRes, booths] = await Promise.all([
    fetchMyProfile(),
    api.get("/applications/my"),
    api.get("/expos", { params: { status: "published" } }),
    fetchMyBooths(userId),
  ]);

  return {
    profile,
    applications: appsRes.data.applications,
    openExpos: exposRes.data.expos,
    booths,
  };
}

export default function ExhibitorDashboard() {
  const { user } = useAuth();
  // Same live count as the bell in the top bar
  const { unreadCount } = useNotifications();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard(user._id)
      .then(setData)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [user._id]);

  if (loading) return <Spinner fullPage />;

  if (!data) return <LoadError onRetry={() => window.location.reload()} />;

  const { profile, applications, openExpos, booths } = data;
  const countBy = (status) => applications.filter((app) => app.status === status).length;

  // { expoId: "pending" }
  const myStatus = {};
  applications.forEach((app) => {
    if (app.expo) myStatus[app.expo._id] = app.status;
  });

  return (
    <>
      <WelcomeCard user={user} profile={profile} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications"
          value={applications.length}
          icon={ClipboardList}
          hint={`${countBy("pending")} pending · ${countBy("approved")} approved · ${countBy("rejected")} rejected`}
        />
        <StatCard label="Approved" value={countBy("approved")} icon={CheckCircle2} color="green" />
        <StatCard
          label="My booths"
          value={booths.length}
          icon={Store}
          color="sky"
          hint={`${booths.filter((b) => b.status === "booked").length} booked · ${booths.filter((b) => b.status === "reserved").length} reserved`}
        />
        <StatCard
          label="Unread notifications"
          value={unreadCount}
          icon={Bell}
          color="amber"
          hint={<Link to="/notifications" className="font-semibold text-indigo-600 hover:underline">View notifications</Link>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0!">
          <ListHeader title="My booths" linkTo="/exhibitor/booth" linkText="Manage" />
          {booths.length === 0 ? (
            <EmptyState icon={Store} title="No booth yet" message="Reserve a booth from an expo floor plan." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {booths.map((booth) => (
                <li key={booth._id}>
                  <Link
                    to={`/exhibitor/expos/${booth.expo._id}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-700">
                      {booth.boothNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{booth.expo.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Booth {booth.boothNumber}
                        {booth.hall && ` · ${booth.hall}`} · {formatDate(booth.expo.startDate)}
                      </p>
                    </div>
                    <Badge status={booth.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-0!">
          <ListHeader title="Open expos" linkTo="/exhibitor/expos" linkText="All expos" />
          {openExpos.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No open expos" message="New expos will show here when published." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {openExpos.slice(0, 5).map((expo) => {
                const status = myStatus[expo._id];
                const applied = status && status !== "withdrawn";
                return (
                  <li key={expo._id} className="flex items-center gap-3 px-5 py-4">
                    <Link to={`/exhibitor/expos/${expo._id}`} className="min-w-0 flex-1 hover:text-indigo-600">
                      <p className="truncate font-semibold text-slate-900">{expo.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                        <span>
                          {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {expo.location}
                        </span>
                      </p>
                    </Link>
                    {applied ? (
                      <Badge status={status} />
                    ) : (
                      <Button to={`/exhibitor/expos/${expo._id}#apply`} size="sm">
                        Apply
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function WelcomeCard({ user, profile }) {
  const checklist = getProfileChecklist(profile);
  const missing = checklist.filter((item) => !item.done);
  const percent = Math.round(((checklist.length - missing.length) / checklist.length) * 100);
  const companyName = profile?.companyName || user.name;

  return (
    <Card className="mb-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <CompanyLogo logo={profile?.logo} name={companyName} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">Welcome, {companyName}</h1>
          <p className="mt-1 text-sm text-slate-500">Signed in as {user.name}</p>

          {missing.length === 0 ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Your profile is complete.
            </p>
          ) : (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">Profile {percent}% complete</span>
                <Link to="/exhibitor/profile" className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-700">
                  Complete profile <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completion"
              >
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Still missing: {missing.map((item) => item.label).join(", ")}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
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
