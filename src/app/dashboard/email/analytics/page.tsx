"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  Mail,
  Send,
  AlertTriangle,
  Ban,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsData } from "@/types/email";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function EmailAnalyticsPage() {
  const [dateRange, setDateRange] = useState("30");

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["email-analytics", dateRange],
    queryFn: async () => {
      const end = new Date().toISOString();
      const start = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/email/analytics?dateFrom=${start}&dateTo=${end}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const summaryCards = [
    {
      label: "Emails Sent",
      value: data?.aggregated.sent?.toLocaleString() || "0",
      icon: Send,
      color: "text-blue-500",
    },
    {
      label: "Delivered",
      value: data?.aggregated.delivered?.toLocaleString() || "0",
      icon: Mail,
      color: "text-emerald-500",
    },
    {
      label: "Opened",
      value: data?.aggregated.opened?.toLocaleString() || "0",
      icon: Eye,
      color: "text-violet-500",
    },
    {
      label: "Clicked",
      value: data?.aggregated.clicked?.toLocaleString() || "0",
      icon: MousePointerClick,
      color: "text-cyan-500",
    },
    {
      label: "Bounced",
      value: data?.aggregated.bounceRate
        ? `${((data.aggregated.bounceRate) * 100).toFixed(2)}%`
        : "0%",
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      label: "Spam",
      value: data?.aggregated.spam?.toLocaleString() || "0",
      icon: Ban,
      color: "text-orange-500",
    },
  ];

  const rateCards = [
    {
      label: "Open Rate",
      value: data?.aggregated.openRate
        ? `${(data.aggregated.openRate * 100).toFixed(1)}%`
        : "0%",
      trend: data && data.aggregated.openRate > 20 ? "up" : "down",
    },
    {
      label: "Click Rate",
      value: data?.aggregated.clickRate
        ? `${(data.aggregated.clickRate * 100).toFixed(1)}%`
        : "0%",
      trend: data && data.aggregated.clickRate > 5 ? "up" : "down",
    },
    {
      label: "Bounce Rate",
      value: data?.aggregated.bounceRate
        ? `${(data.aggregated.bounceRate * 100).toFixed(2)}%`
        : "0%",
      trend: data && data.aggregated.bounceRate < 3 ? "up" : "down",
    },
    {
      label: "Unsubscribe Rate",
      value: data?.aggregated.unsubscribeRate
        ? `${(data.aggregated.unsubscribeRate * 100).toFixed(2)}%`
        : "0%",
      trend: "neutral" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Email Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track email performance and engagement
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))
          : summaryCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                      <Icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Rate Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rateCards.map((rate) => {
          const TrendIcon = rate.trend === "up" ? TrendingUp : rate.trend === "down" ? TrendingDown : null;
          return (
            <Card key={rate.label}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{rate.label}</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">{rate.value}</p>
                </div>
                {TrendIcon && (
                  <TrendIcon className={cn("h-5 w-5", rate.trend === "up" ? "text-emerald-500" : "text-red-500")} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily Stats Chart */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Daily Email Activity</h3>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.dailyStats || []}>
                  <defs>
                    <linearGradient id="sentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="openedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white", fontSize: "13px" }} />
                  <Area type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} fill="url(#sentGradient)" name="Sent" />
                  <Area type="monotone" dataKey="opened" stroke="#10b981" strokeWidth={2} fill="url(#openedGradient)" name="Opened" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscriber Growth */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Subscriber Growth</h3>
            <div className="h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.subscriberGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }} />
                    <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white", fontSize: "13px" }} />
                    <Bar dataKey="newSubscribers" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Subscribers" />
                    <Bar dataKey="unsubscribes" fill="#ef4444" radius={[4, 4, 0, 0]} name="Unsubscribes" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Campaign Performance</h3>
            <div className="h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : data?.campaignPerformance && data.campaignPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.campaignPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" width={120} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white" }} />
                    <Bar dataKey="openRate" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Open Rate %" />
                    <Bar dataKey="clickRate" fill="#10b981" radius={[0, 4, 4, 0]} name="Click Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  <BarChart3 className="h-8 w-8" />
                  <p className="ml-2 text-sm">No campaign data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Top Countries</h3>
            <div className="h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : data?.topCountries && data.topCountries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.topCountries}
                      dataKey="count"
                      nameKey="country"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ country, percent }: { country?: string; percent?: number }) => `${country || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {data.topCountries.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  <Users className="h-8 w-8" />
                  <p className="ml-2 text-sm">No country data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Sources */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Top Sources</h3>
            <div className="h-64">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : data?.topSources && data.topSources.length > 0 ? (
                <div className="space-y-3">
                  {data.topSources.map((source, index) => (
                    <div key={source.source} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="flex-1 text-sm capitalize text-zinc-700 dark:text-zinc-300">
                        {source.source.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {source.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-400">
                  <BarChart3 className="h-8 w-8" />
                  <p className="ml-2 text-sm">No source data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
