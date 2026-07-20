"use client";

import { useState } from "react";
import { Calendar, Clock, ExternalLink, CheckCircle2, Send, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";
import { cn } from "@/lib/utils";

export function BookingSection() {
  const t = useTranslations("booking");
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = t("consultation.nameRequired");
    if (!form.email.trim()) errors.email = t("consultation.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = t("consultation.emailInvalid");
    if (!form.preferredDate) errors.preferredDate = t("consultation.dateRequired");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", company: "", preferredDate: "", preferredTime: "", message: "" });
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <section className="border-t border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-900 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:border-zinc-800 dark:from-blue-950/20 dark:to-purple-950/20">
            {!showForm ? (
              <div className="grid md:grid-cols-2">
                {/* Left: Info */}
                <div className="p-8 sm:p-12">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-lg">
                    <Calendar className="h-6 w-6" />
                  </div>

                  <h2 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
                    {t("consultation.title")}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                    {t("consultation.description")}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {["feature1", "feature2", "feature3"].map((key) => (
                      <li key={key} className="flex items-center gap-3 text-sm text-muted-foreground dark:text-zinc-400">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                        {t(`consultation.${key}`)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: CTA */}
                <div className="flex flex-col items-center justify-center gap-3 p-8 sm:p-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-badge-info-bg text-badge-info-text">
                    <Clock className="h-8 w-8" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground dark:text-zinc-400">
                    {t("consultation.availability1")}
                    <br />
                    {t("consultation.availability2")}
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Calendar className="h-4 w-4" />
                    {t("consultation.cta")}
                  </button>
                  <button
                    onClick={() => window.open("https://calendar.app.google/wRyaaUEGemxPDZ4Y8", "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-blue-600"
                  >
                    {t("consultation.altCta")}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : status === "success" ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-zinc-900 dark:text-white">
                  {t("consultation.successTitle")}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground dark:text-zinc-400">
                  {t("consultation.successDescription")}
                </p>
                <button
                  onClick={() => { setShowForm(false); setStatus("idle"); }}
                  className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {t("consultation.bookAnother")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 sm:p-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {t("consultation.scheduleTitle")}
                    </h3>
                    <p className="text-sm text-zinc-500">{t("consultation.scheduleSubtitle")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-sm text-zinc-400 hover:text-muted-foreground"
                  >
                    {t("consultation.cancel")}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("consultation.nameLabel")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                          formErrors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                        )}
                        placeholder={t("consultation.namePlaceholder")}
                      />
                      {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("consultation.emailLabel")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                          formErrors.email ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                        )}
                        placeholder={t("consultation.emailPlaceholder")}
                      />
                      {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("consultation.phoneLabel")}</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        placeholder={t("consultation.phonePlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("consultation.companyLabel")}</label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        placeholder={t("consultation.companyPlaceholder")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("consultation.dateLabel")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.preferredDate}
                        onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))}
                        min={today}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white",
                          formErrors.preferredDate ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"
                        )}
                      />
                      {formErrors.preferredDate && <p className="mt-1 text-xs text-red-500">{formErrors.preferredDate}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("consultation.timeLabel")}</label>
                      <input
                        type="time"
                        value={form.preferredTime}
                        onChange={(e) => setForm((p) => ({ ...p, preferredTime: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("consultation.messageLabel")}</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      placeholder={t("consultation.messagePlaceholder")}
                    />
                  </div>
                </div>

                {status === "error" && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400" role="alert">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{t("consultation.error")}</span>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {t("consultation.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {status === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("consultation.submit")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
