"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Loader2, Send, CheckCircle, Phone, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsProvider";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

interface ServiceInquiryFormProps {
  serviceId?: string;
  serviceName?: string;
}

export function ServiceInquiryForm({ serviceId, serviceName }: ServiceInquiryFormProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const settings = useSiteSettings();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    budget: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      toast("error", t("services.form.validation.required"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/services/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          serviceId: serviceId ?? null,
          serviceName: serviceName ?? null,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit inquiry");
      toast("success", t("services.form.success"));
      setSubmitted(true);
    } catch {
      toast("error", t("services.form.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="mt-6 text-xl font-semibold text-zinc-900 dark:text-white">{t("services.form.successTitle")}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground dark:text-zinc-400">
          {t("services.form.successDescription")}
        </p>
      </div>
    );
  }

  return (
    <AnimateOnScroll>
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("services.form.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400">
          {t("services.form.description")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t("services.form.fullName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                placeholder={t("contact.form.namePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t("services.form.email")} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                placeholder={t("contact.form.emailPlaceholder")}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("services.form.phone")}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                placeholder={t("contact.form.phonePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("services.form.company")}</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                placeholder={t("contact.form.companyPlaceholder")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t("services.form.budget")}</label>
            <select
              value={form.budget}
              onChange={(e) => updateField("budget", e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">{t("services.form.budgetPlaceholder")}</option>
              <option value="under-1000">{t("services.form.budgetUnder1000")}</option>
              <option value="1000-5000">{t("services.form.budget1000to5000")}</option>
              <option value="5000-10000">{t("services.form.budget5000to10000")}</option>
              <option value="10000-25000">{t("services.form.budget10000to25000")}</option>
              <option value="25000+">{t("services.form.budget25000plus")}</option>
              <option value="not-sure">{t("services.form.budgetNotSure")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t("services.form.details")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
              required
              rows={5}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder={t("services.form.detailsPlaceholder")}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t("services.form.submit")}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <a
            href={`tel:${settings.phone}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
          >
            <Phone className="h-4 w-4" />
            {settings.phone}
          </a>
          {settings.phone && (
            <a
              href={`https://wa.me/${settings.phone}?text=${encodeURIComponent(`Hi, I'm interested in ${serviceName || "your services"}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              <MessageCircle className="h-4 w-4" />
              {t("services.form.whatsapp")}
            </a>
          )}
        </div>
      </div>
    </AnimateOnScroll>
  );
}
