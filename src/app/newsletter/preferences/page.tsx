"use client";

import { useTranslations } from "@/lib/i18n";
import { Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import {
  Loader2,
  Mail,
  Save,
  AlertCircle,
  Bell,
  Megaphone,
  Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { SubscriberPreference } from "@/types/newsletter";

function PreferencesContent() {
  const t = useTranslations("newsletter.preferences");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const email = searchParams.get("email") ?? "";

  const [topics, setTopics] = useState("");
  const [frequency, setFrequency] = useState<"instant" | "daily" | "weekly" | "monthly">("weekly");
  const [promotions, setPromotions] = useState(true);
  const [newsletters, setNewsletters] = useState(true);
  const [blogUpdates, setBlogUpdates] = useState(true);
  const [initialized] = useState(false);

  const { isLoading, error } = useQuery({
    queryKey: ["newsletter-preferences", email],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/preferences?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("loadFailed"));
      }
      return res.json();
    },
    enabled: !!email,
    refetchOnWindowFocus: false,
  });

  const { data: _prefData } = useQuery<SubscriberPreference>({
    queryKey: ["newsletter-preferences-data", email],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/preferences?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("loadFailed"));
      }
      return res.json();
    },
    enabled: !!email,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      email: string;
      topics: string;
      emailFrequency: string;
      receivePromotions: boolean;
      receiveNewsletters: boolean;
      receiveBlogUpdates: boolean;
    }) => {
      const res = await fetch("/api/newsletter/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("saveFailed"));
      }
      return res.json();
    },
    onSuccess: () => {
      toast("success", t("savedSuccess"));
    },
    onError: (err) => {
      toast("error", err instanceof Error ? err.message : t("saveFailed"));
    },
  });

  const handleSave = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      saveMutation.mutate({
        email,
        topics,
        emailFrequency: frequency,
        receivePromotions: promotions,
        receiveNewsletters: newsletters,
        receiveBlogUpdates: blogUpdates,
      });
    },
    [email, topics, frequency, promotions, newsletters, blogUpdates, saveMutation]
  );

  const handleUnsubscribe = useCallback(() => {
    router.push(`/newsletter/unsubscribe?email=${encodeURIComponent(email)}`);
  }, [email, router]);

  if (!email) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("noEmail")}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("useEmailLink")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("loadFailed")}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("loadFailedMessage")}
          </p>
        </div>
      </div>
    );
  }

  const toggleClass =
    "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
          <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("subtitle")}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {isLoading && !initialized ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("emailAddress")}
              </label>
              <p className="mt-1 text-sm text-zinc-900 dark:text-white">{email}</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <label
                htmlFor="topics"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("topics")}
              </label>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {t("topicsHint")}
              </p>
              <input
                id="topics"
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder={t("topicsPlaceholder")}
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <label
                htmlFor="frequency"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("frequency")}
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="instant">{t("frequencyInstant")}</option>
                <option value="daily">{t("frequencyDaily")}</option>
                <option value="weekly">{t("frequencyWeekly")}</option>
                <option value="monthly">{t("frequencyMonthly")}</option>
              </select>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("emailTypes")}</h3>
              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("receivePromotions")}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {t("promotionsHint")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={promotions}
                    onClick={() => setPromotions((p) => !p)}
                    className={cn(toggleClass, promotions ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600")}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        promotions ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Newspaper className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("receiveNewsletters")}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {t("newslettersHint")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={newsletters}
                    onClick={() => setNewsletters((n) => !n)}
                    className={cn(toggleClass, newsletters ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600")}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        newsletters ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("receiveBlogUpdates")}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {t("blogUpdatesHint")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={blogUpdates}
                    onClick={() => setBlogUpdates((b) => !b)}
                    className={cn(toggleClass, blogUpdates ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600")}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        blogUpdates ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saveMutation.isPending ? t("saving") : t("save")}
            </button>
          </>
        )}
      </form>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={handleUnsubscribe}
          className="text-sm text-red-500 underline underline-offset-2 transition-colors hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          {t("unsubscribeAll")}
        </button>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    }>
      <PreferencesContent />
    </Suspense>
  );
}
