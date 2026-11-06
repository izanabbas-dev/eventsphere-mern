const colors = {
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  green: "bg-green-50 text-green-700 ring-green-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
};

const statusColors = {
  approved: "green",
  pending: "amber",
  rejected: "red",
  cancelled: "red",
  published: "indigo",
  ongoing: "green",
  available: "green",
  reserved: "amber",
  booked: "indigo",
  registered: "green",
  attended: "indigo",
  open: "amber",
  in_progress: "indigo",
  resolved: "green",
};

export default function Badge({ status, color, children }) {
  const finalColor = color || statusColors[status] || "gray";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${colors[finalColor]}`}
    >
      {children || status?.replace("_", " ")}
    </span>
  );
}
