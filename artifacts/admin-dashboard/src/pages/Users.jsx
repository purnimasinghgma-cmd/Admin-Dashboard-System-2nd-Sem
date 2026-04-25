import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ArrowUpDown } from "lucide-react";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardBody } from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import Modal, { Field, Input, Select, Button } from "../components/Modal.jsx";
import { useCurrentUser } from "../hooks/useAuth.js";
import { formatDate } from "../lib/utils.js";

const ROLES = ["admin", "manager", "user"];
const STATUSES = ["active", "invited", "suspended"];

export default function Users() {
  const qc = useQueryClient();
  const { canManageUsers } = useCurrentUser();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "user",
    status: "invited",
  });

  if (!canManageUsers) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-12 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Only admins can manage users. Switch role to admin in the top bar.
        </p>
      </div>
    );
  }

  const users = useQuery({
    queryKey: ["users", { q, role, status }],
    queryFn: () => api.listUsers({ q, role, status }),
  });

  const create = useMutation({
    mutationFn: (data) => api.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setForm({ name: "", email: "", role: "user", status: "invited" });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, data }) => api.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id) => api.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const sorted = useMemo(() => {
    const data = [...(users.data || [])];
    data.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va > vb ? 1 : va < vb ? -1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return data;
  }, [users.data, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Users"
          subtitle={`${sorted.length} results`}
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="-mt-0.5 mr-1 inline h-4 w-4" /> Invite user
            </Button>
          }
        />
        <CardBody>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5">
              <Search className="h-4 w-4 text-[var(--color-muted)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users..."
                className="w-56 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  <Th onClick={() => toggleSort("name")}>Name</Th>
                  <Th onClick={() => toggleSort("email")}>Email</Th>
                  <Th onClick={() => toggleSort("role")}>Role</Th>
                  <Th onClick={() => toggleSort("status")}>Status</Th>
                  <Th onClick={() => toggleSort("createdAt")}>Joined</Th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl && (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="h-8 w-8 rounded-full bg-white"
                          />
                        )}
                        <div className="font-medium">{u.name}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--color-muted)]">
                      {u.email}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={u.role}>{u.role}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={u.status}>{u.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--color-muted)]">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => setEditing(u)}
                        className="text-xs text-[var(--color-brand)] hover:underline"
                      >
                        Edit
                      </button>
                      <span className="mx-2 text-[var(--color-border)]">|</span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${u.name}?`)) remove.mutate(u.id);
                        }}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!sorted.length && !users.isLoading && (
              <div className="py-12 text-center text-sm text-[var(--color-muted)]">
                No users found
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite user"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={create.isPending}
              onClick={(e) => {
                e.preventDefault();
                const seed = encodeURIComponent(form.name || "user");
                create.mutate({
                  ...form,
                  avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=transparent`,
                });
              }}
            >
              Send invite
            </Button>
          </>
        }
      >
        <Field label="Name">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Role">
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit user"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  id: editing.id,
                  data: {
                    name: editing.name,
                    email: editing.email,
                    role: editing.role,
                    status: editing.status,
                  },
                })
              }
            >
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <>
            <Field label="Name">
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>
            <Field label="Email">
              <Input
                value={editing.email}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </Field>
            <Field label="Role">
              <Select
                value={editing.role}
                onChange={(e) =>
                  setEditing({ ...editing, role: e.target.value })
                }
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}
      </Modal>
    </div>
  );
}

function Th({ onClick, children }) {
  return (
    <th
      onClick={onClick}
      className="cursor-pointer select-none px-3 py-2 hover:text-[var(--color-text)]"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </span>
    </th>
  );
}
