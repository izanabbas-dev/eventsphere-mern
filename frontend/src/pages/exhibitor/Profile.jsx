import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileText, ImageUp, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import TagInput from "../../components/ui/TagInput";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import CompanyLogo from "../../components/applications/CompanyLogo";
import api from "../../api/axios";
import { fetchMyProfile } from "../../api/exhibitorApi";
import useAuth from "../../context/useAuth";
import { EXHIBITOR_CATEGORIES } from "../../utils/constants";
import {
  downloadFile,
  fileUrl,
  getErrorMessage,
  getFieldErrors,
  getProfileChecklist,
  isValidEmail,
} from "../../utils/helpers";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];

function toForm(profile) {
  return {
    companyName: profile.companyName || "",
    category: profile.category || "",
    description: profile.description || "",
    productsServices: profile.productsServices || [],
    website: profile.website || "",
    contact: {
      person: profile.contact?.person || "",
      email: profile.contact?.email || "",
      phone: profile.contact?.phone || "",
      address: profile.contact?.address || "",
    },
  };
}

export default function ExhibitorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-indigo-600">
        <Spinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Could not load your profile. Please refresh the page.</p>
      </Card>
    );
  }

  const checklist = getProfileChecklist(profile);
  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle={`Profile ${Math.round((doneCount / checklist.length) * 100)}% complete. Attendees and organizers see this information.`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <CompanyForm profile={profile} onSaved={(saved) => setProfile((p) => ({ ...p, ...saved }))} />
        </div>
        <div className="min-w-0 space-y-6">
          <LogoCard profile={profile} onUploaded={(logo) => setProfile((p) => ({ ...p, logo }))} />
          <DocumentsCard documents={profile.documents} onChange={(documents) => setProfile((p) => ({ ...p, documents }))} />
        </div>
      </div>
    </>
  );
}

function CompanyForm({ profile, onSaved }) {
  const [form, setForm] = useState(() => toForm(profile));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function setContact(name, value) {
    setForm((prev) => ({ ...prev, contact: { ...prev.contact, [name]: value } }));
    setErrors((prev) => ({ ...prev, [`contact.${name}`]: "" }));
  }

  function validate() {
    const newErrors = {};
    if (!form.companyName.trim()) newErrors.companyName = "Company name is required";
    if (form.contact.email && !isValidEmail(form.contact.email)) newErrors["contact.email"] = "Email is not valid";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await api.put("/exhibitors/profile", form);
      toast.success(res.data.message);
      onSaved(res.data.profile);
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Company details</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Company name"
            name="companyName"
            required
            value={form.companyName}
            onChange={(e) => setField("companyName", e.target.value)}
            error={errors.companyName}
          />
          <Select
            label="Category"
            name="category"
            placeholder="Choose a category"
            options={EXHIBITOR_CATEGORIES}
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
            error={errors.category}
          />
        </div>

        <Textarea
          label="Description"
          name="description"
          rows={5}
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="What does your company do?"
        />

        <TagInput
          label="Products / services"
          name="productsServices"
          tags={form.productsServices}
          onChange={(tags) => setField("productsServices", tags)}
          placeholder="e.g. Smart sensors, then press Enter"
        />

        <Input
          label="Website"
          name="website"
          type="url"
          value={form.website}
          onChange={(e) => setField("website", e.target.value)}
          placeholder="https://example.com"
          error={errors.website}
        />

        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
          <p className="mt-1 mb-4 text-sm text-slate-500">
            Attendees see these details on your company page. If the email or phone is empty, your account email and
            phone are shown instead. To hide them, turn off "Show my contact info" in{" "}
            <Link to="/profile" className="font-semibold text-indigo-600 hover:underline">
              My account
            </Link>
            .
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Contact person"
              name="contact.person"
              value={form.contact.person}
              onChange={(e) => setContact("person", e.target.value)}
            />
            <Input
              label="Contact email"
              name="contact.email"
              type="email"
              value={form.contact.email}
              onChange={(e) => setContact("email", e.target.value)}
              error={errors["contact.email"]}
            />
            <Input
              label="Phone"
              name="contact.phone"
              type="tel"
              value={form.contact.phone}
              onChange={(e) => setContact("phone", e.target.value)}
            />
            <Input
              label="Address"
              name="contact.address"
              value={form.contact.address}
              onChange={(e) => setContact("address", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function LogoCard({ profile, onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // Free the old preview URL when it changes
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
      toast.error("Logo must be a JPG, PNG or WEBP image");
      return;
    }
    if (chosen.size > MAX_FILE_SIZE) {
      toast.error("Logo must be 5 MB or smaller");
      return;
    }

    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  }

  async function handleUpload() {
    const formData = new FormData();
    formData.append("logo", file);

    setUploading(true);
    try {
      const res = await api.post("/exhibitors/profile/logo", formData);
      toast.success(res.data.message);
      onUploaded(res.data.logo);
      setFile(null);
      setPreview("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Logo</h2>
      <div className="mt-4 flex items-center gap-4">
        {preview ? (
          <img
            src={preview}
            alt="New logo preview"
            className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 bg-white object-contain"
          />
        ) : profile.logo ? (
          <img
            src={fileUrl(profile.logo)}
            alt={`${profile.companyName} logo`}
            className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 bg-white object-contain"
          />
        ) : (
          <CompanyLogo name={profile.companyName} size="lg" />
        )}
        <p className="text-sm text-slate-500">JPG, PNG or WEBP. Max 5 MB.</p>
      </div>

      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleChoose} />

      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={() => inputRef.current.click()} disabled={uploading}>
          <ImageUp className="h-4 w-4" aria-hidden="true" /> {profile.logo ? "Change logo" : "Choose logo"}
        </Button>
        {file && (
          <>
            <Button size="sm" onClick={handleUpload} loading={uploading}>
              Upload
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => {
                setFile(null);
                setPreview("");
              }}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

function DocumentsCard({ documents, onChange }) {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [working, setWorking] = useState(false);

  async function handleChoose(e) {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (files.length === 0) return;

    if (files.length > 5) {
      toast.error("You can upload up to 5 files at once");
      return;
    }
    const badType = files.find((f) => !DOCUMENT_TYPES.includes(f.type));
    if (badType) {
      toast.error(`${badType.name}: only PDF or image files are allowed`);
      return;
    }
    const tooBig = files.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      toast.error(`${tooBig.name} is bigger than 5 MB`);
      return;
    }

    const formData = new FormData();
    files.forEach((f) => formData.append("documents", f));

    setUploading(true);
    try {
      const res = await api.post("/exhibitors/profile/documents", formData);
      toast.success(res.data.message);
      onChange(res.data.documents);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(doc) {
    try {
      await downloadFile(`/exhibitors/${user._id}/documents/${doc._id}`, doc.name);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDelete() {
    setWorking(true);
    try {
      const res = await api.delete(`/exhibitors/profile/documents/${deleting._id}`);
      toast.success(res.data.message);
      onChange(res.data.documents);
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
        <Button size="sm" variant="secondary" onClick={() => inputRef.current.click()} loading={uploading}>
          {!uploading && <Upload className="h-4 w-4" aria-hidden="true" />} Upload
        </Button>
      </div>
      <p className="mt-1 text-sm text-slate-500">PDF or image, max 5 MB each. Only you and the organizer can see them.</p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleChoose}
      />

      {documents.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          No documents yet. Upload your company registration, brochure, etc.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {documents.map((doc) => (
            <li key={doc._id} className="flex items-center gap-3 px-3 py-2.5">
              <FileText className="h-5 w-5 shrink-0 text-indigo-500" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-800" title={doc.name}>
                {doc.name}
              </span>
              <button
                type="button"
                onClick={() => handleDownload(doc)}
                aria-label={`Download ${doc.name}`}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(doc)}
                aria-label={`Delete ${doc.name}`}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete document?"
        message={`"${deleting?.name}" will be deleted for good.`}
        confirmText="Delete"
        loading={working}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}
