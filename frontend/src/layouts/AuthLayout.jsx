import { CalendarCheck, MessageSquare, Store } from "lucide-react";
import Logo from "../components/Logo";

const highlights = [
  { icon: CalendarCheck, text: "Plan expos, sessions and schedules" },
  { icon: Store, text: "Book booths and manage exhibitors" },
  { icon: MessageSquare, text: "Chat in real time with organizers" },
];

// Split screen: indigo panel on the left (desktop only), form on the right
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-12 lg:flex">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5" aria-hidden="true" />

        <Logo light />

        <div className="relative">
          <h2 className="text-4xl leading-tight font-bold text-white">
            Every expo, exhibitor and attendee in one place.
          </h2>
          <p className="mt-4 max-w-md text-indigo-100">
            EventSphere makes large expos and trade shows simple to run, join and enjoy.
          </p>
          <ul className="mt-10 space-y-4">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-indigo-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-200">© {new Date().getFullYear()} EventSphere Management</p>
      </div>

      <main className="flex w-full items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
