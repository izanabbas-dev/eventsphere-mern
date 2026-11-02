import { useEffect, useRef, useState } from "react";
import { Check, Download, FileText, Globe, Mail, MapPin, Phone, UserRound, X } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import Spinner from "../ui/Spinner";
import CompanyLogo from "./CompanyLogo";
import api from "../../api/axios";
import { CURRENCY } from "../../utils/constants";
import { downloadFile, formatDate, getErrorMessage } from "../../utils/helpers";

// Full details of one application. Admin can approve or reject it while it is pending.
export default function ApplicationDetailModal({ applicationId, onClose, onChanged }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  // null, "approve" or "reject"
  const [mode, setMode] = useState(null);
  const [booths, setBooths] = useState([]);
  const [boothsLoading, setBoothsLoading] = useState(false);
  const [boothId, setBoothId] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const actionRef = useRef(null);

  useEffect(() => {
    api
      .get(`/applications/${applicationId}`)
      .then((res) => setApplication(res.data.application))
      .catch((error) => {
        toast.error(getErrorMessage(error));
        onClose();
      })
      .finally(() => setLoading(false));
  }, [applicationId, onClose]);

  // On small screens the approve/reject box is at the bottom, so scroll to it
  useEffect(() => {
    if (mode) actionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [mode, boothsLoading]);

  async function startApprove() {
    setMode("approve");
    setBoothsLoading(true);
    try {
      const res = await api.get(`/expos/${application.expo._id}/booths`);
      // Free booths, and booths this exhibitor already holds
      const exhibitorId = application.exhibitor._id;
      const usable = res.data.booths.filter(
        (booth) => booth.status === "available" || booth.exhibitor?._id === exhibitorId
      );
      setBooths(usable);

      // Pick the booth the exhibitor holds, or else their first free preferred booth
      const preferredIds = application.preferredBooths.map((booth) => booth._id);
      const held = usable.find((booth) => booth.exhibitor?._id === exhibitorId);
      const preferred = usable.find((booth) => preferredIds.includes(booth._id));
      setBoothId(held?._id || preferred?._id || "");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBoothsLoading(false);
    }
  }

  function startReject() {
    setMode("reject");
    setNoteError("");
  }

  async function handleApprove() {
    setSaving(true);
    try {
      const data = { adminNote };
      if (boothId) data.boothId = boothId;
      const res = await api.patch(`/applications/${applicationId}/approve`, data);
      toast.success(res.data.message);
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!adminNote.trim()) {
      setNoteError("Please write why the application is rejected");
      return;
    }
    setSaving(true);
    try {
      const res = await api.patch(`/applications/${applicationId}/reject`, { adminNote });
      toast.success(res.data.message);
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSaving(false);
    }
  }

  async function handleDownload(doc) {
    setDownloadingId(doc._id);
    try {
      await downloadFile(`/exhibitors/${application.exhibitor._id}/documents/${doc._id}`, doc.name || "document");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  }

  const isPending = application?.status === "pending";

  // Footer buttons change with the step
  let footer = (
    <Button variant="secondary" onClick={onClose}>
      Close
    </Button>
  );
  if (isPending && mode === null) {
    footer = (
      <>
        <Button variant="secondary" onClick={onClose} className="sm:mr-auto">
          Close
        </Button>
        <Button variant="danger" onClick={startReject}>
          <X className="h-4 w-4" aria-hidden="true" /> Reject
        </Button>
        <Button onClick={startApprove}>
          <Check className="h-4 w-4" aria-hidden="true" /> Approve
        </Button>
      </>
    );
  } else if (mode === "approve") {
    footer = (
      <>
        <Button variant="secondary" onClick={() => setMode(null)} disabled={saving}>
          Back
        </Button>
        <Button onClick={handleApprove} loading={saving} disabled={boothsLoading}>
          Confirm approval
        </Button>
      </>
    );
  } else if (mode === "reject") {
    footer = (
      <>
        <Button variant="secondary" onClick={() => setMode(null)} disabled={saving}>
          Back
        </Button>
        <Button variant="danger" onClick={handleReject} loading={saving}>
          Confirm rejection
        </Button>
      </>
    );
  }

  return (
    <Modal open onClose={onClose} title="Application" size="xl" footer={footer}>
      {loading || !application ? (
        <div className="flex justify-center py-12 text-indigo-600">
          <Spinner />
        </div>
      ) : (
        <Details
          application={application}
          downloadingId={downloadingId}
          onDownload={handleDownload}
          actionBox={
            mode && (
              <div ref={actionRef}>
                {mode === "approve" ? (
                  <ApproveBox
                    application={application}
                    booths={booths}
                    loading={boothsLoading}
                    boothId={boothId}
                    onBoothChange={setBoothId}
                    adminNote={adminNote}
                    onNoteChange={setAdminNote}
                  />
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                    <Textarea
                      label="Reason for rejection"
                      name="adminNote"
                      rows={3}
                      required
                      placeholder="This note is sent to the exhibitor"
                      value={adminNote}
                      onChange={(e) => {
                        setAdminNote(e.target.value);
                        setNoteError("");
                      }}
                      error={noteError}
                    />
                  </div>
                )}
              </div>
            )
          }
        />
      )}
    </Modal>
  );
}

function Details({ application, downloadingId, onDownload, actionBox }) {
  const profile = application.profile || {};
  const contact = profile.contact || {};
  const companyName = profile.companyName || application.exhibitor?.name || "Unknown company";

  return (
    <div className="space-y-6">
      {/* Company header */}
      <div className="flex gap-4">
        <CompanyLogo logo={profile.logo} name={companyName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{companyName}</h3>
            <Badge status={application.status} />
          </div>
          <p className="text-sm text-slate-500">{profile.category || "No category"}</p>
          <p className="mt-1 text-xs break-words text-slate-500">
            Applied {formatDate(application.createdAt)} by {application.exhibitor?.name} ({application.exhibitor?.email})
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {/* Left: company info */}
        <div className="space-y-6">
          <Section title="About the company">
            <p className="text-sm whitespace-pre-line text-slate-600">{profile.description || "No description added."}</p>
          </Section>

          {profile.productsServices?.length > 0 && (
            <Section title="Products & services">
              <div className="flex flex-wrap gap-2">
                {profile.productsServices.map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section title="Contact">
            <ul className="space-y-2 text-sm text-slate-600">
              <ContactItem icon={UserRound} value={contact.person} />
              <ContactItem icon={Mail} value={contact.email || application.exhibitor?.email} />
              <ContactItem icon={Phone} value={contact.phone || application.exhibitor?.phone} />
              <ContactItem icon={MapPin} value={contact.address} />
              {profile.website && (
                <li className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium text-indigo-600 hover:underline"
                  >
                    {profile.website}
                  </a>
                </li>
              )}
            </ul>
          </Section>

          <Section title="Documents">
            {profile.documents?.length > 0 ? (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {profile.documents.map((doc) => (
                  <li key={doc._id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{doc.name}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(doc)}
                      loading={downloadingId === doc._id}
                      title="Download"
                      aria-label={`Download ${doc.name}`}
                    >
                      {downloadingId !== doc._id && <Download className="h-4 w-4" aria-hidden="true" />}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No documents uploaded.</p>
            )}
          </Section>
        </div>

        {/* Right: application info */}
        <div className="space-y-6">
          <Section title="Message">
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm whitespace-pre-line text-slate-700">
              {application.message || "No message."}
            </p>
          </Section>

          <Section title="Preferred booths">
            {application.preferredBooths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {application.preferredBooths.map((booth) => (
                  <span
                    key={booth._id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-medium text-slate-800"
                  >
                    {booth.boothNumber}
                    <Badge status={booth.status} />
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">None</p>
            )}
          </Section>

          <Section title="Assigned booth">
            {application.assignedBooth ? (
              <p className="text-sm font-semibold text-indigo-700">
                {application.assignedBooth.boothNumber}
                {application.assignedBooth.hall && (
                  <span className="font-normal text-slate-500"> · {application.assignedBooth.hall}</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No booth assigned.</p>
            )}
          </Section>

          {application.adminNote && (
            <Section title="Admin note">
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm whitespace-pre-line text-amber-900">
                {application.adminNote}
              </p>
            </Section>
          )}

          {actionBox}
        </div>
      </div>
    </div>
  );
}

function ApproveBox({ application, booths, loading, boothId, onBoothChange, adminNote, onNoteChange }) {
  const preferredIds = application.preferredBooths.map((booth) => booth._id);

  const boothOptions = booths.map((booth) => {
    const parts = [booth.boothNumber, booth.hall, booth.size, `${CURRENCY} ${booth.price}`].filter(Boolean);
    let label = parts.join(" · ");
    if (booth.status !== "available") label += ` (${booth.status} by this exhibitor)`;
    if (preferredIds.includes(booth._id)) label += " ★ preferred";
    return { value: booth._id, label };
  });

  return (
    <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
      {loading ? (
        <div className="flex justify-center py-4 text-indigo-600">
          <Spinner />
        </div>
      ) : (
        <Select
          label="Assign a booth (optional)"
          name="boothId"
          placeholder="No booth for now"
          options={boothOptions}
          value={boothId}
          onChange={(e) => onBoothChange(e.target.value)}
        />
      )}
      <Textarea
        label="Admin note (optional)"
        name="adminNote"
        rows={2}
        value={adminNote}
        onChange={(e) => onNoteChange(e.target.value)}
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</h4>
      {children}
    </section>
  );
}

function ContactItem({ icon: Icon, value }) {
  if (!value) return null;
  return (
    <li className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="truncate">{value}</span>
    </li>
  );
}
