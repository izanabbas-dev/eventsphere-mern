import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../context/useAuth";
import { getDashboardPath } from "../utils/helpers";
import Spinner from "./ui/Spinner";

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner fullPage />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}
