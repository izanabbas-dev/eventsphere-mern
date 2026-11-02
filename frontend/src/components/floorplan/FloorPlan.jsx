import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../ui/Spinner";
import BoothFormModal from "./BoothFormModal";
import BoothDetailsModal from "./BoothDetailsModal";
import api from "../../api/axios";
import { useSocketEvent } from "../../context/useSocket";
import { getErrorMessage } from "../../utils/helpers";

const boothColors = {
  available: "border-green-300 bg-green-100 text-green-900 hover:bg-green-200",
  reserved: "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200",
  booked: "border-indigo-300 bg-indigo-100 text-indigo-900 hover:bg-indigo-200",
};

const legend = [
  { label: "Available", className: "bg-green-100 border-green-300" },
  { label: "Reserved", className: "bg-amber-100 border-amber-300" },
  { label: "Booked", className: "bg-indigo-100 border-indigo-300" },
  { label: "Empty", className: "bg-slate-100 border-slate-200" },
];

// Admin floor plan: a grid of rows x cols. Click an empty cell to add a booth, click a booth to manage it.
// The parent page must join the expo room (useExpoRoom) to get live updates.
export default function FloorPlan({ expoId }) {
  const [booths, setBooths] = useState([]);
  const [floorPlan, setFloorPlan] = useState({ rows: 0, cols: 0 });
  const [loading, setLoading] = useState(true);
  const [newCell, setNewCell] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editingBooth, setEditingBooth] = useState(null);

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

  // Someone changed a booth: load the fresh floor plan
  useSocketEvent("booth_updated", loadBooths);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-indigo-600">
        <Spinner />
      </div>
    );
  }

  // Find a booth by its cell
  const boothAt = {};
  booths.forEach((booth) => {
    boothAt[`${booth.position.row}-${booth.position.col}`] = booth;
  });

  // If the floor plan was made smaller, still show booths outside it
  const rows = Math.max(floorPlan.rows, ...booths.map((b) => b.position.row + 1));
  const cols = Math.max(floorPlan.cols, ...booths.map((b) => b.position.col + 1));

  const counts = {
    total: booths.length,
    available: booths.filter((b) => b.status === "available").length,
    reserved: booths.filter((b) => b.status === "reserved").length,
    booked: booths.filter((b) => b.status === "booked").length,
  };

  const selectedBooth = booths.find((b) => b._id === selectedId);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total booths", counts.total, "text-slate-900"],
          ["Available", counts.available, "text-green-700"],
          ["Reserved", counts.reserved, "text-amber-700"],
          ["Booked", counts.booked, "text-indigo-700"],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-4" aria-label="Colors">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm text-slate-600">
              <span className={`h-4 w-4 rounded border ${item.className}`} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-500">Click an empty cell to add a booth.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div
          className="grid w-max min-w-full gap-2"
          style={{ gridTemplateColumns: `2rem repeat(${cols}, minmax(5.5rem, 1fr))` }}
        >
          {/* Column numbers */}
          <span />
          {Array.from({ length: cols }, (_, col) => (
            <span key={col} className="text-center text-xs font-semibold text-slate-400">
              {col + 1}
            </span>
          ))}

          {Array.from({ length: rows }, (_, row) => (
            <FloorPlanRow
              key={row}
              row={row}
              cols={cols}
              boothAt={boothAt}
              onAdd={(col) => setNewCell({ row, col })}
              onSelect={(booth) => setSelectedId(booth._id)}
            />
          ))}
        </div>
      </div>

      {newCell && (
        <BoothFormModal
          expoId={expoId}
          cell={newCell}
          onClose={() => setNewCell(null)}
          onSaved={() => {
            setNewCell(null);
            loadBooths();
          }}
        />
      )}

      {editingBooth && (
        <BoothFormModal
          expoId={expoId}
          booth={editingBooth}
          onClose={() => setEditingBooth(null)}
          onSaved={() => {
            setEditingBooth(null);
            loadBooths();
          }}
        />
      )}

      {selectedBooth && (
        <BoothDetailsModal
          key={selectedBooth._id}
          booth={selectedBooth}
          booths={booths}
          expoId={expoId}
          onClose={() => setSelectedId(null)}
          onChanged={loadBooths}
          onEdit={() => {
            setEditingBooth(selectedBooth);
            setSelectedId(null);
          }}
        />
      )}
    </div>
  );
}

function FloorPlanRow({ row, cols, boothAt, onAdd, onSelect }) {
  return (
    <>
      <span className="flex items-center justify-center text-xs font-semibold text-slate-400">{row + 1}</span>
      {Array.from({ length: cols }, (_, col) => {
        const booth = boothAt[`${row}-${col}`];

        if (!booth) {
          return (
            <button
              key={col}
              type="button"
              onClick={() => onAdd(col)}
              aria-label={`Empty cell, row ${row + 1}, column ${col + 1}. Add a booth`}
              className="group flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-100 text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Plus className="h-5 w-5 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>
          );
        }

        return (
          <button
            key={col}
            type="button"
            onClick={() => onSelect(booth)}
            aria-label={`Booth ${booth.boothNumber}, ${booth.status}${booth.companyName ? `, ${booth.companyName}` : ""}`}
            className={`flex h-20 flex-col items-center justify-center rounded-lg border px-1.5 text-center transition ${boothColors[booth.status]}`}
          >
            <span className="text-sm font-bold">{booth.boothNumber}</span>
            <span className="w-full truncate text-[11px] opacity-80">
              {booth.companyName || booth.hall || booth.size}
            </span>
          </button>
        );
      })}
    </>
  );
}
