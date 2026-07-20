"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SupportSettings {
  supportEmail: string;
  autoResponder: boolean;
  maxAttachments: number;
  defaultPriority: string;
  ticketPrefix: string;
}

export default function SupportSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<SupportSettings>({
    supportEmail: "",
    autoResponder: false,
    maxAttachments: 5,
    defaultPriority: "MEDIUM",
    ticketPrefix: "TKT",
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<SupportSettings>) => {
      const res = await fetch("/api/support/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-settings"] });
      toast("success", "Settings saved");
    },
    onError: () => toast("error", "Failed to save settings"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Support Settings</h2>
        <p className="text-sm text-zinc-500">Configure your support module preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">
              Support Email
            </label>
            <Input
              type="email"
              value={form.supportEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, supportEmail: e.target.value }))}
              placeholder="support@example.com"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Incoming emails to this address will be converted to tickets.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">
              Ticket Number Prefix
            </label>
            <Input
              value={form.ticketPrefix}
              onChange={(e) => setForm((prev) => ({ ...prev, ticketPrefix: e.target.value }))}
              placeholder="TKT"
              className="max-w-[120px] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                Default Priority
              </label>
              <select
                value={form.defaultPriority}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultPriority: e.target.value }))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                Max Attachments
              </label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.maxAttachments}
                onChange={(e) => setForm((prev) => ({ ...prev, maxAttachments: parseInt(e.target.value) || 5 }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Auto-Responder</p>
              <p className="text-xs text-zinc-500">Send an automatic acknowledgment when a new ticket is created</p>
            </div>
            <button
              onClick={() => setForm((prev) => ({ ...prev, autoResponder: !prev.autoResponder }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                form.autoResponder ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  form.autoResponder ? "translate-x-[22px]" : "translate-x-[2px]"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Inbound Email</h3>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Configure your email provider to forward support emails to this webhook URL.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/support/inbound-email`}
                className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-mono dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/support/inbound-email`)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <p className="font-medium mb-1">Supported Providers:</p>
            <ul className="list-inside list-disc space-y-1 text-xs">
              <li><strong>Resend:</strong> Add this webhook URL in your Resend dashboard → Inbound Emails</li>
              <li><strong>SendGrid:</strong> Configure Inbound Parse in SendGrid settings</li>
              <li><strong>Mailgun:</strong> Set up a route to forward to this URL</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
