import { Check, Star } from "lucide-react";
import { boothColors, legend } from "./boothStyles";

export default function ExhibitorFloorPlan({ booths, floorPlan, myId, selectedIds = [], onBoothClick }) {
  const boothAt = {};
  booths.forEach((booth) => {
    boothAt[`${booth.position.row}-${booth.position.col}`] = booth;
  });

  const rows = Math.max(floorPlan.rows, ...booths.map((b) => b.position.row + 1));
  const cols = Math.max(floorPlan.cols, ...booths.map((b) => b.position.col + 1));

  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Colors">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm text-slate-600">
            <span className={`h-4 w-4 rounded border ${item.className}`} aria-hidden="true" />
            {item.label}
          </li>
        ))}
        {myId && (
          <li className="flex items-center gap-2 text-sm text-slate-600">
            <span className="h-4 w-4 rounded border border-slate-300 ring-2 ring-amber-500" aria-hidden="true" />
            Your booth
          </li>
        )}
      </ul>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `1.5rem repeat(${cols}, minmax(4rem, 1fr))`, minWidth: `${1.5 + cols * 4.5}rem` }}
        >
          <span />
          {Array.from({ length: cols }, (_, col) => (
            <span key={col} className="text-center text-xs font-semibold text-slate-400">
              {col + 1}
            </span>
          ))}

          {Array.from({ length: rows }, (_, row) => [
            <span key={`r${row}`} className="flex items-center justify-center text-xs font-semibold text-slate-400">
              {row + 1}
            </span>,
            ...Array.from({ length: cols }, (_, col) => {
              const booth = boothAt[`${row}-${col}`];

              if (!booth) {
                return (
                  <div
                    key={`${row}-${col}`}
                    className="h-20 rounded-lg border border-dashed border-slate-200 bg-slate-100"
                    aria-hidden="true"
                  />
                );
              }

              const isMine = Boolean(myId) && booth.exhibitor?._id === myId;
              const isSelected = selectedIds.includes(booth._id);

              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  onClick={() => onBoothClick(booth)}
                  aria-label={`Booth ${booth.boothNumber}, ${booth.status}${isMine ? ", your booth" : ""}${isSelected ? ", selected" : ""}`}
                  className={`relative flex h-20 flex-col items-center justify-center rounded-lg border px-1.5 text-center transition
                    ${boothColors[booth.status]}
                    ${isMine ? "ring-2 ring-amber-500 ring-offset-1" : ""}
                    ${isSelected ? "ring-2 ring-indigo-600 ring-offset-1" : ""}`}
                >
                  {isSelected && (
                    <span className="absolute top-1 right-1 rounded-full bg-indigo-600 p-0.5 text-white">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                  {isMine && (
                    <Star className="absolute top-1 right-1 h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                  )}
                  <span className="text-sm font-bold">{booth.boothNumber}</span>
                  <span className="w-full truncate text-[11px] opacity-80">
                    {isMine ? "Yours" : booth.companyName || booth.hall || booth.size}
                  </span>
                </button>
              );
            }),
          ])}
        </div>
      </div>
    </div>
  );
}
