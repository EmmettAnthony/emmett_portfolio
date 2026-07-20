"use client";

import {
  Users,
  Briefcase,
  FolderKanban,
  Mail,
  Clock,
  Eye,
  MousePointerClick,
  TrendingUp,
  Calendar,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarOverviewWidgets } from "@/components/dashboard/CalendarOverviewWidgets";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { NotificationsWidget } from "@/components/notifications/NotificationsWidget";
import { useTranslations } from "@/lib/i18n";

const chartData = [
  { name: "Jan", leads: 4, projects: 2 },
  { name: "Feb", leads: 6, projects: 3 },
  { name: "Mar", leads: 8, projects: 4 },
  { name: "Apr", leads: 5, projects: 2 },
  { name: "May", leads: 10, projects: 5 },
  { name: "Jun", leads: 7, projects: 3 },
];

interface OverviewData {
  totalLeads: number;
  newLeads: number;
  conversionRate: number;
  activeProjects: number;
  blogPosts: number;
  newsletterSubscribers: number;
  sentCampaigns: number;
  overallOpenRate: number;
  overallClickRate: number;
  campaignPerformance: { id: string; name: string; sent: number; opens: number; clicks: number; openRate: number; clickRate: number }[];
  activeSubscribers: number;
  todayEventCount: number;
  upcomingApptCount: number;
  overdueTaskCount: number;
  todayEventsTrend: { value: number; positive: boolean } | null;
  appointmentsTrend: { value: number; positive: boolean } | null;
  overdueTasksTrend: { value: number; positive: boolean } | null;
}

export default function DashboardOverview() {
  const t = useTranslations("dashboard.overview");
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/overview");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  if (!data) {
    return null;
  }

  const calendarCards = [
    { title: t("todaysEvents"), value: data?.todayEventCount ?? "—", icon: Calendar, description: t("scheduledForToday"), trend: data?.todayEventsTrend ?? undefined },
    { title: t("upcomingAppointments"), value: data?.upcomingApptCount ?? "—", icon: CalendarClock, description: t("pendingOrConfirmed"), trend: data?.appointmentsTrend ?? undefined },
    { title: t("overdueTasks"), value: data?.overdueTaskCount ?? "—", icon: AlertCircle, description: t("pastTheirDueDate"), trend: data?.overdueTasksTrend ?? undefined },
  ];

  const statCards = [
    { title: t("totalLeads"), value: data!.totalLeads, icon: Users, trend: { value: 12, positive: true }, delay: 0.05 },
    { title: t("activeProjects"), value: data!.activeProjects, icon: FolderKanban, trend: { value: 8, positive: true }, delay: 0.1 },
    { title: t("blogPosts"), value: data!.blogPosts, icon: Briefcase, delay: 0.15 },
    { title: t("newsletter"), value: data!.newsletterSubscribers, icon: Mail, trend: { value: 5, positive: true }, delay: 0.2 },
  ];

  const newsletterCards = [
    { title: t("openRate"), value: `${data!.overallOpenRate ?? 0}%`, icon: Eye, trend: { value: 2, positive: true }, delay: 0.25 },
    { title: t("clickRate"), value: `${data!.overallClickRate ?? 0}%`, icon: MousePointerClick, trend: { value: 1, positive: true }, delay: 0.3 },
    { title: t("sentCampaigns"), value: data!.sentCampaigns ?? 0, icon: TrendingUp, delay: 0.35 },
  ];

  const recentCampaigns = data?.campaignPerformance ?? [];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stat.delay as number }}>
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Calendar KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {calendarCards.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {newsletterCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {newsletterCards.map((stat) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stat.delay as number }}>
              <StatsCard {...stat} />
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("leadsOverview")}</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="leads" stroke="#3b82f6" fill="url(#leadGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("projectsByMonth")}</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip />
                <Bar dataKey="projects" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {recentCampaigns.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("recentCampaigns")}</h3>
            <Link href="/dashboard/newsletter" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t("viewAll")}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("campaign")}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("sent")}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("opens")}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("clicks")}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("openRate")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground dark:text-zinc-400">{c.sent}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground dark:text-zinc-400">{c.opens}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground dark:text-zinc-400">{c.clicks}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-emerald-600">{c.openRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <CalendarOverviewWidgets />

      {/* Notifications Dashboard Widget */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
        className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <NotificationsWidget />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("recentActivity")}</h3>
        <div className="mt-4 space-y-1">
          {[
            { action: t("newLeadFrom"), detail: "John Smith", time: t("minutesAgo", { count: 2 }) },
            { action: t("blogPostPublished"), detail: "Next.js 16 Guide", time: t("hoursAgo", { count: 1 }) },
            { action: t("projectUpdated"), detail: "E-Commerce Platform", time: t("hoursAgo", { count: 3 }) },
            { action: t("portfolioProjectAdded"), detail: "Task Management App", time: t("hoursAgo", { count: 5 }) },
            ...(data?.activeSubscribers ? [{ action: t("newsletterActiveSubscribers"), detail: String(data.activeSubscribers), time: t("updatedNow") }] : []),
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                </div>
                <p className="text-sm text-zinc-700 dark:text-muted-foreground">
                  {item.action} <span className="font-medium text-zinc-900 dark:text-white">{item.detail}</span>
                </p>
              </div>
              <span className="text-xs text-zinc-500">{item.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
