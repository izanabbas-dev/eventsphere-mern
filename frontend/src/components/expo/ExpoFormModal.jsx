import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import api from "../../api/axios";
import { getErrorMessage, getFieldErrors, toInputDate } from "../../utils/helpers";

export default function ExpoFormModal({ expo, onClose, onSaved }) {
  const isEdit = Boolean(expo);

  const [form, setForm] = useState({
    title: expo?.title || "",
    description: expo?.description || "",
    theme: expo?.theme || "",
    startDate: toInputDate(expo?.startDate),
    endDate: toInputDate(expo?.endDate),
    location: expo?.location || "",
    rows: expo?.floorPlan?.rows ?? 5,
    cols: expo?.floorPlan?.cols ?? 5,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  function validate() {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.location.trim()) newErrors.location = "Location is required";
    if (!form.startDate) newErrors.startDate = "Start date is required";
    if (!form.endDate) newErrors.endDate = "End date is required";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      newErrors.endDate = "End date must be after the start date";
    }
    const rows = Number(form.rows);
    const cols = Number(form.cols);
    if (!Number.isInteger(rows) || rows < 1 || rows > 50) newErrors.rows = "Rows must be between 1 and 50";
    if (!Number.isInteger(cols) || cols < 1 || cols > 50) newErrors.cols = "Columns must be between 1 and 50";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      title: form.title,
      description: form.description,
      theme: form.theme,
      startDate: form.startDate,
      endDate: form.endDate,
      location: form.location,
      floorPlan: { rows: Number(form.rows), cols: Number(form.cols) },
    };

    setSaving(true);
    try {
      const res = isEdit ? await api.put(`/expos/${expo._id}`, data) : await api.post("/expos", data);
      toast.success(res.data.message);
      onSaved(res.data.expo);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      fieldErrors.rows = fieldErrors["floorPlan.rows"];
      fieldErrors.cols = fieldErrors["floorPlan.cols"];
      setErrors(fieldErrors);
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit expo" : "Create expo"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="expo-form" loading={saving}>
            {isEdit ? "Save changes" : "Create expo"}
          </Button>
        </>
      }
    >
      <form id="expo-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Title"
          name="title"
          placeholder="Tech Innovation Expo 2026"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          required
        />
        <Textarea
          label="Description"
          name="description"
          rows={3}
          placeholder="What is this expo about?"
          value={form.description}
          onChange={handleChange}
          error={errors.description}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Theme"
            name="theme"
            placeholder="Artificial Intelligence"
            value={form.theme}
            onChange={handleChange}
            error={errors.theme}
          />
          <Input
            label="Location"
            name="location"
            placeholder="Expo Centre, Karachi"
            value={form.location}
            onChange={handleChange}
            error={errors.location}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start date"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
            error={errors.startDate}
            required
          />
          <Input
            label="End date"
            name="endDate"
            type="date"
            min={form.startDate || undefined}
            value={form.endDate}
            onChange={handleChange}
            error={errors.endDate}
            required
          />
        </div>

        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">Floor plan size</legend>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Rows"
              name="rows"
              type="number"
              min="1"
              max="50"
              value={form.rows}
              onChange={handleChange}
              error={errors.rows}
            />
            <Input
              label="Columns"
              name="cols"
              type="number"
              min="1"
              max="50"
              value={form.cols}
              onChange={handleChange}
              error={errors.cols}
            />
          </div>
          {isEdit && (
            <p className="mt-3 text-xs text-slate-500">
              Making the floor plan smaller does not delete booths. Booths outside the new size still show on the grid.
            </p>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
