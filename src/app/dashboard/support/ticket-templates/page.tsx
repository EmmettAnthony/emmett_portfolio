"use client";

import { useEffect, useState } from "react";
import { Plus, FileText, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

interface TicketTemplateField {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

interface TicketTemplateForm {
  name: string;
  slug: string;
  description: string;
  icon: string;
  defaultPriorityId: string;
  defaultCategoryId: string;
  fields: TicketTemplateField[];
  isActive: boolean;
}

interface TicketTemplate extends TicketTemplateForm {
  id: string;
  createdAt: string;
}

export default function TicketTemplatesPage() {
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [priorities, setPriorities] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TicketTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = (): TicketTemplateForm => ({
    name: "", slug: "", description: "", icon: "FileText",
    defaultPriorityId: "", defaultCategoryId: "", fields: [{ key: "", label: "", type: "text", required: false }],
    isActive: true,
  });

  const [form, setForm] = useState<TicketTemplateForm>(emptyForm());

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/support/ticket-templates").then(r => r.json()),
      fetch("/api/support/categories").then(r => r.json()),
      fetch("/api/support/priorities").then(r => r.json()),
    ])
      .then(([tplData, catData, priData]) => {
        setTemplates(tplData.templates || tplData || []);
        setCategories(catData.categories || catData || []);
        setPriorities(priData.priorities || priData || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchData(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const openNew = () => {
    setForm(emptyForm());
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (tpl: TicketTemplate) => {
    setForm({
      name: tpl.name, slug: tpl.slug, description: tpl.description, icon: tpl.icon,
      defaultPriorityId: tpl.defaultPriorityId, defaultCategoryId: tpl.defaultCategoryId,
      fields: tpl.fields, isActive: tpl.isActive,
    });
    setEditing(tpl);
    setShowForm(true);
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/support/ticket-templates/${editing.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/support/ticket-templates", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/support/ticket-templates/${id}`, { method: "DELETE" });
    fetchData();
  };

  const toggleTemplate = async (tpl: TicketTemplate) => {
    await fetch(`/api/support/ticket-templates/${tpl.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tpl, isActive: !tpl.isActive }),
    });
    fetchData();
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Ticket Templates</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Pre-defined forms for common ticket types</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
          <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-500" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No templates</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Create templates to speed up ticket creation for common issues</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className={`rounded-xl border p-5 ${tpl.isActive ? "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800" : "border-zinc-100 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleTemplate(tpl)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    {tpl.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(tpl)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteTemplate(tpl.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-medium text-zinc-900 dark:text-white">{tpl.name}</h3>
              {tpl.description && (
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{tpl.description}</p>
              )}
              <div className="mt-3 text-xs text-zinc-400">
                {tpl.fields?.length || 0} fields
                {tpl.defaultCategoryId && ` · Category set`}
                {tpl.defaultPriorityId && ` · Priority set`}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
              {editing ? "Edit Template" : "New Template"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Slug</label>
                <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-mono dark:border-zinc-600 dark:bg-zinc-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Default Priority</label>
                  <select value={form.defaultPriorityId} onChange={e => setForm({ ...form, defaultPriorityId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white">
                    <option value="">None</option>
                    {priorities.map((p) => (
                      <option key={p.id} value={p.id}>{p.name || p.slug}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Default Category</label>
                  <select value={form.defaultCategoryId} onChange={e => setForm({ ...form, defaultCategoryId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white">
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fields</label>
                {form.fields.map((f: TicketTemplateField, i: number) => (
                  <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_100px_auto] gap-2 items-center">
                    <input type="text" value={f.key} onChange={e => { const nf = [...form.fields]; nf[i] = { ...nf[i], key: e.target.value }; setForm({ ...form, fields: nf }); }}
                      placeholder="Key" className="rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white" />
                    <input type="text" value={f.label} onChange={e => { const nf = [...form.fields]; nf[i] = { ...nf[i], label: e.target.value }; setForm({ ...form, fields: nf }); }}
                      placeholder="Label" className="rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white" />
                    <select value={f.type} onChange={e => { const nf = [...form.fields]; nf[i] = { ...nf[i], type: e.target.value }; setForm({ ...form, fields: nf }); }}
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white">
                      <option value="text">text</option>
                      <option value="textarea">textarea</option>
                      <option value="select">select</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={f.required} onChange={e => { const nf = [...form.fields]; nf[i] = { ...nf[i], required: e.target.checked }; setForm({ ...form, fields: nf }); }}
                          className="rounded border-zinc-300 text-primary focus:ring-primary" />
                        <span className="text-[10px] text-zinc-500">Req</span>
                      </label>
                      <button onClick={() => setForm({ ...form, fields: form.fields.filter((_: TicketTemplateField, j: number) => j !== i) })}
                        className="rounded-lg p-0.5 text-red-400 hover:bg-red-50">×</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setForm({ ...form, fields: [...form.fields, { key: "", label: "", type: "text", required: false }] })}
                  className="text-xs text-primary hover:underline">+ Add field</button>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-zinc-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Active</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700">Cancel</button>
              <button onClick={saveTemplate} disabled={saving || !form.name} className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
