"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Plus,
  Loader2,
  Edit3,
  Trash2,
  FileText,
  Mail,
  Smartphone,
  MessageSquare,
  MessageCircle,
  X,
  Save,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  DELIVERY_CHANNELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
  CHANNEL_LABELS
} from "@/types/notifications";
import { useToast } from "@/components/ui/toast";
import type { NotificationTemplateData, NotificationCategory, DeliveryChannel } from "@/types/notifications";

interface TemplateForm {
  id?: string;
  name: string;
  label: string;
  category: string;
  priority: string;
  notifType: string;
  title: string;
  message: string;
  emailSubject: string;
  emailBody: string;
  pushTitle: string;
  pushBody: string;
  variables: string;
  channels: string[];
  actionLabel: string;
}

const emptyForm: TemplateForm = {
  name: "",
  label: "",
  category: "SYSTEM",
  priority: "MEDIUM",
  notifType: "INFO",
  title: "",
  message: "",
  emailSubject: "",
  emailBody: "",
  pushTitle: "",
  pushBody: "",
  variables: "",
  channels: ["IN_APP"],
  actionLabel: "",
};

const channelIcons: Record<string, typeof Bell> = {
  IN_APP: Bell,
  EMAIL: Mail,
  PUSH: Smartphone,
  SMS: MessageSquare,
  WHATSAPP: MessageCircle,
};

export default function NotificationTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateForm>(emptyForm);


  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["notification-templates"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/templates");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Save template
  const saveMutation = useMutation({
    mutationFn: async (formData: TemplateForm) => {
      const body = {
        ...(formData.id ? { id: formData.id } : {}),
        name: formData.name,
        label: formData.label,
        category: formData.category,
        priority: formData.priority,
        notifType: formData.notifType,
        title: formData.title,
        message: formData.message || null,
        emailSubject: formData.emailSubject || null,
        emailBody: formData.emailBody || null,
        pushTitle: formData.pushTitle || null,
        pushBody: formData.pushBody || null,
        variables: formData.variables ? formData.variables.split(",").map((v) => v.trim()).filter(Boolean) : [],
        channels: formData.channels,
        actionLabel: formData.actionLabel || null,
      };

      const method = formData.id ? "PATCH" : "POST";
      const res = await fetch("/api/notifications/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      setShowEditor(false);
      setEditingTemplate(emptyForm);
      toast("success", "Template saved");
    },
    onError: () => toast("error", "Failed to save template"),
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/templates?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      toast("success", "Template deleted");
    },
    onError: () => toast("error", "Failed to delete template"),
  });

  const startEdit = (template: NotificationTemplateData) => {
    setEditingTemplate({
      id: template.id,
      name: template.name,
      label: template.label,
      category: template.category,
      priority: template.priority,
      notifType: template.notifType,
      title: template.title,
      message: template.message || "",
      emailSubject: template.emailSubject || "",
      emailBody: template.emailBody || "",
      pushTitle: template.pushTitle || "",
      pushBody: template.pushBody || "",
      variables: (template.variables || []).join(", "),
      channels: template.channels || ["IN_APP"],
      actionLabel: template.actionLabel || "",
    });
    setShowEditor(true);
  };

  const toggleChannel = (channel: string) => {
    setEditingTemplate((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const renderedPreview = editingTemplate.title
    ? editingTemplate.title.replace(/\{\{(\w+)\}\}/g, '<span class="text-blue-500 font-mono bg-blue-50 dark:bg-blue-950/30 rounded px-1">{{$1}}</span>')
    : "No title set";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Notification Templates</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage notification message templates with variables
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(emptyForm);
            setShowEditor(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : templates?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
            <FileText className="h-10 w-10 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No templates yet</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create your first notification template to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(templates || []).map((template: NotificationTemplateData) => (
            <div
              key={template.id}
              className="group relative rounded-2xl border border-zinc-200 bg-white p-5 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{template.label}</p>
                    <p className="text-xs text-zinc-500">{CATEGORY_LABELS[template.category as NotificationCategory] || template.category}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(template)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(template.id)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 mb-2">{template.title}</p>

              <div className="flex flex-wrap gap-1.5">
                {template.channels.map((ch) => {
                  const Icon = channelIcons[ch] || Bell;
                  return (
                    <span
                      key={ch}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      <Icon className="h-3 w-3" />
                      {CHANNEL_LABELS[ch as DeliveryChannel] || ch}
                    </span>
                  );
                })}
              </div>

              {template.variables && template.variables.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.variables.map((v) => (
                    <span
                      key={v}
                      className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10">
          <div className="mx-4 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 mb-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editingTemplate.id ? "Edit Template" : "New Template"}
              </h2>
              <button
                onClick={() => setShowEditor(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 p-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., new_lead_notification"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Display Label</label>
                  <input
                    type="text"
                    value={editingTemplate.label}
                    onChange={(e) => setEditingTemplate((p) => ({ ...p, label: e.target.value }))}
                    placeholder="e.g., New Lead Notification"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Category, Priority, Type */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Category</label>
                  <select
                    value={editingTemplate.category}
                    onChange={(e) => setEditingTemplate((p) => ({ ...p, category: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    {NOTIFICATION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Priority</label>
                  <select
                    value={editingTemplate.priority}
                    onChange={(e) => setEditingTemplate((p) => ({ ...p, priority: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    {NOTIFICATION_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p as NotificationPriority]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Type</label>
                  <select
                    value={editingTemplate.notifType}
                    onChange={(e) => setEditingTemplate((p) => ({ ...p, notifType: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    {NOTIFICATION_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t as NotificationType]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Title Template <span className="text-zinc-400">(supports variables)</span>
                </label>
                <input
                  type="text"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate((p) => ({ ...p, title: e.target.value }))}
                  placeholder="New lead from {{name}}"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                  Message Template <span className="text-zinc-400">(optional)</span>
                </label>
                <textarea
                  value={editingTemplate.message}
                  onChange={(e) => setEditingTemplate((p) => ({ ...p, message: e.target.value }))}
                  rows={2}
                  placeholder="{{company}} - {{service}} inquiry received"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Email */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                  <Mail className="h-4 w-4" /> Email Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">Email Subject</label>
                    <input
                      type="text"
                      value={editingTemplate.emailSubject}
                      onChange={(e) => setEditingTemplate((p) => ({ ...p, emailSubject: e.target.value }))}
                      placeholder="New inquiry from {{name}}"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">Email Body (HTML)</label>
                    <textarea
                      value={editingTemplate.emailBody}
                      onChange={(e) => setEditingTemplate((p) => ({ ...p, emailBody: e.target.value }))}
                      rows={4}
                      placeholder="<p>New inquiry from {{name}} ({{email}})</p>"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Push */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                  <Smartphone className="h-4 w-4" /> Push Notification Settings
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">Push Title</label>
                    <input
                      type="text"
                      value={editingTemplate.pushTitle}
                      onChange={(e) => setEditingTemplate((p) => ({ ...p, pushTitle: e.target.value }))}
                      placeholder="New lead"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">Push Body</label>
                    <input
                      type="text"
                      value={editingTemplate.pushBody}
                      onChange={(e) => setEditingTemplate((p) => ({ ...p, pushBody: e.target.value }))}
                      placeholder="New lead from {{name}}"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Variables & Channels */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    Variables <span className="text-zinc-400">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.variables}
                    onChange={(e) => setEditingTemplate((p) => ({ ...p, variables: e.target.value }))}
                    placeholder="name, email, company, service"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Action Label</label>
                  <input
                    type="text"
                    value={editingTemplate.actionLabel}
                    onChange={(e) => setEditingTemplate((p) => ({ ...p, actionLabel: e.target.value }))}
                    placeholder="View Lead"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Delivery Channels */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Delivery Channels</label>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_CHANNELS.map((ch) => {
                    const Icon = channelIcons[ch] || Bell;
                    const isActive = editingTemplate.channels.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          isActive
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {CHANNEL_LABELS[ch as DeliveryChannel]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-surface">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-zinc-500">Preview</h3>
                  <Eye className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <p
                  className="text-sm text-zinc-800 dark:text-zinc-200"
                  dangerouslySetInnerHTML={{ __html: renderedPreview }}
                />
                {editingTemplate.message && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{editingTemplate.message}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={() => setShowEditor(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate(editingTemplate)}
                disabled={saveMutation.isPending || !editingTemplate.name || !editingTemplate.title}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingTemplate.id ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
