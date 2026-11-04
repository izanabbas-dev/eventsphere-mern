import { useEffect, useState } from "react";
import { Search, UserCheck, UserX, Users } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import RoleBadge from "../../components/ui/RoleBadge";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import api from "../../api/axios";
import useAuth from "../../context/useAuth";
import { USER_ROLES } from "../../utils/constants";
import { formatDate, getErrorMessage, getInitials } from "../../utils/helpers";

const roleOptions = USER_ROLES.map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }));

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");

  const [changingUser, setChangingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  // The backend filters by role, the search is done here
  useEffect(() => {
    api
      .get("/admin/users", { params: role ? { role } : {} })
      .then((res) => setUsers(res.data.users))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [role]);

  async function handleToggle() {
    setSaving(true);
    try {
      const res = await api.patch(`/admin/users/${changingUser._id}/status`, { isActive: !changingUser.isActive });
      toast.success(res.data.message);
      setUsers(users.map((u) => (u._id === res.data.user._id ? res.data.user : u)));
      setChangingUser(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const text = search.trim().toLowerCase();
  const shownUsers = users.filter(
    (u) => u.name.toLowerCase().includes(text) || u.email.toLowerCase().includes(text)
  );
  const disabling = changingUser?.isActive;

  return (
    <>
      <PageHeader title="Users" subtitle="See all users and activate or disable their accounts." />

      <Card className="mb-6 p-4!">
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute bottom-3 left-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <Input
              label="Search"
              name="search"
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="[&_input]:pl-10"
            />
          </div>
          <Select
            label="Role"
            name="role"
            placeholder="All roles"
            options={roleOptions}
            value={role}
            onChange={(e) => {
              setLoading(true);
              setRole(e.target.value);
            }}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600">
          <Spinner />
        </div>
      ) : shownUsers.length === 0 ? (
        <Card>
          <EmptyState
            icon={text ? Search : Users}
            title="No users found"
            message={text || role ? "Try a different name, email or role." : "No one has signed up yet."}
          />
        </Card>
      ) : (
        <>
          {/* Table on tablet and desktop */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">User</th>
                  <th scope="col" className="px-5 py-3">Role</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">Joined</th>
                  <th scope="col" className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shownUsers.map((u) => (
                  <tr key={u._id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <UserInfo user={u} isMe={u._id === me._id} />
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge active={u.isActive} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <ToggleButton user={u} isMe={u._id === me._id} onClick={() => setChangingUser(u)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards on mobile */}
          <div className="space-y-4 md:hidden">
            {shownUsers.map((u) => (
              <Card key={u._id} className="p-5!">
                <UserInfo user={u} isMe={u._id === me._id} />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <RoleBadge role={u.role} />
                  <StatusBadge active={u.isActive} />
                  <span className="text-xs text-slate-500">Joined {formatDate(u.createdAt)}</span>
                </div>
                {u._id !== me._id && (
                  <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                    <ToggleButton user={u} isMe={false} onClick={() => setChangingUser(u)} />
                  </div>
                )}
              </Card>
            ))}
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Showing {shownUsers.length} of {users.length} users
          </p>
        </>
      )}

      <ConfirmDialog
        open={Boolean(changingUser)}
        title={disabling ? "Disable this user?" : "Activate this user?"}
        message={
          disabling
            ? `${changingUser?.name} will be logged out and will not be able to log in until you activate the account again.`
            : `${changingUser?.name} will be able to log in again.`
        }
        confirmText={disabling ? "Disable user" : "Activate user"}
        variant={disabling ? "danger" : "primary"}
        loading={saving}
        onConfirm={handleToggle}
        onClose={() => setChangingUser(null)}
      />
    </>
  );
}

function UserInfo({ user, isMe }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        {getInitials(user.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">
          {user.name} {isMe && <span className="text-xs font-medium text-slate-500">(You)</span>}
        </p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
    </div>
  );
}

function StatusBadge({ active }) {
  return <Badge color={active ? "green" : "red"}>{active ? "Active" : "Disabled"}</Badge>;
}

function ToggleButton({ user, isMe, onClick }) {
  // The admin cannot disable their own account
  if (isMe) return <span className="text-xs text-slate-400">-</span>;

  return user.isActive ? (
    <Button variant="ghost" size="sm" onClick={onClick} className="text-red-600 hover:bg-red-50 hover:text-red-700">
      <UserX className="h-4 w-4" aria-hidden="true" /> Disable
    </Button>
  ) : (
    <Button variant="ghost" size="sm" onClick={onClick} className="text-green-700 hover:bg-green-50 hover:text-green-800">
      <UserCheck className="h-4 w-4" aria-hidden="true" /> Activate
    </Button>
  );
}
