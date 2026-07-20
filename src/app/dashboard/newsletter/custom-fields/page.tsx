"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Columns
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import type { CustomField } from "@/types/newsletter";

export default function CustomFieldsPage() {

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", fieldType: "text", required: false, options: "", placeholder: "", defaultValue: "", order: 0 });

  const { data: fields, isLoading } = useQuery<CustomField[]>({
    queryKey: ["newsletter-custom-fields"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/custom-fields");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      const res = await fetch("/api/newsletter/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, slug, options: data.options || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-custom-fields"] });
      toast("success", "Field created");
      setShowAdd(false);
      setForm({ name: "", slug: "", fieldType: "text", required: false, options: "", placeholder: "", defaultValue: "", order: 0 });
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/custom-fields?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-custom-fields"] });
      toast("success", "Field deleted");
    },
    onError: (err: Error) => toast("error", err.message),
  });

  const typeIcon = (t: string) => {
    const colors: Record<string, string> = { text: "text-blue-500", number: "text-emerald-500", date: "text-violet-500", select: "text-amber-500", boolean: "text-rose-500" };
    return <span className={cn("text-xs font-bold", colors[t] || colors.text)}>{t.toUpperCase()}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Custom Fields</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Add extra data fields to subscriber profiles</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600">
          <Plus className="h-4 w-4" /> Add Field
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : !fields || fields.length === 0 ? (
        <EmptyState
          icon={Columns}
          title="No custom fields yet"
          description='Add fields like "Company Size", "Industry", or "Birthday"'
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Required</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Order</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {fields.map((field) => (
                <tr key={field.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">{field.name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{field.slug}</td>
                  <td className="px-6 py-4">{typeIcon(field.fieldType)}</td>
                  <td className="px-6 py-4 text-sm">{field.required ? <span className="text-rose-500">Yes</span> : "No"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{field.order}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { if (confirm("Delete this field?")) deleteMutation.mutate(field.id); }} className="rounded-lg p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Add Custom Field</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder="e.g., Company Size" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Slug (leave blank to auto-generate)</label>
                <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder="company_size" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Type</label>
                <select value={form.fieldType} onChange={(e) => setForm((p) => ({ ...p, fieldType: e.target.value }))} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select (Dropdown)</option>
                  <option value="boolean">Boolean (Yes/No)</option>
                </select>
              </div>
              {form.fieldType === "select" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Options (comma-separated)</label>
                  <input value={form.options} onChange={(e) => setForm((p) => ({ ...p, options: e.target.value }))} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder="Small, Medium, Large" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Placeholder</label>
                <input value={form.placeholder} onChange={(e) => setForm((p) => ({ ...p, placeholder: e.target.value }))} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Default Value</label>
                <input value={form.defaultValue} onChange={(e) => setForm((p) => ({ ...p, defaultValue: e.target.value }))} className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.required} onChange={(e) => setForm((p) => ({ ...p, required: e.target.checked }))} className="rounded border-zinc-300 text-blue-600" />
                <span className="text-sm text-zinc-700 dark:text-muted-foreground">Required</span>
              </label>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
              <button onClick={() => addMutation.mutate(form)} disabled={!form.name || addMutation.isPending} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50">
                {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
