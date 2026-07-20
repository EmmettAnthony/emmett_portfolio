"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  FileText,
  Edit3,
  Trash2,
  X,
  Layout,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import { createTemplateSchema } from "@/lib/validations/newsletter";
import type { Template, TemplateCategory } from "@/types/newsletter";

const categoryLabels: Record<string, string> = {
  company_newsletter: "Company Newsletter",
  product_update: "Product Update",
  blog_digest: "Blog Digest",
  announcement: "Announcement",
  promotion: "Promotion",
  event: "Event",
  custom: "Custom",
};

const categoryColors: Record<string, string> = {
  company_newsletter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  product_update: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  blog_digest: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  announcement: "bg-badge-warning-bg text-badge-warning-text",
  promotion: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  event: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  custom: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground",
};

const categories: (TemplateCategory | "all")[] = [
  "all",
  "company_newsletter",
  "product_update",
  "blog_digest",
  "announcement",
  "promotion",
  "event",
  "custom",
];

interface TemplateForm {
  name: string;
  description: string;
  category: string;
  content: string;
}

const defaultForm: TemplateForm = { name: "", description: "", category: "", content: "" };

export default function TemplatesPage() {

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery<Template[]>({
    queryKey: ["newsletter-templates", search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ search });
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/newsletter/templates?${params}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch("/api/newsletter/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-templates"] });
      toast("success", editId ? "Template updated" : "Template created");
      closeModal();
    },
    onError: () => toast("error", "Failed to save template"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-templates"] });
      toast("success", "Template deleted");
    },
    onError: () => toast("error", "Failed to delete template"),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (template: Template) => {
    setEditId(template.id);
    setForm({
      name: template.name,
      description: template.description ?? "",
      category: template.category ?? "",
      content: template.content,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(defaultForm);
    setErrors({});
    setShowPreview(false);
  };

  const openPreview = (content: string, name: string) => {
    setPreviewContent(content);
    setPreviewName(name);
    setShowPreview(true);
  };

  const handleSubmit = () => {
    const result = createTemplateSchema.safeParse({
      ...form,
      category: form.category || null,
      description: form.description || null,
    });
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
    createMutation.mutate(result.data);
  };

  const templates = Array.isArray(data) ? data : [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <FileText className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load templates</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Templates</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {templates.length} templates
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Search + Category Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                categoryFilter === cat
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-300 text-muted-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {cat === "all" ? "All" : categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={Layout}
          title="No templates found"
          description={search || categoryFilter !== "all" ? "Try adjusting your search or filters." : "Create your first template to get started."}
        />
      ) : (
        /* Template Grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                    <h3 className="text-sm font-semibold text-zinc-900 truncate dark:text-white">
                      {template.name}
                    </h3>
                  </div>
                  {template.category && (
                    <span className={cn(
                      "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      categoryColors[template.category] ?? categoryColors.custom
                    )}>
                      {categoryLabels[template.category] ?? template.category}
                    </span>
                  )}
                  {template.description && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <p className="text-xs text-zinc-400">
                  {new Date(template.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openPreview(template.content, template.name)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/newsletter/campaigns/new?templateId=${template.id}`)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => openEdit(template)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this template?")) deleteMutation.mutate(template.id);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editId ? "Edit Template" : "Create Template"}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    errors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="Template name"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="">No category</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Content</label>
                  {form.content && (
                    <button
                      onClick={() => openPreview(form.content, form.name || "Preview")}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </button>
                  )}
                </div>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={12}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="<html>...</html>"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{previewName}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {previewContent ? (
                <div className="mx-auto max-w-[600px] rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-zinc-400">No content to preview</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
