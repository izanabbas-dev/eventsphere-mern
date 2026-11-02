import { useCallback, useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Select from "../../components/ui/Select";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import RatingStars from "../../components/feedback/RatingStars";
import FeedbackDetailModal from "../../components/feedback/FeedbackDetailModal";
import api from "../../api/axios";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from "../../utils/constants";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const statusOptions = FEEDBACK_STATUSES.map((s) => ({
  value: s,
  label: s === "in_progress" ? "In progress" : s[0].toUpperCase() + s.slice(1),
}));
const typeOptions = FEEDBACK_TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }));

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [openItem, setOpenItem] = useState(null);

  const loadFeedback = useCallback(() => {
    const params = {};
    if (status) params.status = status;
    if (type) params.type = type;

    api
      .get("/feedback", { params })
      .then((res) => setFeedback(res.data.feedback))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [status, type]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const closeModal = useCallback(() => setOpenItem(null), []);

  function changeFilter(setter, value) {
    setLoading(true);
    setter(value);
  }

  return (
    <>
      <PageHeader title="Feedback" subtitle="Read feedback from users and reply to it." />

      <Card className="mb-6 p-4!">
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
          <Select
            label="Status"
            name="status"
            placeholder="All statuses"
            options={statusOptions}
            value={status}
            onChange={(e) => changeFilter(setStatus, e.target.value)}
          />
          <Select
            label="Type"
            name="type"
            placeholder="All types"
            options={typeOptions}
            value={type}
            onChange={(e) => changeFilter(setType, e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600">
          <Spinner />
        </div>
      ) : feedback.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquareText}
            title="No feedback found"
            message={status || type ? "Try a different status or type." : "No user has sent feedback yet."}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => setOpenItem(item)}
              className="block w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{item.subject}</h3>
                  <p className="text-sm text-slate-500">
                    {item.user?.name || "Deleted user"}
                    {item.expo && ` · ${item.expo.title}`}
                  </p>
                </div>
                <Badge status={item.status} />
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.message}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                <Badge color="indigo">{item.type}</Badge>
                <RatingStars rating={item.rating} />
                <span>{formatDate(item.createdAt)}</span>
                {item.adminResponse && <span className="font-medium text-green-700">Replied</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {openItem && (
        <FeedbackDetailModal
          feedback={openItem}
          onClose={closeModal}
          onSaved={() => {
            setOpenItem(null);
            loadFeedback();
          }}
        />
      )}
    </>
  );
}
