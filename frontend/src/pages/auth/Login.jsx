import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import useAuth from "../../context/useAuth";
import { getDashboardPath, getErrorMessage, getFieldErrors, isValidEmail } from "../../utils/helpers";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function validate() {
    const newErrors = {};
    if (!isValidEmail(form.email)) newErrors.email = "Please enter a valid email";
    if (!form.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      const dashboard = getDashboardPath(user.role);
      const expoId = location.state?.expoId;
      navigate(location.state?.from || (expoId ? `${dashboard}/expos/${expoId}` : dashboard), { replace: true });
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your EventSphere account.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <div>
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Log in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
