import { useCallback, useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import CompanyLogo from "./CompanyLogo";
import ApplicationDetailModal from "./ApplicationDetailModal";
import api from "../../api/axios";
import { APPLICATION_STATUSES } from "../../utils/constants";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const filters = ["", ...APPLICATION_STATUSES];

export default function ApplicationsList({ expoId }) {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const loadApplications = useCallback(() => {
    api
      .get(`/expos/${expoId}/applications`, { params: status ? { status } : {} })
      .then((res) => setApplications(res.data.applications))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [expoId, status]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const closeModal = useCallback(() => setOpenId(null), []);

  function changeStatus(value) {
    if (value === status) return;
    setLoading(true);
    setStatus(value);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {filters.map((value) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => changeStatus(value)}
            aria-pressed={status === value}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors ${
              status === value
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {value || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600">
          <Spinner />
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No applications"
            message={status ? `There are no ${status} applications for this expo.` : "No exhibitor has applied to this expo yet."}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <ApplicationRow key={application._id} application={application} onOpen={() => setOpenId(application._id)} />
          ))}
        </div>
      )}

      {openId && (
        <ApplicationDetailModal
          applicationId={openId}
          onClose={closeModal}
          onChanged={() => {
            setOpenId(null);
            loadApplications();
          }}
        />
      )}
    </div>
  );
}

function ApplicationRow({ application, onOpen }) {
  const profile = application.profile || {};
  const companyName = profile.companyName || application.exhibitor?.name || "Unknown company";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:p-5"
    >
      <div className="flex gap-4">
        <CompanyLogo logo={profile.logo} name={companyName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-900">{companyName}</h3>
              <p className="text-sm text-slate-500">{profile.category || "No category"}</p>
            </div>
            <Badge status={application.status} />
          </div>

          {application.message && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{application.message}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span>Applied {formatDate(application.createdAt)}</span>
            {application.preferredBooths.length > 0 && (
              <span className="flex flex-wrap items-center gap-1">
                Preferred:
                {application.preferredBooths.map((booth) => (
                  <span key={booth._id} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                    {booth.boothNumber}
                  </span>
                ))}
              </span>
            )}
            {application.assignedBooth && (
              <span className="font-medium text-indigo-700">Booth {application.assignedBooth.boothNumber}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
