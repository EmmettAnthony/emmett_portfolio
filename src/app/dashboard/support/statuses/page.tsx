"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Plus, X, Edit3, Trash2, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface Status {
  id: string;
  name: string;
  slug: string;
  color: string;
  order: number;
  active: boolean;
  isDefault: boolean;
}

interface StatusForm {
  name: string;
  slug: string;
  color: string;
  order: number;
  active: boolean;
}

const defaultForm: StatusForm = { name: "", slug: "", color: "#3b82f6", order: 0, active: true };

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function SupportStatusesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Status | null>(null);
  const [form, setForm] = useState<StatusForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StatusForm, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["support-statuses"],
    queryFn: async () => {
      const res = await fetch("/api/support/statuses");
      if (!res.ok) throw new Error("Failed to fetch statuses");
      return res.json() as Promise<{ statuses: Status[] }>;
    },
  });

  const statuses = data?.statuses ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<StatusForm>) => {
      const res = await fetch("/api/support/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-statuses"] });
      toast("success", "Status created");
      closeModal();
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: payload }: { id: string; data: Partial<StatusForm> }) => {
      const res = await fetch(`/api/support/statuses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-statuses"] });
      toast("success", "Status updated");
      closeModal();
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/support/statuses/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to delete"); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-statuses"] });
      toast("success", "Status deleted");
      setDeleteId(null);
      setDeleteError("");
    },
    onError: (err: Error) => { setDeleteError(err.message); },
  });

  const updateField = (key: keyof StatusForm, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(status: Status) {
    setEditing(status);
    setForm({ name: status.name, slug: status.slug, color: status.color, order: status.order, active: status.active });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
  }

  function handleSubmit() {
    const errors: Partial<Record<keyof StatusForm, string>> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.slug.trim()) errors.slug = "Slug is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: Partial<StatusForm> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      color: form.color,
      order: form.order,
      active: form.active,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <CheckCircle2 className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load statuses</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Statuses</h2>
          <p className="text-sm text-zinc-500">{statuses.length} total statuses</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Status
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : statuses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No statuses yet. Create your first one!</p>
            <Button onClick={openCreate} className="mt-4">
              <Plus className="h-4 w-4" />
              Add Status
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Default</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Active</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {statuses.map((status) => (
                  <tr key={status.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">{status.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-500 dark:text-zinc-400">{status.slug}</td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-500">{status.color}</td>
                    <td className="px-4 py-3">
                      {status.isDefault ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Default
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{status.order}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        status.active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      )}>
                        {status.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(status)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleteId(status.id); setDeleteError(""); }} className="hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editing ? "Edit Status" : "Add Status"}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    updateField("name", name);
                    if (!editing) updateField("slug", slugify(name));
                  }}
                  className={cn(formErrors.name && "border-red-400")}
                  placeholder="e.g. In Progress"
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Slug *</label>
                <Input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  className={cn("font-mono", formErrors.slug && "border-red-400")}
                  placeholder="in-progress"
                />
                {formErrors.slug && <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => updateField("color", e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0.5"
                    />
                    <Input
                      value={form.color}
                      onChange={(e) => updateField("color", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Order</label>
                  <Input type="number" min={0} value={form.order} onChange={(e) => updateField("order", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Active</label>
                  <button
                    onClick={() => updateField("active", !form.active)}
                    className={cn(
                      "mt-1 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      form.active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {form.active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setDeleteId(null); setDeleteError(""); }}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Status</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this status? This action cannot be undone.
            </p>
            {deleteError && <p className="mt-2 text-sm text-red-500">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDeleteId(null); setDeleteError(""); }}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
