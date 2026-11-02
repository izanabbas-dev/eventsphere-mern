import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import api from "../../api/axios";
import { BOOTH_SIZES, CURRENCY } from "../../utils/constants";
import { getErrorMessage, getFieldErrors } from "../../utils/helpers";

const sizeOptions = BOOTH_SIZES.map((size) => ({ value: size, label: size[0].toUpperCase() + size.slice(1) }));

// Add a booth on an empty cell, or edit an existing booth
export default function BoothFormModal({ expoId, booth, cell, onClose, onSaved }) {
  const isEdit = Boolean(booth);
  const position = isEdit ? booth.position : cell;

  const [form, setForm] = useState({
    boothNumber: booth?.boothNumber || "",
    hall: booth?.hall || "",
    size: booth?.size || "medium",
    price: booth?.price ?? 0,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!form.boothNumber.trim()) newErrors.boothNumber = "Booth number is required";
    if (form.price === "" || Number(form.price) < 0) newErrors.price = "Price must be 0 or more";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const data = {
      boothNumber: form.boothNumber,
      hall: form.hall,
      size: form.size,
      price: Number(form.price),
    };

    setSaving(true);
    try {
      const res = isEdit
        ? await api.put(`/booths/${booth._id}`, data)
        : await api.post(`/expos/${expoId}/booths`, { ...data, position });
      toast.success(res.data.message);
      onSaved();
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Edit booth ${booth.boothNumber}` : "Add booth"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="booth-form" loading={saving}>
            {isEdit ? "Save changes" : "Add booth"}
          </Button>
        </>
      }
    >
      <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Position: <strong className="text-slate-900">Row {position.row + 1}</strong>,{" "}
        <strong className="text-slate-900">Column {position.col + 1}</strong>
      </p>

      <form id="booth-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Booth number"
            name="boothNumber"
            placeholder="e.g. A12"
            value={form.boothNumber}
            onChange={handleChange}
            error={errors.boothNumber}
            required
          />
          <Input
            label="Hall"
            name="hall"
            placeholder="e.g. Hall 1"
            value={form.hall}
            onChange={handleChange}
            error={errors.hall}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Size"
            name="size"
            options={sizeOptions}
            value={form.size}
            onChange={handleChange}
            error={errors.size}
          />
          <Input
            label={`Price (${CURRENCY})`}
            name="price"
            type="number"
            min="0"
            value={form.price}
            onChange={handleChange}
            error={errors.price}
          />
        </div>
      </form>
    </Modal>
  );
}
