import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, Store } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import LoadError from "../../components/ui/LoadError";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import api from "../../api/axios";
import { formatDate, getErrorMessage } from "../../utils/helpers";

export default function ExhibitorApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadApplications = useCallback(() => {
    api
      .get("/applications/my")
      .then((res) => {
        setApplications(res.data.applications);
        setFailed(false);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  function retry() {
    setLoading(true);
    loadApplications();
  }

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function withdraw() {
    setWorking(true);
    try {
      const res = await api.patch(`/applications/${withdrawing._id}/withdraw`);
      toast.success(res.data.message);
      setWithdrawing(null);
      loadApplications();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader
        title="My Applications"
        subtitle="Track the status of your expo applications."
        actions={<Button to="/exhibitor/expos">Browse expos</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600">
          <Spinner />
        </div>
      ) : failed ? (
        <LoadError onRetry={retry} />
      ) : applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No applications yet"
            message="Apply to a published expo to see your application here."
            action={<Button to="/exhibitor/expos">Find an expo</Button>}
          />
        </Card>
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => (
            <li key={app._id}>
              <Card className="p-5!">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {app.expo ? (
                        <Link
                          to={`/exhibitor/expos/${app.expo._id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600"
                        >
                          {app.expo.title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-slate-500">Expo removed</span>
                      )}
                      <Badge status={app.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                      {app.expo && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          {formatDate(app.expo.startDate)} - {formatDate(app.expo.endDate)}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Store className="h-4 w-4" aria-hidden="true" />
                        {app.assignedBooth
                          ? `Booth ${app.assignedBooth.boothNumber}${app.assignedBooth.hall ? ` · ${app.assignedBooth.hall}` : ""}`
                          : "No booth assigned"}
                      </span>
                      <span>Applied {formatDate(app.createdAt)}</span>
                    </div>
                  </div>

                  {app.status === "pending" && (
                    <Button variant="secondary" size="sm" className="self-start" onClick={() => setWithdrawing(app)}>
                      Withdraw
                    </Button>
                  )}
                </div>

                {app.adminNote && (
                  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <span className="font-semibold">Admin note:</span> {app.adminNote}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(withdrawing)}
        title="Withdraw application?"
        message={`Your application for ${withdrawing?.expo?.title || "this expo"} will be withdrawn and any booth you hold there will be released.`}
        confirmText="Withdraw"
        loading={working}
        onConfirm={withdraw}
        onClose={() => setWithdrawing(null)}
      />
    </>
  );
}
