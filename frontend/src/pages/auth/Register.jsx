import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import PasswordRules from "../../components/PasswordRules";
import useAuth from "../../context/useAuth";
import api from "../../api/axios";
import { EXHIBITOR_CATEGORIES } from "../../utils/constants";
import { getDashboardPath, getErrorMessage, getFieldErrors, getPasswordError, isValidEmail } from "../../utils/helpers";

const roles = [
  { value: "attendee", label: "Attendee", text: "Visit expos and join sessions", icon: Ticket },
  { value: "exhibitor", label: "Exhibitor", text: "Showcase your company", icon: Store },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: "attendee",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    category: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isExhibitor = form.role === "exhibitor";

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setErrors({ ...errors, [name]: "" });
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!isValidEmail(form.email)) newErrors.email = "Please enter a valid email";
    const passwordError = getPasswordError(form.password);
    if (passwordError) newErrors.password = passwordError;
    if (form.confirmPassword !== form.password) newErrors.confirmPassword = "Passwords do not match";
    if (isExhibitor && !form.companyName.trim()) newErrors.companyName = "Company name is required for exhibitors";
    if (isExhibitor && !form.category) newErrors.category = "Please choose a category";
    if (!form.termsAccepted) newErrors.termsAccepted = "You must accept the terms and privacy policy";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      role: form.role,
      name: form.name,
      email: form.email,
      password: form.password,
      termsAccepted: form.termsAccepted,
    };
    if (form.phone) data.phone = form.phone;
    if (isExhibitor) data.companyName = form.companyName;

    setLoading(true);
    try {
      const user = await register(data);

      // The register route does not take a category, so save it on the new exhibitor profile
      if (isExhibitor) {
        await api.put("/exhibitors/profile", { category: form.category }).catch(() => {
          toast.error("Account created, but the category was not saved. You can add it in My Profile.");
        });
      }

      toast.success("Account created successfully!");
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join EventSphere in less than a minute.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">I want to join as</legend>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => {
              const selected = form.role === role.value;
              return (
                <label
                  key={role.value}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition has-focus-visible:ring-2 has-focus-visible:ring-indigo-500 ${
                    selected ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selected}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <role.icon className={`h-5 w-5 ${selected ? "text-indigo-600" : "text-slate-500"}`} aria-hidden="true" />
                  <span className="text-sm font-semibold text-slate-900">{role.label}</span>
                  <span className="text-xs text-slate-500">{role.text}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Ali Khan"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
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
          <Input
            label="Phone (optional)"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0300 1234567"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
          />
        </div>

        {isExhibitor && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Company name"
              name="companyName"
              autoComplete="organization"
              placeholder="Acme Pvt Ltd"
              value={form.companyName}
              onChange={handleChange}
              error={errors.companyName}
              required
            />
            <Select
              label="Category"
              name="category"
              placeholder="Choose a category"
              options={EXHIBITOR_CATEGORIES}
              value={form.category}
              onChange={handleChange}
              error={errors.category}
              required
            />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />
        </div>

        <PasswordRules password={form.password} confirmPassword={form.confirmPassword} />

        <div>
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={form.termsAccepted}
              onChange={handleChange}
              aria-invalid={Boolean(errors.termsAccepted)}
              aria-describedby={errors.termsAccepted ? "termsAccepted-error" : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            />
            <span>
              I agree to the <strong className="text-slate-800">Terms of Service</strong> and{" "}
              <strong className="text-slate-800">Privacy Policy</strong>, and I allow EventSphere to use my data
              to run my account.
            </span>
          </label>
          {errors.termsAccepted && (
            <p id="termsAccepted-error" className="mt-1.5 text-sm text-red-600">
              {errors.termsAccepted}
            </p>
          )}
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
