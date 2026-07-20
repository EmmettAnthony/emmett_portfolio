"use client";

import { useTranslations } from "@/lib/i18n";
import { Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ThumbsDown,
  Home,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface SubscriberInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function UnsubscribeContent() {
  const t = useTranslations("newsletter.unsubscribe");
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const email = searchParams.get("email") ?? "";

  const reasons = [
    { value: "too_many", label: t("tooManyEmails") },
    { value: "not_relevant", label: t("notRelevant") },
    { value: "no_longer_interested", label: t("noLongerInterested") },
    { value: "other", label: t("other") },
  ];

  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [unsubscribed, setUnsubscribed] = useState(false);
  const campaignId = searchParams.get("campaignId") ?? "";

  const { data: subscriber, isLoading, error } = useQuery<SubscriberInfo>({
    queryKey: ["subscriber-info", email],
    queryFn: async () => {
      const res = await fetch(`/api/newsletter/subscribers?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("failedToLoad"));
      }
      return res.json();
    },
    enabled: !!email,
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (payload: { email: string; reason: string; detail: string; campaignId?: string }) => {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("failedToUnsubscribe"));
      }
      return res.json();
    },
    onSuccess: () => {
      setUnsubscribed(true);
      toast("success", t("unsubscribedToast"));
    },
    onError: (err) => {
      toast("error", err instanceof Error ? err.message : t("unsubscribedError"));
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      unsubscribeMutation.mutate({ email, reason, detail, campaignId });
    },
    [email, reason, detail, unsubscribeMutation, campaignId]
  );

  const handleResubscribe = useCallback(async () => {
    try {
      const res = await fetch("/api/newsletter/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: subscriber?.firstName ?? "",
          lastName: subscriber?.lastName ?? "",
          source: "manual_import",
        }),
      });
      if (!res.ok) throw new Error("Failed to re-subscribe");
      toast("success", t("resubscribed"));
      setUnsubscribed(false);
    } catch {
      toast("error", t("resubscribeFailed"));
    }
  }, [email, subscriber, toast, t]);

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
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("somethingWentWrong")}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {t("tryAgainOrContact")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {unsubscribed ? (
          <>
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("unsubscribed")}</h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {t("noMoreEmails")}
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleResubscribe}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
              >
                <RotateCcw className="h-4 w-4" />
                {t("resubscribe")}
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
              >
                <Home className="h-4 w-4" />
                {t("returnHome")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <ThumbsDown className="mx-auto mb-3 h-10 w-10 text-zinc-400" />
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("unsubscribe")}</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {t("confirmMessage")}
              </p>
              {isLoading ? (
                <div className="mt-4 h-5 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800 mx-auto" />
              ) : subscriber ? (
                <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                  {subscriber.firstName} {subscriber.lastName} ({email})
                </p>
              ) : (
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                  {t("reasonForLeaving")}
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="">{t("selectReason")}</option>
                  {reasons.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {reason === "other" && (
                <div>
                  <label htmlFor="detail" className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                    {t("tellUsMore")}
                  </label>
                  <textarea
                    id="detail"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder={t("feedbackHelps")}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={unsubscribeMutation.isPending}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {unsubscribeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsDown className="h-4 w-4" />
                )}
                {unsubscribeMutation.isPending ? t("unsubscribing") : t("confirmUnsubscribe")}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-muted-foreground"
              >
                {t("keepSubscribed")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-lg px-4 py-20">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
