import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, Tag, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Tabs from "../../components/ui/Tabs";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import TicketCard from "../../components/attendee/TicketCard";
import AttendeeSchedule from "../../components/attendee/AttendeeSchedule";
import ExhibitorSearch from "../../components/attendee/ExhibitorSearch";
import AttendeeFloorPlan from "../../components/attendee/AttendeeFloorPlan";
import api from "../../api/axios";
import { fetchMyRegistrations, findExpoRegistration } from "../../api/attendeeApi";
import { useExpoRoom, useSocketEvent } from "../../context/useSocket";
import { fileUrl, formatDate, getErrorMessage } from "../../utils/helpers";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "schedule", label: "Schedule" },
  { value: "exhibitors", label: "Exhibitors" },
  { value: "floor-plan", label: "Floor Plan" },
];

export default function AttendeeExpoDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expo, setExpo] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // The tab is kept in the URL so "Back" from an exhibitor profile opens the same tab
  const activeTab = searchParams.get("tab") || "overview";

  const loadRegistrations = useCallback(() => {
    return fetchMyRegistrations().then(setRegistrations);
  }, []);

  useEffect(() => {
    Promise.all([api.get(`/expos/${id}`).then((res) => setExpo(res.data.expo)), loadRegistrations()])
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [id, loadRegistrations]);

  // Live updates for the expo details, schedule and floor plan tabs
  useExpoRoom(id);
  const navigate = useNavigate();
  const handleExpoUpdated = useCallback(
    (data) => {
      if (data.action === "deleted") {
        toast("This expo was removed by the organizer");
        navigate("/attendee/expos", { replace: true });
      } else {
        api
          .get(`/expos/${id}`)
          .then((res) => setExpo(res.data.expo))
          .catch(() => {});
      }
    },
    [id, navigate]
  );
  useSocketEvent("expo_updated", handleExpoUpdated);

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-indigo-600">
        <Spinner />
      </div>
    );
  }

  if (!expo) {
    return (
      <Card>
        <EmptyState
          title="Expo not found"
          message="This expo may have been removed."
          action={<Button to="/attendee/expos">Back to expos</Button>}
        />
      </Card>
    );
  }

  return (
    <>
      <Link
        to="/attendee/expos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All expos
      </Link>

      <Card className="mb-6 overflow-hidden p-0!">
        {expo.banner && <img src={fileUrl(expo.banner)} alt="" className="aspect-[14/3] w-full object-cover" />}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{expo.title}</h1>
            <Badge status={expo.status} />
            {findExpoRegistration(registrations, expo._id) && <Badge status="registered">Registered</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" /> {expo.location}
            </span>
            {expo.theme && (
              <span className="flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-slate-400" aria-hidden="true" /> {expo.theme}
              </span>
            )}
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} active={activeTab} onChange={(tab) => setSearchParams({ tab }, { replace: true })} />

      <div className="mt-6">
        {activeTab === "overview" && (
          <Overview expo={expo} registrations={registrations} onChanged={() => loadRegistrations().catch(() => {})} />
        )}
        {activeTab === "schedule" && <AttendeeSchedule expo={expo} />}
        {activeTab === "exhibitors" && <ExhibitorSearch expoId={expo._id} />}
        {activeTab === "floor-plan" && (
          <Card>
            <AttendeeFloorPlan expoId={expo._id} />
          </Card>
        )}
      </div>
    </>
  );
}

function Overview({ expo, registrations, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const registration = findExpoRegistration(registrations, expo._id);
  const canRegister = expo.status === "published";

  async function handleRegister() {
    setBusy(true);
    try {
      const res = await api.post(`/expos/${expo._id}/register`);
      toast.success(res.data.message);
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      const res = await api.delete(`/registrations/${registration._id}`);
      toast.success(res.data.message);
      setConfirmOpen(false);
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {registration && (
        <div>
          <TicketCard
            expo={expo}
            registration={registration}
            action={
              registration.status === "registered" && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)} className="text-red-600! hover:bg-red-50!">
                  Cancel registration
                </Button>
              )
            }
          />
          <p className="mt-2 text-sm text-slate-500">Show this ticket code at the entrance.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className={registration ? "lg:col-span-5" : "lg:col-span-3"}>
          <h2 className="text-lg font-semibold text-slate-900">About this expo</h2>
          <p className="mt-3 text-sm whitespace-pre-line text-slate-600">
            {expo.description || "The organizer has not added a description yet."}
          </p>
          {expo.organizer?.name && <p className="mt-4 text-sm text-slate-500">Organized by {expo.organizer.name}</p>}
        </Card>

        {!registration && (
          <Card className="text-center lg:col-span-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Ticket className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Join this expo</h2>
            <p className="mt-1 text-sm text-slate-500">
              {canRegister
                ? "Get your ticket code and book seats in sessions."
                : `Registration is closed because this expo is ${expo.status}.`}
            </p>
            <Button size="lg" fullWidth className="mt-5" onClick={handleRegister} loading={busy} disabled={!canRegister}>
              Register for this expo
            </Button>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel your registration?"
        message="Your ticket and all your session registrations in this expo will be cancelled. You can register again later."
        confirmText="Cancel registration"
        loading={busy}
        onConfirm={handleCancel}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
