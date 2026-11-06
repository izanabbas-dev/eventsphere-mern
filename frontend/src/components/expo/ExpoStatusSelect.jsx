import { useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "../ui/ConfirmDialog";
import api from "../../api/axios";
import { EXPO_NEXT_STATUSES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

export default function ExpoStatusSelect({ expo, onChanged }) {
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const options = EXPO_NEXT_STATUSES[expo.status] || [];

  async function changeStatus(status) {
    setSaving(true);
    try {
      const res = await api.patch(`/expos/${expo._id}/status`, { status });
      toast.success(res.data.message);
      onChanged(res.data.expo);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
      setConfirmCancel(false);
    }
  }

  function handleChange(e) {
    const status = e.target.value;
    if (!status) return;
    if (status === "cancelled") setConfirmCancel(true);
    else changeStatus(status);
  }

  if (options.length === 0) {
    return <span className="text-xs text-slate-400">No status changes</span>;
  }

  return (
    <>
      <select
        value=""
        onChange={handleChange}
        disabled={saving}
        aria-label={`Change status of ${expo.title}`}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm
          focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-60"
      >
        <option value="">{saving ? "Saving..." : "Change status"}</option>
        {options.map((status) => (
          <option key={status} value={status} className="capitalize">
            {status === "cancelled" ? "Cancel expo" : `Mark as ${status}`}
          </option>
        ))}
      </select>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this expo?"
        message={`"${expo.title}" will be marked as cancelled. This cannot be changed later.`}
        confirmText="Yes, cancel expo"
        loading={saving}
        onConfirm={() => changeStatus("cancelled")}
        onClose={() => setConfirmCancel(false)}
      />
    </>
  );
}
