import { Star } from "lucide-react";

export default function RatingStars({ rating }) {
  if (!rating) return <span className="text-xs text-slate-400">No rating</span>;

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
