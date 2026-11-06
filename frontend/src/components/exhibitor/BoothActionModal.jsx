import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
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

export default function BoothActionModal({
  booth,
  isMine,
  hasBooth,
  canReserve,
  canSelect,
  isSelected,
  selectionFull,
  onToggleSelect,
  onClose,
  onChanged,
}) {
  const [working, setWorking] = useState(false);
  const isAvailable = booth.status === "available";

  async function runAction(request) {
    setWorking(true);
    try {
      const res = await request();
      toast.success(res.data.message);
      onChanged();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setWorking(false);
    }
  }

  const reserve = () => runAction(() => api.post(`/booths/${booth._id}/reserve`));
  const cancel = () => runAction(() => api.delete(`/booths/${booth._id}/reserve`));

  return (
    <Modal
      open
      onClose={onClose}
      title={`Booth ${booth.boothNumber}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={working}>
            Close
          </Button>
          {canSelect && isAvailable && (
            <Button
              variant="secondary"
              disabled={!isSelected && selectionFull}
              onClick={() => {
                onToggleSelect(booth._id);
                onClose();
              }}
            >
              {isSelected ? "Remove from preferred" : "Add to preferred"}
            </Button>
          )}
          {canReserve && isAvailable && (
            <Button onClick={reserve} loading={working}>
              Reserve this booth
            </Button>
          )}
          {isMine && booth.status === "reserved" && (
            <Button variant="danger" onClick={cancel} loading={working}>
              Cancel reservation
            </Button>
          )}
          {isMine && booth.status === "booked" && <Button to="/exhibitor/booth">Manage my booth</Button>}
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-4">
        <Detail label="Status">
          <Badge status={booth.status} />
        </Detail>
        <Detail label="Hall">{booth.hall || "-"}</Detail>
        <Detail label="Size">{booth.size}</Detail>
        <Detail label="Price">
          {CURRENCY} {Number(booth.price || 0).toLocaleString()}
        </Detail>
        <Detail label="Position">
          Row {booth.position.row + 1}, Col {booth.position.col + 1}
        </Detail>
        <Detail label="Exhibitor">{isMine ? "You" : booth.companyName || "-"}</Detail>
      </dl>

      {canSelect && isAvailable && !isSelected && selectionFull && (
        <p className="mt-4 text-sm text-amber-700">You can pick up to 3 preferred booths.</p>
      )}
      {hasBooth && isAvailable && !isMine && (
        <p className="mt-4 text-sm text-slate-500">You already hold a booth in this expo, so you cannot reserve another.</p>
      )}
      {isMine && booth.status === "reserved" && (
        <p className="mt-4 text-sm text-slate-500">This booth is reserved for you. The organizer will confirm the booking.</p>
      )}
    </Modal>
  );
}
