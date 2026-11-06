import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Send, X } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Textarea from "../ui/Textarea";
import ConfirmDialog from "../ui/ConfirmDialog";
import api from "../../api/axios";
import { fetchMyProfile } from "../../api/exhibitorApi";
import { formatDate, getErrorMessage, getFieldErrors, getProfileChecklist } from "../../utils/helpers";
import { MAX_PREFERRED_BOOTHS as MAX_PREFERRED } from "../../utils/constants";

export default function ApplySection({ expo, application, booths, selectedIds, onRemoveSelected, onChanged }) {
  const hasApplied = application && application.status !== "withdrawn";

  return (
    <div id="apply" className="scroll-mt-24">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900">{hasApplied ? "My application" : "Apply to this expo"}</h2>
        {hasApplied ? (
          <ApplicationStatus application={application} onChanged={onChanged} />
        ) : expo.status !== "published" ? (
          <p className="mt-2 text-sm text-slate-500">Applications are closed for this expo.</p>
        ) : (
          <ApplyForm
            expoId={expo._id}
            wasWithdrawn={application?.status === "withdrawn"}
            booths={booths}
            selectedIds={selectedIds}
            onRemoveSelected={onRemoveSelected}
            onChanged={onChanged}
          />
        )}
      </Card>
    </div>
  );
}

function ApplyForm({ expoId, wasWithdrawn, booths, selectedIds, onRemoveSelected, onChanged }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState([]);

  useEffect(() => {
    fetchMyProfile()
      .then((profile) => setMissing(getProfileChecklist(profile).filter((item) => !item.done)))
      .catch(() => {});
  }, []);

  const selectedBooths = booths.filter((booth) => selectedIds.includes(booth._id));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write a short message for the organizer");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post(`/expos/${expoId}/applications`, {
        message: message.trim(),
        preferredBooths: selectedIds,
      });
      toast.success(res.data.message);
      onChanged();
    } catch (err) {
      setError(getFieldErrors(err).message || "");
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
      {wasWithdrawn && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          You withdrew your earlier application. You can apply again.
        </p>
      )}

      {missing.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          The organizer reviews your company profile with this application. Still missing:{" "}
          {missing.map((item) => item.label).join(", ")}.{" "}
          <Link to="/exhibitor/profile" className="font-semibold underline">
            Complete profile
          </Link>
        </p>
      )}

      <Textarea
        label="Message to the organizer"
        name="message"
        required
        maxLength={1000}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setError("");
        }}
        error={error}
        placeholder="Tell us what you will showcase..."
      />

      <div>
        <p className="text-sm font-medium text-slate-700">
          Preferred booths <span className="font-normal text-slate-500">(optional, up to {MAX_PREFERRED})</span>
        </p>
        {selectedBooths.length === 0 ? (
          <p className="mt-1.5 text-sm text-slate-500">Click available (green) booths on the floor plan to pick them.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {selectedBooths.map((booth) => (
              <li
                key={booth._id}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pr-1 pl-3 text-sm font-medium text-indigo-700"
              >
                {booth.boothNumber}
                {booth.hall && <span className="text-indigo-500">· {booth.hall}</span>}
                <button
                  type="button"
                  onClick={() => onRemoveSelected(booth._id)}
                  aria-label={`Remove booth ${booth.boothNumber}`}
                  className="rounded-full p-0.5 hover:bg-indigo-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" loading={saving} fullWidth>
        <Send className="h-4 w-4" aria-hidden="true" /> Submit application
      </Button>
    </form>
  );
}

function ApplicationStatus({ application, onChanged }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [working, setWorking] = useState(false);

  async function withdraw() {
    setWorking(true);
    try {
      const res = await api.patch(`/applications/${application._id}/withdraw`);
      toast.success(res.data.message);
      setConfirmOpen(false);
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <dl className="space-y-3 text-sm">
        <Row label="Status">
          <Badge status={application.status} />
        </Row>
        <Row label="Applied on">{formatDate(application.createdAt)}</Row>
        <Row label="Assigned booth">
          {application.assignedBooth ? (
            <span className="font-semibold">
              {application.assignedBooth.boothNumber}
              {application.assignedBooth.hall && ` · ${application.assignedBooth.hall}`}
            </span>
          ) : (
            "Not assigned yet"
          )}
        </Row>
        {application.preferredBooths?.length > 0 && (
          <Row label="Preferred">{application.preferredBooths.map((b) => b.boothNumber).join(", ")}</Row>
        )}
      </dl>

      {application.message && (
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Your message</p>
          <p className="mt-1 text-sm whitespace-pre-line text-slate-700">{application.message}</p>
        </div>
      )}

      {application.adminNote && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="font-semibold">Admin note:</span> {application.adminNote}
        </div>
      )}

      {application.status === "pending" && (
        <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(true)}>
          Withdraw application
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Withdraw application?"
        message="Your application will be withdrawn and any booth you hold in this expo will be released. You can apply again later."
        confirmText="Withdraw"
        loading={working}
        onConfirm={withdraw}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}
