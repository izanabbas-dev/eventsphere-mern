import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Headset, MapPin, Tag } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import ExhibitorFloorPlan from "../../components/floorplan/ExhibitorFloorPlan";
import BoothActionModal from "../../components/exhibitor/BoothActionModal";
import ApplySection from "../../components/exhibitor/ApplySection";
import api from "../../api/axios";
import { startConversation } from "../../api/chatApi";
import useAuth from "../../context/useAuth";
import { useExpoRoom, useSocketEvent } from "../../context/useSocket";
import { MAX_PREFERRED_BOOTHS } from "../../utils/constants";
import { fileUrl, formatDate, getErrorMessage } from "../../utils/helpers";

export default function ExhibitorExpoDetail() {
  const { id } = useParams();
  const { hash } = useLocation();
  const { user } = useAuth();
  const [expo, setExpo] = useState(null);
  const [booths, setBooths] = useState([]);
  const [floorPlan, setFloorPlan] = useState({ rows: 0, cols: 0 });
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeBoothId, setActiveBoothId] = useState(null);
  const [contacting, setContacting] = useState(false);
  const navigate = useNavigate();

  const loadBooths = useCallback(() => {
    return api.get(`/expos/${id}/booths`).then((res) => {
      setBooths(res.data.booths);
      setFloorPlan(res.data.floorPlan);
      // A selected booth that was just taken cannot stay selected
      const availableIds = res.data.booths.filter((b) => b.status === "available").map((b) => b._id);
      setSelectedIds((prev) => prev.filter((boothId) => availableIds.includes(boothId)));
    });
  }, [id]);

  const loadApplication = useCallback(() => {
    return api.get("/applications/my").then((res) => {
      setApplication(res.data.applications.find((app) => app.expo?._id === id) || null);
    });
  }, [id]);

  useEffect(() => {
    Promise.all([api.get(`/expos/${id}`).then((res) => setExpo(res.data.expo)), loadBooths(), loadApplication()])
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [id, loadBooths, loadApplication]);

  // Coming from an "Apply" button: scroll to the apply form
  useEffect(() => {
    if (!loading && hash === "#apply") {
      document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading, hash]);

  // Live updates: a booth changed (maybe the admin assigned it to me)
  useExpoRoom(id);
  const handleBoothUpdated = useCallback(() => {
    loadBooths().catch(() => {});
    loadApplication().catch(() => {});
  }, [loadBooths, loadApplication]);
  useSocketEvent("booth_updated", handleBoothUpdated);

  // Live updates: the organizer changed or removed this expo
  const handleExpoUpdated = useCallback(
    (data) => {
      if (data.action === "deleted") {
        toast("This expo was removed by the organizer");
        navigate("/exhibitor/expos", { replace: true });
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

  function reloadAll() {
    loadBooths().catch((error) => toast.error(getErrorMessage(error)));
    loadApplication().catch((error) => toast.error(getErrorMessage(error)));
  }

  // Open the support chat with the organizer of this expo
  async function contactOrganizer() {
    setContacting(true);
    try {
      const conversation = await startConversation(expo.organizer._id, expo._id);
      navigate(`/exhibitor/messages?c=${conversation._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setContacting(false);
    }
  }

  function toggleSelect(boothId) {
    setSelectedIds((prev) =>
      prev.includes(boothId) ? prev.filter((x) => x !== boothId) : [...prev, boothId].slice(0, MAX_PREFERRED_BOOTHS)
    );
  }

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
          action={<Link to="/exhibitor/expos" className="font-semibold text-indigo-600">Back to expos</Link>}
        />
      </Card>
    );
  }

  const myBooth = booths.find((b) => b.exhibitor?._id === user._id);
  const canApply = expo.status === "published" && (!application || application.status === "withdrawn");
  const canReserve = ["published", "ongoing"].includes(expo.status) && !myBooth;
  const activeBooth = booths.find((b) => b._id === activeBoothId);
  const availableCount = booths.filter((b) => b.status === "available").length;

  return (
    <>
      <Link
        to="/exhibitor/expos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All expos
      </Link>

      {/* Expo info */}
      <Card className="mb-6 overflow-hidden p-0!">
        {expo.banner && <img src={fileUrl(expo.banner)} alt="" className="h-40 w-full object-cover sm:h-56" />}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{expo.title}</h1>
            <Badge status={expo.status} />
            {expo.organizer && (
              <Button variant="secondary" size="sm" className="sm:ml-auto" onClick={contactOrganizer} loading={contacting}>
                <Headset className="h-4 w-4" aria-hidden="true" /> Contact organizer
              </Button>
            )}
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
          {expo.description && <p className="mt-4 text-sm whitespace-pre-line text-slate-600">{expo.description}</p>}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Floor plan</h2>
            <p className="text-sm text-slate-500">{availableCount} booths available</p>
          </div>

          {myBooth && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Your booth: <span className="font-semibold">{myBooth.boothNumber}</span> ({myBooth.status})
            </p>
          )}

          {booths.length === 0 ? (
            <EmptyState title="No booths yet" message="The organizer has not added booths to this expo yet." />
          ) : (
            <>
              <ExhibitorFloorPlan
                booths={booths}
                floorPlan={floorPlan}
                myId={user._id}
                selectedIds={selectedIds}
                onBoothClick={(booth) => setActiveBoothId(booth._id)}
              />
              <p className="mt-3 text-sm text-slate-500">
                Click a booth to see details{canApply ? ", pick it as preferred" : ""}
                {canReserve ? " or reserve it" : ""}.
              </p>
            </>
          )}
        </Card>

        <div className="min-w-0">
          <ApplySection
            expo={expo}
            application={application}
            booths={booths}
            selectedIds={selectedIds}
            onRemoveSelected={toggleSelect}
            onChanged={reloadAll}
          />
        </div>
      </div>

      {activeBooth && (
        <BoothActionModal
          key={activeBooth._id}
          booth={activeBooth}
          isMine={activeBooth.exhibitor?._id === user._id}
          hasBooth={Boolean(myBooth)}
          canReserve={canReserve}
          canSelect={canApply}
          isSelected={selectedIds.includes(activeBooth._id)}
          selectionFull={selectedIds.length >= MAX_PREFERRED_BOOTHS}
          onToggleSelect={toggleSelect}
          onClose={() => setActiveBoothId(null)}
          onChanged={reloadAll}
        />
      )}
    </>
  );
}
