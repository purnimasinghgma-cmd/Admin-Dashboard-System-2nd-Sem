import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, ArrowUpDown, AlertTriangle } from "lucide-react";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardBody } from "../components/Card.jsx";
import Modal, { Field, Input, Select, Button } from "../components/Modal.jsx";
import { useCurrentUser } from "../hooks/useAuth.js";
import { formatCurrency } from "../lib/utils.js";

export default function Products() {
  const qc = useQueryClient();
  const { canEditProducts, isAdmin } = useCurrentUser();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const empty = { name: "", sku: "", category: "", price: "", stock: "" };
  const [form, setForm] = useState(empty);

  const products = useQuery({
    queryKey: ["products", { q, category }],
    queryFn: () => api.listProducts({ q, category }),
  });

  const categories = useMemo(
    () => [...new Set((products.data || []).map((p) => p.category))],
    [products.data],
  );

  const create = useMutation({
    mutationFn: (data) => api.createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setForm(empty);
    },
  });
  const update = useMutation({
    mutationFn: ({ id, data }) => api.updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id) => api.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const sorted = useMemo(() => {
    const data = [...(products.data || [])];
    data.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = va > vb ? 1 : va < vb ? -1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return data;
  }, [products.data, sortKey, sortDir]);

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
          title="Products"
          subtitle={`${sorted.length} results`}
          action={
            canEditProducts && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="-mt-0.5 mr-1 inline h-4 w-4" /> Add product
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
                placeholder="Search products..."
                className="w-56 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  <Th onClick={() => toggleSort("name")}>Name</Th>
                  <Th onClick={() => toggleSort("sku")}>SKU</Th>
                  <Th onClick={() => toggleSort("category")}>Category</Th>
                  <Th onClick={() => toggleSort("price")}>Price</Th>
                  <Th onClick={() => toggleSort("stock")}>Stock</Th>
                  {canEditProducts && (
                    <th className="px-3 py-2 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-3 py-2.5 font-medium">{p.name}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{p.sku}</td>
                    <td className="px-3 py-2.5 text-[var(--color-muted)]">
                      {p.category}
                    </td>
                    <td className="px-3 py-2.5">{formatCurrency(p.price)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          p.stock < 5 ? "text-amber-700" : ""
                        }`}
                      >
                        {p.stock < 5 && (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        {p.stock}
                      </span>
                    </td>
                    {canEditProducts && (
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => setEditing(p)}
                          className="text-xs text-[var(--color-brand)] hover:underline"
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <>
                            <span className="mx-2 text-[var(--color-border)]">
                              |
                            </span>
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${p.name}?`))
                                  remove.mutate(p.id);
                              }}
                              className="text-xs text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!sorted.length && !products.isLoading && (
              <div className="py-12 text-center text-sm text-[var(--color-muted)]">
                No products found
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add product"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={create.isPending}
              onClick={() =>
                create.mutate({
                  ...form,
                  price: Number(form.price),
                  stock: Number(form.stock || 0),
                })
              }
            >
              Create
            </Button>
          </>
        }
      >
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="SKU">
          <Input
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </Field>
        <Field label="Price (USD)">
          <Input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </Field>
        <Field label="Stock">
          <Input
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
        </Field>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit product"
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
                    sku: editing.sku,
                    category: editing.category,
                    price: Number(editing.price),
                    stock: Number(editing.stock),
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
            <Field label="SKU">
              <Input
                value={editing.sku}
                onChange={(e) =>
                  setEditing({ ...editing, sku: e.target.value })
                }
              />
            </Field>
            <Field label="Category">
              <Input
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              />
            </Field>
            <Field label="Price">
              <Input
                type="number"
                step="0.01"
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: e.target.value })
                }
              />
            </Field>
            <Field label="Stock">
              <Input
                type="number"
                value={editing.stock}
                onChange={(e) =>
                  setEditing({ ...editing, stock: e.target.value })
                }
              />
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
