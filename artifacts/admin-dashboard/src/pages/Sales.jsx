import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ArrowUpDown } from "lucide-react";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardBody } from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import Modal, { Field, Input, Select, Button } from "../components/Modal.jsx";
import { useCurrentUser } from "../hooks/useAuth.js";
import { formatCurrency, formatDate } from "../lib/utils.js";

const STATUSES = ["pending", "paid", "shipped", "refunded", "cancelled"];

export default function Sales() {
  const qc = useQueryClient();
  const { canEditOrders } = useCurrentUser();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    productName: "",
    productCategory: "",
    amount: "",
  });

  const orders = useQuery({
    queryKey: ["orders", { q, status }],
    queryFn: () => api.listOrders({ q, status }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => api.updateOrder(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
  const create = useMutation({
    mutationFn: (data) => api.createOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setOpen(false);
      setForm({
        customerName: "",
        customerEmail: "",
        productName: "",
        productCategory: "",
        amount: "",
      });
    },
  });
  const remove = useMutation({
    mutationFn: (id) => api.deleteOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });

  const sorted = useMemo(() => {
    const data = [...(orders.data || [])];
    data.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va > vb ? 1 : va < vb ? -1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return data;
  }, [orders.data, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function submit(e) {
    e.preventDefault();
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    create.mutate({
      ...form,
      orderNumber,
      amount: Number(form.amount),
      status: "pending",
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Orders"
          subtitle={`${sorted.length} results`}
          action={
            canEditOrders && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="-mt-0.5 mr-1 inline h-4 w-4" /> New order
              </Button>
            )
          }
        />
        <CardBody>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5">
              <Search className="h-4 w-4 text-[var(--color-muted)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search orders..."
                className="w-56 bg-transparent text-sm focus:outline-none"
              />
            </div>
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
                  <Th onClick={() => toggleSort("orderNumber")}>Order #</Th>
                  <Th onClick={() => toggleSort("customerName")}>Customer</Th>
                  <Th onClick={() => toggleSort("productName")}>Product</Th>
                  <Th onClick={() => toggleSort("amount")}>Amount</Th>
                  <Th onClick={() => toggleSort("status")}>Status</Th>
                  <Th onClick={() => toggleSort("createdAt")}>Date</Th>
                  {canEditOrders && <th className="px-3 py-2"></th>}
                </tr>
              </thead>
              <tbody>
                {sorted.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {o.orderNumber}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {o.customerEmail}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div>{o.productName}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {o.productCategory}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {formatCurrency(o.amount)}
                    </td>
                    <td className="px-3 py-2.5">
                      {canEditOrders ? (
                        <select
                          value={o.status}
                          onChange={(e) =>
                            update.mutate({
                              id: o.id,
                              data: { status: e.target.value },
                            })
                          }
                          className="rounded border border-[var(--color-border)] bg-white px-2 py-1 text-xs capitalize"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={o.status}>{o.status}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--color-muted)]">
                      {formatDate(o.createdAt)}
                    </td>
                    {canEditOrders && (
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => {
                            if (confirm("Delete this order?"))
                              remove.mutate(o.id);
                          }}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!sorted.length && !orders.isLoading && (
              <div className="py-12 text-center text-sm text-[var(--color-muted)]">
                No orders found
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={create.isPending}>
              Create order
            </Button>
          </>
        }
      >
        <form onSubmit={submit}>
          <Field label="Customer name">
            <Input
              required
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
            />
          </Field>
          <Field label="Customer email">
            <Input
              type="email"
              required
              value={form.customerEmail}
              onChange={(e) =>
                setForm({ ...form, customerEmail: e.target.value })
              }
            />
          </Field>
          <Field label="Product name">
            <Input
              required
              value={form.productName}
              onChange={(e) =>
                setForm({ ...form, productName: e.target.value })
              }
            />
          </Field>
          <Field label="Product category">
            <Input
              required
              value={form.productCategory}
              onChange={(e) =>
                setForm({ ...form, productCategory: e.target.value })
              }
            />
          </Field>
          <Field label="Amount (USD)">
            <Input
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
        </form>
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
