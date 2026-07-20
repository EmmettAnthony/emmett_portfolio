"use client";

import { useState, useEffect, startTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Copy, Check, Eye, Code } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { NewsletterSettings } from "@/types/newsletter";

interface FormConfig {
  fields: { key: string; label: string; enabled: boolean; required: boolean }[];
  buttonText: string;
  buttonColor: string;
  borderRadius: string;
  redirectUrl: string;
  showGDPR: boolean;
}

const DEFAULT_FIELDS = [
  { key: "firstName", label: "First Name", enabled: true, required: false },
  { key: "lastName", label: "Last Name", enabled: false, required: false },
  { key: "phone", label: "Phone", enabled: false, required: false },
  { key: "company", label: "Company", enabled: false, required: false },
  { key: "country", label: "Country", enabled: false, required: false },
];

const defaultConfig: FormConfig = {
  fields: DEFAULT_FIELDS,
  buttonText: "Subscribe",
  buttonColor: "#2563eb",
  borderRadius: "12",
  redirectUrl: "",
  showGDPR: true,
};

export default function SignupFormBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEmbed, setShowEmbed] = useState(false);
  const [config, setConfig] = useState<FormConfig>(defaultConfig);
  const [copied, setCopied] = useState(false);

  const { data: settings } = useQuery<NewsletterSettings>({
    queryKey: ["newsletter-settings"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/settings");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings?.signupFormConfig) {
      const saved = settings.signupFormConfig as unknown as FormConfig;
      startTransition(() => {
        setConfig({
          fields: DEFAULT_FIELDS.map((f) => {
            const savedField = saved.fields?.find((sf: { key: string }) => sf.key === f.key);
            return savedField || f;
          }),
          buttonText: saved.buttonText || defaultConfig.buttonText,
          buttonColor: saved.buttonColor || defaultConfig.buttonColor,
          borderRadius: saved.borderRadius || defaultConfig.borderRadius,
          redirectUrl: saved.redirectUrl || "",
          showGDPR: saved.showGDPR ?? true,
        });
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (formConfig: FormConfig) => {
      const res = await fetch("/api/newsletter/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
        body: JSON.stringify({ signupFormConfig: formConfig } as any),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-settings"] });
      toast("success", "Form saved");
    },
    onError: () => toast("error", "Failed to save form"),
  });

  const toggleField = (key: string, prop: "enabled" | "required") => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.key === key ? { ...f, [prop]: !f[prop] } : f)),
    }));
  };

  const embedCode = `<form action="${typeof window !== "undefined" ? window.location.origin : ""}/api/newsletter/signup" method="POST" style="display:flex;flex-direction:column;gap:8px;max-width:400px;">
  ${config.fields.filter((f) => f.enabled).map((f) => `  <input type="text" name="${f.key}" placeholder="${f.label}"${f.required ? " required" : ""} style="padding:10px 14px;border:1px solid #d4d4d8;border-radius:${config.borderRadius}px;font-size:14px;" />`).join("\n")}
  <button type="submit" style="padding:10px 16px;background:${config.buttonColor};color:white;border:none;border-radius:${config.borderRadius}px;font-size:14px;font-weight:600;cursor:pointer;">${config.buttonText}</button>
${config.showGDPR ? '  <label style="font-size:12px;color:#71717a;display:flex;align-items:center;gap:6px;"><input type="checkbox" name="gdprConsent" value="true" required /> I agree to receive emails</label>' : ""}
</form>`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Signup Form Builder</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEmbed(!showEmbed)} className="flex items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">
            <Code className="h-3.5 w-3.5" /> {showEmbed ? "Hide" : "Embed"} Code
          </button>
          <button onClick={() => saveMutation.mutate(config)} disabled={saveMutation.isPending} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-3 py-2 text-xs font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50">
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form Builder */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Form Fields</h3>
          <div className="space-y-3">
            {config.fields.map((field) => (
              <div key={field.key} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                <span className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">{field.label}</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <input type="checkbox" checked={field.enabled} onChange={() => toggleField(field.key, "enabled")} className="rounded border-zinc-300 text-blue-600" />
                    Show
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={() => toggleField(field.key, "required")} className="rounded border-zinc-300 text-blue-600" />
                    Required
                  </label>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold text-zinc-900 dark:text-white">Style & Behavior</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Button Text</label>
              <input value={config.buttonText} onChange={(e) => setConfig((p) => ({ ...p, buttonText: e.target.value }))} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Button Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={config.buttonColor} onChange={(e) => setConfig((p) => ({ ...p, buttonColor: e.target.value }))} className="h-9 w-9 cursor-pointer rounded-lg border border-zinc-300" />
                  <span className="text-xs text-zinc-500">{config.buttonColor}</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Border Radius (px)</label>
                <input type="number" value={config.borderRadius} onChange={(e) => setConfig((p) => ({ ...p, borderRadius: e.target.value }))} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" min="0" max="24" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Redirect URL (after signup, optional)</label>
              <input value={config.redirectUrl} onChange={(e) => setConfig((p) => ({ ...p, redirectUrl: e.target.value }))} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder="https://example.com/thank-you" />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-muted-foreground">
              <input type="checkbox" checked={config.showGDPR} onChange={(e) => setConfig((p) => ({ ...p, showGDPR: e.target.checked }))} className="rounded border-zinc-300 text-blue-600" />
              Show GDPR consent checkbox
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Preview</h3>
          </div>
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-700 dark:bg-zinc-800/30">
            <div className="w-full max-w-sm space-y-3" style={{ fontFamily: "system-ui, sans-serif" }}>
              {config.fields.filter((f) => f.enabled).map((f) => (
                <input
                  key={f.key}
                  type="text"
                  placeholder={f.label}
                  disabled
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
              ))}
              <button
                disabled
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: config.buttonColor, borderRadius: `${config.borderRadius}px` }}
              >
                {config.buttonText}
              </button>
              {config.showGDPR && (
                <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <input type="checkbox" disabled className="rounded border-zinc-300" />
                  I agree to receive emails
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      {showEmbed && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Embed Code</h3>
            <button
              onClick={() => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy HTML"}
            </button>
          </div>
          <p className="mb-2 text-xs text-zinc-500">Paste this HTML anywhere on your website to embed the signup form:</p>
          <pre className="max-h-64 overflow-auto rounded-xl bg-zinc-50 p-4 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground"><code>{embedCode}</code></pre>
        </div>
      )}
    </div>
  );
}
