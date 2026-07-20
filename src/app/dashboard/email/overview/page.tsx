"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users,
  Mail,
  Send,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  Target,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Ban,
  UserMinus,
  FileText,
  List,
  Settings,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats, CampaignPerformance } from "@/types/email";

export default function EmailOverview() {
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["email-dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/email/dashboard-stats");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <BarChart3 className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load dashboard</p>
        <p className="mt-1 text-sm text-zinc-400">{(error as Error).message}</p>
      </div>
    );
  }

  const statsCards = [
    {
      label: "Total Subscribers",
      value: data?.totalSubscribers ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Active Subscribers",
      value: data?.activeSubscribers ?? 0,
      icon: Target,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      label: "Contacts",
      value: data?.totalContacts ?? 0,
      icon: Mail,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
    },
    {
      label: "Transactional Emails",
      value: data?.transactionalEmailsSent ?? 0,
      icon: Send,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      label: "Campaigns",
      value: data?.totalCampaigns ?? 0,
      icon: BarChart3,
      color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400",
    },
    {
      label: "Emails Sent",
      value: data?.emailsSent?.toLocaleString() ?? "0",
      icon: Send,
      color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
  ];

  const rateCards = [
    {
      label: "Open Rate",
      value: data?.openRate ? `${(data.openRate * 100).toFixed(1)}%` : "0%",
      icon: Eye,
      color: "text-blue-600",
      trend: data && data.openRate > 20 ? "up" : "down",
    },
    {
      label: "Click Rate",
      value: data?.clickRate ? `${(data.clickRate * 100).toFixed(1)}%` : "0%",
      icon: MousePointerClick,
      color: "text-emerald-600",
      trend: data && data.clickRate > 5 ? "up" : "down",
    },
    {
      label: "Bounce Rate",
      value: data?.bounceRate ? `${(data.bounceRate * 100).toFixed(1)}%` : "0%",
      icon: AlertTriangle,
      color: "text-red-600",
      trend: data && data.bounceRate < 5 ? "up" : "down",
    },
    {
      label: "Spam Rate",
      value: data?.spamRate ? `${(data.spamRate * 100).toFixed(1)}%` : "0%",
      icon: Ban,
      color: "text-orange-600",
      trend: data && data.spamRate < 0.1 ? "up" : "down",
    },
    {
      label: "Unsubscribes",
      value: data?.totalUnsubscribes ?? 0,
      icon: UserMinus,
      color: "text-zinc-600",
      trend: "neutral" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Email Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Brevo-powered email platform overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : statsCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <div className={cn("rounded-lg p-1.5", stat.color.split(" ").slice(1).join(" "))}>
                        <Icon className={cn("h-3.5 w-3.5", stat.color.split(" ")[0])} />
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                      {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Rate Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-14" />
                </CardContent>
              </Card>
            ))
          : rateCards.map((rate) => {
              const Icon = rate.icon;
              const TrendIcon = rate.trend === "up" ? TrendingUp : rate.trend === "down" ? TrendingDown : null;
              return (
                <Card key={rate.label}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={cn("rounded-lg p-2 bg-zinc-100 dark:bg-zinc-800")}>
                      <Icon className={cn("h-4 w-4", rate.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {rate.label}
                      </p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">{rate.value}</p>
                    </div>
                    {TrendIcon && (
                      <TrendIcon className={cn(
                        "h-4 w-4",
                        rate.trend === "up" ? "text-emerald-500" : "text-red-500"
                      )} />
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Campaign Performance */}
      {!isLoading && data?.campaignPerformance && data.campaignPerformance.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Campaign Performance</h3>
              </div>
              <Link
                href="/dashboard/email/campaigns"
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                View all campaigns
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Campaign</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Sent</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Opens</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Clicks</th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="h-3 w-3" />
                        Open Rate
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center justify-end gap-1">
                        <MousePointerClick className="h-3 w-3" />
                        Click Rate
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.campaignPerformance.map((campaign: CampaignPerformance) => (
                    <tr
                      key={campaign.id}
                      className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/email/campaigns/${campaign.id}`}
                          className="text-sm font-medium text-zinc-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                        >
                          {campaign.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                        {campaign.sent.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                        {campaign.opens.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                        {campaign.clicks.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <CampaignRateBadge rate={campaign.openRate} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <CampaignRateBadge rate={campaign.clickRate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Activity</h3>
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : data?.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2.5 dark:border-zinc-800"
                  >
                    <div className={cn(
                      "rounded-full p-1.5",
                      activity.action.includes("campaign") 
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    )}>
                      {activity.action.includes("campaign") ? (
                        <Send className="h-3 w-3" />
                      ) : (
                        <Mail className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                        {activity.entityName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      activity.status === "sent" || activity.status === "SENT"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    )}>
                      {activity.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                  <Activity className="mb-2 h-8 w-8" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                { href: "/dashboard/email/campaigns/new", label: "Create Campaign", icon: Send, color: "text-blue-500" },
                { href: "/dashboard/email/templates", label: "Manage Templates", icon: FileText, color: "text-emerald-500" },
                { href: "/dashboard/email/subscribers", label: "Manage Subscribers", icon: Users, color: "text-amber-500" },
                { href: "/dashboard/email/lists", label: "Contact Lists", icon: List, color: "text-violet-500" },
                { href: "/dashboard/email/transactional", label: "Send Transactional", icon: Mail, color: "text-rose-500" },
                { href: "/dashboard/email/settings", label: "Settings", icon: Settings, color: "text-zinc-500" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
                  >
                    <Icon className={cn("h-4 w-4", action.color)} />
                    <span>{action.label}</span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-zinc-400" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Campaign Rate Badge ────────────────────────────────────────────────────

function CampaignRateBadge({ rate }: { rate: number }) {
  const color =
    rate >= 20
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : rate >= 10
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : rate > 0
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums", color)}>
      {rate > 0 ? (
        <>
          <span>{rate.toFixed(1)}%</span>
          {rate >= 20 ? (
            <TrendingUp className="h-3 w-3" />
          ) : rate >= 10 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
        </>
      ) : (
        "—"
      )}
    </span>
  );
}
