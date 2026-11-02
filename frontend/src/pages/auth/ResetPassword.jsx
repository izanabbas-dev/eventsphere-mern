import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import PasswordRules from "../../components/PasswordRules";
import api from "../../api/axios";
import { PASSWORD_MIN_LENGTH } from "../../utils/constants";
import { getErrorMessage, getFieldErrors } from "../../utils/helpers";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (form.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (form.confirmPassword !== form.password) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password: form.password });
      toast.success("Password changed. Please log in with your new password.");
      navigate("/login", { replace: true });
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          required
        />
        <Input
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />
        <PasswordRules password={form.password} confirmPassword={form.confirmPassword} />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Reset password
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Link expired?{" "}
        <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Request a new one
        </Link>
      </p>
    </AuthLayout>
  );
}
