"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageCircle,
  Target,
  Activity,
  TrendingUp,
  Zap,
  LogOut,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

type DatePreset = "7" | "30" | "90";

interface AnalyticsResponse {
  overview: {
    welcomeTriggerCount: number;
    exitIntentTriggerCount: number;
    welcomeTriggerConversions: number;
    exitIntentConversions: number;
    welcomeTriggerLeadConversions: number;
    exitIntentLeadConversions: number;
    totalWelcomeTriggered: number;
    totalExitIntentTriggered: number;
    totalConversations: number;
    totalLeads: number;
  };
  triggerTrends: { date: string; welcomeTriggers: number; exitIntentTriggers: number }[];
  conversationsOverTime: { date: string; count: number }[];
}

export function TriggersClient() {
  const t = useTranslations("dashboard.chatbotTriggers");
  const [preset, setPreset] = useState<DatePreset>("30");

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("period", preset);
    return `/api/chat/analytics?${params.toString()}`;
  }, [preset]);

  const { data, isLoading, error } = useQuery<AnalyticsResponse>({
    queryKey: ["chat-triggers", preset],
    queryFn: async () => {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error("Failed to fetch trigger data");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">
          {t("failedToLoadTriggerData")}
        </p>
      </div>
    );
  }

  const { overview, triggerTrends } = data;

  // ── Computed metrics ─────────────────────────────────────────────
  const totalTriggers = overview.welcomeTriggerCount + overview.exitIntentTriggerCount;
  const welcomeConvRate =
    overview.totalWelcomeTriggered > 0
      ? (overview.welcomeTriggerConversions / overview.totalWelcomeTriggered) * 100
      : 0;
  const exitConvRate =
    overview.totalExitIntentTriggered > 0
      ? (overview.exitIntentConversions / overview.totalExitIntentTriggered) * 100
      : 0;
  const welcomeLeadRate =
    overview.totalWelcomeTriggered > 0
      ? (overview.welcomeTriggerLeadConversions / overview.totalWelcomeTriggered) * 100
      : 0;
  const exitLeadRate =
    overview.totalExitIntentTriggered > 0
      ? (overview.exitIntentLeadConversions / overview.totalExitIntentTriggered) * 100
      : 0;

  const welcomeIsBetter = welcomeConvRate > exitConvRate;
  const bestTrigger = welcomeConvRate >= exitConvRate ? t("welcome") : t("exitIntent");

  // ── Side-by-side comparison data ──────────────────────────────────
  const comparisonData = [
    {
      metricKey: "totalTriggers",
      welcome: overview.welcomeTriggerCount,
      exitIntent: overview.exitIntentTriggerCount,
      isPercent: false,
    },
    {
      metricKey: "repliedToMessage",
      welcome: overview.welcomeTriggerConversions,
      exitIntent: overview.exitIntentConversions,
      isPercent: false,
    },
    {
      metricKey: "convertedToLead",
      welcome: overview.welcomeTriggerLeadConversions,
      exitIntent: overview.exitIntentLeadConversions,
      isPercent: false,
    },
    {
      metricKey: "messageRate",
      welcome: Math.round(welcomeConvRate * 10) / 10,
      exitIntent: Math.round(exitConvRate * 10) / 10,
      isPercent: true,
    },
    {
      metricKey: "leadRate",
      welcome: Math.round(welcomeLeadRate * 10) / 10,
      exitIntent: Math.round(exitLeadRate * 10) / 10,
      isPercent: true,
    },
  ];

  // ── Conversion rate chart data for visual comparison ──────────────
  const rateChartData = [
    {
      name: t("messageRate"),
      Welcome: Math.round(welcomeConvRate * 10) / 10,
      "Exit Intent": Math.round(exitConvRate * 10) / 10,
    },
    {
      name: t("leadRate"),
      Welcome: Math.round(welcomeLeadRate * 10) / 10,
      "Exit Intent": Math.round(exitLeadRate * 10) / 10,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date range picker */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
          {(["7", "30", "90"] as DatePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                preset === p
                  ? "bg-blue-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {p === "7" ? t("days7") : p === "30" ? t("days30") : t("days90")}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Triggers */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              {t("total")}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
            {totalTriggers.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {t("welcomeAndExitCount", { welcome: overview.welcomeTriggerCount.toLocaleString(), exitIntent: overview.exitIntentTriggerCount.toLocaleString() })}
          </p>
        </div>

        {/* Best Performer */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              {t("bestTrigger")}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
            {bestTrigger}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {t("messageRateValue", { rate: (welcomeIsBetter ? welcomeConvRate : exitConvRate).toFixed(1) })}
          </p>
        </div>

        {/* Welcome → Message rate */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              {t("welcome")}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
            {welcomeConvRate.toFixed(1)}%
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
            {t("xOfYReplied", { x: overview.welcomeTriggerConversions, y: overview.totalWelcomeTriggered })}
            {overview.totalWelcomeTriggered > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[10px]",
                  welcomeIsBetter ? "text-emerald-500" : "text-zinc-400"
                )}
              >
                <ArrowUpRight className="h-3 w-3" />
                {t("toMessage")}
              </span>
            )}
          </p>
          {overview.totalWelcomeTriggered > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(welcomeConvRate, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Exit Intent → Message rate */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
              <LogOut className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              {t("exitIntent")}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
            {exitConvRate.toFixed(1)}%
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
            {t("xOfYReplied", { x: overview.exitIntentConversions, y: overview.totalExitIntentTriggered })}
            {overview.totalExitIntentTriggered > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[10px]",
                  !welcomeIsBetter ? "text-orange-500" : "text-zinc-400"
                )}
              >
                <ArrowUpRight className="h-3 w-3" />
                {t("toMessage")}
              </span>
            )}
          </p>
          {overview.totalExitIntentTriggered > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/20">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${Math.min(exitConvRate, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Side-by-side comparison chart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {t("performanceComparison")}
          </h3>
        </div>
        <p className="mb-4 text-xs text-zinc-500">
          {t("performanceComparisonDesc")}
        </p>
        {overview.totalWelcomeTriggered === 0 && overview.totalExitIntentTriggered === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            {t("noTriggerDataForPeriod")}
          </p>
        ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <th className="px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{t("metric")}</th>
                <th className="px-4 py-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="h-3 w-3" />
                    {t("welcome")}
                  </div>
                </th>
                <th className="px-4 py-2.5 text-xs font-medium text-orange-600 dark:text-orange-400">
                  <div className="flex items-center gap-1.5">
                    <LogOut className="h-3 w-3" />
                    {t("exitIntent")}
                  </div>
                </th>
                <th className="hidden px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  {t("winner")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {comparisonData.map((row) => {
                const isWelcomeWinner =
                  typeof row.welcome === "number" && typeof row.exitIntent === "number"
                    ? row.welcome >= row.exitIntent
                    : false;
                const isTie = row.welcome === row.exitIntent;
                return (
                  <tr
                    key={row.metricKey}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {t(row.metricKey)}
                    </td>
                    <td className="px-4 py-2.5 text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {typeof row.welcome === "number"
                          ? row.isPercent
                            ? `${row.welcome.toFixed(1)}%`
                            : row.welcome.toLocaleString()
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {typeof row.exitIntent === "number"
                          ? row.isPercent
                            ? `${row.exitIntent.toFixed(1)}%`
                            : row.exitIntent.toLocaleString()
                          : "—"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">
                      {isTie ? (
                        <span className="text-[10px] text-zinc-400">{t("tie")}</span>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-medium",
                            isWelcomeWinner
                              ? "text-emerald-500"
                              : "text-orange-500"
                          )}
                        >
                          {isWelcomeWinner ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" />
                              {t("welcome")}
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="h-3 w-3" />
                              {t("exitIntent")}
                            </>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Conversion rate comparison chart */}
      {overview.totalWelcomeTriggered > 0 && overview.totalExitIntentTriggered > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {t("conversionRateComparison")}
            </h3>
          </div>
          <p className="mb-4 text-xs text-zinc-500">
            {t("conversionRateComparisonDesc")}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rateChartData} barSize={48} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value: unknown) => [`${(value as number).toFixed(1)}%`]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="Welcome"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name={t("welcome")}
              />
              <Bar
                dataKey="Exit Intent"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                name={t("exitIntent")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trigger trends over time */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {t("triggerTrendsOverTime")}
          </h3>
        </div>
        <p className="mb-4 text-xs text-zinc-500">
          {t("triggerTrendsOverTimeDesc")}
        </p>
        {triggerTrends.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {t("noTriggerDataForPeriod")}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={triggerTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="welcomeTriggers"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name={t("welcomeTriggers")}
                stackId="a"
              />
              <Bar
                dataKey="exitIntentTriggers"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                name={t("exitIntentTriggers")}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Lead conversion summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {t("leadConversionSummary")}
          </h3>
        </div>
        <p className="mb-4 text-xs text-zinc-500">
          {t("leadConversionSummaryDesc")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Welcome leads */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {t("welcomeToLead")}
                </p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                  {t("xLeadsFromYWelcome", { x: overview.welcomeTriggerLeadConversions, y: overview.totalWelcomeTriggered })}
                </p>
              </div>
              <span className="ml-auto text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {welcomeLeadRate.toFixed(1)}%
              </span>
            </div>
            {overview.totalWelcomeTriggered > 0 && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-emerald-200/50 dark:bg-emerald-900/20">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(welcomeLeadRate, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Exit intent leads */}
          <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <LogOut className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  {t("exitIntentToLead")}
                </p>
                <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70">
                  {t("xLeadsFromYExitIntent", { x: overview.exitIntentLeadConversions, y: overview.totalExitIntentTriggered })}
                </p>
              </div>
              <span className="ml-auto text-lg font-bold text-orange-600 dark:text-orange-400">
                {exitLeadRate.toFixed(1)}%
              </span>
            </div>
            {overview.totalExitIntentTriggered > 0 && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-orange-200/50 dark:bg-orange-900/20">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{ width: `${Math.min(exitLeadRate, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
