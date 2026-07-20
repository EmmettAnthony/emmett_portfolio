"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Plus, X, Edit3, Trash2, Loader2, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: { id: string; name: string } | null;
  views: number;
  published: boolean;
  createdAt: string;
}

interface ArticleForm {
  title: string;
  slug: string;
  content: string;
  published: boolean;
}

const defaultForm: ArticleForm = { title: "", slug: "", content: "", published: true };

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function KnowledgeBasePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ArticleForm, string>>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["support-knowledge-base", search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/support/knowledge-base${params}`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json() as Promise<{ articles: Article[] }>;
    },
  });

  const articles = data?.articles ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<ArticleForm>) => {
      const res = await fetch("/api/support/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-knowledge-base"] });
      toast("success", "Article created");
      closeModal();
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: payload }: { id: string; data: Partial<ArticleForm> }) => {
      const res = await fetch(`/api/support/knowledge-base/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-knowledge-base"] });
      toast("success", "Article updated");
      closeModal();
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/support/knowledge-base/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to delete"); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-knowledge-base"] });
      toast("success", "Article deleted");
      setDeleteId(null);
      setDeleteError("");
    },
    onError: (err: Error) => { setDeleteError(err.message); },
  });

  const updateField = (key: keyof ArticleForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  function openCreate() {
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(article: Article) {
    setEditing(article);
    setForm({ title: article.title, slug: article.slug, content: article.content, published: article.published });
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
    const errors: Partial<Record<keyof ArticleForm, string>> = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.slug.trim()) errors.slug = "Slug is required";
    if (!form.content.trim()) errors.content = "Content is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: Partial<ArticleForm> = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      content: form.content.trim(),
      published: form.published,
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
        <BookOpen className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load articles</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Knowledge Base</h2>
          <p className="text-sm text-zinc-500">{articles.length} total articles</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Article
        </Button>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {search ? "No articles match your search." : "No articles yet. Create your first one!"}
            </p>
            {!search && (
              <Button onClick={openCreate} className="mt-4">
                <Plus className="h-4 w-4" />
                Add Article
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-white truncate">{article.title}</h3>
                    {!article.published && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">Draft</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {article.slug} &middot; {article.views} views
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(article)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setDeleteId(article.id); setDeleteError(""); }} className="hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editing ? "Edit Article" : "Add Article"}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    updateField("title", title);
                    if (!editing) updateField("slug", slugify(title));
                  }}
                  className={cn(formErrors.title && "border-red-400")}
                  placeholder="e.g. How to Reset Your Password"
                />
                {formErrors.title && <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Slug *</label>
                <Input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  className={cn("font-mono", formErrors.slug && "border-red-400")}
                  placeholder="how-to-reset-your-password"
                />
                {formErrors.slug && <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Content *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  rows={12}
                  className={cn(
                    "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                    formErrors.content && "border-red-400"
                  )}
                />
                {formErrors.content && <p className="mt-1 text-xs text-red-500">{formErrors.content}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateField("published", !form.published)}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    form.published
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  )}
                >
                  {form.published ? "Published" : "Draft"}
                </button>
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Article</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this article? This action cannot be undone.
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
