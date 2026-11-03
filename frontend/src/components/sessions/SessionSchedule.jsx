import { useCallback, useEffect, useState } from "react";
import { Ban, Clock, MapPin, Mic, Pencil, Plus, Search, Tag, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import ConfirmDialog from "../ui/ConfirmDialog";
import SessionFormModal from "./SessionFormModal";
import SessionFilters from "./SessionFilters";
import api from "../../api/axios";
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

// Admin schedule of one expo, grouped by day.
// The parent page must join the expo room (useExpoRoom) to get live updates.
export default function SessionSchedule({ expo }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(emptySessionFilters);
  // null, "new" or the session being edited
  const [formSession, setFormSession] = useState(null);
  // { action: "cancel" | "delete", session }
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadSessions = useCallback(() => {
    api
      .get(`/expos/${expo._id}/sessions`)
      .then((res) => setSessions(res.data.sessions))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [expo._id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Someone changed the schedule or booked a seat: load it again
  useSocketEvent("schedule_updated", loadSessions);
  useSocketEvent("registrations_updated", loadSessions);

  async function handleConfirm() {
    const { action, session } = confirm;
    setBusy(true);
    try {
      const res =
        action === "cancel" ? await api.patch(`/sessions/${session._id}/cancel`) : await api.delete(`/sessions/${session._id}`);
      toast.success(res.data.message);
      setConfirm(null);
      loadSessions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-indigo-600">
        <Spinner />
      </div>
    );
  }

  const canAdd = !["cancelled", "completed"].includes(expo.status);
  const groups = groupSessionsByDay(filterSessions(sessions, filters));
  const dayKeys = Object.keys(groups).sort();
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5">
      <SessionFilters
        expo={expo}
        sessions={sessions}
        filters={filters}
        onChange={setFilters}
        action={
          <Button onClick={() => setFormSession("new")} disabled={!canAdd} title={canAdd ? "" : `This expo is ${expo.status}`}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Create session
          </Button>
        }
      />

      {sessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={Mic}
            title="No sessions yet"
            message={canAdd ? "Create the first session of this expo's schedule." : `Sessions cannot be added to a ${expo.status} expo.`}
          />
        </Card>
      ) : dayKeys.length === 0 ? (
        <Card>
          <EmptyState
            icon={Search}
            title="No matching sessions"
            message="Try another day, type, topic or search."
            action={
              hasFilters && (
                <Button variant="secondary" size="sm" onClick={() => setFilters(emptySessionFilters)}>
                  Clear filters
                </Button>
              )
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
                  onEdit={() => setFormSession(session)}
                  onCancel={() => setConfirm({ action: "cancel", session })}
                  onDelete={() => setConfirm({ action: "delete", session })}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {formSession && (
        <SessionFormModal
          expo={expo}
          session={formSession === "new" ? null : formSession}
          onClose={() => setFormSession(null)}
          onSaved={() => {
            setFormSession(null);
            loadSessions();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.action === "cancel" ? "Cancel this session?" : "Delete this session?"}
        message={
          confirm?.action === "cancel"
            ? `"${confirm.session.title}" will be marked as cancelled and registered attendees will be notified.`
            : `"${confirm?.session.title}" and all its registrations and bookmarks will be deleted. This cannot be undone.`
        }
        confirmText={confirm?.action === "cancel" ? "Cancel session" : "Delete session"}
        loading={busy}
        onConfirm={handleConfirm}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

function SessionCard({ session, onEdit, onCancel, onDelete }) {
  const cancelled = session.status === "cancelled";
  const fullPercent = Math.min(100, Math.round((session.registeredCount / session.capacity) * 100));

  return (
    <Card className={`p-4! sm:p-5! ${cancelled ? "bg-slate-50 opacity-60" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Time */}
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-indigo-700 sm:w-36 sm:flex-col sm:items-start sm:gap-0">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {formatTime(session.startTime)}
          </span>
          <span className="font-normal text-slate-500">
            <span className="sm:hidden">- </span>
            {formatTime(session.endTime)}
          </span>
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`font-semibold text-slate-900 ${cancelled ? "line-through" : ""}`}>{session.title}</h4>
            <Badge color={SESSION_TYPE_COLORS[session.type]}>{session.type}</Badge>
            {cancelled && <Badge status="cancelled">Cancelled</Badge>}
          </div>

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
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {session.registeredCount} / {session.capacity} registered
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

          <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <div
              className={`h-full rounded-full ${fullPercent >= 100 ? "bg-red-500" : "bg-indigo-500"}`}
              style={{ width: `${fullPercent}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-start gap-1">
          {!cancelled && (
            <>
              <Button variant="ghost" size="sm" onClick={onEdit} title="Edit" aria-label={`Edit ${session.title}`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancel} title="Cancel session" aria-label={`Cancel ${session.title}`}>
                <Ban className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Delete"
            aria-label={`Delete ${session.title}`}
            className="hover:bg-red-50! hover:text-red-600!"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
