import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import PlaceholderPage from "./pages/PlaceholderPage";
import AdminExpos from "./pages/admin/Expos";
import ExpoDetail from "./pages/admin/ExpoDetail";
import AdminBooths from "./pages/admin/Booths";
import AdminApplications from "./pages/admin/Applications";
import AdminSessions from "./pages/admin/Sessions";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminUsers from "./pages/admin/Users";
import AdminFeedback from "./pages/admin/Feedback";
import NotFound from "./pages/NotFound";

// Placeholder pages for now: [path, title]
const exhibitorPages = [
  ["/exhibitor", "Exhibitor Dashboard"],
  ["/exhibitor/profile", "My Profile"],
  ["/exhibitor/expos", "Expos"],
  ["/exhibitor/booth", "My Booth"],
  ["/exhibitor/applications", "My Applications"],
  ["/exhibitor/messages", "Messages"],
];

const attendeePages = [
  ["/attendee", "Attendee Dashboard"],
  ["/attendee/expos", "Expos"],
  ["/attendee/schedule", "Schedule"],
  ["/attendee/exhibitors", "Exhibitors"],
  ["/attendee/registrations", "My Registrations"],
  ["/attendee/bookmarks", "Bookmarks"],
  ["/attendee/messages", "Messages"],
];

const commonPages = [
  ["/profile", "Profile"],
  ["/notifications", "Notifications"],
];

function renderPages(pages) {
  return pages.map(([path, title]) => <Route key={path} path={path} element={<PlaceholderPage title={title} />} />);
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin/expos" element={<AdminExpos />} />
            <Route path="/admin/expos/:id" element={<ExpoDetail />} />
            <Route path="/admin/booths" element={<AdminBooths />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/sessions" element={<AdminSessions />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
          </Route>
          <Route element={<ProtectedRoute roles={["exhibitor"]} />}>{renderPages(exhibitorPages)}</Route>
          <Route element={<ProtectedRoute roles={["attendee"]} />}>{renderPages(attendeePages)}</Route>
          {renderPages(commonPages)}
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
