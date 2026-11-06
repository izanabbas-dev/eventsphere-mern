import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarPlus,
  ChartColumn,
  ClipboardList,
  FileUp,
  LayoutGrid,
  MessageSquare,
  Search,
  Bookmark,
  Store,
  Ticket,
  UserCheck,
  UserPlus,
} from "lucide-react";
import PublicLayout, { PublicHero } from "../../layouts/PublicLayout";
import Button from "../../components/ui/Button";
import useAuth from "../../context/useAuth";
import { getDashboardPath } from "../../utils/helpers";

const roles = [
  {
    icon: ClipboardList,
    title: "Organizers",
    text: "Plan and run the whole expo from one dashboard.",
    steps: [
      { icon: CalendarPlus, title: "Create an expo", text: "Add the title, dates, location, theme and a banner, then publish it." },
      { icon: LayoutGrid, title: "Build the floor plan", text: "Add booths with their size and price on the floor plan." },
      { icon: UserCheck, title: "Approve exhibitors", text: "Review applications and assign booths to approved exhibitors." },
      { icon: ChartColumn, title: "Plan sessions and track", text: "Schedule sessions and follow registrations and booth visits in analytics." },
    ],
  },
  {
    icon: Store,
    title: "Exhibitors",
    text: "Show your company to the right visitors.",
    steps: [
      { icon: UserPlus, title: "Set up your profile", text: "Add your company logo, description, products and documents." },
      { icon: FileUp, title: "Apply to an expo", text: "Pick an expo, choose your preferred booths and send your application." },
      { icon: LayoutGrid, title: "Get your booth", text: "Once approved, see your booth on the floor plan." },
      { icon: MessageSquare, title: "Talk to visitors", text: "Chat with organizers and attendees in real time." },
    ],
  },
  {
    icon: Ticket,
    title: "Attendees",
    text: "Get the most out of every event.",
    steps: [
      { icon: Ticket, title: "Register for an expo", text: "Sign up for free and register to get your ticket." },
      { icon: Search, title: "Find exhibitors", text: "Search exhibitors by name or category and open the floor plan." },
      { icon: Bookmark, title: "Plan your day", text: "Bookmark sessions and get a reminder before they start." },
      { icon: Bell, title: "Chat and get updates", text: "Message exhibitors and get live notifications about schedule changes." },
    ],
  },
];

export default function HowItWorks() {
  const { user } = useAuth();

  return (
    <PublicLayout>
      <PublicHero
        title="How EventSphere works"
        subtitle="EventSphere brings organizers, exhibitors and attendees together on one platform. Here is how each role uses it."
      />

      <div className="mx-auto max-w-7xl space-y-16 px-4 pb-20 sm:px-6 lg:px-8">
        {roles.map((role) => (
          <section key={role.title} aria-labelledby={`role-${role.title}`}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <role.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h2 id={`role-${role.title}`} className="text-2xl font-bold text-slate-900">
                  {role.title}
                </h2>
                <p className="text-sm text-slate-600">{role.text}</p>
              </div>
            </div>

            <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {role.steps.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <step.icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section className="rounded-2xl bg-indigo-600 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Create your free account and join your next expo in a few minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {user ? (
              <Button to={getDashboardPath(user.role)} size="lg" variant="secondary">
                Go to dashboard <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            ) : (
              <>
                <Button to="/register" size="lg" variant="secondary">
                  Sign up free <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Link
                  to="/expos"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-white ring-1 ring-white/40 transition-colors hover:bg-white/10"
                >
                  Explore expos
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
