"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit3, Trash2, X, Save, Loader2, Shield, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";

interface PromptData {
  id: string;
  name: string;
  label: string;
  description: string | null;
  prompt: string;
  category: string;
  variables: string[];
  isSystem: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const QUERY_KEY = ["chat-prompts"];

export function PromptsClient({ prompts: initialPrompts, categories }: { prompts: PromptData[]; categories: string[] }) {
  const t = useTranslations("dashboard.chatbotPrompts");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromptData | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", label: "", description: "", prompt: "", category: "", variables: "",
  });

  const { data: prompts } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/chat/prompts");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      return json.templates as PromptData[];
    },
    initialData: initialPrompts,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const filtered = prompts.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.label.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;
    return true;
  });

  const resetForm = () => {
    setForm({ name: "", label: "", description: "", prompt: "", category: "", variables: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (p: PromptData) => {
    setForm({
      name: p.name, label: p.label, description: p.description || "", prompt: p.prompt,
      category: p.category, variables: p.variables.join(", "),
    });
    setEditing(p);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.label.trim() || !form.prompt.trim()) {
      toast.error(t("nameLabelPromptRequired"));
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name, label: form.label, description: form.description || null,
        prompt: form.prompt, category: form.category, variables: form.variables.split(",").map((v) => v.trim()).filter(Boolean),
      };

      if (editing) {
        const res = await fetch(`/api/chat/prompts?id=${editing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success(t("promptUpdated"));
      } else {
        const res = await fetch("/api/chat/prompts", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success(t("promptCreated"));
      }
      resetForm();
      invalidate();
    } catch {
      toast.error(t("failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) { toast.error(t("cannotDeleteSystemPrompts")); return; }
    if (!confirm(t("deletePromptConfirm"))) return;
    try {
      const res = await fetch(`/api/chat/prompts?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(t("promptDeleted"));
      invalidate();
    } catch { toast.error(t("failedToDelete")); }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/chat/prompts?id=${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !enabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      invalidate();
    } catch { toast.error(t("failedToTogglePrompt")); }
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPrompts")}
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> {t("addPrompt")}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((prompt) => (
          <div key={prompt.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{prompt.label}</h3>
                  {prompt.isSystem && <Shield className="h-3.5 w-3.5 text-amber-500" aria-label={t("systemPrompt")} />}
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", prompt.enabled ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800")}>
                    {prompt.enabled ? t("active") : t("disabled")}
                  </span>
                  <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800">{prompt.category}</span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{prompt.description || prompt.name}</p>
                {prompt.variables.length > 0 && (
                  <p className="mt-1 text-[10px] text-zinc-400">{t("variables")}: {prompt.variables.join(", ")}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(prompt)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleToggle(prompt.id, prompt.enabled)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {!prompt.isSystem && (
                  <button onClick={() => handleDelete(prompt.id, prompt.isSystem)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">{t("noPromptsFound")}</p>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{editing ? t("editPrompt") : t("addPrompt")}</h2>
                <button onClick={resetForm} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("nameRequired")}</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("labelRequired")}</label>
                    <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("categoryRequired")}</label>
                  <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={t("categoryPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("description")}</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("variablesCommaSeparated")}</label>
                  <input type="text" value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder={t("variablesPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("promptRequired")}</label>
                  <textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} rows={8}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
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
