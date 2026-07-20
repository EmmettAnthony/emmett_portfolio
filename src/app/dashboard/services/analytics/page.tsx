"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Layers,
  Star,
  MessageSquare,
  TrendingUp,
  PenSquare
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { StatsCardSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import type { Service } from "@/types/services";

interface ServicesAnalytics {
  stats: {
    total: number;
    published: number;
    draft: number;
    totalInquiries: number;
    conversionRate: number;
  };
  inquiriesOverTime: { date: string; count: number }[];
  servicesByViews: { id: string; title: string; views: number }[];
  inquiryStatusBreakdown: { status: string; count: number }[];
  topServices: (Service & { inquiryCount: number; conversionRate: number })[];
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const RADIAN = Math.PI / 180;

function renderCustomizedLabel(props: { cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number }) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
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

export default function ServicesAnalyticsPage() {
  const t = useTranslations("dashboard.services");
  const { data, isLoading, error } = useQuery<ServicesAnalytics>({
    queryKey: ["dashboard-services-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/services/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Layers className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">{t("failedToLoad")}</p>
        <p className="mt-1 text-sm">{t("tryRefreshing")}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <StatsCardSkeleton count={5} />
        <div className="h-72 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!data) return null;

  const statusLabels: Record<string, string> = {
    NEW: t("statusNew"), CONTACTED: t("statusContacted"), QUALIFIED: t("statusQualified"),
    PROPOSAL_SENT: t("statusProposalSent"), NEGOTIATION: t("statusNegotiation"),
    CONVERTED: t("statusConverted"), CLOSED: t("statusClosed"), LOST: t("statusLost"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("analytics")}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("analyticsDescription")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: t("totalServices"), value: data.stats.total, icon: Layers, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: t("published"), value: data.stats.published, icon: Star, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
          { label: t("draft"), value: data.stats.draft, icon: PenSquare, color: "text-muted-foreground bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400" },
          { label: t("totalInquiries"), value: data.stats.totalInquiries, icon: MessageSquare, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400" },
          { label: t("conversionRate"), value: `${data.stats.conversionRate}%`, icon: TrendingUp, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                <div className={cn("rounded-xl p-2", stat.color.split(" ").slice(1).join(" "))}>
                  <Icon className={cn("h-4 w-4", stat.color.split(" ")[0])} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Inquiries Over Time Chart */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t("inquiriesOverLast30Days")}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.inquiriesOverTime}>
              <defs>
                <linearGradient id="inquiryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a1a1aa" tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
              <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white", fontSize: "13px" }}
                labelFormatter={(v) => new Date(v).toLocaleDateString()}
              />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#inquiryGradient)" name={t("inquiries")} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Services by Views */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t("servicesByViews")}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.servicesByViews} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 10 }} stroke="#a1a1aa" width={120} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white", fontSize: "13px" }}
                />
                <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} name={t("views")} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inquiry Status Breakdown */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">{t("inquiryStatusBreakdown")}</h3>
          {data.inquiryStatusBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-sm text-zinc-400">{t("noDataYet")}</div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.inquiryStatusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {data.inquiryStatusBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e4e4e7", background: "white", fontSize: "13px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {data.inquiryStatusBreakdown.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground dark:text-zinc-400">{statusLabels[item.status] ?? item.status}</span>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Most Popular Services */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("mostPopularServices")}</h3>
        </div>
        {data.topServices.length === 0 ? (
          <div className="px-6 py-12">
            <EmptyState icon={Layers} title={t("noDataYet")} description={t("servicesAppearHere")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">{t("service")}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">{t("views")}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">{t("inquiries")}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">{t("conversion")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.topServices.map((svc) => (
                  <tr key={svc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {svc.icon && <span className="text-base">{svc.icon}</span>}
                        <span className="font-medium text-zinc-900 dark:text-white">{svc.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-muted-foreground dark:text-zinc-400">{svc.viewCount.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground dark:text-zinc-400">{svc.inquiryCount}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={cn("font-medium", svc.conversionRate > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400")}>
                        {svc.conversionRate > 0 ? `${svc.conversionRate}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
