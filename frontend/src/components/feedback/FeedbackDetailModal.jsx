import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import RatingStars from "./RatingStars";
import api from "../../api/axios";
import { FEEDBACK_STATUSES } from "../../utils/constants";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const statusOptions = FEEDBACK_STATUSES.map((s) => ({
  value: s,
  label: s === "in_progress" ? "In progress" : s[0].toUpperCase() + s.slice(1),
}));

// Full feedback message, with a form to change its status and reply
export default function FeedbackDetailModal({ feedback, onClose, onSaved }) {
  const [status, setStatus] = useState(feedback.status);
  const [response, setResponse] = useState(feedback.adminResponse || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch(`/feedback/${feedback._id}`, { status, adminResponse: response.trim() });
      toast.success(res.data.message);
      onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={feedback.subject}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="feedback-form" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge color="indigo">{feedback.type}</Badge>
        <Badge status={feedback.status} />
        <RatingStars rating={feedback.rating} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">From</dt>
          <dd className="font-medium text-slate-900">
            {feedback.user?.name || "Deleted user"}
            {feedback.user?.role && <span className="ml-1 text-xs text-slate-500 capitalize">({feedback.user.role})</span>}
          </dd>
          {feedback.user?.email && <dd className="text-slate-500">{feedback.user.email}</dd>}
        </div>
        <div>
          <dt className="text-slate-500">Date</dt>
          <dd className="font-medium text-slate-900">{formatDate(feedback.createdAt)}</dd>
          <dd className="text-slate-500">{feedback.expo ? `Expo: ${feedback.expo.title}` : "General feedback"}</dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm whitespace-pre-line text-slate-700">{feedback.message}</div>

      <form id="feedback-form" onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-slate-100 pt-5">
        <Select
          label="Status"
          name="status"
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="sm:max-w-xs"
        />
        <Textarea
          label="Admin response"
          name="adminResponse"
          placeholder="Write a reply for the user..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        />
      </form>
    </Modal>
  );
}
