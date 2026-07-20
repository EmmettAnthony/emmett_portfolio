"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Loader2,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: { id: string; name: string; color: string | null } | null;
  tags: string[];
  source: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  _count: { items: number };
}

const QUERY_KEY = ["chat-knowledge-base"];

export function KnowledgeBaseClient({ items: initialItems, categories: initialCategories }: { items: KnowledgeItem[]; categories: Category[] }) {
  const t = useTranslations("dashboard.chatbotKnowledge");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    categoryId: "",
    tags: "",
    source: "",
    sourceUrl: "",
  });

  const { data: items } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/chat/knowledge-base");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json.items as KnowledgeItem[];
    },
    initialData: initialItems,
  });

  const { data: categories } = useQuery({
    queryKey: [...QUERY_KEY, "categories"],
    queryFn: async () => {
      const res = await fetch("/api/chat/knowledge-base/categories");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json.categories as Category[];
    },
    initialData: initialCategories,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, "categories"] });
  };

  const filteredItems = items.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && item.category?.id !== selectedCategory) return false;
    return true;
  });

  const resetForm = () => {
    setForm({ title: "", content: "", categoryId: "", tags: "", source: "", sourceUrl: "" });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item: KnowledgeItem) => {
    setForm({
      title: item.title,
      content: item.content,
      categoryId: item.category?.id || "",
      tags: item.tags.join(", "),
      source: item.source || "",
      sourceUrl: "",
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error(t("titleAndContentRequired"));
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: form.title,
        content: form.content,
        categoryId: form.categoryId || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        source: form.source || null,
        sourceUrl: form.sourceUrl || null,
      };

      if (editingItem) {
        const res = await fetch("/api/chat/knowledge-base?id=" + editingItem.id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success(t("knowledgeBaseUpdated"));
      } else {
        const res = await fetch("/api/chat/knowledge-base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success(t("knowledgeBaseEntryCreated"));
      }
      resetForm();
      invalidate();
    } catch {
      toast.error(t("failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteEntryConfirm"))) return;
    try {
      const res = await fetch("/api/chat/knowledge-base?id=" + id, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(t("entryDeleted"));
      invalidate();
    } catch {
      toast.error(t("failedToDelete"));
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await fetch("/api/chat/knowledge-base?id=" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      invalidate();
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchKnowledgeBase")}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
          <option value="">{t("allCategories")}</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name} ({cat._count.items})</option>)}
        </select>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          <Plus className="h-4 w-4" /> {t("addEntry")}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(item.id, item.enabled)}
                    className={cn("h-5 w-5 rounded border-2 flex items-center justify-center transition-colors", item.enabled ? "bg-green-500 border-green-500" : "border-zinc-300 dark:border-zinc-600")}>
                    {item.enabled && <span className="text-white text-[10px]">&#10003;</span>}
                  </button>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.title}</h3>
                  {item.category && (
                    <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800"
                      style={item.category.color ? { backgroundColor: `${item.category.color}20`, color: item.category.color } : {}}>
                      {item.category.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{item.content}</p>
                {item.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(item)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">{t("noKnowledgeBaseEntries")}</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{editingItem ? t("editEntry") : t("addEntry")}</h2>
                <button onClick={resetForm} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("titleRequired")}</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("contentRequired")}</label>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("category")}</label>
                    <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                      <option value="">{t("none")}</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("source")}</label>
                    <input type="text" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("tagsCommaSeparated")}</label>
                    <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder={t("tagsPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={resetForm} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">{t("cancel")}</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? t("saving") : t("save")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
