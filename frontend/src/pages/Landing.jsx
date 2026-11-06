import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  Check,
  ClipboardList,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Store,
  Ticket,
} from "lucide-react";
import PublicLayout from "../layouts/PublicLayout";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import api from "../api/axios";
import useAuth from "../context/useAuth";
import { fileUrl, formatDate, getDashboardPath, toInputDate } from "../utils/helpers";

async function fetchNextExpo() {
  const res = await api.get("/expos", { params: { status: "published" } });
  const today = toInputDate(new Date());
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

const features = [
  { icon: LayoutGrid, title: "Interactive floor plan", text: "See every booth and its status on a clear map." },
  { icon: Store, title: "Booth booking", text: "Exhibitors pick their preferred booths when they apply." },
  { icon: CalendarClock, title: "Session scheduling", text: "Plan talks, workshops and keynotes day by day." },
  { icon: MessageSquare, title: "Live chat", text: "Organizers, exhibitors and attendees talk in real time." },
  { icon: Bell, title: "Real-time notifications", text: "Get updates on applications, sessions and messages." },
  { icon: ChartColumn, title: "Analytics and reports", text: "Track registrations, booths and visits for every expo." },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <PublicLayout>
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
                    <Button to="/expos" size="lg">
                      Explore expos <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </Button>
                    <Button to="/how-it-works" size="lg" variant="secondary">
                      How it works
                    </Button>
                  </>
                )}
              </div>
            </div>

            <NextExpoCard />
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle title="Features" subtitle="Everything you need to run an expo, in one place." />

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <UpcomingExpos />

        <section className="py-20 sm:py-24">
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

        <section className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-2xl bg-indigo-600 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to run your next expo?</h2>
            <p className="mx-auto mt-3 max-w-xl text-indigo-100">
              Join EventSphere for free and bring organizers, exhibitors and attendees together.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {user ? (
                <Button to={getDashboardPath(user.role)} size="lg" variant="secondary">
                  Go to dashboard <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              ) : (
                <Button to="/register" size="lg" variant="secondary">
                  Sign up free <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              )}
              <Link
                to="/expos"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-white ring-1 ring-white/40 transition-colors hover:bg-white/10"
              >
                Explore expos
              </Link>
            </div>
          </div>
        </section>
    </PublicLayout>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-slate-600">{subtitle}</p>
    </div>
  );
}

function ExpoBanner({ expo, className }) {
  if (expo.banner) {
    return <img src={fileUrl(expo.banner)} alt="" className={`${className} w-full object-cover`} />;
  }

  return (
    <div className={`${className} flex items-center justify-center bg-linear-to-br from-indigo-500 to-indigo-800 text-white`}>
      <CalendarDays className="h-10 w-10 opacity-80" aria-hidden="true" />
    </div>
  );
}

function UpcomingExpos() {
  const { user } = useAuth();
  const [expos, setExpos] = useState([]);

  useEffect(() => {
    api
      .get("/expos")
      .then((res) => {
        const today = toInputDate(new Date());
        const list = res.data.expos.filter(
          (expo) => ["published", "ongoing"].includes(expo.status) && toInputDate(expo.endDate) >= today
        );
        setExpos(list.slice(0, 3));
      })
      .catch(() => setExpos([]));
  }, []);

  if (expos.length === 0) return null;

  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Upcoming expos" subtitle="See what is coming up next on EventSphere." />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {expos.map((expo) => (
            <Link
              key={expo._id}
              to={user ? `${getDashboardPath(user.role)}/expos/${expo._id}` : "/login"}
              state={user ? undefined : { expoId: expo._id }}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
            >
              <ExpoBanner expo={expo} className="h-36" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold break-words text-slate-900 group-hover:text-indigo-700">{expo.title}</h3>
                  {expo.status === "ongoing" && <Badge status="ongoing" />}
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="truncate">{expo.location}</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button to="/expos" variant="secondary">
            View all expos <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
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
            <ExpoBanner expo={expo} className="mb-5 h-36 rounded-xl" />
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
