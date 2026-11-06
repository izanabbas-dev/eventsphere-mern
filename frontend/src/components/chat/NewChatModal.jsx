import { useEffect, useState } from "react";
import { Headset, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import CompanyLogo from "../applications/CompanyLogo";
import api from "../../api/axios";
import { getErrorMessage } from "../../utils/helpers";

export default function NewChatModal({ open, onClose, myId, onStart }) {
  const [expos, setExpos] = useState([]);
  const [expoId, setExpoId] = useState("");
  const [organizer, setOrganizer] = useState(null);
  const [exhibitors, setExhibitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState("");

  useEffect(() => {
    if (!open) return;
    api
      .get("/expos")
      .then((res) => setExpos(res.data.expos.filter((expo) => expo.status !== "cancelled")))
      .catch((error) => toast.error(getErrorMessage(error)));
  }, [open]);

  function changeExpo(id) {
    setExpoId(id);
    setOrganizer(null);
    setExhibitors([]);
    if (!id) return;

    setLoading(true);
    Promise.all([api.get(`/expos/${id}`), api.get(`/expos/${id}/exhibitors`)])
      .then(([expoRes, exhibitorsRes]) => {
        setOrganizer(expoRes.data.expo.organizer);
        setExhibitors(exhibitorsRes.data.exhibitors.filter((profile) => profile.user !== myId));
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }

  async function start(userId) {
    setStartingId(userId);
    await onStart(userId, expoId);
    setStartingId("");
  }

  return (
    <Modal open={open} onClose={onClose} title="New chat">
      <Select
        label="Expo"
        name="chat-expo"
        placeholder="Choose an expo"
        options={expos.map((expo) => ({ value: expo._id, label: expo.title }))}
        value={expoId}
        onChange={(e) => changeExpo(e.target.value)}
      />

      {loading && (
        <div className="flex justify-center py-10 text-indigo-600">
          <Spinner />
        </div>
      )}

      {!loading && organizer && (
        <div className="mt-5 space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4">
            <Headset className="h-8 w-8 shrink-0 text-indigo-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">Organizer support</p>
              <p className="truncate text-sm text-slate-600">{organizer.name}</p>
            </div>
            <Button size="sm" loading={startingId === organizer._id} onClick={() => start(organizer._id)}>
              Contact organizer
            </Button>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Other exhibitors in this expo</h3>
            {exhibitors.length === 0 ? (
              <p className="text-sm text-slate-500">No other exhibitors in this expo yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {exhibitors.map((profile) => (
                  <li key={profile._id} className="flex items-center gap-3 p-3">
                    <CompanyLogo logo={profile.logo} name={profile.companyName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{profile.companyName}</p>
                      {profile.category && <p className="truncate text-xs text-slate-500">{profile.category}</p>}
                    </div>
                    <Button size="sm" variant="secondary" loading={startingId === profile.user} onClick={() => start(profile.user)}>
                      <MessageSquare className="h-4 w-4" aria-hidden="true" /> Message
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
