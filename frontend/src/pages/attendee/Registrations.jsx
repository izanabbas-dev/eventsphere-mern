import { useCallback, useEffect, useState } from "react";
import { Clock, MapPin, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import LoadError from "../../components/ui/LoadError";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import TicketCard from "../../components/attendee/TicketCard";
import api from "../../api/axios";
import { fetchMyRegistrations } from "../../api/attendeeApi";
import { formatSessionTime, getErrorMessage } from "../../utils/helpers";

export default function AttendeeRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadRegistrations = useCallback(() => {
    fetchMyRegistrations()
      .then((list) => {
        setRegistrations(list);
        setFailed(false);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  function retry() {
    setLoading(true);
    loadRegistrations();
  }

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function handleCancel() {
    setBusy(true);
    try {
      const res = await api.delete(`/registrations/${cancelTarget._id}`);
      toast.success(res.data.message);
      setCancelTarget(null);
      loadRegistrations();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner fullPage />;

  const expoRegistrations = registrations
    .filter((r) => !r.session)
    .sort((a, b) => {
      const aCancelled = a.status === "cancelled";
      const bCancelled = b.status === "cancelled";
      if (aCancelled !== bCancelled) return aCancelled ? 1 : -1;
      return new Date(a.expo.startDate) - new Date(b.expo.startDate);
    });

  function sessionsOf(expoId) {
    return registrations
      .filter((r) => r.session && r.expo._id === expoId && r.status !== "cancelled")
      .sort((a, b) => new Date(a.session.startTime) - new Date(b.session.startTime));
  }

  return (
    <>
      <PageHeader title="My Registrations" subtitle="Your expo tickets and booked sessions." />

      {failed ? (
        <LoadError onRetry={retry} />
      ) : expoRegistrations.length === 0 ? (
        <Card>
          <EmptyState
            icon={Ticket}
            title="No registrations yet"
            message="Register for an expo to get your ticket code."
            action={<Button to="/attendee/expos">Browse expos</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {expoRegistrations.map((registration) => {
            const sessions = sessionsOf(registration.expo._id);
            return (
              <section key={registration._id} className="space-y-3">
                <TicketCard
                  expo={registration.expo}
                  registration={registration}
                  action={
                    <div className="flex flex-wrap justify-center gap-1">
                      <Button to={`/attendee/expos/${registration.expo._id}`} variant="ghost" size="sm">
                        View expo
                      </Button>
                      {registration.status === "registered" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelTarget(registration)}
                          className="text-red-600! hover:bg-red-50!"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  }
                />

                {sessions.length > 0 && (
                  <Card className="p-0!">
                    <h3 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
                      Booked sessions ({sessions.length})
                    </h3>
                    <ul className="divide-y divide-slate-100">
                      {sessions.map((sessionReg) => (
                        <SessionRow key={sessionReg._id} registration={sessionReg} onCancel={() => setCancelTarget(sessionReg)} />
                      ))}
                    </ul>
                  </Card>
                )}
              </section>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title={cancelTarget?.session ? "Cancel session registration?" : "Cancel expo registration?"}
        message={
          cancelTarget?.session
            ? `Your seat in "${cancelTarget.session.title}" will be given up.`
            : `Your ticket for "${cancelTarget?.expo.title}" and all your sessions in this expo will be cancelled.`
        }
        confirmText="Cancel registration"
        loading={busy}
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </>
  );
}

function SessionRow({ registration, onCancel }) {
  const { session } = registration;
  const cancelled = session.status === "cancelled";
  const ended = new Date(session.endTime) < new Date();

  return (
    <li className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center ${cancelled ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-semibold text-slate-900 ${cancelled ? "line-through" : ""}`}>{session.title}</p>
          {cancelled && <Badge status="cancelled">Session cancelled</Badge>}
          {!cancelled && ended && <Badge color="gray">Ended</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {formatSessionTime(session)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {session.location}
          </span>
        </div>
      </div>
      {registration.status === "registered" && !cancelled && !ended && (
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </li>
  );
}
