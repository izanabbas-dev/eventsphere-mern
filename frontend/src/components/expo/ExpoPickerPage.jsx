import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../PageHeader";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Select from "../ui/Select";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import LoadError from "../ui/LoadError";
import api from "../../api/axios";
import { useExpoRoom } from "../../context/useSocket";
import { getErrorMessage } from "../../utils/helpers";

export default function ExpoPickerPage({ title, subtitle, emptyMessage, basePath = "/admin", hideStatuses = [], children }) {
  const [allExpos, setAllExpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    api
      .get("/expos")
      .then((res) => {
        setAllExpos(res.data.expos);
        setFailed(false);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  function retry() {
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  const expos = allExpos.filter((expo) => !hideStatuses.includes(expo.status));

  const selectedId = searchParams.get("expo") || expos[0]?._id || "";
  const selectedExpo = expos.find((expo) => expo._id === selectedId);

  useExpoRoom(selectedExpo ? selectedId : null);

  if (loading) return <Spinner fullPage />;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      {failed ? (
        <LoadError onRetry={retry} />
      ) : expos.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="No expos yet"
            message={emptyMessage}
            action={<Button to={`${basePath}/expos`}>Go to expos</Button>}
          />
        </Card>
      ) : (
        <>
          <Card className="mb-6 p-4!">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Select
                label="Expo"
                name="expo"
                options={expos.map((expo) => ({ value: expo._id, label: expo.title }))}
                value={selectedId}
                onChange={(e) => setSearchParams({ expo: e.target.value })}
                className="flex-1 sm:max-w-md"
              />
              {selectedExpo && (
                <div className="flex items-center gap-3">
                  <Badge status={selectedExpo.status} />
                  <Button to={`${basePath}/expos/${selectedExpo._id}`} variant="secondary" size="sm">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open expo
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {selectedExpo ? (
            <div key={selectedId}>{children(selectedExpo)}</div>
          ) : (
            <Card>
              <EmptyState title="Expo not found" message="Please choose an expo from the list." />
            </Card>
          )}
        </>
      )}
    </>
  );
}
