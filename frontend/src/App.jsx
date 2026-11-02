import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminExpos from "./pages/admin/Expos";
import ExpoDetail from "./pages/admin/ExpoDetail";
import AdminBooths from "./pages/admin/Booths";
import AdminApplications from "./pages/admin/Applications";
import AdminSessions from "./pages/admin/Sessions";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminUsers from "./pages/admin/Users";
import AdminFeedback from "./pages/admin/Feedback";
import ExhibitorDashboard from "./pages/exhibitor/Dashboard";
import ExhibitorProfile from "./pages/exhibitor/Profile";
import ExhibitorExpos from "./pages/exhibitor/Expos";
import ExhibitorExpoDetail from "./pages/exhibitor/ExpoDetail";
import MyBooth from "./pages/exhibitor/MyBooth";
import ExhibitorApplications from "./pages/exhibitor/Applications";
import AttendeeDashboard from "./pages/attendee/Dashboard";
import AttendeeExpos from "./pages/attendee/Expos";
import AttendeeExpoDetail from "./pages/attendee/ExpoDetail";
import AttendeeExhibitorProfile from "./pages/attendee/ExhibitorProfile";
import AttendeeSchedulePage from "./pages/attendee/Schedule";
import AttendeeExhibitors from "./pages/attendee/Exhibitors";
import AttendeeRegistrations from "./pages/attendee/Registrations";
import AttendeeBookmarks from "./pages/attendee/Bookmarks";
import Messages from "./pages/common/Messages";
import Notifications from "./pages/common/Notifications";
import Profile from "./pages/common/Profile";
import MyFeedback from "./pages/common/MyFeedback";
import NotFound from "./pages/NotFound";

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
            <Route path="/admin/messages" element={<Messages />} />
          </Route>
          <Route element={<ProtectedRoute roles={["exhibitor"]} />}>
            <Route path="/exhibitor" element={<ExhibitorDashboard />} />
            <Route path="/exhibitor/profile" element={<ExhibitorProfile />} />
            <Route path="/exhibitor/expos" element={<ExhibitorExpos />} />
            <Route path="/exhibitor/expos/:id" element={<ExhibitorExpoDetail />} />
            <Route path="/exhibitor/booth" element={<MyBooth />} />
            <Route path="/exhibitor/applications" element={<ExhibitorApplications />} />
            <Route path="/exhibitor/messages" element={<Messages />} />
            <Route path="/exhibitor/feedback" element={<MyFeedback />} />
          </Route>
          <Route element={<ProtectedRoute roles={["attendee"]} />}>
            <Route path="/attendee" element={<AttendeeDashboard />} />
            <Route path="/attendee/expos" element={<AttendeeExpos />} />
            <Route path="/attendee/expos/:id" element={<AttendeeExpoDetail />} />
            <Route path="/attendee/schedule" element={<AttendeeSchedulePage />} />
            <Route path="/attendee/exhibitors" element={<AttendeeExhibitors />} />
            <Route path="/attendee/exhibitors/:id" element={<AttendeeExhibitorProfile />} />
            <Route path="/attendee/registrations" element={<AttendeeRegistrations />} />
            <Route path="/attendee/bookmarks" element={<AttendeeBookmarks />} />
            <Route path="/attendee/messages" element={<Messages />} />
            <Route path="/attendee/feedback" element={<MyFeedback />} />
          </Route>
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
