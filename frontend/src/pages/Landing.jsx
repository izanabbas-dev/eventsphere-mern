import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Check, ClipboardList, MapPin, Store, Ticket } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import api from "../api/axios";
import useAuth from "../context/useAuth";
import { formatDate, getDashboardPath, toInputDate } from "../utils/helpers";

// The next published expo that has not ended, with its booth, exhibitor and session counts
async function fetchNextExpo() {
  const res = await api.get("/expos", { params: { status: "published" } });
  const today = toInputDate(new Date());
  // The list is already sorted by start date
  const expo = res.data.expos.find((item) => toInputDate(item.endDate) >= today);
  if (!expo) return null;

  const [boothsRes, exhibitorsRes, sessionsRes] = await Promise.all([
    api.get(`/expos/${expo._id}/booths`),
    api.get(`/expos/${expo._id}/exhibitors`),
    api.get(`/expos/${expo._id}/sessions`),
  ]);

  return {
    ...expo,
    boothCount: boothsRes.data.count,
    exhibitorCount: exhibitorsRes.data.count,
    sessionCount: sessionsRes.data.sessions.filter((session) => session.status !== "cancelled").length,
  };
}

const roleCards = [
  {
    icon: ClipboardList,
    title: "Organizers",
    text: "Run the whole expo from one dashboard.",
    points: ["Create and manage expos", "Approve exhibitors and assign booths", "Plan sessions and see live analytics"],
  },
  {
    icon: Store,
    title: "Exhibitors",
    text: "Showcase your company to the right people.",
    points: ["Apply to expos with your documents", "Choose your booth on the floor plan", "Chat with organizers and visitors"],
  },
  {
    icon: Ticket,
    title: "Attendees",
    text: "Get the most out of every event.",
    points: ["Register for expos and sessions", "Find exhibitors by category", "Bookmark sessions and get reminders"],
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <header className="absolute inset-x-0 top-0 z-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8" aria-label="Top">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Button to={getDashboardPath(user.role)}>Go to dashboard</Button>
            ) : (
              <>
                <Button to="/login" variant="ghost">
                  Log in
                </Button>
                <Button to="/register">Sign up</Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-linear-to-b from-indigo-100 via-indigo-50 to-white pt-32 pb-20 sm:pt-40 sm:pb-28">
          <div
            className="absolute top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-300/30 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                Expo and trade show management
              </span>
              <h1 className="mt-6 text-4xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Run unforgettable expos with <span className="text-indigo-600">EventSphere</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600 lg:mx-0">
                One platform for organizers, exhibitors and attendees. Manage booths, schedules and conversations
                in real time.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                {user ? (
                  <Button to={getDashboardPath(user.role)} size="lg">
                    Go to dashboard <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                ) : (
                  <>
                    <Button to="/register" size="lg">
                      Get started free <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      How it works
                    </Button>
                  </>
                )}
              </div>
            </div>

            <NextExpoCard />
          </div>
        </section>

        {/* Roles */}
        <section id="features" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Built for everyone at the expo</h2>
              <p className="mt-4 text-slate-600">Each role gets its own dashboard with the tools it needs.</p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {roleCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <card.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{card.text}</p>
                  <ul className="mt-5 space-y-2.5">
                    {card.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Logo />
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} EventSphere Management. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function NextExpoCard() {
  const { user } = useAuth();
  const [expo, setExpo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNextExpo()
      .then(setExpo)
      .catch(() => setExpo(null))
      .finally(() => setLoading(false));
  }, []);

  // Logged in users open the expo in their dashboard, guests sign up first
  const link = user && expo ? `${getDashboardPath(user.role)}/expos/${expo._id}` : "/register";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-indigo-100">
        {loading ? (
          <div className="flex justify-center py-16 text-indigo-600">
            <Spinner />
          </div>
        ) : !expo ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">No upcoming expo yet</p>
            <p className="mt-1 text-sm text-slate-500">New expos will show here as soon as the organizer publishes them.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">Next expo</p>
                <h2 className="mt-1 text-lg font-bold break-words text-slate-900">{expo.title}</h2>
              </div>
              <Badge status="published">Open</Badge>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="truncate">{expo.location}</span>
              </p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                [expo.boothCount, "Booths"],
                [expo.exhibitorCount, "Exhibitors"],
                [expo.sessionCount, "Sessions"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-slate-50 py-3">
                  <p className="text-xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            <Button to={link} fullWidth className="mt-6">
              {user ? "View expo" : "Sign up to join"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
