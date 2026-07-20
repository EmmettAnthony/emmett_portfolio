"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart3,
  Users,
  Mail,
  UserPlus,
  UserX,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  MousePointerClick,
  BellRing,
  XCircle,
  CheckCircle2,
  Eye,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { StatsCardSkeleton } from "@/components/ui/newsletter/Skeleton";
import type { NewsletterAnalytics, PopupAnalyticsData } from "@/types/newsletter";

const dateRanges = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "All Time", value: "all" },
];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic callback type
function renderCustomizedLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");

  const { data, isLoading, error } = useQuery<NewsletterAnalytics>({
    queryKey: ["newsletter-analytics", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(`/api/newsletter/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const { data: popupData, isLoading: popupLoading } = useQuery<PopupAnalyticsData>({
    queryKey: ["newsletter-popup-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/popup-analytics");
      if (!res.ok) throw new Error("Failed to fetch popup analytics");
      return res.json();
    },
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <BarChart3 className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load analytics</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Subscribers",
      value: data?.totalSubscribers ?? 0,
      icon: Users,
      change: null,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Active Subscribers",
      value: data?.activeSubscribers ?? 0,
      icon: Mail,
      change: null,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      label: "New This Month",
      value: data?.newSubscribersThisMonth ?? 0,
      icon: UserPlus,
      change: "up" as const,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
    },
    {
      label: "Unsubscribed",
      value: data?.unsubscribedThisMonth ?? 0,
      icon: UserX,
      change: "down" as const,
      color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    },
    {
      label: "Bounced",
      value: data?.bouncedThisMonth ?? 0,
      icon: AlertTriangle,
      change: null,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ];

  const keyRates = [
    {
      label: "Open Rate",
      value: data ? `${(data.overallOpenRate * 100).toFixed(1)}%` : "0%",
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Click Rate",
      value: data ? `${(data.overallClickRate * 100).toFixed(1)}%` : "0%",
      icon: MousePointerClick,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Bounce Rate",
      value: data ? `${(data.overallBounceRate * 100).toFixed(1)}%` : "0%",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Unsubscribe Rate",
      value: data ? `${(data.overallUnsubscribeRate * 100).toFixed(1)}%` : "0%",
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  // ── Popup analytics ──────────────────────────────────────────────────────
  const popupMetrics = [
    {
      label: "Popup Shown",
      value: popupData?.totalShown ?? 0,
      today: popupData?.todayShown ?? 0,
      icon: Eye,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Popup Dismissed",
      value: popupData?.totalDismissed ?? 0,
      today: popupData?.todayDismissed ?? 0,
      icon: XCircle,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "Conversions (Signups)",
      value: popupData?.totalConverted ?? 0,
      today: popupData?.todayConverted ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      label: "Conversion Rate",
      value: popupData ? `${(popupData.conversionRate * 100).toFixed(1)}%` : "0%",
      today: null,
      icon: BellRing,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
    },
    {
      label: "Dismiss Rate",
      value: popupData ? `${(popupData.dismissRate * 100).toFixed(1)}%` : "0%",
      today: null,
      icon: TrendingDown,
      color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track your newsletter performance
          </p>
        </div>
        <div className="flex gap-2">
          {dateRanges.map((dr) => (
            <button
              key={dr.value}
              onClick={() => setDateRange(dr.value)}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                dateRange === dr.value
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-300 text-muted-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {dr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          <StatsCardSkeleton count={5} />
          <div className="h-72 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
      ) : (
        <>
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{metric.label}</p>
                    <div className={cn("rounded-xl p-2", metric.color.split(" ").slice(1).join(" "))}>
                      <Icon className={cn("h-4 w-4", metric.color.split(" ")[0])} />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">{metric.value}</p>
                  {metric.change === "up" && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      <span>+{data?.newSubscribersThisMonth ?? 0} this month</span>
                    </div>
                  )}
                  {metric.change === "down" && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                      <TrendingDown className="h-3 w-3" />
                      <span>{data?.unsubscribedThisMonth ?? 0} this month</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Trend Chart (full width) */}
          {data?.dailyEventCounts && data.dailyEventCounts.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Open & Click Trend</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyEventCounts}>
                    <defs>
                      <linearGradient id="opensTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="clicksTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
                    <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white", fontSize: "13px" }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString()}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="opens" stroke="#3b82f6" strokeWidth={2} fill="url(#opensTrend)" name="Opens" />
                    <Area type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} fill="url(#clicksTrend)" name="Clicks" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Subscriber Growth */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Subscriber Growth</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.growthData ?? []}>
                    <defs>
                      <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }} />
                    <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e4e4e7",
                        background: "white",
                        fontSize: "13px",
                      }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#growthGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Campaign Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data?.campaignPerformance ?? []).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" unit="%" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e4e4e7",
                        background: "white",
                        fontSize: "13px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="openRate" name="Open Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clickRate" name="Click Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pie Charts + Key Metrics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Subscribers by Source */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Subscribers by Source</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.subscribersBySource ?? []}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {(data?.subscribersBySource ?? []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e4e4e7",
                        background: "white",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {(data?.subscribersBySource ?? []).map((item, index) => (
                  <div key={item.source} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground dark:text-zinc-400 capitalize">{item.source.replace(/_/g, " ")}</span>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscribers by Status */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Subscribers by Status</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.subscribersByStatus ?? []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {(data?.subscribersByStatus ?? []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e4e4e7",
                        background: "white",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {(data?.subscribersByStatus ?? []).map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground dark:text-zinc-400">{item.status.charAt(0) + item.status.slice(1).toLowerCase()}</span>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Key Metrics</h3>
              <div className="space-y-4">
                {keyRates.map((rate) => {
                  const Icon = rate.icon;
                  return (
                    <div key={rate.label} className={cn("flex items-center justify-between rounded-xl p-4", rate.bgColor)}>
                      <div className="flex items-center gap-3">
                        <Icon className={cn("h-5 w-5", rate.color)} />
                        <span className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">{rate.label}</span>
                      </div>
                      <span className={cn("text-lg font-bold", rate.color)}>{rate.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Popup Analytics Section ── */}
          {!popupLoading && popupData && (
            <>
              <div className="border-t border-zinc-200 pt-8 dark:border-zinc-800">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    <BellRing className="mr-2 inline-block h-5 w-5 text-muted-foreground" />
                    Newsletter Popup Analytics
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Track how the newsletter popup performs — shows, dismissals, and signup conversions.
                  </p>
                </div>

                {/* Popup metric cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {popupMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div
                        key={metric.label}
                        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{metric.label}</p>
                          <div className={cn("rounded-xl p-2", metric.color.split(" ").slice(1).join(" "))}>
                            <Icon className={cn("h-4 w-4", metric.color.split(" ")[0])} />
                          </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">{metric.value}</p>
                        {metric.today !== null && metric.today !== undefined && (
                          <p className="mt-1 text-xs text-zinc-400">
                            {metric.today} today
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Popup daily trend + by trigger/page */}
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Daily popup trend */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Daily Trend</h3>
                    <div className="h-56">
                      {popupData.dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={popupData.dailyData}>
                            <defs>
                              <linearGradient id="shownGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#a1a1aa" tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                            <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white", fontSize: "12px" }}
                              labelFormatter={(v) => new Date(v).toLocaleDateString()}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="shown" stroke="#3b82f6" strokeWidth={2} fill="url(#shownGrad)" name="Shown" />
                            <Area type="monotone" dataKey="converted" stroke="#10b981" strokeWidth={2} fill="url(#convGrad)" name="Converted" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-sm text-zinc-400">No data yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* By trigger type */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">By Trigger Type</h3>
                    {popupData.byTrigger.length > 0 ? (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={popupData.byTrigger} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
                            <YAxis type="category" dataKey="trigger" tick={{ fontSize: 11 }} stroke="#a1a1aa" width={80} />
                            <Tooltip
                              contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white", fontSize: "12px" }}
                            />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Shown" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-zinc-400">No data yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* By page */}
                {popupData.byPage.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">By Page</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {popupData.byPage.map((item) => (
                        <div
                          key={item.page}
                          className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-800/50"
                        >
                          <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                            {item.page}
                          </span>
                          <span className="ml-2 font-medium text-zinc-900 dark:text-white">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Popup loading state */}
          {popupLoading && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="animate-pulse space-y-4">
                <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="grid grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
