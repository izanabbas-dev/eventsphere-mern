import { Link } from "react-router-dom";
import { Bell, LogOut, Menu } from "lucide-react";
import Badge from "./ui/Badge";
import { getInitials } from "../utils/helpers";

export default function Topbar({ user, onMenuClick, onLogout }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <Badge color="indigo">{user.role}</Badge>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            {getInitials(user.name)}
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Logout</span>
          <span className="sr-only sm:hidden">Logout</span>
        </button>
      </div>
    </header>
  );
}
