"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {Save, Loader2, Eye, EyeOff} from "lucide-react";






import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmailSettings as EmailSettingsType } from "@/types/email";

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: settings, isLoading } = useQuery<EmailSettingsType>({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const res = await fetch("/api/email/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const [form, setForm] = useState<Partial<EmailSettingsType>>({});

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/email/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      toast("success", "Settings saved");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const handleSave = () => {
    saveMutation.mutate(form as Record<string, unknown>);
  };

  const updateField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-32 mb-4" /><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const current = { ...settings, ...form };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Email Settings</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Configure your Brevo email integration
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* API Configuration */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">API Configuration</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Brevo API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={current.apiKey || ""}
                  onChange={(e) => updateField("apiKey", e.target.value)}
                  placeholder="Enter your Brevo API key"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sender Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Sender Information</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Sender Name</label>
              <input
                type="text"
                value={current.senderName || ""}
                onChange={(e) => updateField("senderName", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Sender Email</label>
              <input
                type="email"
                value={current.senderEmail || ""}
                onChange={(e) => updateField("senderEmail", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Reply-To Email</label>
              <input
                type="email"
                value={current.replyToEmail || ""}
                onChange={(e) => updateField("replyToEmail", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* SMTP Settings */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">SMTP Settings</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">SMTP Server</label>
              <input
                type="text"
                value={current.smtpServer || "smtp-relay.brevo.com"}
                onChange={(e) => updateField("smtpServer", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Port</label>
                <input
                  type="number"
                  value={current.smtpPort || 587}
                  onChange={(e) => updateField("smtpPort", parseInt(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">SMTP Login</label>
                <input
                  type="text"
                  value={current.smtpLogin || ""}
                  onChange={(e) => updateField("smtpLogin", e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sending Limits */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Sending Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Daily Limit</label>
                <input
                  type="number"
                  value={current.dailySendLimit || 300}
                  onChange={(e) => updateField("dailySendLimit", parseInt(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Weekly Limit</label>
                <input
                  type="number"
                  value={current.weeklySendLimit || 2000}
                  onChange={(e) => updateField("weeklySendLimit", parseInt(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Monthly Limit</label>
                <input
                  type="number"
                  value={current.monthlySendLimit || 8000}
                  onChange={(e) => updateField("monthlySendLimit", parseInt(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking & Opt-in */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Tracking & Opt-in</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={current.trackingEnabled ?? true}
                onChange={(e) => updateField("trackingEnabled", e.target.checked)}
                className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Enable Open Tracking</p>
                <p className="text-xs text-zinc-500">Track when recipients open emails</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={current.doubleOptIn ?? true}
                onChange={(e) => updateField("doubleOptIn", e.target.checked)}
                className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Double Opt-in</p>
                <p className="text-xs text-zinc-500">Require email confirmation for new subscribers</p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Webhook */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Webhook</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Webhook Secret</label>
              <input
                type="password"
                value={current.webhookSecret || ""}
                onChange={(e) => updateField("webhookSecret", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
              <p className="mt-1 text-[10px] text-zinc-400">
                Used to verify incoming webhooks from Brevo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
