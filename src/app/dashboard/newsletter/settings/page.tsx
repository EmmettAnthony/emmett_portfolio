"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, startTransition } from "react";
import {
  Loader2,
  Save,
  User,
  Mail,
  Reply,
  SlidersHorizontal,
  Eye,
  MousePointerClick,
  Shield,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { updateNewsletterSettingsSchema } from "@/lib/validations/newsletter";
import type { NewsletterSettings } from "@/types/newsletter";
import SignupFormBuilder from "./SignupFormBuilder";

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/about": "About",
  "/blog": "Blog & Articles",
  "/contact": "Contact",
  "/portfolio": "Portfolio",
  "/services": "Services",
  "/testimonials": "Testimonials",
  "/resume": "Resume",
  "/book-consultation": "Book Consultation",
  "/search": "Search",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/cookies": "Cookie Policy",
  "/newsletter": "Newsletter Page",
};

interface SettingsForm {
  defaultSenderName: string;
  defaultSenderEmail: string;
  replyToEmail: string;
  dailySendLimit: number;
  weeklySendLimit: number;
  monthlySendLimit: number;
  trackOpens: boolean;
  trackClicks: boolean;
  doubleOptIn: boolean;
  gdprEnabled: boolean;
  unsubscribeFooter: string;
  footerHtml: string;
}

const defaultForm: SettingsForm = {
  defaultSenderName: "",
  defaultSenderEmail: "",
  replyToEmail: "",
  dailySendLimit: 1000,
  weeklySendLimit: 7000,
  monthlySendLimit: 30000,
  trackOpens: true,
  trackClicks: true,
  doubleOptIn: false,
  gdprEnabled: false,
  unsubscribeFooter: "",
  footerHtml: "",
};

export default function NewsletterSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  const { data, isLoading, error } = useQuery<NewsletterSettings>({
    queryKey: ["newsletter-settings"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (data && !initialized) {
      startTransition(() => {
        setForm({
        defaultSenderName: data.defaultSenderName ?? "",
        defaultSenderEmail: data.defaultSenderEmail ?? "",
        replyToEmail: data.replyToEmail ?? "",
        dailySendLimit: data.dailySendLimit ?? 1000,
        weeklySendLimit: data.weeklySendLimit ?? 7000,
        monthlySendLimit: data.monthlySendLimit ?? 30000,
        trackOpens: data.trackOpens ?? true,
        trackClicks: data.trackClicks ?? true,
        doubleOptIn: data.doubleOptIn ?? false,
        gdprEnabled: data.gdprEnabled ?? false,
        unsubscribeFooter: data.unsubscribeFooter ?? "",
        footerHtml: data.footerHtml ?? "",
      });
      setInitialized(true);
      });
    }
  }, [data, initialized]);

  const saveMutation = useMutation({
    mutationFn: async (formData: SettingsForm) => {
      const res = await fetch("/api/newsletter/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-settings"] });
      toast("success", "Settings saved successfully");
    },
    onError: () => toast("error", "Failed to save settings"),
  });

  const handleSave = () => {
    const result = updateNewsletterSettingsSchema.safeParse({
      ...form,
      defaultSenderEmail: form.defaultSenderEmail || null,
      replyToEmail: form.replyToEmail || null,
      unsubscribeFooter: form.unsubscribeFooter || null,
      footerHtml: form.footerHtml || null,
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
    saveMutation.mutate(form);
  };

  const updateField = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <SlidersHorizontal className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load settings</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Newsletter Settings</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Configure your newsletter delivery and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sender Settings */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Sender Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Default Sender Name</label>
              <input
                type="text"
                value={form.defaultSenderName}
                onChange={(e) => updateField("defaultSenderName", e.target.value)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                  errors.defaultSenderName ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                )}
                placeholder="Your Name"
              />
              {errors.defaultSenderName && <p className="mt-1 text-xs text-red-500">{errors.defaultSenderName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Default Sender Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={form.defaultSenderEmail}
                  onChange={(e) => updateField("defaultSenderEmail", e.target.value)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    errors.defaultSenderEmail ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="newsletter@example.com"
                />
              </div>
              {errors.defaultSenderEmail && <p className="mt-1 text-xs text-red-500">{errors.defaultSenderEmail}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Reply-to Email</label>
              <div className="relative">
                <Reply className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={form.replyToEmail}
                  onChange={(e) => updateField("replyToEmail", e.target.value)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                    errors.replyToEmail ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                  )}
                  placeholder="replies@example.com"
                />
              </div>
              {errors.replyToEmail && <p className="mt-1 text-xs text-red-500">{errors.replyToEmail}</p>}
            </div>
          </div>
        </div>

        {/* Send Limits */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Send Limits</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Daily Send Limit</label>
              <input
                type="number"
                min={1}
                value={form.dailySendLimit}
                onChange={(e) => updateField("dailySendLimit", parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Weekly Send Limit</label>
              <input
                type="number"
                min={1}
                value={form.weeklySendLimit}
                onChange={(e) => updateField("weeklySendLimit", parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Monthly Send Limit</label>
              <input
                type="number"
                min={1}
                value={form.monthlySendLimit}
                onChange={(e) => updateField("monthlySendLimit", parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Tracking */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Tracking</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Track Opens</p>
                  <p className="text-xs text-zinc-500">Track when recipients open emails</p>
                </div>
              </div>
              <button
                onClick={() => updateField("trackOpens", !form.trackOpens)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  form.trackOpens ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  form.trackOpens ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MousePointerClick className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Track Clicks</p>
                  <p className="text-xs text-zinc-500">Track when recipients click links</p>
                </div>
              </div>
              <button
                onClick={() => updateField("trackClicks", !form.trackClicks)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  form.trackClicks ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  form.trackClicks ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* GDPR */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">GDPR & Privacy</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Double Opt-In</p>
                <p className="text-xs text-zinc-500">Send confirmation email before subscribing</p>
              </div>
              <button
                onClick={() => updateField("doubleOptIn", !form.doubleOptIn)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  form.doubleOptIn ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  form.doubleOptIn ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">GDPR Enabled</p>
                <p className="text-xs text-zinc-500">Show GDPR consent checkbox on signup forms</p>
              </div>
              <button
                onClick={() => updateField("gdprEnabled", !form.gdprEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  form.gdprEnabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  form.gdprEnabled ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Settings */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Email Footer</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Unsubscribe Footer Text</label>
            <input
              type="text"
              value={form.unsubscribeFooter}
              onChange={(e) => updateField("unsubscribeFooter", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="If you no longer wish to receive these emails, you can unsubscribe here."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Custom Footer HTML</label>
            <textarea
              value={form.footerHtml}
              onChange={(e) => updateField("footerHtml", e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="<div>Your footer HTML here</div>"
            />
          </div>
        </div>
      </div>

      <SignupFormBuilder />

      {/* Popup Settings */}
      <PopupSettingsSection />
    </div>
  );
}

function PopupSettingsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings } = useQuery<NewsletterSettings>({
    queryKey: ["newsletter-settings"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/settings");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Extract or initialize popup config from signupFormConfig
  const formConfig = settings?.signupFormConfig as Record<string, unknown> | undefined;
  const savedPopupConfig = formConfig?.popupConfig as
    | { enabled?: boolean; defaultEnabled?: boolean; perPage?: Record<string, boolean> }
    | undefined;

  const [enabled, setEnabled] = useState(savedPopupConfig?.enabled ?? true);
  const [defaultEnabled, setDefaultEnabled] = useState(savedPopupConfig?.defaultEnabled ?? true);
  const [perPage, setPerPage] = useState<Record<string, boolean>>(
    savedPopupConfig?.perPage ?? {}
  );
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (savedPopupConfig && !initialized) {
      startTransition(() => {
        setEnabled(savedPopupConfig.enabled ?? true);
        setDefaultEnabled(savedPopupConfig.defaultEnabled ?? true);
        setPerPage(savedPopupConfig.perPage ?? {});
        setInitialized(true);
      });
    }
  }, [savedPopupConfig, initialized]);

  const saveMutation = useMutation({
    mutationFn: async (popupConfig: {
      enabled: boolean;
      defaultEnabled: boolean;
      perPage: Record<string, boolean>;
    }) => {
      // Merge with existing signupFormConfig
      const existing = (settings?.signupFormConfig as Record<string, unknown>) ?? {};
      const merged = { ...existing, popupConfig };

      const res = await fetch("/api/newsletter/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
        body: JSON.stringify({ signupFormConfig: merged } as any),
      });
      if (!res.ok) throw new Error("Failed to save popup settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-settings"] });
      toast("success", "Popup settings saved");
    },
    onError: () => toast("error", "Failed to save popup settings"),
  });

  const togglePage = (path: string) => {
    setPerPage((prev) => ({ ...prev, [path]: !(prev[path] ?? defaultEnabled) }));
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Newsletter Popup Settings
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Control which pages show the newsletter signup popup
          </p>
        </div>
        <button
          onClick={() =>
            saveMutation.mutate({
              enabled,
              defaultEnabled,
              perPage,
            })
          }
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save Popup Settings
        </button>
      </div>

      {/* Global toggle */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            Enable newsletter popup
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Master toggle — when disabled, the popup won&apos;t show on any page
          </p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            enabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {/* Default for unlisted pages */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            Default for all other pages
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Default behavior for pages not listed below
          </p>
        </div>
        <button
          onClick={() => setDefaultEnabled(!defaultEnabled)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            defaultEnabled ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-700"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              defaultEnabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {/* Per-page toggles */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(PAGE_LABELS).map(([path, label]) => {
          const isEnabled = perPage[path] ?? defaultEnabled;
          return (
            <button
              key={path}
              onClick={() => togglePage(path)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                isEnabled
                  ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
                  : "border-zinc-200 bg-transparent dark:border-zinc-700"
              )}
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                {label}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  isEnabled
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {isEnabled ? "On" : "Off"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
