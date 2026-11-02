import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Grid3X3,
  ImageUp,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Tabs from "../../components/ui/Tabs";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ExpoFormModal from "../../components/expo/ExpoFormModal";
import ExpoStatusSelect from "../../components/expo/ExpoStatusSelect";
import FloorPlan from "../../components/floorplan/FloorPlan";
import SessionSchedule from "../../components/sessions/SessionSchedule";
import ApplicationsList from "../../components/applications/ApplicationsList";
import api from "../../api/axios";
import { useExpoRoom, useSocketEvent } from "../../context/useSocket";
import { fileUrl, formatDate, getErrorMessage } from "../../utils/helpers";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "floorplan", label: "Floor Plan" },
  { value: "sessions", label: "Sessions" },
  { value: "applications", label: "Applications" },
];

const MAX_BANNER_SIZE = 5 * 1024 * 1024;

export default function ExpoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expo, setExpo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadExpo = useCallback(() => {
    api
      .get(`/expos/${id}`)
      .then((res) => setExpo(res.data.expo))
      .catch((error) => {
        setExpo(null);
        if (error.response?.status !== 404) toast.error(getErrorMessage(error));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadExpo();
  }, [loadExpo]);

  // Live updates for this expo
  useExpoRoom(id);

  const handleExpoUpdated = useCallback(
    (data) => {
      if (data.action === "deleted") {
        toast("This expo was deleted");
        navigate("/admin/expos", { replace: true });
      } else {
        loadExpo();
      }
    },
    [loadExpo, navigate]
  );
  useSocketEvent("expo_updated", handleExpoUpdated);

  async function handleBannerChange(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_BANNER_SIZE) {
      toast.error("File is too large. Max size is 5 MB");
      return;
    }

    const formData = new FormData();
    formData.append("banner", file);

    setUploading(true);
    try {
      const res = await api.post(`/expos/${id}/banner`, formData);
      toast.success(res.data.message);
      setExpo({ ...expo, banner: res.data.banner });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await api.delete(`/expos/${id}`);
      toast.success(res.data.message);
      navigate("/admin/expos", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
      setDeleting(false);
    }
  }

  if (loading) return <Spinner fullPage />;

  if (!expo) {
    return (
      <Card>
        <EmptyState
          title="Expo not found"
          message="This expo does not exist or was deleted."
          action={<Button to="/admin/expos">Back to expos</Button>}
        />
      </Card>
    );
  }

  return (
    <>
      <Link
        to="/admin/expos"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All expos
      </Link>

      <Card className="overflow-hidden p-0!">
        {/* Banner */}
        <div className="relative h-40 bg-linear-to-br from-indigo-500 to-indigo-800 sm:h-56">
          {expo.banner && <img src={fileUrl(expo.banner)} alt={`${expo.title} banner`} className="h-full w-full object-cover" />}
          <label
            className="absolute right-4 bottom-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white"
          >
            {uploading ? <Spinner size="sm" /> : <ImageUp className="h-4 w-4" aria-hidden="true" />}
            {expo.banner ? "Change banner" : "Upload banner"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleBannerChange}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{expo.title}</h1>
                <Badge status={expo.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {expo.location}
                </span>
                {expo.theme && (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {expo.theme}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExpoStatusSelect expo={expo} onChanged={loadExpo} />
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div className="pt-6" role="tabpanel">
          {activeTab === "overview" && <Overview expo={expo} />}
          {activeTab === "floorplan" && (
            // New key when the size changes, so the grid loads again
            <FloorPlan key={`${expo.floorPlan.rows}x${expo.floorPlan.cols}`} expoId={expo._id} />
          )}
          {activeTab === "sessions" && <SessionSchedule expo={expo} />}
          {activeTab === "applications" && <ApplicationsList expoId={expo._id} />}
        </div>
      </div>

      {editOpen && (
        <ExpoFormModal
          expo={expo}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            loadExpo();
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this expo?"
        message={`"${expo.title}" and all its booths, sessions, applications and registrations will be deleted. This cannot be undone.`}
        confirmText="Delete expo"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}

function Overview({ expo }) {
  const facts = [
    { icon: CalendarDays, label: "Dates", value: `${formatDate(expo.startDate)} - ${formatDate(expo.endDate)}` },
    { icon: MapPin, label: "Location", value: expo.location },
    { icon: Sparkles, label: "Theme", value: expo.theme || "-" },
    { icon: Grid3X3, label: "Floor plan", value: `${expo.floorPlan.rows} rows x ${expo.floorPlan.cols} columns` },
    { icon: UserRound, label: "Organizer", value: expo.organizer?.name || "-" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="text-lg font-semibold text-slate-900">About this expo</h2>
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-slate-600">
          {expo.description || "No description added yet."}
        </p>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Details</h2>
        <dl className="mt-4 space-y-4">
          {facts.map((fact) => (
            <div key={fact.label} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <fact.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <dt className="text-xs font-medium text-slate-500">{fact.label}</dt>
                <dd className="text-sm font-medium text-slate-900">{fact.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
