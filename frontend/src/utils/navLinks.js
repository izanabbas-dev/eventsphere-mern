import {
  BarChart3,
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
  Users,
} from "lucide-react";

// Sidebar links for each role. "end" means the link is active only on that exact path.
const navLinks = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/expos", label: "Expos", icon: CalendarDays },
    { to: "/admin/booths", label: "Booths", icon: Store },
    { to: "/admin/applications", label: "Applications", icon: FileText },
    { to: "/admin/sessions", label: "Sessions", icon: CalendarClock },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
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
  ],
  attendee: [
    { to: "/attendee", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/attendee/expos", label: "Expos", icon: CalendarDays },
    { to: "/attendee/schedule", label: "Schedule", icon: CalendarClock },
    { to: "/attendee/exhibitors", label: "Exhibitors", icon: Building2 },
    { to: "/attendee/registrations", label: "My Registrations", icon: Ticket },
    { to: "/attendee/bookmarks", label: "Bookmarks", icon: Bookmark },
    { to: "/attendee/messages", label: "Messages", icon: MessageSquare },
  ],
};

export default navLinks;
