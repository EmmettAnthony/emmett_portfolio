"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { FormFieldOptions, FormOption } from "@/lib/form-field-options";
import { useTranslations } from "@/lib/i18n";

const CATEGORIES = [
  { key: "projectTypes" as const, label: "Project Types", description: "Options for the project type dropdown" },
  { key: "budgetRanges" as const, label: "Budget Ranges", description: "Options for the budget range dropdown" },
  { key: "timelineOptions" as const, label: "Timeline Options", description: "Options for the timeline dropdown" },
];

function OptionRow({ option, index, onChange, onRemove, t }: {
  option: FormOption;
  index: number;
  onChange: (index: number, field: keyof FormOption, value: string | boolean | number) => void;
  onRemove: (index: number) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <GripVertical className="h-4 w-4 flex-shrink-0 text-zinc-400" />
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <input
          type="text"
          value={option.value}
          onChange={(e) => onChange(index, "value", e.target.value)}
          placeholder={t("valuePlaceholder")}
          className="w-44 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
        <input
          type="text"
          value={option.label}
          onChange={(e) => onChange(index, "label", e.target.value)}
          placeholder={t("labelPlaceholder")}
          className="flex-1 min-w-[120px] rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
        <input
          type="number"
          value={option.order}
          onChange={(e) => onChange(index, "order", parseInt(e.target.value) || 0)}
          className="w-16 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          title={t("order")}
        />
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={option.enabled}
            onChange={(e) => onChange(index, "enabled", e.target.checked)}
            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          {t("enabled")}
        </label>
        <button
          onClick={() => onRemove(index)}
          className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function OptionsEditor({ title, description, options, onChange, onAdd, t }: {
  title: string;
  description: string;
  options: FormOption[];
  onChange: (options: FormOption[]) => void;
  onAdd: () => void;
  t: (key: string) => string;
}) {
  const updateOption = (index: number, field: keyof FormOption, value: string | boolean | number) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <div className="space-y-2">
        {options.map((option, i) => (
          <OptionRow key={i} option={option} index={i} onChange={updateOption} onRemove={removeOption} t={t} />
        ))}
      </div>
      <button
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400"
      >
        <Plus className="h-3.5 w-3.5" /> {t("addOption")}
      </button>
    </div>
  );
}

export default function FormFieldsSettingsPage() {
  const t = useTranslations("dashboard.formFields");
  const [data, setData] = useState<FormFieldOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/settings/form-fields")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => toast.error(t("failedToLoad")))
      .finally(() => setLoading(false));
  }, [t]);

  const updateCategory = (key: keyof FormFieldOptions, options: FormOption[]) => {
    if (!data) return;
    setData({ ...data, [key]: options });
  };

  const addOption = (key: keyof FormFieldOptions) => {
    if (!data) return;
    const options = data[key];
    const maxOrder = Math.max(...options.map((o) => o.order), 0);
    updateCategory(key, [
      ...options,
      { value: "", label: "", enabled: true, order: maxOrder + 1 },
    ]);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/form-fields", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("failedToSave"));
      }
      toast.success(t("saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t("failedToLoadSettings")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? t("saving") : t("saveChanges")}
        </button>
      </div>

      {CATEGORIES.map((cat) => (
        <OptionsEditor
          key={cat.key}
          title={t(cat.key)}
          description={t(cat.key + "Desc")}
          options={data[cat.key]}
          onChange={(options) => updateCategory(cat.key, options)}
          onAdd={() => addOption(cat.key)}
          t={t}
        />
      ))}

      <p className="text-xs text-zinc-500">
        {t("changesNote")}
      </p>
    </div>
  );
}
