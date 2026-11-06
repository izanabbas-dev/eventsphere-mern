import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin, Search, Tag } from "lucide-react";
import PublicLayout, { PublicHero } from "../../layouts/PublicLayout";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import LoadError from "../../components/ui/LoadError";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";
import { fileUrl, formatDate, getDashboardPath } from "../../utils/helpers";

async function fetchCounts(expoId) {
  try {
    const [boothsRes, exhibitorsRes, sessionsRes] = await Promise.all([
      api.get(`/expos/${expoId}/booths`),
      api.get(`/expos/${expoId}/exhibitors`),
      api.get(`/expos/${expoId}/sessions`),
    ]);
    return {
      booths: boothsRes.data.count,
      exhibitors: exhibitorsRes.data.count,
      sessions: sessionsRes.data.sessions.filter((session) => session.status !== "cancelled").length,
    };
  } catch {
    return null;
  }
}

async function fetchPublishedExpos() {
  const res = await api.get("/expos", { params: { status: "published" } });
  const counts = await Promise.all(res.data.expos.map((expo) => fetchCounts(expo._id)));
  return res.data.expos.map((expo, index) => ({ ...expo, counts: counts[index] }));
}

export default function ExploreExpos() {
  const [expos, setExpos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  function loadExpos() {
    fetchPublishedExpos()
      .then(setExpos)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadExpos();
  }, []);

  function retry() {
    setLoading(true);
    setFailed(false);
    loadExpos();
  }

  const text = search.trim().toLowerCase();
  const filtered = expos.filter((expo) => expo.title.toLowerCase().includes(text));

  return (
    <PublicLayout>
      <PublicHero title="Explore expos" subtitle="Browse upcoming expos and trade shows on EventSphere.">
        <div className="relative mx-auto mt-8 max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title"
            aria-label="Search expos by title"
            className="block w-full rounded-xl border border-slate-300 bg-white py-3 pr-3.5 pl-10 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
          />
        </div>
      </PublicHero>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-16 text-indigo-600">
            <Spinner />
          </div>
        ) : failed ? (
          <LoadError onRetry={retry} />
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title={expos.length === 0 ? "No expos yet" : "No expos match your search"}
              message={
                expos.length === 0 ? "New expos will show here when the organizer publishes them." : "Try a different word."
              }
            />
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((expo) => (
              <ExpoCard key={expo._id} expo={expo} />
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

function ExpoCard({ expo }) {
  const { user } = useAuth();

  const link = user ? `${getDashboardPath(user.role)}/expos/${expo._id}` : "/login";

  return (
    <Link
      to={link}
      state={user ? undefined : { expoId: expo._id }}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
    >
      {expo.banner ? (
        <img src={fileUrl(expo.banner)} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-linear-to-br from-indigo-500 to-indigo-800 text-white">
          <CalendarDays className="h-10 w-10 opacity-80" aria-hidden="true" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-semibold break-words text-slate-900 group-hover:text-indigo-700">{expo.title}</h2>

        <div className="mt-3 space-y-1.5 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{expo.location}</span>
          </p>
          {expo.theme && (
            <p className="flex items-center gap-2">
              <Tag className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{expo.theme}</span>
            </p>
          )}
        </div>

        {expo.counts && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              [expo.counts.booths, "Booths"],
              [expo.counts.exhibitors, "Exhibitors"],
              [expo.counts.sessions, "Sessions"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg bg-slate-50 py-2">
                <p className="font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-indigo-600">
          {user ? "View expo" : "Log in to view"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
