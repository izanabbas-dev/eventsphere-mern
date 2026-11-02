import { useState } from "react";
import { Star } from "lucide-react";
import { REMIND_OPTIONS } from "../../utils/constants";

// Star toggle with a "remind me before" choice.
// onSave(minutes) adds the bookmark or changes its reminder, onRemove() deletes it.
export default function BookmarkButton({ bookmark, disabled, busy, onSave, onRemove }) {
  const [remind, setRemind] = useState(bookmark?.remindBeforeMinutes || 30);
  const saved = Boolean(bookmark);

  function handleRemindChange(e) {
    const minutes = Number(e.target.value);
    setRemind(minutes);
    if (saved) onSave(minutes);
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => (saved ? onRemove() : onSave(remind))}
        disabled={disabled || busy}
        aria-pressed={saved}
        title={saved ? "Remove bookmark" : "Bookmark"}
        className={`rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          saved ? "text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
        }`}
      >
        <Star className={`h-5 w-5 ${saved ? "fill-amber-400" : ""}`} aria-hidden="true" />
        <span className="sr-only">{saved ? "Remove bookmark" : "Bookmark"}</span>
      </button>
      <select
        value={remind}
        onChange={handleRemindChange}
        disabled={disabled || busy}
        aria-label="Remind me before the session"
        title="Remind me before"
        className="rounded-lg border border-slate-300 bg-white py-1 pr-7 pl-2 text-xs text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-50"
      >
        {REMIND_OPTIONS.map((minutes) => (
          <option key={minutes} value={minutes}>
            {minutes} min before
          </option>
        ))}
      </select>
    </div>
  );
}
