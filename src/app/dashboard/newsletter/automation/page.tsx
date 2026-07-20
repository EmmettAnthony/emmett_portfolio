"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus,
  Search,
  Loader2,
  GitBranch,
  Zap,
  Trash2,
  Edit3,
  X,
  Play,
  Pause,
  Layers,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";
import { createAutomationSchema, createAutomationStepSchema } from "@/lib/validations/newsletter";
import type {
  Automation,
  AutomationStatus,
  AutomationTrigger
} from "@/types/newsletter";

const triggerLabels: Record<AutomationTrigger, string> = {
  welcome_series: "Welcome Series",
  blog_notification: "Blog Notification",
  lead_nurturing: "Lead Nurturing",
  re_engagement: "Re-engagement",
  tag_added: "Tag Added",
  custom: "Custom",
};

const triggerColors: Record<AutomationTrigger, string> = {
  welcome_series: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  blog_notification: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  lead_nurturing: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  re_engagement: "bg-badge-warning-bg text-badge-warning-text",
  tag_added: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  custom: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground",
};

const statusColors: Record<AutomationStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PAUSED: "bg-badge-warning-bg text-badge-warning-text",
  ARCHIVED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground",
};

const statusFilters: (AutomationStatus | "all")[] = ["all", "ACTIVE", "PAUSED", "ARCHIVED"];

interface AutomationForm {
  name: string;
  description: string;
  triggerType: string;
  triggerConfig: string;
}

const defaultForm: AutomationForm = {
  name: "",
  description: "",
  triggerType: "welcome_series",
  triggerConfig: "{}",
};

interface StepForm {
  name: string;
  subject: string;
  content: string;
  delayDays: number;
  delayHours: number;
}

const defaultStep: StepForm = {
  name: "",
  subject: "",
  content: "",
  delayDays: 0,
  delayHours: 0,
};

export default function AutomationPage() {

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AutomationStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AutomationForm>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepForm[]>([]);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [stepForm, setStepForm] = useState<StepForm>(defaultStep);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery<Automation[]>({
    queryKey: ["newsletter-automation", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ search });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/newsletter/automation?${params}`);
      if (!res.ok) throw new Error("Failed to fetch automations");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const url = editId ? `/api/newsletter/automation/${editId}` : "/api/newsletter/automation";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save automation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-automation"] });
      toast("success", editId ? "Automation updated" : "Automation created");
      closeModal();
    },
    onError: () => toast("error", "Failed to save automation"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/newsletter/automation/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete automation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-automation"] });
      toast("success", "Automation deleted");
    },
    onError: () => toast("error", "Failed to delete automation"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AutomationStatus }) => {
      const res = await fetch(`/api/newsletter/automation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to toggle automation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-automation"] });
      toast("success", "Automation status updated");
    },
    onError: () => toast("error", "Failed to update automation"),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setSteps([]);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (automation: Automation) => {
    setEditId(automation.id);
    setForm({
      name: automation.name,
      description: automation.description ?? "",
      triggerType: automation.triggerType,
      triggerConfig: automation.triggerConfig ? JSON.stringify(automation.triggerConfig, null, 2) : "{}",
    });
    setSteps(
      automation.steps.map((s) => ({
        name: s.name,
        subject: s.subject ?? "",
        content: s.content ?? "",
        delayDays: s.delayDays,
        delayHours: s.delayHours,
      }))
    );
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(defaultForm);
    setSteps([]);
    setErrors({});
  };

  const handleSubmit = () => {
    let triggerConfig: Record<string, unknown> = {};
    try {
      triggerConfig = JSON.parse(form.triggerConfig);
    } catch {
      setErrors({ triggerConfig: "Invalid JSON" });
      return;
    }
    const result = createAutomationSchema.safeParse({
      name: form.name,
      description: form.description || null,
      triggerType: form.triggerType,
      triggerConfig,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    saveMutation.mutate({ ...result.data, steps });
  };

  const openAddStep = (index: number | null = null) => {
    if (index !== null) {
      setEditingStepIndex(index);
      setStepForm(steps[index]);
    } else {
      setEditingStepIndex(null);
      setStepForm(defaultStep);
    }
    setStepErrors({});
    setShowStepModal(true);
  };

  const handleSaveStep = () => {
    const result = createAutomationStepSchema.safeParse({
      automationId: "temp",
      stepOrder: editingStepIndex ?? steps.length,
      name: stepForm.name,
      subject: stepForm.subject || null,
      content: stepForm.content || null,
      delayDays: stepForm.delayDays,
      delayHours: stepForm.delayHours,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setStepErrors(fieldErrors);
      return;
    }
    setStepErrors({});
    if (editingStepIndex !== null) {
      setSteps((prev) => prev.map((s, i) => (i === editingStepIndex ? stepForm : s)));
    } else {
      setSteps((prev) => [...prev, stepForm]);
    }
    setShowStepModal(false);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const automations = Array.isArray(data) ? data : [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Zap className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load automations</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Automations</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {automations.length} automations
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
          Create Automation
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search automations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-300 text-muted-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : automations.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No automations found"
          description="Create your first automation to get started."
        />
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
                        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{automation.name}</h3>
                        {automation.description && (
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{automation.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        triggerColors[automation.triggerType] ?? triggerColors.custom
                      )}>
                        {triggerLabels[automation.triggerType] ?? automation.triggerType}
                      </span>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusColors[automation.status]
                      )}>
                        {automation.status.charAt(0) + automation.status.slice(1).toLowerCase()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Layers className="h-3 w-3" />
                        {automation.steps.length} steps
                      </span>
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(automation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {automation.status === "ACTIVE" ? (
                      <button
                        onClick={() => toggleMutation.mutate({ id: automation.id, status: "PAUSED" })}
                        className="rounded-lg p-2 text-amber-500 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        title="Pause"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleMutation.mutate({ id: automation.id, status: "ACTIVE" })}
                        className="rounded-lg p-2 text-emerald-500 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        title="Activate"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(automation)}
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this automation?")) deleteMutation.mutate(automation.id);
                      }}
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === automation.id ? null : automation.id)}
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <svg className={cn("h-4 w-4 transition-transform", expandedId === automation.id && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Steps */}
              {expandedId === automation.id && (
                <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Steps</h4>
                  {automation.steps.length === 0 ? (
                    <p className="text-sm text-zinc-400">No steps configured</p>
                  ) : (
                    <div className="space-y-2">
                      {automation.steps
                        .sort((a, b) => a.stepOrder - b.stepOrder)
                        .map((step, i) => (
                          <div key={step.id} className="flex items-start gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 dark:text-white">{step.name}</p>
                              <p className="text-xs text-zinc-500">
                                {step.subject && <span>Subject: {step.subject} | </span>}
                                {(step.delayDays > 0 || step.delayHours > 0) && (
                                  <span>Delay: {step.delayDays}d {step.delayHours}h | </span>
                                )}
                                <span>Order: {step.stepOrder}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Automation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editId ? "Edit Automation" : "Create Automation"}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    errors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="Automation name"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Trigger Type *</label>
                <select
                  value={form.triggerType}
                  onChange={(e) => setForm((p) => ({ ...p, triggerType: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  {Object.entries(triggerLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Trigger Config (JSON)</label>
                <textarea
                  value={form.triggerConfig}
                  onChange={(e) => setForm((p) => ({ ...p, triggerConfig: e.target.value }))}
                  rows={4}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    errors.triggerConfig ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                />
                {errors.triggerConfig && <p className="mt-1 text-xs text-red-500">{errors.triggerConfig}</p>}
              </div>

              {/* Steps Section */}
              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Steps</h3>
                  <button
                    onClick={() => openAddStep()}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Plus className="h-3 w-3" />
                    Add Step
                  </button>
                </div>
                {steps.length === 0 ? (
                  <p className="text-sm text-zinc-400 py-2">No steps added yet</p>
                ) : (
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{step.name}</p>
                          <p className="text-xs text-zinc-500">
                            {step.subject && <span>Subject: {step.subject} | </span>}
                            <span>Delay: {step.delayDays}d {step.delayHours}h</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openAddStep(i)} className="rounded p-1 text-zinc-400 hover:text-muted-foreground">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => removeStep(i)} className="rounded p-1 text-zinc-400 hover:text-red-500">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Modal */}
      {showStepModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editingStepIndex !== null ? "Edit Step" : "Add Step"}
              </h2>
              <button onClick={() => setShowStepModal(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Step Name *</label>
                <input
                  type="text"
                  value={stepForm.name}
                  onChange={(e) => setStepForm((p) => ({ ...p, name: e.target.value }))}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    stepErrors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="Step name"
                />
                {stepErrors.name && <p className="mt-1 text-xs text-red-500">{stepErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Subject</label>
                <input
                  type="text"
                  value={stepForm.subject}
                  onChange={(e) => setStepForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Content</label>
                <textarea
                  value={stepForm.content}
                  onChange={(e) => setStepForm((p) => ({ ...p, content: e.target.value }))}
                  rows={6}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Email HTML content"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Delay (Days)</label>
                  <input
                    type="number"
                    min={0}
                    value={stepForm.delayDays}
                    onChange={(e) => setStepForm((p) => ({ ...p, delayDays: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Delay (Hours)</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={stepForm.delayHours}
                    onChange={(e) => setStepForm((p) => ({ ...p, delayHours: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowStepModal(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStep}
                  className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
                >
                  {editingStepIndex !== null ? "Update Step" : "Add Step"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
