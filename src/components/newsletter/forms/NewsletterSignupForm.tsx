"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2, AlertCircle, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsletterSignupFormProps {
  source: string;
  className?: string;
  variant?: "inline" | "modal" | "sidebar";
  onSuccess?: () => void;
}

export function NewsletterSignupForm({
  source,
  className,
  variant = "inline",
  onSuccess,
}: NewsletterSignupFormProps) {
  const t = useTranslations("newsletter");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "rate_limited">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !gdprConsent) return;

      setStatus("loading");
      setMessage("");

      try {
        const res = await fetch("/api/newsletter/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            email: email.trim(),
            source,
            gdprConsent,
          }),
        });

        const data = await res.json();

        if (res.status === 429) {
          setStatus("rate_limited");
          setMessage(data.error ?? t("form.rateLimited"));
          return;
        }

        if (res.ok) {
          setStatus("success");
          setMessage(
            data.message === "Already subscribed"
              ? t("form.alreadySubscribed")
              : t("form.successMessage")
          );
          setName("");
          setEmail("");
          setGdprConsent(false);
          onSuccess?.();
        } else {
          setStatus("error");
          setMessage(data.error ?? t("form.error"));
        }
      } catch {
        setStatus("error");
        setMessage(t("form.networkError"));
      }
    },
    [email, name, source, gdprConsent, onSuccess, t]
  );

  const isCompact = variant === "sidebar";
  const inputClass =
    "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500";

  if (status === "success") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-4 dark:border-emerald-900/30 dark:from-emerald-900/10 dark:to-emerald-900/5",
          className
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {t("form.subscribed")}
          </p>
          <p className="mt-0.5 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(variant === "inline" && "space-y-3", variant === "sidebar" && "space-y-2.5", variant === "modal" && "space-y-4", className)}
    >
      {message && (
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm",
            status === "error" &&
              "border border-red-200 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400",
            status === "rate_limited" &&
              "border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400"
          )}
          role="alert"
        >
          {status === "rate_limited" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message}
        </div>
      )}

      {!isCompact && (
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("form.namePlaceholder")}
            className={cn(inputClass, "pl-10")}
          />
        </div>
      )}

      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("form.emailPlaceholder")}
          required
          className={cn(inputClass, "pl-10")}
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800">
        <input
          type="checkbox"
          checked={gdprConsent}
          onChange={(e) => setGdprConsent(e.target.checked)}
          required
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/50 dark:border-zinc-600"
        />
        <span className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t("form.gdpr")}{" "}
          <a href="/privacy" className="font-medium underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300">
            {t("form.privacyPolicy")}
          </a>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "loading" || !email || !gdprConsent}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50",
          isCompact ? "px-3 py-2 text-xs" : "px-4 py-2.5"
        )}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("form.subscribing")}
          </>
        ) : (
          <>{t("form.subscribe")}</>
        )}
      </button>
    </form>
  );
}
