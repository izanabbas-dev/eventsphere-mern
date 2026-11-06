import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Info, MapPin, Mic, Search, Tag, Users } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import ConfirmDialog from "../ui/ConfirmDialog";
import SessionFilters from "../sessions/SessionFilters";
import BookmarkButton from "./BookmarkButton";
import api from "../../api/axios";
import { fetchMyBookmarks, fetchMyRegistrations, findExpoRegistration } from "../../api/attendeeApi";
import { useSocketEvent } from "../../context/useSocket";
import { SESSION_TYPE_COLORS } from "../../utils/constants";
import {
  emptySessionFilters,
  filterSessions,
  formatDayKey,
  formatTime,
  getErrorMessage,
  groupSessionsByDay,
} from "../../utils/helpers";

export default function AttendeeSchedule({ expo, showFilters = false }) {
  const [sessions, setSessions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(emptySessionFilters);
  const [busyId, setBusyId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadSessions = useCallback(() => {
    return api.get(`/expos/${expo._id}/sessions`).then((res) => setSessions(res.data.sessions));
  }, [expo._id]);

  const loadMine = useCallback(() => {
    return Promise.all([fetchMyRegistrations(), fetchMyBookmarks()]).then(([regs, marks]) => {
      setRegistrations(regs);
      setBookmarks(marks);
    });
  }, []);

  const reload = useCallback(() => {
    Promise.all([loadSessions(), loadMine()])
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [loadSessions, loadMine]);

  useEffect(() => {
    reload();
  }, [reload]);

  useSocketEvent("schedule_updated", reload);
  const reloadSessions = useCallback(() => {
    loadSessions().catch(() => {});
  }, [loadSessions]);
  useSocketEvent("registrations_updated", reloadSessions);

  async function runAction(sessionId, request) {
    setBusyId(sessionId);
    try {
      const res = await request();
      toast.success(res.data.message);
      await Promise.all([loadSessions(), loadMine()]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel() {
    await runAction(cancelTarget.session._id, () => api.delete(`/registrations/${cancelTarget.registration._id}`));
    setCancelTarget(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-indigo-600">
        <Spinner />
      </div>
    );
  }

  const expoRegistered = Boolean(findExpoRegistration(registrations, expo._id));

  const mySessionRegs = {};
  registrations.forEach((r) => {
    if (r.session && r.status === "registered") mySessionRegs[r.session._id] = r;
  });
  const myBookmarks = {};
  bookmarks.forEach((b) => {
    myBookmarks[b.session._id] = b;
  });

  const groups = groupSessionsByDay(filterSessions(sessions, filters));
  const dayKeys = Object.keys(groups).sort();

  return (
    <div className="space-y-5">
      {!expoRegistered && (
        <div className="flex items-start gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Register for this expo to book a seat in sessions. You can still bookmark sessions.{" "}
            {showFilters && (
              <Link to={`/attendee/expos/${expo._id}`} className="font-semibold underline">
                Go to expo
              </Link>
            )}
          </p>
        </div>
      )}

      {showFilters && sessions.length > 0 && (
        <SessionFilters expo={expo} sessions={sessions} filters={filters} onChange={setFilters} />
      )}

      {sessions.length === 0 ? (
        <Card>
          <EmptyState icon={Mic} title="No sessions yet" message="The schedule for this expo has not been published yet." />
        </Card>
      ) : dayKeys.length === 0 ? (
        <Card>
          <EmptyState
            icon={Search}
            title="No matching sessions"
            message="Try another day, type, topic or search."
            action={
              <Button variant="secondary" size="sm" onClick={() => setFilters(emptySessionFilters)}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        dayKeys.map((key) => (
          <section key={key}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              {formatDayKey(key)}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{groups[key].length}</span>
            </h3>
            <div className="space-y-3">
              {groups[key].map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  canRegister={expoRegistered}
                  registration={mySessionRegs[session._id]}
                  bookmark={myBookmarks[session._id]}
                  busy={busyId === session._id}
                  onRegister={() => runAction(session._id, () => api.post(`/sessions/${session._id}/register`))}
                  onCancel={() => setCancelTarget({ session, registration: mySessionRegs[session._id] })}
                  onBookmark={(minutes) =>
                    runAction(session._id, () => api.post(`/sessions/${session._id}/bookmark`, { remindBeforeMinutes: minutes }))
                  }
                  onRemoveBookmark={() => runAction(session._id, () => api.delete(`/sessions/${session._id}/bookmark`))}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel session registration?"
        message={`Your seat in "${cancelTarget?.session.title}" will be given up.`}
        confirmText="Cancel registration"
        loading={Boolean(busyId)}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}

function SessionCard({ session, canRegister, registration, bookmark, busy, onRegister, onCancel, onBookmark, onRemoveBookmark }) {
  const cancelled = session.status === "cancelled";
  const ended = new Date(session.endTime) < new Date();
  const seatsLeft = Math.max(0, session.capacity - session.registeredCount);
  const full = seatsLeft === 0;

  return (
    <Card className={`p-4! sm:p-5! ${cancelled ? "bg-slate-50 opacity-60" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-indigo-700 sm:w-32 sm:flex-col sm:items-start sm:gap-0">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {formatTime(session.startTime)}
          </span>
          <span className="font-normal text-slate-500">
            <span className="sm:hidden">- </span>
            {formatTime(session.endTime)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`font-semibold text-slate-900 ${cancelled ? "line-through" : ""}`}>{session.title}</h4>
            <Badge color={SESSION_TYPE_COLORS[session.type]}>{session.type}</Badge>
            {cancelled && <Badge status="cancelled">Cancelled</Badge>}
            {!cancelled && registration && <Badge status="registered">Registered</Badge>}
            {!cancelled && ended && <Badge color="gray">Ended</Badge>}
          </div>

          {session.description && <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{session.description}</p>}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {session.topic && (
              <span className="flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {session.topic}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {session.location}
            </span>
            <span className={`flex items-center gap-1.5 ${full ? "font-semibold text-red-600" : ""}`}>
              <Users className={`h-4 w-4 ${full ? "" : "text-slate-400"}`} aria-hidden="true" />
              {full ? "Full" : `${seatsLeft} of ${session.capacity} seats left`}
            </span>
          </div>

          {session.speakers.length > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
              <Mic className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span>
                {session.speakers
                  .map((speaker) => (speaker.designation ? `${speaker.name} (${speaker.designation})` : speaker.name))
                  .join(", ")}
              </span>
            </p>
          )}
        </div>

        {!cancelled && (
          <div className="flex shrink-0 flex-wrap items-center gap-3 sm:flex-col sm:items-end">
            <BookmarkButton
              key={bookmark?.remindBeforeMinutes || "none"}
              bookmark={bookmark}
              disabled={ended && !bookmark}
              busy={busy}
              onSave={onBookmark}
              onRemove={onRemoveBookmark}
            />
            {canRegister && !ended &&
              (registration ? (
                <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
                  Cancel
                </Button>
              ) : (
                <Button size="sm" onClick={onRegister} loading={busy} disabled={full}>
                  {full ? "Full" : "Register"}
                </Button>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}
