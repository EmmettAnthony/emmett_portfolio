"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, FolderKanban } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export default function TestimonialCategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["testimonial-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/testimonials/categories");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (d: { name: string; description: string }) => {
      const res = await fetch("/api/admin/testimonials/categories", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["testimonial-categories"] }); closeModal(); toast("success", "Category created"); },
    onError: (err: Error) => { toast("error", err.message); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description: string } }) => {
      const res = await fetch(`/api/admin/testimonials/categories/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["testimonial-categories"] }); closeModal(); toast("success", "Category updated"); },
    onError: (err: Error) => { toast("error", err.message); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/testimonials/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["testimonial-categories"] }); setDeletingId(null); toast("success", "Category deleted"); },
    onError: () => { toast("error", "Failed to delete"); },
  });

  const categories: Category[] = data?.categories || [];

  function closeModal() { setShowModal(false); setEditing(null); setName(""); setDescription(""); }

  function openAdd() { setEditing(null); setName(""); setDescription(""); setShowModal(true); }

  function openEdit(cat: Category) { setEditing(cat); setName(cat.name); setDescription(cat.description || ""); setShowModal(true); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) updateMutation.mutate({ id: editing.id, data: { name: name.trim(), description: description.trim() } });
    else createMutation.mutate({ name: name.trim(), description: description.trim() });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/testimonials"
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Testimonial Categories</h1>
            <p className="text-sm text-zinc-500">Manage categories for testimonials</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <FolderKanban className="mb-2 h-8 w-8" />
            <p>No categories yet</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{cat.name}</p>
                  {cat.description && (
                    <p className="mt-0.5 text-sm text-zinc-500">{cat.description}</p>
                  )}
                  <p className="mt-0.5 text-xs text-zinc-400">/{cat.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(cat)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800 dark:hover:text-muted-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeletingId(cat.id)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {editing ? "Edit Category" : "Add Category"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Name *</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Delete Category</h2>
            <p className="mt-2 text-sm text-zinc-500">Are you sure? This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDeletingId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate(deletingId)} disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
