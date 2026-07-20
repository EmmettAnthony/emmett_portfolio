"use client";

import { useState, useEffect, startTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Mail,
  Users,
  BarChart3,
  PenSquare,
  Plus,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { StatsCardSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { OnboardingWizard } from "@/components/ui/newsletter/OnboardingWizard";
import type { NewsletterAnalytics } from "@/types/newsletter";

export default function NewsletterOverview() {

  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { data, isLoading, error } = useQuery<NewsletterAnalytics>({
    queryKey: ["newsletter-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const { data: onboardingData } = useQuery<{ shouldShow: boolean }>({
    queryKey: ["newsletter-onboarding"],
    queryFn: async () => {
      const res = await fetch("/api/newsletter/onboarding");
      if (!res.ok) throw new Error("Failed to check onboarding");
      return res.json();
    },
  });

  useEffect(() => {
    if (onboardingData?.shouldShow) {
      try {
        const completed = localStorage.getItem("newsletter_onboarding_completed");
        if (completed !== "true") {
          startTransition(() => {
            setShowOnboarding(true);
          });
        }
      } catch {
        startTransition(() => {
          setShowOnboarding(true);
        });
      }
    }
  }, [onboardingData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <BarChart3 className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load analytics</p>
        <p className="mt-1 text-sm text-zinc-400">{(error as Error).message}</p>
        <p className="mt-1 text-xs text-zinc-500">Please try refreshing the page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <StatsCardSkeleton />
      </div>
    );
  }

  const stats = [
    {
      label: "Total Subscribers",
      value: data?.totalSubscribers ?? 0,
      change: data?.newSubscribersThisMonth ?? 0,
      changeLabel: "new this month",
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
      trend: "up" as const,
    },
    {
      label: "Active Subscribers",
      value: data?.activeSubscribers ?? 0,
      change: null,
      changeLabel: null,
      icon: Mail,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
      trend: "up" as const,
    },
    {
      label: "Active Campaigns",
      value: data?.activeCampaigns ?? 0,
      change: data?.totalCampaigns ?? 0,
      changeLabel: "total campaigns",
      icon: PenSquare,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
      trend: "up" as const,
    },
    {
      label: "Avg. Open Rate",
      value: `${((data?.overallOpenRate ?? 0) * 100).toFixed(1)}%`,
      change: null,
      changeLabel: null,
      icon: TrendingUp,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
      trend: "up" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Newsletter Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Overview of your newsletter performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/newsletter/campaigns/new")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                <div className={cn("rounded-xl p-2", stat.color.split(" ").slice(1).join(" "))}>
                  <Icon className={cn("h-4 w-4", stat.color.split(" ")[0])} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
              {stat.change !== null && (
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>
                    {stat.change} {stat.changeLabel}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Growth Chart + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Subscriber Growth Mini Chart */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Subscriber Growth</h3>
          <div className="mt-4 h-48">
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
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#growthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Quick Actions</h3>
          <div className="space-y-2.5">
            <button
              onClick={() => router.push("/dashboard/newsletter/subscribers")}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
            >
              <Users className="h-4 w-4 text-blue-500" />
              Manage Subscribers
            </button>
            <button
              onClick={() => router.push("/dashboard/newsletter/campaigns/new")}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
            >
              <PenSquare className="h-4 w-4 text-emerald-500" />
              New Campaign
            </button>
            <button
              onClick={() => router.push("/dashboard/newsletter/templates")}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
            >
              <Mail className="h-4 w-4 text-amber-500" />
              Browse Templates
            </button>
            <button
              onClick={() => router.push("/dashboard/newsletter/analytics")}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
            >
              <BarChart3 className="h-4 w-4 text-violet-500" />
              View Analytics
            </button>
            <button
              onClick={() => router.push("/dashboard/newsletter/settings")}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
            >
              <BarChart3 className="h-4 w-4 text-zinc-500" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Recent Campaigns Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Campaigns</h3>
          <button
            onClick={() => router.push("/dashboard/newsletter/campaigns")}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Opens</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data?.campaignPerformance?.slice(0, 5).map((campaign) => (
                <tr
                  key={campaign.id}
                  className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  onClick={() => router.push(`/dashboard/newsletter/campaigns/${campaign.id}`)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">{campaign.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Sent
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{campaign.sent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{campaign.openRate}%</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{campaign.clickRate}%</td>
                </tr>
              ))}
              {(!data?.campaignPerformance || data.campaignPerformance.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <EmptyState
                      icon={Mail}
                      title="No campaigns yet"
                      description="Create your first campaign to get started."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OnboardingWizard open={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </div>
  );
}