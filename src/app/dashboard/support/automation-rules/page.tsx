"use client";

import { useEffect, useState } from "react";
import { Plus, Zap, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  value: string;
}

interface AutomationRuleForm {
  name: string;
  trigger: string;
  conditions: Condition[];
  actions: Action[];
  isEnabled: boolean;
  sortOrder: number;
}

interface AutomationRule extends AutomationRuleForm {
  id: string;
  createdAt: string;
}

export default function AutomationRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRules = () => {
    setLoading(true);
    fetch("/api/support/automation-rules")
      .then(r => r.json())
      .then(data => setRules(data.rules || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchRules(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const emptyForm = () => ({
    name: "", trigger: "ticket_created", conditions: [{ field: "priorityId", operator: "equals", value: "" }],
    actions: [{ type: "assign_to", value: "" }], isEnabled: true, sortOrder: 0,
  });

  const [form, setForm] = useState<AutomationRuleForm>(emptyForm());

  const openNew = () => {
    setForm(emptyForm());
    setEditingRule(null);
    setShowForm(true);
  };

  const openEdit = (rule: AutomationRule) => {
    setForm({
      name: rule.name, trigger: rule.trigger, conditions: rule.conditions, actions: rule.actions,
      isEnabled: rule.isEnabled, sortOrder: rule.sortOrder,
    });
    setEditingRule(rule);
    setShowForm(true);
  };

  const saveRule = async () => {
    setSaving(true);
    try {
      if (editingRule) {
        await fetch(`/api/support/automation-rules/${editingRule.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/support/automation-rules", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      fetchRules();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this automation rule?")) return;
    await fetch(`/api/support/automation-rules/${id}`, { method: "DELETE" });
    fetchRules();
  };

  const toggleRule = async (rule: AutomationRule) => {
    await fetch(`/api/support/automation-rules/${rule.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rule, isEnabled: !rule.isEnabled }),
    });
    fetchRules();
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Automation Rules</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Define automatic actions when tickets are created, updated, or closed</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
          <Zap className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-500" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No automation rules</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Create rules to automatically assign, prioritize, and notify based on conditions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className={`rounded-xl border p-4 ${rule.isEnabled ? "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800" : "border-zinc-100 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className={`h-5 w-5 ${rule.isEnabled ? "text-amber-500" : "text-zinc-300 dark:text-zinc-600"}`} />
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-white">{rule.name}</h3>
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700">{rule.trigger.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleRule(rule)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700">
                    {rule.isEnabled ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button onClick={() => openEdit(rule)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {(rule.conditions?.length > 0 || rule.actions?.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {rule.conditions?.filter((c: Condition) => c.value).map((c: Condition, i: number) => (
                    <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      {c.field} {c.operator} {c.value}
                    </span>
                  ))}
                  {(rule.conditions?.filter((c: Condition) => c.value).length > 0 && rule.actions?.filter((a: Action) => a.value).length > 0) && (
                    <span className="text-xs text-zinc-400 self-center ml-1">→</span>
                  )}
                  {rule.actions?.filter((a: Action) => a.value).map((a: Action, i: number) => (
                    <span key={i} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-950 dark:text-green-400">
                      {a.type}: {a.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
              {editingRule ? "Edit Rule" : "New Rule"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Trigger</label>
                <select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white">
                  {["ticket_created", "ticket_updated", "ticket_closed", "ticket_escalated"].map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Conditions</label>
                {form.conditions.map((c: Condition, i: number) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input type="text" value={c.field} onChange={e => { const nc = [...form.conditions]; nc[i] = { ...nc[i], field: e.target.value }; setForm({ ...form, conditions: nc }); }}
                      placeholder="Field (e.g. priorityId)" className="flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white" />
                    <select value={c.operator} onChange={e => { const nc = [...form.conditions]; nc[i] = { ...nc[i], operator: e.target.value }; setForm({ ...form, conditions: nc }); }}
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white">
                      <option value="equals">equals</option>
                      <option value="contains">contains</option>
                    </select>
                    <input type="text" value={c.value} onChange={e => { const nc = [...form.conditions]; nc[i] = { ...nc[i], value: e.target.value }; setForm({ ...form, conditions: nc }); }}
                      placeholder="Value" className="flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white" />
                    <button onClick={() => setForm({ ...form, conditions: form.conditions.filter((_: Condition, j: number) => j !== i) })}
                      className="rounded-lg p-1 text-red-400 hover:bg-red-50">×</button>
                  </div>
                ))}
                <button onClick={() => setForm({ ...form, conditions: [...form.conditions, { field: "", operator: "equals", value: "" }] })}
                  className="text-xs text-primary hover:underline">+ Add condition</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Actions</label>
                {form.actions.map((a: Action, i: number) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <select value={a.type} onChange={e => { const na = [...form.actions]; na[i] = { ...na[i], type: e.target.value }; setForm({ ...form, actions: na }); }}
                      className="rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white">
                      <option value="assign_to">Assign To</option>
                      <option value="change_status">Change Status</option>
                      <option value="change_priority">Change Priority</option>
                      <option value="add_tag">Add Tag</option>
                      <option value="notify">Notify Admins</option>
                    </select>
                    <input type="text" value={a.value} onChange={e => { const na = [...form.actions]; na[i] = { ...na[i], value: e.target.value }; setForm({ ...form, actions: na }); }}
                      placeholder="User/Status/Priority ID or tag name" className="flex-1 rounded-lg border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white" />
                    <button onClick={() => setForm({ ...form, actions: form.actions.filter((_: Action, j: number) => j !== i) })}
                      className="rounded-lg p-1 text-red-400 hover:bg-red-50">×</button>
                  </div>
                ))}
                <button onClick={() => setForm({ ...form, actions: [...form.actions, { type: "assign_to", value: "" }] })}
                  className="text-xs text-primary hover:underline">+ Add action</button>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isEnabled} onChange={e => setForm({ ...form, isEnabled: e.target.checked })}
                    className="rounded border-zinc-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Enabled</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700">Cancel</button>
              <button onClick={saveRule} disabled={saving || !form.name} className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50">
                {saving ? "Saving..." : editingRule ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
