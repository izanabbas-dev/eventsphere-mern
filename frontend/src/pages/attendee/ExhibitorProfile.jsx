import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Globe, Mail, MapPin, MessageSquare, Phone, Store, User } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import CompanyLogo from "../../components/applications/CompanyLogo";
import AttendeeFloorPlan from "../../components/attendee/AttendeeFloorPlan";
import api from "../../api/axios";
import { startConversation } from "../../api/chatApi";
import { useExpoRoom } from "../../context/useSocket";
import { getErrorMessage, toWebsiteUrl } from "../../utils/helpers";

export default function AttendeeExhibitorProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const expoId = searchParams.get("expoId");
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api
      .get(`/exhibitors/${id}`, { params: { expoId: expoId || undefined } })
      .then((res) => setData(res.data))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [id, expoId]);

  // Live updates for the small floor plan
  useExpoRoom(data?.booth ? expoId : null);

  // Open my old chat with this exhibitor for this expo, or create it
  async function handleMessage() {
    setStarting(true);
    try {
      const conversation = await startConversation(id, expoId);
      navigate(`/attendee/messages?c=${conversation._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setStarting(false);
    }
  }

  // Go back, or to the exhibitor list when this page was opened directly
  function goBack() {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(expoId ? `/attendee/expos/${expoId}?tab=exhibitors` : "/attendee/exhibitors");
  }

  const backLink = (
    <button
      type="button"
      onClick={goBack}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
    </button>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-indigo-600">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <>
        {backLink}
        <Card>
          <EmptyState title="Exhibitor not found" message="This exhibitor may no longer be available." />
        </Card>
      </>
    );
  }

  const { profile, booth, contactHidden } = data;
  const contact = profile.contact || {};
  const products = profile.productsServices || [];

  return (
    <>
      {backLink}

      <Card className="mb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <CompanyLogo logo={profile.logo} name={profile.companyName} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{profile.companyName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {profile.category && <Badge color="indigo">{profile.category}</Badge>}
              {booth && (
                <Badge color="green">
                  <Store className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Booth {booth.boothNumber}
                  {booth.hall && ` · ${booth.hall}`}
                </Badge>
              )}
            </div>
          </div>
          {/* A chat always belongs to an expo, so the button needs one */}
          {expoId && (
            <Button onClick={handleMessage} loading={starting}>
              <MessageSquare className="h-4 w-4" aria-hidden="true" /> Message
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900">About</h2>
            <p className="mt-3 text-sm whitespace-pre-line text-slate-600">
              {profile.description || "This exhibitor has not added a description yet."}
            </p>

            {products.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold text-slate-900">Products & services</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {products.map((product) => (
                    <li key={product} className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                      {product}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          {booth && (
            <Card className="min-w-0">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Find the booth</h2>
              <AttendeeFloorPlan expoId={expoId} highlightId={booth._id} />
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {contact.person && <ContactRow icon={User}>{contact.person}</ContactRow>}
            {contact.email && (
              <ContactRow icon={Mail}>
                <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">
                  {contact.email}
                </a>
              </ContactRow>
            )}
            {contact.phone && (
              <ContactRow icon={Phone}>
                <a href={`tel:${contact.phone}`} className="text-indigo-600 hover:underline">
                  {contact.phone}
                </a>
              </ContactRow>
            )}
            {profile.website && (
              <ContactRow icon={Globe}>
                <a href={toWebsiteUrl(profile.website)} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                  {profile.website}
                </a>
              </ContactRow>
            )}
            {contact.address && <ContactRow icon={MapPin}>{contact.address}</ContactRow>}
            {!contactHidden && !contact.person && !contact.email && !contact.phone && !profile.website && !contact.address && (
              <li className="text-slate-500">No contact details yet.</li>
            )}
          </ul>

          {contactHidden && (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              This exhibitor keeps their email and phone private.
              {expoId ? " Use the Message button to contact them." : ""}
            </p>
          )}

          {booth && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">Booth in this expo</p>
              <p className="mt-1 text-slate-600">
                Booth <span className="font-semibold">{booth.boothNumber}</span>
                {booth.hall && `, ${booth.hall}`}
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function ContactRow({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-3 text-slate-700">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}
