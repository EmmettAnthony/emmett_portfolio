"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Plus, Pencil, Trash2, Globe, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LegalPagesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ slug: "", title: "", content: "", lastUpdated: "", published: true });
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-legal"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/legal");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ pages: LegalPage[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ slug, data }: { slug: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/dashboard/legal/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-legal"] });
      toast("success", "Legal page saved");
      setEditingSlug(null);
    },
    onError: () => toast("error", "Failed to save"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/dashboard/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-legal"] });
      toast("success", "Legal page created");
      setIsCreating(false);
      setEditForm({ slug: "", title: "", content: "", lastUpdated: "", published: true });
    },
    onError: () => toast("error", "Failed to create"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await fetch(`/api/dashboard/legal/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-legal"] });
      toast("success", "Legal page deleted");
    },
    onError: () => toast("error", "Failed to delete"),
  });

  const pages = data?.pages ?? [];

  const startEdit = (page: LegalPage) => {
    setEditingSlug(page.slug);
    setEditForm({
      slug: page.slug,
      title: page.title,
      content: page.content,
      lastUpdated: page.lastUpdated?.split("T")[0] ?? "",
      published: page.published,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Legal Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">Manage cookies, privacy, terms, and other legal pages</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingSlug(null); setEditForm({ slug: "", title: "", content: "", lastUpdated: "", published: true }); }}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" /> New Page
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Create New Legal Page</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Slug</label>
                <input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" placeholder="cookies" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" placeholder="Cookies Policy" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Content (HTML)</label>
              <textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} rows={15}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input type="checkbox" checked={editForm.published} onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })} />
                Published
              </label>
              <div className="flex gap-2">
                <button onClick={() => setIsCreating(false)} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">Cancel</button>
                <button onClick={() => createMutation.mutate(editForm)} disabled={createMutation.isPending || !editForm.slug || !editForm.title}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pages List */}
      {pages.length === 0 && !isCreating ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Globe className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">No legal pages yet</h3>
          <p className="mt-1 text-sm text-zinc-500">Create your first legal page to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => (
            <div key={page.id} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              {editingSlug === page.slug ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Slug</label>
                      <input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
                      <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Content (HTML)</label>
                    <textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} rows={15}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <input type="checkbox" checked={editForm.published} onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })} />
                      Published
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingSlug(null)} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
                        <X className="h-4 w-4" />
                      </button>
                      <button onClick={() => saveMutation.mutate({ slug: page.slug, data: editForm })} disabled={saveMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900">
                        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Globe className="mt-0.5 h-5 w-5 text-zinc-400" />
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">{page.title}</h3>
                      <p className="text-sm text-zinc-500">/{page.slug}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                        <span>{page.published ? <span className="text-emerald-600">Published</span> : <span className="text-zinc-400">Draft</span>}</span>
                        {page.lastUpdated && <span>Updated: {new Date(page.lastUpdated).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(page)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => { if (confirm("Delete this legal page?")) deleteMutation.mutate(page.slug); }}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
