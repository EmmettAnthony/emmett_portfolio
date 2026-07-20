"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquareQuote, TrendingUp, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

export function TestimonialAnalytics() {
  const t = useTranslations("testimonials.analytics");
  const { data, isLoading } = useQuery({
    queryKey: ["testimonial-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/testimonials/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>;
  }

  if (!data) return null;

  const stats = [
    { key: "total", label: t("total"), value: data.total, icon: MessageSquareQuote, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
    { key: "approved", label: t("approved"), value: data.approved, icon: CheckCircle, color: "text-green-500 bg-green-100 dark:bg-green-900/30" },
    { key: "featured", label: t("featured"), value: data.featured, icon: Star, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
    { key: "avgRating", label: t("avgRating"), value: data.averageRating, icon: TrendingUp, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30", suffix: t("outOf5") },
    { key: "archived", label: t("archived"), value: data.archived ?? 0, icon: Loader2, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.key}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">{s.label}</span>
              <div className={cn("rounded-lg p-2", s.color.split(" ").slice(1).join(" "))}>
                <s.icon className={cn("h-4 w-4", s.color.split(" ")[0])} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
              {s.value}{s.suffix || ""}
            </p>
            {s.key === "approved" && (
              <p className="mt-1 text-xs text-zinc-500">
                {data.approvalRate}% {t("approvalRate")} &middot; {data.pending} {t("pending")}
              </p>
            )}
          </div>
        ))}
      </div>

      {data.monthlyData?.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t("monthlySubmissions")}</h3>
          <div className="flex items-end gap-2">
            {data.monthlyData.map((m: { month: string; count: number }) => {
              const max = Math.max(...data.monthlyData.map((d: { count: number }) => d.count), 1);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-zinc-500">{m.count}</span>
                  <div className="w-full rounded-t-md bg-blue-500 transition-all dark:bg-blue-400"
                    style={{ height: `${(m.count / max) * 80}px`, minHeight: m.count > 0 ? 8 : 0 }} />
                  <span className="text-[10px] text-zinc-400">{m.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
