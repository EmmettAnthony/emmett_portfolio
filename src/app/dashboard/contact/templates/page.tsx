"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { FileText, Eye, Save, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface EmailTemplate {
  id: string;
  name: string;
  label: string;
  subject: string;
  htmlBody: string;
  variables: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplatesData {
  templates: EmailTemplate[];
}

const typeLabels: Record<string, string> = {
  contact_owner: "Owner Notification",
  contact_auto_reply: "Auto-Reply",
  booking_owner: "Booking Owner",
  booking_auto_reply: "Booking Auto-Reply",
};

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editHtmlBody, setEditHtmlBody] = useState("");

  const { data, isLoading, error } = useQuery<TemplatesData>({
    queryKey: ["dashboard-contact-templates"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/contact/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<EmailTemplate> }) => {
      const res = await fetch(`/api/dashboard/contact/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-contact-templates"] });
      toast("success", "Template saved");
      setEditingId(null);
    },
    onError: () => {
      toast("error", "Failed to save template");
    },
  });

  const templates = data?.templates ?? [];

  const startEditing = (tpl: EmailTemplate) => {
    setEditingId(tpl.id);
    setEditLabel(tpl.label);
    setEditSubject(tpl.subject);
    setEditHtmlBody(tpl.htmlBody);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSave = (id: string) => {
    saveMutation.mutate({ id, body: { label: editLabel, subject: editSubject, htmlBody: editHtmlBody } });
  };

  const editingTemplate = templates.find((t) => t.id === editingId);
  const variables = editingTemplate ? (JSON.parse(editingTemplate.variables || "[]") as string[]) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/contact"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Email Templates
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {templates.length} template{templates.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <X className="mb-2 h-8 w-8 text-red-400" />
          <p className="text-sm font-medium text-red-500">Failed to load templates</p>
          <p className="text-xs">Please try again later</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <FileText className="mb-2 h-8 w-8" />
          <p className="text-sm font-medium">No templates found</p>
          <p className="text-xs">Run the seed script to populate default templates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((tpl) => {
            const isEditing = editingId === tpl.id;
            return (
              <div
                key={tpl.id}
                className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-info-bg text-badge-info-text">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {isEditing ? editLabel : tpl.label}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {typeLabels[tpl.name] || tpl.name}
                      </p>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => startEditing(tpl)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4 p-6">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">Label</label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">
                        Subject <span className="text-zinc-400">(use {"{{variable}}"})</span>
                      </label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">
                        HTML Body <span className="text-zinc-400">(use {"{{variable}}"})</span>
                      </label>
                      <textarea
                        value={editHtmlBody}
                        onChange={(e) => setEditHtmlBody(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        style={{ minHeight: "400px", fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
                      />
                    </div>
                    {variables.length > 0 && (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-500">Available Variables</label>
                        <div className="flex flex-wrap gap-1.5">
                          {variables.map((v) => (
                            <span
                              key={v}
                              className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400"
                            >
                              {"{{"}{v}{"}}"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSave(tpl.id)}
                        disabled={saveMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {saveMutation.isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-6">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Subject</span>
                      <p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{tpl.subject}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Variables</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(JSON.parse(tpl.variables || "[]") as string[]).map((v) => (
                          <span
                            key={v}
                            className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            {"{{"}{v}{"}}"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
