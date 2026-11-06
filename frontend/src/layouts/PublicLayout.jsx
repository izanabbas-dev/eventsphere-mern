import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/ui/Button";
import useAuth from "../context/useAuth";
import { getDashboardPath } from "../utils/helpers";

const navLinks = [
  { to: "/expos", label: "Expos" },
  { to: "/how-it-works", label: "Guide" },
];

function linkClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

export default function PublicLayout({ children }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="absolute inset-x-0 top-0 z-10">
        <nav className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-6">
              <Logo compact />
              <div className="hidden items-center gap-1 md:flex">
                {navLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className={linkClass}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3">
              {user ? (
                <Button to={getDashboardPath(user.role)}>Dashboard</Button>
              ) : (
                <>
                  <Button to="/login" variant="ghost" className="px-3 sm:px-4">
                    Log in
                  </Button>
                  <Button to="/register" className="px-3 sm:px-4">
                    Sign up
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="public-menu"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div
              id="public-menu"
              className="absolute inset-x-4 top-full flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg sm:inset-x-6 md:hidden"
            >
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Logo />
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} EventSphere Management. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PublicHero({ title, subtitle, children }) {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-indigo-100 via-indigo-50 to-white pt-32 pb-12 sm:pt-40 sm:pb-16">
      <div
        className="absolute top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-300/30 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
