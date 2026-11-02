import { useState } from "react";
import { Star } from "lucide-react";

// Click a star to choose 1-5. Click the same star again to clear it.
export default function RatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(value === n ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star className={`h-7 w-7 ${n <= shown ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden="true" />
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-500">{value ? `${value} / 5` : "No rating"}</span>
    </div>
  );
}
