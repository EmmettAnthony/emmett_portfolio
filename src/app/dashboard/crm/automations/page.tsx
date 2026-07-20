"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TRIGGER_OPTIONS = [
  { value: "lead.created", label: "Lead Created" },
  { value: "lead.status_changed", label: "Lead Status Changed" },
  { value: "deal.stage_changed", label: "Deal Stage Changed" },
  { value: "deal.won", label: "Deal Won" },
  { value: "deal.lost", label: "Deal Lost" },
  { value: "invoice.overdue", label: "Invoice Overdue" },
  { value: "task.due_soon", label: "Task Due Soon" },
];

const ACTION_OPTIONS = [
  { value: "send_email", label: "Send Email" },
  { value: "assign_task", label: "Assign Task" },
  { value: "update_status", label: "Update Status" },
  { value: "send_notification", label: "Send Notification" },
  { value: "create_activity", label: "Create Activity" },
  { value: "update_field", label: "Update Field" },
];

interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  createdAt: string;
}

interface AutomationFormData {
  name: string;
  trigger: string;
  action: string;
}

const emptyForm: AutomationFormData = { name: "", trigger: "lead.created", action: "send_email" };

export default function AutomationsPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AutomationFormData>(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-automations"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/crm/automations");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AutomationFormData) => {
      const res = await fetch("/api/dashboard/crm/automations", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-automations"] });
      toast("success", "Automation created");
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: () => toast("error", "Failed to create automation"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`/api/dashboard/crm/automations/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-automations"] });
      toast("success", "Automation updated");
    },
    onError: () => toast("error", "Failed to update automation"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/crm/automations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-automations"] });
      toast("success", "Automation deleted");
      setDeletingId(null);
    },
    onError: () => toast("error", "Failed to delete automation"),
  });

  const triggerLabels: Record<string, string> = Object.fromEntries(TRIGGER_OPTIONS.map((o) => [o.value, o.label]));
  const actionLabels: Record<string, string> = Object.fromEntries(ACTION_OPTIONS.map((o) => [o.value, o.label]));

  const automations: Automation[] = data?.automations ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Automations</h1>
          <p className="mt-1 text-sm text-zinc-500">{data?.total ?? 0} rules</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Add Automation
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : automations.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500">
          No automation rules yet. Create one to automate your workflow.
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "flex items-center justify-between rounded-xl border p-4 transition-colors",
                rule.enabled
                  ? "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  : "border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-surface"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm font-medium", rule.enabled ? "text-zinc-900 dark:text-white" : "text-zinc-500")}>
                    {rule.name}
                  </p>
                  <Badge variant={rule.enabled ? "default" : "outline"}>
                    {rule.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                    Trigger: {triggerLabels[rule.trigger] || rule.trigger}
                  </span>
                  <span>&rarr;</span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                    Action: {actionLabels[rule.action] || rule.action}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
                  className={cn(
                    "rounded-lg p-1.5 transition-colors",
                    rule.enabled
                      ? "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {rule.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setDeletingId(rule.id)}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Automation Rule</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Rule Name *</label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Send welcome email on new lead" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Trigger</label>
                <select value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  {TRIGGER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Action</label>
                <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  {ACTION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Create Rule</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Rule</h3>
            <p className="mt-2 text-sm text-zinc-500">Are you sure? This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(deletingId)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
