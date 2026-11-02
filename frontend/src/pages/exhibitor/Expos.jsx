import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Search, Tag } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../api/axios";
import { fileUrl, formatDate, getErrorMessage } from "../../utils/helpers";

export default function ExhibitorExpos() {
  const [expos, setExpos] = useState([]);
  const [myStatus, setMyStatus] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/expos", { params: { status: "published" } }), api.get("/applications/my")])
      .then(([exposRes, appsRes]) => {
        setExpos(exposRes.data.expos);
        // { expoId: "pending" }
        const statuses = {};
        appsRes.data.applications.forEach((app) => {
          if (app.expo) statuses[app.expo._id] = app.status;
        });
        setMyStatus(statuses);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const text = search.trim().toLowerCase();
  const filtered = expos.filter((expo) =>
    [expo.title, expo.location, expo.theme].some((value) => value?.toLowerCase().includes(text))
  );

  return (
    <>
      <PageHeader title="Expos" subtitle="Published expos you can apply to." />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, location or theme"
          aria-label="Search expos"
          className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3.5 pl-10 text-sm shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title={expos.length === 0 ? "No open expos" : "No expos match your search"}
            message={expos.length === 0 ? "New expos will show here when the organizer publishes them." : "Try a different word."}
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((expo) => (
            <ExpoCard key={expo._id} expo={expo} status={myStatus[expo._id]} />
          ))}
        </div>
      )}
    </>
  );
}

function ExpoCard({ expo, status }) {
  const applied = status && status !== "withdrawn";

  return (
    <Link
      to={`/exhibitor/expos/${expo._id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      {expo.banner ? (
        <img src={fileUrl(expo.banner)} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-linear-to-br from-indigo-500 to-indigo-800 text-white">
          <CalendarDays className="h-10 w-10 opacity-80" aria-hidden="true" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold text-slate-900 group-hover:text-indigo-700">{expo.title}</h2>
          {status && <Badge status={status} />}
        </div>

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

        <span className="mt-4 pt-1 text-sm font-semibold text-indigo-600">
          {applied ? "View details" : "View & apply"} →
        </span>
      </div>
    </Link>
  );
}
