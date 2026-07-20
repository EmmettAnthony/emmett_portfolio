"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Upload,
  Globe,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LanguageData, TranslationData, TranslationGroupData } from "@/types/locale";

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<TranslationData[]>([]);
  const [groups, setGroups] = useState<TranslationGroupData[]>([]);
  const [languages, setLanguages] = useState<LanguageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [missingOnly, setMissingOnly] = useState(false);

  // Inline edit
  const [editingCell, setEditingCell] = useState<{
    id: string;
    languageId: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Bulk import modal
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importGroupId, setImportGroupId] = useState("");
  const [importLangId, setImportLangId] = useState("");
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (groupFilter !== "all") params.set("groupId", groupFilter);
      if (languageFilter !== "all") params.set("languageId", languageFilter);
      if (search) params.set("search", search);
      if (missingOnly) params.set("missingOnly", "true");
      params.set("includeLanguages", "true");

      const [transRes, langRes] = await Promise.all([
        fetch(`/api/admin/translations?${params}`),
        fetch("/api/admin/languages"),
      ]);

      if (transRes.ok) {
        const transData = await transRes.json();
        setTranslations(transData.translations);
        setGroups(transData.groups);
      }
      if (langRes.ok) {
        const langData = await langRes.json();
        setLanguages(langData.languages);
      }
    } catch (err) {
      console.error("Failed to load translations:", err);
    } finally {
      setLoading(false);
    }
  }, [search, groupFilter, languageFilter, missingOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const enabledLanguages = languages.filter((l) => l.isEnabled);

  async function saveTranslation(id: string, languageId: string, value: string) {
    setSaving(id);
    try {
      const res = await fetch("/api/admin/translations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, value }),
      });
      if (res.ok) {
        setTranslations((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, value, needsReview: false } : t
          )
        );
      }
    } catch (err) {
      console.error("Failed to save translation:", err);
    } finally {
      setSaving(null);
    }
  }

  function startEdit(id: string, languageId: string, currentValue: string) {
    setEditingCell({ id, languageId });
    setEditValue(currentValue);
  }

  function confirmEdit() {
    if (editingCell) {
      saveTranslation(editingCell.id, editingCell.languageId, editValue);
      setEditingCell(null);
    }
  }

  function cancelEdit() {
    setEditingCell(null);
  }

  // Group translations by key for matrix view
  const translationsByKey = translations.reduce(
    (acc, t) => {
      if (!acc[t.key]) acc[t.key] = {};
      acc[t.key][t.languageId] = t;
      return acc;
    },
    {} as Record<string, Record<string, TranslationData>>
  );

  const translationKeys = Object.keys(translationsByKey);

  async function handleExport() {
    const params = new URLSearchParams();
    if (groupFilter !== "all") params.set("groupId", groupFilter);
    if (languageFilter !== "all") params.set("languageId", languageFilter);

    const res = await fetch(`/api/admin/translations?${params}`);
    if (!res.ok) return;

    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.translations, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!importJson || !importGroupId || !importLangId) return;
    setImporting(true);
    setImportResult(null);

    try {
      let parsed: { key: string; value: string }[];
      try {
        parsed = JSON.parse(importJson);
        if (!Array.isArray(parsed)) throw new Error("Must be an array");
      } catch {
        alert("Invalid JSON. Must be an array of { key, value } objects.");
        setImporting(false);
        return;
      }

      const res = await fetch("/api/admin/translations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languageId: importLangId,
          groupId: importGroupId,
          overwrite: importOverwrite,
          translations: parsed,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setImportResult(result);
        loadData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Import failed");
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Import failed. Check your JSON format.");
    } finally {
      setImporting(false);
    }
  }

  const hasMissing = (key: string) => {
    return enabledLanguages.some(
      (lang) =>
        !translationsByKey[key]?.[lang.id]?.value &&
        !lang.isDefault
    );
  };

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
          <h1 className="text-2xl font-bold text-foreground">Translations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage translations across all supported languages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setImportJson("");
              setImportResult(null);
              setShowImport(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-input px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keys..."
            className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Languages</option>
          {enabledLanguages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.flagEmoji} {l.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={missingOnly}
            onChange={(e) => setMissingOnly(e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-sm text-muted-foreground">Missing only</span>
        </label>
      </div>

      {/* Translation Matrix */}
      {translationKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Globe className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            {search
              ? "No translations match your search"
              : "No translations found"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Add translation groups and keys to get started
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Key
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Group
                  </th>
                  {enabledLanguages.map((lang) => (
                    <th
                      key={lang.id}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      <span className="inline-flex items-center gap-1">
                        {lang.flagEmoji} {lang.code}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {translationKeys.slice(0, 200).map((key) => {
                  const firstTrans = translationsByKey[key][
                    Object.keys(translationsByKey[key])[0]
                  ];
                  const group = groups.find(
                    (g) => g.id === firstTrans?.groupId
                  );
                  const missing = hasMissing(key);

                  return (
                    <tr
                      key={key}
                      className={cn(
                        "transition-colors hover:bg-accent/30",
                        missing && "bg-amber-50/50 dark:bg-amber-950/10"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-foreground">
                            {key}
                          </span>
                          {missing && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {group?.name || "—"}
                      </td>
                      {enabledLanguages.map((lang) => {
                        const t = translationsByKey[key]?.[lang.id];
                        const value = t?.value || "";
                        const isEditing =
                          editingCell?.id === t?.id &&
                          editingCell?.languageId === lang.id;

                        return (
                          <td key={lang.id} className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmEdit();
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  autoFocus
                                  className="w-full min-w-[120px] rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <button
                                  onClick={confirmEdit}
                                  className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  t && startEdit(t.id, lang.id, value)
                                }
                                disabled={!t || saving === t.id}
                                className={cn(
                                  "group flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors",
                                  value
                                    ? "text-foreground"
                                    : "italic text-muted-foreground/50",
                                  "hover:bg-accent"
                                )}
                              >
                                <span className="flex-1 truncate text-left">
                                  {value || "—"}
                                </span>
                                {t && (
                                  <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {translationKeys.length > 200 && (
            <div className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
              Showing 200 of {translationKeys.length} keys. Use search to narrow
              results.
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Bulk Import Translations
              </h2>
              <button
                onClick={() => setShowImport(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importResult ? (
              <div className="text-center py-8">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
                <p className="text-sm font-medium text-foreground">
                  Import complete
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created: {importResult.created} | Updated: {importResult.updated}
                </p>
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportResult(null);
                  }}
                  className="mt-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Group
                  </label>
                  <select
                    value={importGroupId}
                    onChange={(e) => setImportGroupId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select group...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Language
                  </label>
                  <select
                    value={importLangId}
                    onChange={(e) => setImportLangId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select language...</option>
                    {enabledLanguages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.flagEmoji} {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    JSON Data
                  </label>
                  <textarea
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    placeholder='[{ "key": "nav.home", "value": "Accueil" }, ...]'
                    rows={8}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOverwrite}
                    onChange={(e) => setImportOverwrite(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm text-muted-foreground">
                    Overwrite existing translations
                  </span>
                </label>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowImport(false)}
                    className="rounded-xl border border-input px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || !importJson || !importGroupId || !importLangId}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                  >
                    {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                    Import
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
