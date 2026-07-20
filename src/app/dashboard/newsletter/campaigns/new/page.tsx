"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {Loader2, Save, Send, ArrowLeft, Clock, Code, Layout, Repeat} from "lucide-react";










import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { createCampaignSchema } from "@/lib/validations/newsletter";
import type { Template, Segment } from "@/types/newsletter";
import EmailEditor from "@/components/newsletter/editor/EmailEditor";
import { buildEmailFromBlocks } from "@/lib/email";

interface CampaignForm {
  name: string;
  subject: string;
  previewText: string;
  senderName: string;
  senderEmail: string;
  content: string;
  templateId: string;
  segmentId: string;
  scheduledAt: string;
  abTestEnabled: boolean;
  abTestVariantA: string;
  abTestVariantB: string;
  recurringEnabled: boolean;
  recurringFrequency: string;
  recurringDayOfWeek: number;
  recurringDayOfMonth: number;
  recurringMaxCount: string;
  recurringEndsAt: string;
}

const defaultForm: CampaignForm = {
  name: "",
  subject: "",
  previewText: "",
  senderName: "",
  senderEmail: "",
  content: "",
  templateId: "",
  segmentId: "",
  scheduledAt: "",
  abTestEnabled: false,
  abTestVariantA: "",
  abTestVariantB: "",
  recurringEnabled: false,
  recurringFrequency: "weekly",
  recurringDayOfWeek: 1,
  recurringDayOfMonth: 1,
  recurringMaxCount: "",
  recurringEndsAt: "",
};

export default function NewCampaignPage() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [form, setForm] = useState<CampaignForm>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSchedule, setShowSchedule] = useState(false);
  const [editorMode, setEditorMode] = useState<"visual" | "source">("visual");
  const [blocks, setBlocks] = useState("");

  const templateId = searchParams.get("templateId");

  const { data: templates } = useQuery<Template[]>({
    queryKey: ["newsletter-templates"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const { data: segments } = useQuery<Segment[]>({
    queryKey: ["newsletter-segments"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/subscribers/segments");
      if (!res.ok) throw new Error("Failed to fetch segments");
      return res.json();
    },
  });

  useEffect(() => {
    if (templateId && templates) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((prev) => ({ ...prev, templateId, content: template.content }));
      }
    }
  }, [templateId, templates]);

  const validate = () => {
    const result = createCampaignSchema.safeParse({
      ...form,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      senderEmail: form.senderEmail || null,
      previewText: form.previewText || null,
      templateId: form.templateId || null,
      segmentId: form.segmentId || null,
      abTestVariantA: form.abTestVariantA ? JSON.stringify({ subject: form.abTestVariantA }) : null,
      abTestVariantB: form.abTestVariantB ? JSON.stringify({ subject: form.abTestVariantB }) : null,
      recurringFrequency: form.recurringEnabled ? form.recurringFrequency : null,
      recurringDayOfWeek: form.recurringEnabled && form.recurringFrequency === "weekly" ? form.recurringDayOfWeek : null,
      recurringDayOfMonth: form.recurringEnabled && form.recurringFrequency === "monthly" ? form.recurringDayOfMonth : null,
      recurringEndsAt: form.recurringEnabled && form.recurringEndsAt ? new Date(form.recurringEndsAt).toISOString() : null,
      recurringMaxCount: form.recurringEnabled && form.recurringMaxCount ? parseInt(form.recurringMaxCount) : null,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return null;
    }
    setErrors({});
    return result.data;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch("/api/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save campaign");
      return res.json();
    },
    onSuccess: (result) => {
      const campaignId = result.campaign?.id || result.id;
      toast("success", "Campaign saved as draft");
      router.push(`/dashboard/newsletter/campaigns/${campaignId}`);
    },
    onError: () => toast("error", "Failed to save campaign"),
  });

  const sendMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      const result = await res.json();
      const campaign = result.campaign || result;
      const campaignId = campaign.id || result.id;
      if (campaign.recurringFrequency) {
        return { id: campaignId, scheduled: true };
      }
      const sendRes = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (!sendRes.ok) throw new Error("Failed to send campaign");
      return sendRes.json();
    },
    onSuccess: (result) => {
      if (result.scheduled) {
        toast("success", "Recurring campaign created and scheduled");
      } else {
        toast("success", "Campaign created and sending");
      }
      router.push(`/dashboard/newsletter/campaigns/${result.id}`);
    },
    onError: () => toast("error", "Failed to send campaign"),
  });

  const handleSave = () => {
    const data = validate();
    if (data) saveMutation.mutate(data);
  };

  const handleSaveAndSend = () => {
    const data = validate();
    if (data) sendMutation.mutate(data);
  };

  const updateField = <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const templatesList = Array.isArray(templates) ? templates : [];
  const segmentsList = Array.isArray(segments) ? segments : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Create Campaign</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Set up a new email campaign</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save as Draft
          </button>
          <button
            onClick={handleSaveAndSend}
            disabled={sendMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Save & Send
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Details */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Basic Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    errors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="e.g. May Newsletter"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Subject Line *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    errors.subject ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="e.g. This month's top stories"
                />
                {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Preview Text</label>
                <input
                  type="text"
                  value={form.previewText}
                  onChange={(e) => updateField("previewText", e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Short preview text after the subject line"
                />
              </div>
            </div>
          </div>

          {/* Sender Info */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Sender Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Sender Name</label>
                <input
                  type="text"
                  value={form.senderName}
                  onChange={(e) => updateField("senderName", e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Sender Email</label>
                <input
                  type="email"
                  value={form.senderEmail}
                  onChange={(e) => updateField("senderEmail", e.target.value)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    errors.senderEmail ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="newsletter@example.com"
                />
                {errors.senderEmail && <p className="mt-1 text-xs text-red-500">{errors.senderEmail}</p>}
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Content</h2>
              <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setEditorMode("visual")}
                  className={cn("flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors", editorMode === "visual" ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-muted-foreground")}
                >
                  <Layout className="h-3 w-3" />
                  Visual
                </button>
                <button
                  onClick={() => setEditorMode("source")}
                  className={cn("flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors", editorMode === "source" ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-muted-foreground")}
                >
                  <Code className="h-3 w-3" />
                  Source
                </button>
              </div>
            </div>
            {editorMode === "visual" ? (
              <EmailEditor
                value={blocks}
                onChange={(newBlocks) => {
                  setBlocks(newBlocks);
                  try {
                    const parsed = JSON.parse(newBlocks);
                    const html = buildEmailFromBlocks(parsed);
                    updateField("content", html);
                  } catch { /* keep existing content */ }
                }}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">HTML Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  rows={16}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="<html>...</html>"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Template</h2>
            <select
              value={form.templateId}
              onChange={(e) => updateField("templateId", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">No template</option>
              {templatesList.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Segment Selection */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Segment</h2>
            <select
              value={form.segmentId}
              onChange={(e) => updateField("segmentId", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">All subscribers</option>
              {segmentsList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* A/B Testing */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">A/B Testing</h2>
              <button
                onClick={() => setForm((prev) => ({ ...prev, abTestEnabled: !prev.abTestEnabled }))}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  form.abTestEnabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  form.abTestEnabled ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
            {form.abTestEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Variant A</label>
                  <textarea
                    value={form.abTestVariantA}
                    onChange={(e) => updateField("abTestVariantA", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Subject A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Variant B</label>
                  <textarea
                    value={form.abTestVariantB}
                    onChange={(e) => updateField("abTestVariantB", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Subject B"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Schedule</h2>
              </div>
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  showSchedule ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  showSchedule ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
            {showSchedule && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Send At</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => updateField("scheduledAt", e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Recurring / Evergreen */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recurring</h2>
              </div>
              <button
                onClick={() => setForm((prev) => ({ ...prev, recurringEnabled: !prev.recurringEnabled }))}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  form.recurringEnabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  form.recurringEnabled ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
            {form.recurringEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Frequency</label>
                  <select
                    value={form.recurringFrequency}
                    onChange={(e) => updateField("recurringFrequency", e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                {form.recurringFrequency === "weekly" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Day of Week</label>
                    <select
                      value={form.recurringDayOfWeek}
                      onChange={(e) => updateField("recurringDayOfWeek", parseInt(e.target.value))}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                )}
                {form.recurringFrequency === "monthly" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Day of Month</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={form.recurringDayOfMonth}
                      onChange={(e) => updateField("recurringDayOfMonth", parseInt(e.target.value) || 1)}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Max Sends (optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.recurringMaxCount}
                    onChange={(e) => updateField("recurringMaxCount", e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={form.recurringEndsAt}
                    onChange={(e) => updateField("recurringEndsAt", e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
