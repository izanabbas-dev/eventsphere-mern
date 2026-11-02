import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../context/useAuth";
import { getDashboardPath } from "../utils/helpers";
import Spinner from "./ui/Spinner";

// Login and register pages: a logged in user goes to their dashboard
export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner fullPage />;
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;

  return <Outlet />;
}
