import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Map as MapIcon, Plus, Store, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import TagInput from "../../components/ui/TagInput";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import LoadError from "../../components/ui/LoadError";
import api from "../../api/axios";
import { fetchMyBooths } from "../../api/exhibitorApi";
import useAuth from "../../context/useAuth";
import { CURRENCY } from "../../utils/constants";
import { formatDate, getErrorMessage } from "../../utils/helpers";

export default function MyBooth() {
  const { user } = useAuth();
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadBooths = useCallback(() => {
    fetchMyBooths(user._id)
      .then((list) => {
        setBooths(list);
        setFailed(false);
      })
      .catch((error) => {
        toast.error(getErrorMessage(error));
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, [user._id]);

  useEffect(() => {
    loadBooths();
  }, [loadBooths]);

  function retry() {
    setLoading(true);
    loadBooths();
  }

  return (
    <>
      <PageHeader title="My Booth" subtitle="Your reserved and booked booths, with products and staff." />

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600">
          <Spinner />
        </div>
      ) : failed ? (
        <LoadError onRetry={retry} />
      ) : booths.length === 0 ? (
        <Card>
          <EmptyState
            icon={Store}
            title="No booth yet"
            message="Reserve a booth on an expo floor plan, or wait for the organizer to assign one after approval."
            action={<Button to="/exhibitor/expos">Browse expos</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {booths.map((booth) => (
            <BoothCard key={booth._id} booth={booth} />
          ))}
        </div>
      )}
    </>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900 capitalize">{children}</dd>
    </div>
  );
}

function BoothCard({ booth }) {
  const { expo } = booth;

  return (
    <Card className="p-0!">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Booth {booth.boothNumber}</h2>
            <Badge status={booth.status} />
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {expo.title} · {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
          </p>
        </div>
        <Button to={`/exhibitor/expos/${expo._id}`} variant="secondary" size="sm" className="self-start sm:self-auto">
          <MapIcon className="h-4 w-4" aria-hidden="true" /> View on floor plan
        </Button>
      </div>

      <div className="space-y-6 p-5">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Detail label="Hall">{booth.hall || "-"}</Detail>
          <Detail label="Size">{booth.size}</Detail>
          <Detail label="Price">
            {CURRENCY} {Number(booth.price || 0).toLocaleString()}
          </Detail>
          <Detail label="Position">
            Row {booth.position.row + 1}, Col {booth.position.col + 1}
          </Detail>
        </dl>

        {booth.status === "reserved" && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This booth is reserved for you. The organizer will confirm the booking.
          </p>
        )}

        <ProductsForm booth={booth} />
        <StaffForm boothId={booth._id} initialStaff={booth.staff} />
      </div>
    </Card>
  );
}

function ProductsForm({ booth }) {
  const [products, setProducts] = useState(booth.productsShowcased || []);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await api.put(`/booths/${booth._id}/details`, { productsShowcased: products });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border-t border-slate-100 pt-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Products showcased</h3>
      <TagInput
        name={`products-${booth._id}`}
        tags={products}
        onChange={setProducts}
        placeholder="e.g. Solar panel, then press Enter"
      />
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={save} loading={saving}>
          Save products
        </Button>
      </div>
    </section>
  );
}

const emptyMember = { name: "", role: "", phone: "" };

function toStaffRows(staff = []) {
  return staff.map((m) => ({ name: m.name || "", role: m.role || "", phone: m.phone || "" }));
}

function StaffForm({ boothId, initialStaff }) {
  const [staff, setStaff] = useState(() => toStaffRows(initialStaff));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateMember(index, field, value) {
    setStaff((prev) => prev.map((member, i) => (i === index ? { ...member, [field]: value } : member)));
    setError("");
  }

  async function save() {
    const list = staff.map((m) => ({ name: m.name.trim(), role: m.role.trim(), phone: m.phone.trim() }));
    if (list.some((m) => !m.name)) {
      setError("Every staff member needs a name");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/booths/${boothId}/details`, { staff: list });
      toast.success(res.data.message);
      setStaff(toStaffRows(res.data.booth.staff));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border-t border-slate-100 pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Booth staff</h3>
        <Button variant="ghost" size="sm" onClick={() => setStaff((prev) => [...prev, { ...emptyMember }])}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add member
        </Button>
      </div>
      <p className="mb-3 text-sm text-slate-500">
        Only you and the organizer can see your staff details.
      </p>

      {staff.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
          No staff added. Click "Add member".
        </p>
      ) : (
        <ul className="space-y-3">
          {staff.map((member, index) => (
            <li
              key={index}
              className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
            >
              <Input
                label="Name"
                name={`staff-${boothId}-${index}-name`}
                required
                value={member.name}
                onChange={(e) => updateMember(index, "name", e.target.value)}
              />
              <Input
                label="Role / designation"
                name={`staff-${boothId}-${index}-role`}
                value={member.role}
                onChange={(e) => updateMember(index, "role", e.target.value)}
              />
              <Input
                label="Phone"
                name={`staff-${boothId}-${index}-phone`}
                type="tel"
                value={member.phone}
                onChange={(e) => updateMember(index, "phone", e.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                className="justify-self-end text-red-600! hover:bg-red-50!"
                aria-label={`Remove staff member ${index + 1}`}
                onClick={() => setStaff((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={save} loading={saving}>
          Save staff
        </Button>
      </div>
    </section>
  );
}
