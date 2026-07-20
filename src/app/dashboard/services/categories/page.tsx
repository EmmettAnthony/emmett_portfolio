"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, X, Edit3, Trash2, ArrowLeft, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import { createServiceCategorySchema } from "@/lib/validations/services";
import type { ServiceCategory } from "@/types/services";

interface CategoriesResponse {
  categories: (ServiceCategory & { _count?: { services: number } })[];
}

export default function CategoriesPage() {

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "", image: "", order: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery<CategoriesResponse>({
    queryKey: ["dashboard-service-categories"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/services/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const categories = data?.categories ?? [];

  const createMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch("/api/dashboard/services/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service-categories"] });
      toast("success", "Category created");
      closeModal();
    },
    onError: () => toast("error", "Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await fetch(`/api/dashboard/services/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service-categories"] });
      toast("success", "Category updated");
      closeModal();
    },
    onError: () => toast("error", "Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/services/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete category");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service-categories"] });
      toast("success", "Category deleted");
      setDeleteId(null);
      setDeleteError("");
    },
    onError: (err) => {
      setDeleteError(err.message);
    },
  });

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: "", slug: "", description: "", icon: "", image: "", order: 0 });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "", icon: cat.icon ?? "", image: cat.image ?? "", order: cat.order });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setErrors({});
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      description: form.description || null,
      icon: form.icon || null,
      image: form.image || null,
    };
    const result = createServiceCategorySchema.safeParse(editingCategory ? { ...payload, order: form.order } : payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: result.data });
    } else {
      createMutation.mutate(result.data);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Layers className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load categories</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Categories</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{categories.length} total categories</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No categories yet"
          description="Create your first service category to organize your services."
          action={{ label: "Add Category", onClick: openCreate }}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Services</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Order</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {categories.map((cat) => (
                  <tr key={cat.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {cat.icon && <span className="text-lg">{cat.icon}</span>}
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-zinc-500 dark:text-zinc-400">{cat.slug}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{cat._count?.services ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{cat.order}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(cat)} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setDeleteId(cat.id); setDeleteError(""); }}
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: editingCategory ? p.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))}
                  className={cn("w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white", errors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700")}
                  placeholder="e.g. Web Development"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  className={cn("w-full rounded-xl border px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white", errors.slug ? "border-red-400" : "border-zinc-300 dark:border-zinc-700")}
                  placeholder="web-development"
                />
                {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Icon</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="e.g. 🚀"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Image URL</label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
              {editingCategory && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCategory ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Category</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
            {deleteError && (
              <p className="mt-2 text-sm text-red-500">{deleteError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setDeleteId(null); setDeleteError(""); }} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
