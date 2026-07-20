"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Eye, ExternalLink } from "lucide-react";
import { ChatTriggerPreview } from "@/components/dashboard/ChatTriggerPreview";
import { WidgetLivePreview } from "@/components/dashboard/WidgetLivePreview";
import { useTranslations } from "@/lib/i18n";

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "groq", label: "Groq" },
  { value: "ollama", label: "Ollama" },
  { value: "lmstudio", label: "LM Studio" },
];

const WIDGET_SIZES = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

interface SettingsData {
  id: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
  blockedWords: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  maxConversationLength: number;
  enableFileSearch: boolean;
  enableLeadCapture: boolean;
  enableBooking: boolean;
  enableHumanHandoff: boolean;
  enableMultilingual: boolean;
  enableAnalytics: boolean;
  enableWelcomeTrigger: boolean;
  welcomeDelayMs: number;
  enableExitIntent: boolean;
  exitIntentMessage: string;
  widgetPosition: string;
  widgetColor: string;
  widgetTitle: string;
  widgetSubtitle: string;
  widgetAvatar: string | null;
  widgetSize: string;
  enabled: boolean;
}

export function SettingsClient({ settings }: { settings: SettingsData }) {
  const t = useTranslations("dashboard.chatbotSettings");
  const [form, setForm] = useState<SettingsData>(settings);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"welcome" | "exit-intent">("welcome");
  const [suggestionsInput, setSuggestionsInput] = useState("");
  const [blockedWordsInput, setBlockedWordsInput] = useState("");

  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/chat/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: form.provider,
          model: form.model,
          temperature: form.temperature,
          maxTokens: form.maxTokens,
          systemPrompt: form.systemPrompt,
          welcomeMessage: form.welcomeMessage,
          suggestedQuestions: form.suggestedQuestions,
          blockedWords: form.blockedWords,
          rateLimitPerMinute: form.rateLimitPerMinute,
          rateLimitPerDay: form.rateLimitPerDay,
          maxConversationLength: form.maxConversationLength,
          enableFileSearch: form.enableFileSearch,
          enableLeadCapture: form.enableLeadCapture,
          enableBooking: form.enableBooking,
          enableHumanHandoff: form.enableHumanHandoff,
          enableMultilingual: form.enableMultilingual,
          enableAnalytics: form.enableAnalytics,
          enableWelcomeTrigger: form.enableWelcomeTrigger,
          welcomeDelayMs: form.welcomeDelayMs,
          enableExitIntent: form.enableExitIntent,
          exitIntentMessage: form.exitIntentMessage,
          widgetPosition: form.widgetPosition,
          widgetColor: form.widgetColor,
          widgetTitle: form.widgetTitle,
          widgetSubtitle: form.widgetSubtitle,
          widgetAvatar: form.widgetAvatar,
          widgetSize: form.widgetSize,
          enabled: form.enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success(t("settingsSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToSaveSettings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Provider */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("aiProvider")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("aiProviderDesc")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("provider")}</label>
            <select value={form.provider} onChange={(e) => update("provider", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
              {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("model")}</label>
            <input type="text" value={form.model} onChange={(e) => update("model", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("temperatureValue", { value: form.temperature })}</label>
            <input type="range" min="0" max="2" step="0.1" value={form.temperature} onChange={(e) => update("temperature", parseFloat(e.target.value))}
              className="mt-1 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("maxTokens")}</label>
            <input type="number" value={form.maxTokens} onChange={(e) => update("maxTokens", parseInt(e.target.value))}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
        </div>
      </section>

      {/* System Prompt */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("systemPrompt")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("systemPromptDesc")}</p>
        <textarea value={form.systemPrompt} onChange={(e) => update("systemPrompt", e.target.value)} rows={6}
          className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
      </section>

      {/* Chat Behavior */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("chatBehavior")}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("welcomeMessage")}</label>
            <input type="text" value={form.welcomeMessage} onChange={(e) => update("welcomeMessage", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("suggestedQuestions")}</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {form.suggestedQuestions.map((q, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {q}
                  <button onClick={() => update("suggestedQuestions", form.suggestedQuestions.filter((_, j) => j !== i))} className="text-blue-500 hover:text-blue-700">&times;</button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input type="text" value={suggestionsInput} onChange={(e) => setSuggestionsInput(e.target.value)} placeholder={t("typeAQuestionAndAdd")}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (suggestionsInput.trim()) { update("suggestedQuestions", [...form.suggestedQuestions, suggestionsInput.trim()]); setSuggestionsInput(""); } } }} />
              <button onClick={() => { if (suggestionsInput.trim()) { update("suggestedQuestions", [...form.suggestedQuestions, suggestionsInput.trim()]); setSuggestionsInput(""); } }}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">{t("add")}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("blockedWords")}</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {form.blockedWords.map((w, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {w}
                  <button onClick={() => update("blockedWords", form.blockedWords.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">&times;</button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input type="text" value={blockedWordsInput} onChange={(e) => setBlockedWordsInput(e.target.value)} placeholder={t("typeAWordAndAdd")}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (blockedWordsInput.trim()) { update("blockedWords", [...form.blockedWords, blockedWordsInput.trim()]); setBlockedWordsInput(""); } } }} />
              <button onClick={() => { if (blockedWordsInput.trim()) { update("blockedWords", [...form.blockedWords, blockedWordsInput.trim()]); setBlockedWordsInput(""); } }}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">{t("add")}</button>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("rateLimits")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("perMinute")}</label>
            <input type="number" value={form.rateLimitPerMinute} onChange={(e) => update("rateLimitPerMinute", parseInt(e.target.value))}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("perDay")}</label>
            <input type="number" value={form.rateLimitPerDay} onChange={(e) => update("rateLimitPerDay", parseInt(e.target.value))}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("maxConversationLength")}</label>
            <input type="number" value={form.maxConversationLength} onChange={(e) => update("maxConversationLength", parseInt(e.target.value))}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
        </div>
      </section>

      {/* Feature Toggles */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("features")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { key: "enableFileSearch", label: t("fileSearch") },
            { key: "enableLeadCapture", label: t("leadCapture") },
            { key: "enableBooking", label: t("booking") },
            { key: "enableHumanHandoff", label: t("humanHandoff") },
            { key: "enableMultilingual", label: t("multilingual") },
            { key: "enableAnalytics", label: t("analytics") },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic form key access */}
              <input type="checkbox" checked={(form as Record<string, unknown>)[key] as boolean} onChange={(e) => update(key as keyof SettingsData, e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Proactive Triggers */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("proactiveTriggers")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{t("proactiveTriggersDesc")}</p>
          </div>
          <ChatTriggerPreview
            open={showPreview}
            onClose={() => setShowPreview(false)}
            welcomeMessage={form.welcomeMessage}
            exitIntentMessage={form.exitIntentMessage}
            widgetColor={form.widgetColor}
            widgetTitle={form.widgetTitle}
            widgetSubtitle={form.widgetSubtitle}
            welcomeDelayMs={form.welcomeDelayMs}
            widgetPosition={form.widgetPosition as "right" | "left"}
            widgetSize={form.widgetSize as "sm" | "md" | "lg"}
            suggestedQuestions={form.suggestedQuestions}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        </div>
        <div className="mt-4 space-y-4">
              {/* Preview & Welcome Trigger header */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("testTheExperience")}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPreviewMode("welcome");
                    setShowPreview(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t("preview")}
                </button>
              </div>
            </div>
            <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-zinc-500">
                  {t("sendTriggerToLiveSite")}
                </p>
                <button
                  onClick={() => {
                    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                    window.open(`${siteUrl}/?chat-test=welcome`, "_blank", "noopener,noreferrer");
                    toast.success(t("openingLivePreview"));
                  }}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("sendTest")}
                </button>
              </div>
            </div>
          </div>

          {/* Welcome Trigger */}
          <div className="flex items-start gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <label className="flex items-center gap-3 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enableWelcomeTrigger}
                onChange={(e) => update("enableWelcomeTrigger", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600"
              />
              <div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("timedWelcome")}</span>
                <p className="text-xs text-zinc-500 mt-0.5">{t("timedWelcomeDesc")}</p>
              </div>
            </label>
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-zinc-500 mb-1">{t("delayMs")}</label>
              <input
                type="number"
                value={form.welcomeDelayMs}
                onChange={(e) => update("welcomeDelayMs", parseInt(e.target.value) || 15000)}
                min={3000}
                max={120000}
                step={1000}
                disabled={!form.enableWelcomeTrigger}
                className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Exit Intent */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex items-start justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={form.enableExitIntent}
                  onChange={(e) => update("enableExitIntent", e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("exitIntentDetection")}</span>
                  <p className="text-xs text-zinc-500 mt-0.5">{t("exitIntentDetectionDesc")}</p>
                </div>
              </label>
              <button
                onClick={() => {
                  setPreviewMode("exit-intent");
                  setShowPreview(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                <Eye className="h-3.5 w-3.5" />
                {t("previewExitIntent")}
              </button>
            </div>
            <div className="ml-7 mt-3">
              <label className="block text-xs font-medium text-zinc-500 mb-1">{t("exitIntentMessage")}</label>
              <textarea
                value={form.exitIntentMessage}
                onChange={(e) => update("exitIntentMessage", e.target.value)}
                rows={3}
                disabled={!form.enableExitIntent}
                placeholder={t("exitIntentMessagePlaceholder")}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Widget Appearance */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("widgetAppearance")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("widgetAppearanceDesc")}</p>

        {/* Live preview */}
        <div className="mt-4">
          <WidgetLivePreview
            widgetPosition={form.widgetPosition as "right" | "left"}
            widgetColor={form.widgetColor}
            widgetTitle={form.widgetTitle}
            widgetSubtitle={form.widgetSubtitle}
            widgetSize={form.widgetSize as "sm" | "md" | "lg"}
            enabled={form.enabled}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("widgetTitle")}</label>
            <input type="text" value={form.widgetTitle} onChange={(e) => update("widgetTitle", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("widgetSubtitle")}</label>
            <input type="text" value={form.widgetSubtitle} onChange={(e) => update("widgetSubtitle", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("position")}</label>
            <select value={form.widgetPosition} onChange={(e) => update("widgetPosition", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
              <option value="right">{t("right")}</option>
              <option value="left">{t("left")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("size")}</label>
            <select value={form.widgetSize} onChange={(e) => update("widgetSize", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
              {WIDGET_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("widgetColor")}</label>
            <div className="mt-1 flex items-center gap-3">
              <input type="color" value={form.widgetColor} onChange={(e) => update("widgetColor", e.target.value)} className="h-9 w-9 rounded cursor-pointer" />
              <input type="text" value={form.widgetColor} onChange={(e) => update("widgetColor", e.target.value)}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700 w-full">
              <input type="checkbox" checked={form.enabled} onChange={(e) => update("enabled", e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-600" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("chatbotEnabled")}</span>
            </label>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? t("saving") : t("saveSettings")}
        </button>
      </div>
    </div>
  );
}
