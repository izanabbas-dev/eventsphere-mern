import Button from "../components/ui/Button";
import Logo from "../components/Logo";
import useAuth from "../context/useAuth";
import { getDashboardPath } from "../utils/helpers";

export default function NotFound() {
  const { user } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo />
      <p className="mt-10 text-7xl font-extrabold text-indigo-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">Sorry, we could not find the page you are looking for.</p>
      <div className="mt-8">
        <Button to={user ? getDashboardPath(user.role) : "/"}>{user ? "Back to dashboard" : "Back to home"}</Button>
      </div>
    </main>
  );
}
