import { useEffect, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import RatingStars from "../../components/feedback/RatingStars";
import RatingInput from "../../components/feedback/RatingInput";
import api from "../../api/axios";
import { FEEDBACK_TYPES } from "../../utils/constants";
import { formatDate, getErrorMessage, getFieldErrors } from "../../utils/helpers";

const typeOptions = FEEDBACK_TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }));
const emptyForm = { type: "suggestion", subject: "", message: "", rating: 0, expoId: "" };

// For attendees and exhibitors: send feedback and see the admin's reply
export default function MyFeedback() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expos, setExpos] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/feedback/my"), api.get("/expos")])
      .then(([feedbackRes, exposRes]) => {
        setFeedback(feedbackRes.data.feedback);
        setExpos(exposRes.data.expos);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!form.subject.trim()) newErrors.subject = "Subject is required";
    if (!form.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const data = { type: form.type, subject: form.subject.trim(), message: form.message.trim() };
    if (form.rating) data.rating = form.rating;
    if (form.expoId) data.expoId = form.expoId;

    setSaving(true);
    try {
      const res = await api.post("/feedback", data);
      const expo = expos.find((x) => x._id === form.expoId);
      setFeedback([{ ...res.data.feedback, expo: expo ? { _id: expo._id, title: expo.title } : null }, ...feedback]);
      setForm(emptyForm);
      toast.success("Thank you! Your feedback has been sent.");
    } catch (error) {
      setErrors(getFieldErrors(error));
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Feedback" subtitle="Tell us what went well, report a problem or suggest an idea." />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Send feedback</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Select label="Type" name="type" options={typeOptions} value={form.type} onChange={handleChange} error={errors.type} required />
              <Select
                label="Expo (optional)"
                name="expoId"
                placeholder="No specific expo"
                options={expos.map((expo) => ({ value: expo._id, label: expo.title }))}
                value={form.expoId}
                onChange={handleChange}
                error={errors.expoId}
              />
            </div>
            <Input label="Subject" name="subject" value={form.subject} onChange={handleChange} error={errors.subject} maxLength={150} required />
            <Textarea
              label="Message"
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              error={errors.message}
              placeholder="Write the details here..."
              required
            />
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Rating (optional)</p>
              <RatingInput value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
            </div>
            <Button type="submit" loading={saving} fullWidth>
              <Send className="h-4 w-4" aria-hidden="true" /> Send feedback
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-3">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">My feedback</h2>

          {loading ? (
            <div className="flex justify-center py-16 text-indigo-600">
              <Spinner />
            </div>
          ) : feedback.length === 0 ? (
            <Card>
              <EmptyState icon={MessageSquareText} title="No feedback yet" message="Feedback you send will show here with the admin's reply." />
            </Card>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => (
                <Card key={item._id} className="p-4! sm:p-5!">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold break-words text-slate-900">{item.subject}</h3>
                      <p className="text-xs text-slate-500">
                        {formatDate(item.createdAt)}
                        {item.expo && ` · ${item.expo.title}`}
                      </p>
                    </div>
                    <Badge status={item.status} />
                  </div>

                  <p className="mt-2 text-sm break-words whitespace-pre-line text-slate-600">{item.message}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Badge color="indigo">{item.type}</Badge>
                    <RatingStars rating={item.rating} />
                  </div>

                  {item.adminResponse && (
                    <div className="mt-4 rounded-xl border-l-4 border-green-500 bg-green-50 p-3">
                      <p className="text-xs font-semibold text-green-800">Response from the organizer</p>
                      <p className="mt-1 text-sm whitespace-pre-line text-slate-700">{item.adminResponse}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
