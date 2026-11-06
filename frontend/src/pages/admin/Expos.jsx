import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Eye, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ExpoFormModal from "../../components/expo/ExpoFormModal";
import ExpoStatusSelect from "../../components/expo/ExpoStatusSelect";
import api from "../../api/axios";
import { EXPO_STATUSES } from "../../utils/constants";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const statusOptions = EXPO_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));

export default function AdminExpos() {
  const [expos, setExpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpo, setEditingExpo] = useState(null);
  const [deletingExpo, setDeletingExpo] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadExpos = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      const res = await api.get("/expos", { params });
      setExpos(res.data.expos);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(loadExpos, 300);
    return () => clearTimeout(timer);
  }, [loadExpos]);

  function openCreate() {
    setEditingExpo(null);
    setFormOpen(true);
  }

  function openEdit(expo) {
    setEditingExpo(expo);
    setFormOpen(true);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await api.delete(`/expos/${deletingExpo._id}`);
      toast.success(res.data.message);
      setDeletingExpo(null);
      loadExpos();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = search.trim() || status;

  return (
    <>
      <PageHeader
        title="Expos"
        subtitle="Create and manage your expos and trade shows."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Create Expo
          </Button>
        }
      />

      <Card className="mb-6 p-4!">
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute bottom-3 left-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <Input
              label="Search"
              name="search"
              type="search"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="[&_input]:pl-10"
            />
          </div>
          <Select
            label="Status"
            name="status"
            placeholder="All statuses"
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600">
          <Spinner />
        </div>
      ) : expos.length === 0 ? (
        <Card>
          {hasFilters ? (
            <EmptyState icon={Search} title="No expos found" message="Try a different title or status." />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No expos yet"
              message="Create your first expo to start adding booths and sessions."
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Create Expo
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">Expo</th>
                  <th scope="col" className="px-5 py-3">Dates</th>
                  <th scope="col" className="px-5 py-3">Location</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expos.map((expo) => (
                  <tr key={expo._id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link to={`/admin/expos/${expo._id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                        {expo.title}
                      </Link>
                      {expo.theme && <p className="mt-0.5 text-xs text-slate-500">{expo.theme}</p>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{expo.location}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <Badge status={expo.status} />
                        <ExpoStatusSelect expo={expo} onChanged={loadExpos} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <ExpoActions expo={expo} onEdit={openEdit} onDelete={setDeletingExpo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {expos.map((expo) => (
              <Card key={expo._id} className="p-5!">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/admin/expos/${expo._id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                    {expo.title}
                  </Link>
                  <Badge status={expo.status} />
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {formatDate(expo.startDate)} - {formatDate(expo.endDate)}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {expo.location}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <ExpoStatusSelect expo={expo} onChanged={loadExpos} />
                  <ExpoActions expo={expo} onEdit={openEdit} onDelete={setDeletingExpo} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {formOpen && (
        <ExpoFormModal
          expo={editingExpo}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            loadExpos();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingExpo)}
        title="Delete this expo?"
        message={`"${deletingExpo?.title}" and all its booths, sessions, applications and registrations will be deleted. This cannot be undone.`}
        confirmText="Delete expo"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingExpo(null)}
      />
    </>
  );
}

function ExpoActions({ expo, onEdit, onDelete }) {
  return (
    <div className="flex justify-end gap-1">
      <Button to={`/admin/expos/${expo._id}`} variant="ghost" size="sm" aria-label={`View ${expo.title}`}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onEdit(expo)} aria-label={`Edit ${expo.title}`}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(expo)}
        aria-label={`Delete ${expo.title}`}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
