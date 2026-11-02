import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import ExhibitorFloorPlan from "../floorplan/ExhibitorFloorPlan";
import api from "../../api/axios";
import { useSocketEvent } from "../../context/useSocket";
import { getErrorMessage } from "../../utils/helpers";

// Read-only floor plan for attendees. Click a booked booth to open the exhibitor's profile.
// highlightId marks one booth (e.g. on the exhibitor profile page).
// The parent page must join the expo room (useExpoRoom) to get live updates.
export default function AttendeeFloorPlan({ expoId, highlightId }) {
  const navigate = useNavigate();
  const [booths, setBooths] = useState([]);
  const [floorPlan, setFloorPlan] = useState({ rows: 0, cols: 0 });
  const [loading, setLoading] = useState(true);

  const loadBooths = useCallback(() => {
    api
      .get(`/expos/${expoId}/booths`)
      .then((res) => {
        setBooths(res.data.booths);
        setFloorPlan(res.data.floorPlan);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [expoId]);

  useEffect(() => {
    loadBooths();
  }, [loadBooths]);

  // A booth changed: load the fresh floor plan
  useSocketEvent("booth_updated", loadBooths);

  function handleBoothClick(booth) {
    if (booth.status !== "booked" || !booth.exhibitor) {
      toast(`Booth ${booth.boothNumber} has no exhibitor yet`);
      return;
    }
    // Count the visit for the booth traffic report (no need to wait for it)
    api.post(`/booths/${booth._id}/visit`, { source: "floor_plan" }).catch(() => {});
    navigate(`/attendee/exhibitors/${booth.exhibitor._id}?expoId=${expoId}`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-indigo-600">
        <Spinner />
      </div>
    );
  }

  if (booths.length === 0) {
    return <EmptyState icon={Store} title="No booths yet" message="The floor plan for this expo is not ready yet." />;
  }

  return (
    <div>
      <ExhibitorFloorPlan
        booths={booths}
        floorPlan={floorPlan}
        selectedIds={highlightId ? [highlightId] : []}
        onBoothClick={handleBoothClick}
      />
      <p className="mt-3 text-sm text-slate-500">Click a booked booth to see the exhibitor.</p>
    </div>
  );
}
