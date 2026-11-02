import { Link } from "react-router-dom";
import { Orbit } from "lucide-react";

// light = white text, for dark/indigo backgrounds
export default function Logo({ light = false, to = "/" }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5 rounded-lg">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          light ? "bg-white/15 text-white" : "bg-indigo-600 text-white"
        }`}
      >
        <Orbit className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
        EventSphere
      </span>
    </Link>
  );
}
