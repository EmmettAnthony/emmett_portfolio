"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageCircle, Users, MessageSquare, Target, Star,
  Clock, Timer,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

type DatePreset = "7" | "30" | "90";

interface DailyStat {
  id: string;
  date: string;
  totalConversations: number;
  totalMessages: number;
  leadsGenerated: number;
  bookingsMade: number;
  questionsAsked: number;
  resolvedCount: number;
  escalatedCount: number;
  avgResponseTime: number;
  avgSessionDuration: number;
  satisfactionScore: number;
}

interface AnalyticsResponse {
  overview: {
    totalConversations: number;
    activeConversations: number;
    totalLeads: number;
    totalMessages: number;
    avgSatisfaction: number;
    conversionRate: number;
    welcomeTriggerCount: number;
    exitIntentTriggerCount: number;
    welcomeTriggerConversions: number;
    exitIntentConversions: number;
    welcomeTriggerLeadConversions: number;
    exitIntentLeadConversions: number;
    totalWelcomeTriggered: number;
    totalExitIntentTriggered: number;
  };
  dailyStats: DailyStat[];
  topTopics: { topic: string; count: number }[];
  conversationsOverTime: { date: string; count: number; messages: number; leads: number }[];
  triggerTrends: { date: string; welcomeTriggers: number; exitIntentTriggers: number }[];
  responseTimeData: { date: string; avgResponseTime: number; avgSessionDuration: number }[];
  satisfactionTrend: { date: string; satisfactionScore: number }[];
}

export function AnalyticsClient() {
  const t = useTranslations("dashboard.chatbotAnalytics");
  const [preset, setPreset] = useState<DatePreset>("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (useCustom && customStart && customEnd) {
      params.set("startDate", customStart);
      params.set("endDate", customEnd);
    } else {
      params.set("period", preset);
    }
    return `/api/chat/analytics?${params.toString()}`;
  }, [preset, customStart, customEnd, useCustom]);

  const { data, isLoading, error } = useQuery<AnalyticsResponse>({
    queryKey: ["chat-analytics", useCustom ? `${customStart}_${customEnd}` : preset],
    queryFn: async () => {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const handlePreset = (p: DatePreset) => {
    setPreset(p);
    setUseCustom(false);
  };

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
        <p className="text-sm text-red-600 dark:text-red-400">{t("failedToLoadAnalytics")}</p>
      </div>
    );
  }

  const { overview, topTopics, conversationsOverTime, triggerTrends, responseTimeData, satisfactionTrend } = data;

  const statCards = [
    { label: t("totalConversations"), value: overview.totalConversations.toLocaleString(), icon: MessageCircle, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
    { label: t("activeNow"), value: overview.activeConversations.toLocaleString(), icon: Users, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30" },
    { label: t("totalMessages"), value: overview.totalMessages.toLocaleString(), icon: MessageSquare, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
    { label: t("totalLeads"), value: overview.totalLeads.toLocaleString(), icon: Target, color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30" },
    { label: t("avgSatisfaction"), value: `${(overview.avgSatisfaction || 0).toFixed(1)}/5`, icon: Star, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30" },
    { label: t("conversionRate"), value: `${(overview.conversionRate || 0).toFixed(1)}%`, icon: Target, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30" },
    { label: t("welcomeTriggers"), value: overview.welcomeTriggerCount.toLocaleString(), icon: MessageCircle, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
    { label: t("exitIntentTriggers"), value: overview.exitIntentTriggerCount.toLocaleString(), icon: MessageCircle, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" },
  ];

  // Compute conversion rates
  const welcomeConvRate = overview.totalWelcomeTriggered > 0
    ? (overview.welcomeTriggerConversions / overview.totalWelcomeTriggered) * 100
    : 0;
  const exitConvRate = overview.totalExitIntentTriggered > 0
    ? (overview.exitIntentConversions / overview.totalExitIntentTriggered) * 100
    : 0;
  const welcomeLeadRate = overview.totalWelcomeTriggered > 0
    ? (overview.welcomeTriggerLeadConversions / overview.totalWelcomeTriggered) * 100
    : 0;
  const exitLeadRate = overview.totalExitIntentTriggered > 0
    ? (overview.exitIntentLeadConversions / overview.totalExitIntentTriggered) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
          {(["7", "30", "90"] as DatePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                !useCustom && preset === p
                  ? "bg-blue-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {p === "7" ? t("days7") : p === "30" ? t("days30") : t("days90")}
            </button>
          ))}
          <button
            onClick={() => setUseCustom(true)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              useCustom ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            {t("custom")}
          </button>
        </div>
        {useCustom && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <span className="text-xs text-zinc-500">{t("to")}</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{card.value}</p>
                <p className="text-[10px] text-zinc-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trigger Conversion Rates */}
      {overview.totalWelcomeTriggered > 0 || overview.totalExitIntentTriggered > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t("triggerConversionRates")}</h3>
          <p className="mb-4 text-xs text-zinc-500">
            {t("triggerConversionRatesDesc")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Welcome conversion */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {t("welcomeToMessage")}
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                  {welcomeConvRate.toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                {t("xOfYTriggeredReplied", { x: overview.welcomeTriggerConversions, y: overview.totalWelcomeTriggered })}
              </p>
              {overview.totalWelcomeTriggered > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200/50 dark:bg-emerald-900/20">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(welcomeConvRate, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Exit intent conversion */}
            <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                  {t("exitIntentToMessage")}
                </span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-300">
                  {exitConvRate.toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-[10px] text-orange-600/70 dark:text-orange-400/70">
                {t("xOfYTriggeredReplied", { x: overview.exitIntentConversions, y: overview.totalExitIntentTriggered })}
              </p>
              {overview.totalExitIntentTriggered > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-orange-200/50 dark:bg-orange-900/20">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${Math.min(exitConvRate, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Welcome → Lead */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {t("welcomeToLead")}
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
                  {welcomeLeadRate.toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                {t("xOfYBecameLeads", { x: overview.welcomeTriggerLeadConversions, y: overview.totalWelcomeTriggered })}
              </p>
              {overview.totalWelcomeTriggered > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200/50 dark:bg-emerald-900/20">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(welcomeLeadRate, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Exit Intent → Lead */}
            <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                  {t("exitIntentToLead")}
                </span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-300">
                  {exitLeadRate.toFixed(1)}%
                </span>
              </div>
              <p className="mt-1 text-[10px] text-orange-600/70 dark:text-orange-400/70">
                {t("xOfYBecameLeads", { x: overview.exitIntentLeadConversions, y: overview.totalExitIntentTriggered })}
              </p>
              {overview.totalExitIntentTriggered > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-orange-200/50 dark:bg-orange-900/20">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${Math.min(exitLeadRate, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Conversations Over Time */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t("conversationsOverTime")}</h3>
        {conversationsOverTime.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">{t("noConversationDataYet")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={conversationsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t("conversations")} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Leads Over Time */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t("leadsOverTime")}</h3>
        {conversationsOverTime.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">{t("noLeadDataYet")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={conversationsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="leads" fill="#22c55e" radius={[4, 4, 0, 0]} name={t("leads")} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Response Time & Session Duration */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("avgResponseTime")}</h3>
          </div>
          {responseTimeData.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">{t("noResponseTimeData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value: unknown) => [`${(value as number).toFixed(1)}s`, t("avgResponseTime")]}
                />
                <Line
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#8b5cf6" }}
                  activeDot={{ r: 5 }}
                  name={t("avgResponseTime")}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2">
            <Timer className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("avgSessionDuration")}</h3>
          </div>
          {responseTimeData.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">{t("noSessionDurationData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value: unknown) => [`${(value as number).toFixed(1)} min`, t("avgSessionDuration")]}
                />
                <defs>
                  <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="avgSessionDuration"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#sessionGradient)"
                  dot={{ r: 3, fill: "#06b6d4" }}
                  name={t("avgSessionDuration")}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Trigger Trends (Welcome vs Exit Intent) */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t("proactiveTriggerTrends")}</h3>
        <p className="mb-4 text-xs text-zinc-500">{t("proactiveTriggerTrendsDesc")}</p>
        {triggerTrends.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">{t("noTriggerDataYet")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={triggerTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
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

      {/* Satisfaction Trend */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("satisfactionScoreTrend")}</h3>
        </div>
        {satisfactionTrend.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">{t("noSatisfactionDataYet")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={satisfactionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }}
                labelStyle={{ fontWeight: 600 }}                  formatter={(value: unknown) => [`${(value as number).toFixed(1)}/5`, t("satisfaction")]}
              />
              <Line
                type="monotone"
                dataKey="satisfactionScore"
                stroke="#eab308"
                strokeWidth={2}
                dot={{ r: 3, fill: "#eab308" }}
                activeDot={{ r: 5 }}
                name={t("satisfactionScore")}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Topics */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t("topTopics")}</h3>
        {topTopics.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">{t("noTopicDataYet")}</p>
        ) : (
          <div className="space-y-3">
            {topTopics.map((t, i) => {
              const maxCount = topTopics[0].count;
              return (
                <div key={t.topic} className="flex items-center gap-3">
                  <span className="w-6 text-xs text-zinc-400 text-right">{i + 1}.</span>
                  <span className="w-32 text-sm text-zinc-700 dark:text-zinc-300 truncate">{t.topic}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                      style={{ width: `${(t.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">{t.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
