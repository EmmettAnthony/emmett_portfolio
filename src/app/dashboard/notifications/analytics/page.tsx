"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle,
  Eye,
  TrendingUp,
  BarChart3,
  PieChart,
  Loader2,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RechartsPieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = {
  CRM: "#3b82f6",
  CONTACT: "#22c55e",
  CALENDAR: "#a855f7",
  PORTFOLIO: "#f59e0b",
  NEWSLETTER: "#e11d48",
  RESUME: "#06b6d4",
  TESTIMONIAL: "#10b981",
  SYSTEM: "#6b7280",
};

const PRIORITY_COLORS = {
  LOW: "#9ca3af",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  CRITICAL: "#ef4444",
};

const CHANNEL_COLORS: Record<string, string> = {
  IN_APP: "#3b82f6",
  EMAIL: "#22c55e",
  PUSH: "#a855f7",
  SMS: "#f59e0b",
  WHATSAPP: "#06b6d4",
};

export default function NotificationAnalyticsPage() {
  const t = useTranslations("dashboard.notifications");
  const { data, isLoading } = useQuery({
    queryKey: ["notification-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        {t("noAnalyticsData")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("notificationAnalytics")}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("analyticsDescription")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("totalSent")}
          value={data.totalSent ?? 0}
          icon={Bell}
          trend={data.recentTrend}
        />
        <StatsCard
          title={t("readRate")}
          value={`${data.readRate ?? 0}%`}
          icon={Eye}
          trend={{ value: data.readRate, positive: data.readRate > 50 }}
        />
        <StatsCard
          title={t("delivered")}
          value={data.totalDelivered ?? 0}
          icon={CheckCircle}
        />
        <StatsCard
          title={t("deliverySuccess")}
          value={`${data.deliverySuccessRate ?? 100}%`}
          icon={TrendingUp}
          trend={{ value: data.deliverySuccessRate, positive: data.deliverySuccessRate > 95 }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Category Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-zinc-400" />
            {t("byCategory")}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={data.byCategory?.map((c: { category: string; count: number }) => ({
                    name: c.category,
                    value: c.count,
                  })) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(data.byCategory || []).map((entry: { category: string }) => (
                    <Cell
                      key={entry.category}
                      fill={COLORS[entry.category as keyof typeof COLORS] || "#6b7280"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {(data.byCategory || []).map((entry: { category: string; count: number }) => (
              <div key={entry.category} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[entry.category as keyof typeof COLORS] || "#6b7280" }}
                />
                <span className="text-xs text-muted-foreground dark:text-zinc-400">
                  {entry.category} ({entry.count})
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* By Priority Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-zinc-400" />
            {t("byPriority")}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byPriority?.map((p: { priority: string; count: number }) => ({
                  name: p.priority,
                  count: p.count,
                })) || []}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(data.byPriority || []).map((entry: { priority: string }) => (
                    <Cell
                      key={entry.priority}
                      fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] || "#6b7280"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Daily Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-zinc-400" />
          {t("dailyNotificationActivity")}
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.dailyCounts || []}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="date"
                stroke="#a1a1aa"
                fontSize={11}
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis stroke="#a1a1aa" fontSize={12} />
              <Tooltip />
              <Bar dataKey="sent" name={t("sent")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="read" name={t("read")} fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* By Channel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-zinc-400" />
          {t("deliveryByChannel")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data.byChannel || []).map((ch: { channel: string; sent: number; delivered: number; failed: number }) => (
            <div
              key={ch.channel}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{ch.channel}</span>
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: CHANNEL_COLORS[ch.channel] || "#6b7280" }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{t("sent")}</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{ch.sent}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{t("delivered")}</span>
                  <span className="font-medium text-green-600">{ch.delivered}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{t("failed")}</span>
                  <span className="font-medium text-red-600">{ch.failed}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${ch.sent > 0 ? (ch.delivered / ch.sent) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
