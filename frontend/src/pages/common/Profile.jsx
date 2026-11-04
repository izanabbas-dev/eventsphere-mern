import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Camera, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import RoleBadge from "../../components/ui/RoleBadge";
import PasswordRules from "../../components/PasswordRules";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";
import { getErrorMessage, getFieldErrors, getPasswordError } from "../../utils/helpers";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Profile() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="My account" subtitle="Your photo, personal details, privacy and password." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <AvatarCard />
          {user.role === "exhibitor" && (
            <Card>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold text-slate-900">Company profile</h2>
                  <p className="mt-1 text-sm text-slate-500">Logo, description, products and documents are on your company page.</p>
                  <Link to="/exhibitor/profile" className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline">
                    Edit company profile
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <DetailsCard />
          <PrivacyCard />
          <PasswordCard />
        </div>
      </div>
    </>
  );
}

// "Show my contact info to others" switch. It is saved right away.
function PrivacyCard() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  // Not saved yet = same default as the backend: exhibitors share, attendees do not
  const isOn = typeof user.showContactInfo === "boolean" ? user.showContactInfo : user.role !== "attendee";

  async function handleToggle() {
    setSaving(true);
    try {
      const res = await api.put("/auth/me", { showContactInfo: !isOn });
      updateUser(res.data.user);
      toast.success(isOn ? "Your email and phone are now hidden" : "Your email and phone are now visible");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Privacy</h2>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <p id="contact-switch-label" className="text-sm font-medium text-slate-900">
                Show my contact info to others
              </p>
              <p id="contact-switch-hint" className="mt-1 text-sm text-slate-500">
                {user.role === "exhibitor"
                  ? "When on, attendees see your company contact email and phone (or your account email and phone if those are empty) on your company page and in chats. When off, they are hidden."
                  : "When off, other users cannot see your email and phone in chats."}{" "}
                Admins can always see them.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOn}
              aria-labelledby="contact-switch-label"
              aria-describedby="contact-switch-hint"
              onClick={handleToggle}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:ring-2 focus:ring-indigo-500/40 focus:outline-none disabled:opacity-60 ${
                isOn ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isOn ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AvatarCard() {
  const { user, updateUser } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  // Free the preview URL when it is not needed anymore
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleChoose(e) {
    const chosen = e.target.files[0];
    e.target.value = "";
    if (!chosen) return;

    if (!IMAGE_TYPES.includes(chosen.type)) {
      toast.error("Please choose a JPG, PNG or WEBP image");
      return;
    }
    if (chosen.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  }

  function cancel() {
    setFile(null);
    setPreview("");
  }

  async function handleUpload() {
    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    try {
      const res = await api.post("/uploads/avatar", formData);
      updateUser({ avatar: res.data.avatar });
      toast.success("Photo updated");
      cancel();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="text-center">
      <div className="relative mx-auto w-fit">
        <Avatar src={preview || user.avatar} name={user.name} size="xl" className="ring-4 ring-indigo-50" />
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          aria-label="Choose a new photo"
          className="absolute right-0 bottom-0 rounded-full border-2 border-white bg-indigo-600 p-2 text-white shadow hover:bg-indigo-700"
        >
          <Camera className="h-4 w-4" />
        </button>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleChoose} className="hidden" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-slate-900">{user.name}</h2>
      <p className="text-sm break-all text-slate-500">{user.email}</p>
      <div className="mt-2">
        <RoleBadge role={user.role} />
      </div>

      {file ? (
        <div className="mt-5 flex justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={cancel} disabled={uploading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleUpload} loading={uploading}>
            Save photo
          </Button>
        </div>
      ) : (
        <p className="mt-5 text-xs text-slate-400">JPG, PNG or WEBP, up to 5 MB</p>
      )}
    </Card>
  );
}

function DetailsCard() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    setSaving(true);
    try {
      const res = await api.put("/auth/me", { name: form.name.trim(), phone: form.phone.trim() });
      updateUser(res.data.user);
      toast.success("Profile updated");
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const changed = form.name.trim() !== user.name || form.phone.trim() !== (user.phone || "");

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Personal details</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" name="name" value={form.name} onChange={handleChange} error={errors.name} required />
          <Input label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="03xx xxxxxxx" />
        </div>
        <Input label="Email" name="email" value={user.email} disabled hint="Email cannot be changed." />
        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={!changed}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

const emptyPasswords = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordCard() {
  const { saveSession } = useAuth();
  const [form, setForm] = useState(emptyPasswords);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!form.currentPassword) newErrors.currentPassword = "Current password is required";
    const passwordError = getPasswordError(form.newPassword);
    if (passwordError) newErrors.newPassword = passwordError;
    if (form.confirmPassword !== form.newPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await api.put("/auth/update-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      // The old login token stops working after a password change, so save the new one
      saveSession(res.data.token, res.data.user);
      setForm(emptyPasswords);
      toast.success("Password changed");
    } catch (error) {
      if (error.response?.status === 401) setErrors({ currentPassword: "Current password is incorrect" });
      else setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <Input
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
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
        </div>
        <PasswordRules password={form.newPassword} confirmPassword={form.confirmPassword} />
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}
