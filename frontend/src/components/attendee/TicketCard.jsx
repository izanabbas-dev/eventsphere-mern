import { CalendarDays, MapPin, Ticket } from "lucide-react";
import Badge from "../ui/Badge";
import { formatDate } from "../../utils/helpers";

export default function TicketCard({ expo, registration, action }) {
  const cancelled = registration.status === "cancelled";

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl shadow-sm sm:flex-row ${cancelled ? "opacity-60" : ""}`}>
      <div
        className={`flex-1 p-5 text-white sm:p-6 ${cancelled ? "bg-slate-500" : "bg-linear-to-br from-indigo-600 to-indigo-800"}`}
      >
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-white/70 uppercase">
          <Ticket className="h-4 w-4" aria-hidden="true" /> Expo ticket
        </p>
        <h3 className="mt-2 text-lg font-bold">{expo.title}</h3>
        <div className="mt-3 space-y-1 text-sm text-white/85">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{expo.location}</span>
          </p>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center gap-2 border-t-2 border-dashed border-slate-200 bg-white p-5 text-center sm:w-60 sm:border-t-0 sm:border-l-2">
        <span className="absolute -top-3 -left-3 hidden h-6 w-6 rounded-full bg-slate-50 sm:block" aria-hidden="true" />
        <span className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full bg-slate-50 sm:block" aria-hidden="true" />
        <p className="text-xs font-medium text-slate-500">Ticket code</p>
        <p className={`font-mono text-xl font-bold tracking-widest ${cancelled ? "text-slate-500 line-through" : "text-indigo-700"}`}>
          {registration.ticketCode}
        </p>
        <Badge status={registration.status} />
        {action}
      </div>
    </div>
  );
}
