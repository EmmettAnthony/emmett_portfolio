"use client";

import { useState } from "react";
import { Lock, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const t = useTranslations("admin.forgotPassword");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("somethingWentWrong"));
      } else {
        setSent(true);
      }
    } catch {
      setError(t("errorOccurred"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">{t("checkEmail")}</h1>
            <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400">
              {t.rich("emailSent", { email: () => <strong>{email}</strong> })}
            </p>
            <Link href="/admin/login" className="mt-6 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
              <ArrowLeft className="h-4 w-4" /> {t("backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-600" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("sending")}</>
              ) : (
                t("sendResetLink")
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground dark:text-zinc-400">
            {t("rememberPassword")}{" "}
            <Link href="/admin/login" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t("signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
