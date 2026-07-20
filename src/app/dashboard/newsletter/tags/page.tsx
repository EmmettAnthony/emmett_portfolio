"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Tag,
  Edit3,
  Trash2,
  Palette,
  Hash,
  FileText,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";

const PRESET_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

interface TagItem {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function TagsPage() {

  const { toast } = useToast();
  const [tags, setTags] = useState<TagItem[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", color: "#3b82f6", description: "" });

  const resetForm = () => {
    setForm({ name: "", slug: "", color: "#3b82f6", description: "" });
    setEditingTag(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (tag: TagItem) => {
    setForm({ name: tag.name, slug: tag.slug, color: tag.color, description: tag.description });
    setEditingTag(tag);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast("error", "Tag name is required");
      return;
    }
    if (!form.slug.trim()) {
      toast("error", "Tag slug is required");
      return;
    }

    if (editingTag) {
      setTags((prev) =>
        prev.map((t) =>
          t.id === editingTag.id
            ? { ...t, name: form.name.trim(), slug: form.slug.trim(), color: form.color, description: form.description.trim() }
            : t
        )
      );
      toast("success", "Tag updated");
    } else {
      const newTag: TagItem = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        slug: form.slug.trim(),
        color: form.color,
        description: form.description.trim(),
      };
      setTags((prev) => [...prev, newTag]);
      toast("success", "Tag created");
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    setTags((prev) => prev.filter((t) => t.id !== id));
    toast("success", "Tag deleted");
  };

  const hasSlugConflict = editingTag
    ? tags.some((t) => t.slug === form.slug && t.id !== editingTag.id)
    : tags.some((t) => t.slug === form.slug);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Tags</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {tags.length} tag{tags.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
          Create Tag
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : tags.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No tags created"
          description="Create tags to organize your subscribers."
          action={{ label: "Create Your First Tag", onClick: openCreate }}
        />
      ) : (
        /* Tag Grid */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full ring-2 ring-offset-1 dark:ring-offset-zinc-900"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{tag.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      <Hash className="inline h-3 w-3 mr-0.5" />
                      {tag.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(tag)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {tag.description && (
                <div className="mt-3 flex items-start gap-2">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{tag.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editingTag ? "Edit Tag" : "Create Tag"}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((p) => ({
                      ...p,
                      name,
                      slug: editingTag ? p.slug : generateSlug(name),
                    }));
                  }}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="e.g. VIP Customers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    hasSlugConflict
                      ? "border-red-400"
                      : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="vip-customers"
                />
                {hasSlugConflict && (
                  <p className="mt-1 text-xs text-red-500">A tag with this slug already exists.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm((p) => ({ ...p, color }))}
                      className={cn(
                        "h-7 w-7 rounded-full ring-offset-1 transition-all dark:ring-offset-zinc-900",
                        form.color === color ? "ring-2 ring-zinc-900 dark:ring-white scale-110" : "ring-1 ring-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    className="flex-1 rounded-xl border border-zinc-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Brief description of this tag..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.slug.trim() || hasSlugConflict}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {editingTag ? "Update Tag" : "Create Tag"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
