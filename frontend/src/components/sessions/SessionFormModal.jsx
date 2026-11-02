import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import api from "../../api/axios";
import { SESSION_TYPES } from "../../utils/constants";
import { getErrorMessage, getFieldErrors, toInputDate, toInputDateTime } from "../../utils/helpers";

const typeOptions = SESSION_TYPES.map((type) => ({ value: type, label: type[0].toUpperCase() + type.slice(1) }));

const emptySpeaker = { name: "", designation: "", bio: "" };

// Backend sends some errors only as a message, so show them under the right field
function getMessageField(message) {
  if (message.includes("already booked")) return "location";
  if (message.includes("End time")) return "endTime";
  if (message.includes("expo dates")) return "startTime";
  if (message.includes("Capacity")) return "capacity";
  return null;
}

// Create a session in an expo, or edit one when "session" is given
export default function SessionFormModal({ expo, session, onClose, onSaved }) {
  const isEdit = Boolean(session);

  const [form, setForm] = useState({
    title: session?.title || "",
    description: session?.description || "",
    topic: session?.topic || "",
    type: session?.type || "session",
    location: session?.location || "",
    startTime: toInputDateTime(session?.startTime),
    endTime: toInputDateTime(session?.endTime),
    capacity: session?.capacity ?? 50,
  });
  const [speakers, setSpeakers] = useState(
    session?.speakers?.map((s) => ({ name: s.name || "", designation: s.designation || "", bio: s.bio || "" })) || []
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Session times must be inside the expo days
  const minTime = `${toInputDate(expo.startDate)}T00:00`;
  const maxTime = `${toInputDate(expo.endDate)}T23:59`;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function changeSpeaker(index, field, value) {
    setSpeakers(speakers.map((speaker, i) => (i === index ? { ...speaker, [field]: value } : speaker)));
    setErrors({ ...errors, speakers: "" });
  }

  function validate() {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.location.trim()) newErrors.location = "Location is required";
    if (!form.startTime) newErrors.startTime = "Start time is required";
    if (!form.endTime) newErrors.endTime = "End time is required";
    if (form.startTime && (form.startTime < minTime || form.startTime > maxTime)) {
      newErrors.startTime = "Start time must be inside the expo dates";
    }
    if (form.endTime && (form.endTime < minTime || form.endTime > maxTime)) {
      newErrors.endTime = "End time must be inside the expo dates";
    }
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      newErrors.endTime = "End time must be after the start time";
    }
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) newErrors.capacity = "Capacity must be at least 1";
    if (speakers.some((speaker) => !speaker.name.trim())) newErrors.speakers = "Every speaker needs a name";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      title: form.title,
      description: form.description,
      topic: form.topic,
      type: form.type,
      location: form.location,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      capacity: Number(form.capacity),
      speakers,
    };

    setSaving(true);
    try {
      const res = isEdit
        ? await api.put(`/sessions/${session._id}`, data)
        : await api.post(`/expos/${expo._id}/sessions`, data);
      toast.success(res.data.message);
      onSaved();
    } catch (error) {
      const message = getErrorMessage(error);
      const fieldErrors = getFieldErrors(error);

      // "speakers[0].name" -> one error for the speakers list
      const speakerField = Object.keys(fieldErrors).find((field) => field.startsWith("speakers"));
      if (speakerField) fieldErrors.speakers = fieldErrors[speakerField];

      const messageField = getMessageField(message);
      if (messageField) fieldErrors[messageField] = message;

      setErrors(fieldErrors);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit session" : "Create session"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="session-form" loading={saving}>
            {isEdit ? "Save changes" : "Create session"}
          </Button>
        </>
      }
    >
      <form id="session-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input label="Title" name="title" value={form.title} onChange={handleChange} error={errors.title} required />
        <Textarea
          label="Description"
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          error={errors.description}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Topic"
            name="topic"
            placeholder="e.g. AI"
            value={form.topic}
            onChange={handleChange}
            error={errors.topic}
          />
          <Select label="Type" name="type" options={typeOptions} value={form.type} onChange={handleChange} error={errors.type} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Location"
            name="location"
            placeholder="e.g. Hall A"
            value={form.location}
            onChange={handleChange}
            error={errors.location}
            required
          />
          <Input
            label="Capacity"
            name="capacity"
            type="number"
            min="1"
            value={form.capacity}
            onChange={handleChange}
            error={errors.capacity}
            hint={isEdit ? `${session.registeredCount} already registered` : undefined}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start time"
            name="startTime"
            type="datetime-local"
            min={minTime}
            max={maxTime}
            value={form.startTime}
            onChange={handleChange}
            error={errors.startTime}
            required
          />
          <Input
            label="End time"
            name="endTime"
            type="datetime-local"
            min={form.startTime || minTime}
            max={maxTime}
            value={form.endTime}
            onChange={handleChange}
            error={errors.endTime}
            required
          />
        </div>

        {/* Speakers */}
        <div role="group" aria-labelledby="speakers-label">
          <div className="mb-2 flex items-center justify-between">
            <span id="speakers-label" className="text-sm font-medium text-slate-700">
              Speakers
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSpeakers([...speakers, { ...emptySpeaker }])}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add speaker
            </Button>
          </div>

          {speakers.length === 0 && <p className="text-sm text-slate-500">No speakers added.</p>}

          <div className="space-y-3">
            {speakers.map((speaker, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <Input
                      label="Name"
                      name={`speaker-name-${index}`}
                      value={speaker.name}
                      onChange={(e) => changeSpeaker(index, "name", e.target.value)}
                      required
                    />
                    <Input
                      label="Designation"
                      name={`speaker-designation-${index}`}
                      placeholder="e.g. CTO, Acme"
                      value={speaker.designation}
                      onChange={(e) => changeSpeaker(index, "designation", e.target.value)}
                    />
                    <Textarea
                      label="Bio"
                      name={`speaker-bio-${index}`}
                      rows={2}
                      value={speaker.bio}
                      onChange={(e) => changeSpeaker(index, "bio", e.target.value)}
                      className="sm:col-span-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpeakers(speakers.filter((_, i) => i !== index))}
                    aria-label={`Remove speaker ${index + 1}`}
                    className="mt-7 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {errors.speakers && <p className="mt-1.5 text-sm text-red-600">{errors.speakers}</p>}
        </div>
      </form>
    </Modal>
  );
}
