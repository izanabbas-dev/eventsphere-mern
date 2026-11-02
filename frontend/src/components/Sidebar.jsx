import { NavLink } from "react-router-dom";
import { Bell, UserRound, X } from "lucide-react";
import Logo from "./Logo";
import navLinks from "../utils/navLinks";
import { getDashboardPath } from "../utils/helpers";

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
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {link.label}
    </NavLink>
  );
}

// On desktop it is always visible. On mobile it slides in when "open" is true.
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
