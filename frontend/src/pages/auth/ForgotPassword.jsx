import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import api from "../../api/axios";
import { getErrorMessage, getFieldErrors, isValidEmail } from "../../utils/helpers";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success(res.data.message);
      setSent(true);
    } catch (err) {
      setError(getFieldErrors(err).email || "");
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const backLink = (
    <Link
      to="/login"
      className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to login
    </Link>
  );

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <MailCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-600">
            If <strong className="text-slate-900">{email}</strong> is registered, we have sent a link to reset your
            password. The link is valid for 15 minutes.
          </p>
        </div>
        {backLink}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we will send you a reset link.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          error={error}
          required
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Send reset link
        </Button>
      </form>
      {backLink}
    </AuthLayout>
  );
}
