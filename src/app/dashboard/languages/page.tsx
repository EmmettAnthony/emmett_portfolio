"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Globe,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LanguageData, LanguageFormValues } from "@/types/locale";
import { languageSchema } from "@/lib/validations/locale";

const defaultCodes = [
  { code: "en", name: "English", native: "English", dir: "LTR", flag: "🇺🇸" },
  { code: "fr", name: "French", native: "Français", dir: "LTR", flag: "🇫🇷" },
  { code: "es", name: "Spanish", native: "Español", dir: "LTR", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", native: "Português", dir: "LTR", flag: "🇵🇹" },
  { code: "ar", name: "Arabic", native: "العربية", dir: "RTL", flag: "🇸🇦" },
  { code: "de", name: "German", native: "Deutsch", dir: "LTR", flag: "🇩🇪" },
  { code: "it", name: "Italian", native: "Italiano", dir: "LTR", flag: "🇮🇹" },
  { code: "zh", name: "Chinese", native: "中文", dir: "LTR", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", native: "日本語", dir: "LTR", flag: "🇯🇵" },
  { code: "ko", name: "Korean", native: "한국어", dir: "LTR", flag: "🇰🇷" },
];

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<LanguageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState<LanguageFormValues>({
    code: "",
    name: "",
    nameEn: "",
    nativeName: "",
    direction: "LTR",
    flagEmoji: "",
    isEnabled: true,
    isDefault: false,
    order: 0,
  });

  useEffect(() => {
    loadLanguages();
  }, []);

  async function loadLanguages() {
    try {
      const res = await fetch("/api/admin/languages");
      if (res.ok) {
        const data = await res.json();
        setLanguages(data.languages);
      }
    } catch (err) {
      console.error("Failed to load languages:", err);
    } finally {
      setLoading(false);
    }
  }

  function openAddForm(preset?: { code: string; name: string; native: string; dir: string; flag: string }) {
    setForm({
      code: preset?.code || "",
      name: preset?.name || "",
      nameEn: preset?.name || "",
      nativeName: preset?.native || "",
      direction: preset?.dir as "LTR" | "RTL",
      flagEmoji: preset?.flag || "",
      isEnabled: true,
      isDefault: false,
      order: languages.length,
    });
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEditForm(lang: LanguageData) {
    setForm({
      code: lang.code,
      name: lang.name,
      nameEn: lang.nameEn,
      nativeName: lang.nativeName,
      direction: lang.direction,
      flagEmoji: lang.flagEmoji || "",
      flagImage: lang.flagImage || "",
      isEnabled: lang.isEnabled,
      isDefault: lang.isDefault,
      fallbackLocale: lang.fallbackLocale || "",
      order: lang.order,
    });
    setEditingId(lang.id);
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const validation = languageSchema.safeParse(form);
    if (!validation.success) {
      setError(
        validation.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
      setSaving(false);
      return;
    }

    try {
      const url = editingId
        ? "/api/admin/languages"
        : "/api/admin/languages";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      await loadLanguages();
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/languages?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      await loadLanguages();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    const idx = languages.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= languages.length) return;

    const reordered = [...languages];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];

    // Optimistic update
    setLanguages(
      reordered.map((l, i) => ({ ...l, order: i }))
    );

    // Persist
    for (let i = 0; i < reordered.length; i++) {
      await fetch("/api/admin/languages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reordered[i].id, order: i }),
      });
    }
  }

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Languages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage supported languages for your multilingual site
          </p>
        </div>
        <button
          onClick={() => openAddForm()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add Language
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search languages..."
          className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Quick-add presets */}
      <div className="flex flex-wrap gap-2">
        {defaultCodes
          .filter((p) => !languages.find((l) => l.code === p.code))
          .map((preset) => (
            <button
              key={preset.code}
              onClick={() => openAddForm(preset)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {preset.flag} {preset.native}
            </button>
          ))}
      </div>

      {/* Language List */}
      <div className="rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Globe className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "No languages match your search" : "No languages added yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Click &quot;Add Language&quot; to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((lang, i) => (
              <div
                key={lang.id}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/50",
                  !lang.isEnabled && "opacity-50"
                )}
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleReorder(lang.id, "up")}
                    disabled={i === 0}
                    className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleReorder(lang.id, "down")}
                    disabled={i === filtered.length - 1}
                    className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Flag + Name */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="text-xl">{lang.flagEmoji || "🌐"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {lang.nativeName}
                      </p>
                      {lang.isDefault && (
                        <span className="rounded-full bg-badge-info-bg px-2 py-0.5 text-[10px] font-medium text-badge-info-text">
                          Default
                        </span>
                      )}
                      {!lang.isEnabled && (
                        <span className="rounded-full bg-badge-neutral-bg px-2 py-0.5 text-[10px] font-medium text-badge-neutral-text">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lang.code} — {lang.name}
                      {lang.direction === "RTL" && " (RTL)"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(lang)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {!lang.isDefault && (
                    <button
                      onClick={() => setDeleteConfirm(lang.id)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Edit Language" : "Add Language"}
            </h2>

            <div className="mt-4 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Language Code
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toLowerCase() })
                  }
                  placeholder="en, fr, es..."
                  disabled={!!editingId}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>

              {/* Native Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Native Name
                </label>
                <input
                  type="text"
                  value={form.nativeName}
                  onChange={(e) => setForm({ ...form, nativeName: e.target.value })}
                  placeholder="Français, Español..."
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  English Name
                </label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="French, Spanish..."
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Direction */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Direction
                </label>
                <select
                  value={form.direction}
                  onChange={(e) =>
                    setForm({ ...form, direction: e.target.value as "LTR" | "RTL" })
                  }
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="LTR">Left-to-Right</option>
                  <option value="RTL">Right-to-Left</option>
                </select>
              </div>

              {/* Flag Emoji */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Flag Emoji
                </label>
                <input
                  type="text"
                  value={form.flagEmoji || ""}
                  onChange={(e) => setForm({ ...form, flagEmoji: e.target.value })}
                  placeholder="🇺🇸, 🇫🇷, 🇪🇸..."
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isEnabled ?? true}
                    onChange={(e) =>
                      setForm({ ...form, isEnabled: e.target.checked })
                    }
                    className="rounded border-input"
                  />
                  <span className="text-sm text-muted-foreground">Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault ?? false}
                    onChange={(e) =>
                      setForm({ ...form, isDefault: e.target.checked })
                    }
                    className="rounded border-input"
                  />
                  <span className="text-sm text-muted-foreground">Default</span>
                </label>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-500">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="rounded-xl border border-input px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">Delete Language</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure? This will permanently delete this language and all its
              translations.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-input px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
