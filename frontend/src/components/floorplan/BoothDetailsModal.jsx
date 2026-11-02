import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Select from "../ui/Select";
import ConfirmDialog from "../ui/ConfirmDialog";
import Spinner from "../ui/Spinner";
import api from "../../api/axios";
import { CURRENCY } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900 capitalize">{children}</dd>
    </div>
  );
}

// Booth info and admin actions: edit, delete, assign, unassign
export default function BoothDetailsModal({ booth, booths, expoId, onClose, onEdit, onChanged }) {
  const [exhibitors, setExhibitors] = useState([]);
  const [loadingExhibitors, setLoadingExhibitors] = useState(booth.status === "available");
  const [exhibitorId, setExhibitorId] = useState("");
  const [working, setWorking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAvailable = booth.status === "available";
  const exhibitorName = booth.companyName || booth.exhibitor?.name;

  // Approved exhibitors of this expo who do not hold a booth yet
  useEffect(() => {
    if (!isAvailable) return;

    api
      .get(`/expos/${expoId}/applications`, { params: { status: "approved" } })
      .then((res) => {
        const takenIds = booths.filter((b) => b.exhibitor).map((b) => b.exhibitor._id);
        const list = res.data.applications
          .filter((app) => !takenIds.includes(app.exhibitor._id))
          .map((app) => ({
            value: app.exhibitor._id,
            label: app.profile?.companyName ? `${app.profile.companyName} (${app.exhibitor.name})` : app.exhibitor.name,
          }));
        setExhibitors(list);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoadingExhibitors(false));
  }, [isAvailable, expoId, booths]);

  // Runs one booth action and reloads the floor plan. Returns true if it worked.
  async function runAction(request) {
    setWorking(true);
    try {
      const res = await request();
      toast.success(res.data.message);
      onChanged();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      setWorking(false);
    }
  }

  function handleAssign(id) {
    if (!id) {
      toast.error("Please choose an exhibitor");
      return;
    }
    runAction(() => api.patch(`/booths/${booth._id}/assign`, { exhibitorId: id }));
  }

  async function handleDelete() {
    const deleted = await runAction(() => api.delete(`/booths/${booth._id}`));
    setConfirmDelete(false);
    if (deleted) onClose();
  }

  return (
    <>
      <Modal
        open={!confirmDelete}
        onClose={onClose}
        title={`Booth ${booth.boothNumber}`}
        footer={
          <>
            <Button
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              disabled={booth.status === "booked" || working}
              title={booth.status === "booked" ? "A booked booth cannot be deleted" : undefined}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
            </Button>
            <Button variant="secondary" onClick={onEdit} disabled={working}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
            </Button>
          </>
        }
      >
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Detail label="Status">
            <Badge status={booth.status} />
          </Detail>
          <Detail label="Hall">{booth.hall || "-"}</Detail>
          <Detail label="Size">{booth.size}</Detail>
          <Detail label="Price">
            {CURRENCY} {booth.price.toLocaleString()}
          </Detail>
          <Detail label="Position">
            Row {booth.position.row + 1}, Col {booth.position.col + 1}
          </Detail>
        </dl>

        {booth.status === "booked" && (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            A booked booth cannot be deleted. Unassign it first.
          </p>
        )}

        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-900">Exhibitor</h3>

          {isAvailable ? (
            <div className="mt-3">
              {loadingExhibitors ? (
                <div className="text-indigo-600">
                  <Spinner size="sm" />
                </div>
              ) : exhibitors.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No approved exhibitors without a booth. Approve applications first.
                </p>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Select
                    label="Assign to exhibitor"
                    name="exhibitorId"
                    placeholder="Choose an exhibitor"
                    options={exhibitors}
                    value={exhibitorId}
                    onChange={(e) => setExhibitorId(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={() => handleAssign(exhibitorId)} loading={working}>
                    Assign
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">{exhibitorName || "Unknown exhibitor"}</span>
                {booth.status === "reserved" && <span className="text-slate-500"> has reserved this booth.</span>}
              </p>

              <div className="flex flex-wrap gap-3">
                {booth.status === "reserved" && (
                  <Button size="sm" onClick={() => handleAssign(booth.exhibitor._id)} loading={working}>
                    Confirm booking
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => runAction(() => api.patch(`/booths/${booth._id}/unassign`))}
                  disabled={working}
                >
                  Unassign
                </Button>
              </div>

              <div>
                <h4 className="text-xs font-medium tracking-wide text-slate-500 uppercase">Products showcased</h4>
                {booth.productsShowcased?.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {booth.productsShowcased.map((product) => (
                      <Badge key={product} color="gray">
                        {product}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">Not added yet.</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-medium tracking-wide text-slate-500 uppercase">Staff</h4>
                {booth.staff?.length > 0 ? (
                  <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {booth.staff.map((member, index) => (
                      <li key={index} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-900">
                          {member.name}
                          {member.role && <span className="font-normal text-slate-500"> - {member.role}</span>}
                        </span>
                        {member.phone && <span className="text-slate-500">{member.phone}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">Not added yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete booth ${booth.boothNumber}?`}
        message="This booth will be removed from the floor plan."
        confirmText="Delete booth"
        loading={working}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
