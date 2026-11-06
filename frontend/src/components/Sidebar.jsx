import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Bookmark,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquare,
  MessageSquareText,
  Store,
  Ticket,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { getDashboardPath } from "../utils/helpers";

const navLinks = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/expos", label: "Expos", icon: CalendarDays },
    { to: "/admin/booths", label: "Booths", icon: Store },
    { to: "/admin/applications", label: "Applications", icon: FileText },
    { to: "/admin/sessions", label: "Sessions", icon: CalendarClock },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/messages", label: "Messages", icon: MessageSquare },
    { to: "/admin/feedback", label: "Feedback", icon: MessageSquareText },
    { to: "/admin/users", label: "Users", icon: Users },
  ],
  exhibitor: [
    { to: "/exhibitor", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/exhibitor/profile", label: "My Profile", icon: Building2 },
    { to: "/exhibitor/expos", label: "Expos", icon: CalendarDays },
    { to: "/exhibitor/booth", label: "My Booth", icon: Store },
    { to: "/exhibitor/applications", label: "My Applications", icon: ClipboardList },
    { to: "/exhibitor/messages", label: "Messages", icon: MessageSquare },
    { to: "/exhibitor/feedback", label: "Feedback", icon: MessageSquareText },
  ],
  attendee: [
    { to: "/attendee", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/attendee/expos", label: "Expos", icon: CalendarDays },
    { to: "/attendee/schedule", label: "Schedule", icon: CalendarClock },
    { to: "/attendee/exhibitors", label: "Exhibitors", icon: Building2 },
    { to: "/attendee/registrations", label: "My Registrations", icon: Ticket },
    { to: "/attendee/bookmarks", label: "Bookmarks", icon: Bookmark },
    { to: "/attendee/messages", label: "Messages", icon: MessageSquare },
    { to: "/attendee/feedback", label: "Feedback", icon: MessageSquareText },
  ],
};

const accountLinks = [
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

function SidebarLink({ link, onClick }) {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.to}
      end={link.end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 ${
          isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {link.label}
    </NavLink>
  );
}

export default function Sidebar({ role, open, onClose }) {
  const links = navLinks[role] || [];

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200
          lg:visible lg:translate-x-0 ${open ? "visible translate-x-0" : "invisible -translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Logo to={getDashboardPath(role)} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
          <div className="space-y-1">
            {links.map((link) => (
              <SidebarLink key={link.to} link={link} onClick={onClose} />
            ))}
          </div>

          <p className="mt-6 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
          <div className="space-y-1">
            {accountLinks.map((link) => (
              <SidebarLink key={link.to} link={link} onClick={onClose} />
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
