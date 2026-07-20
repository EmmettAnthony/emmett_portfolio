"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ShieldAlert,
  Users,
  Loader2,
  Clock,
  AlertTriangle,
  Globe
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import type { ActivityAnalytics } from "@/types/activity";
import { MODULE_LABELS, SEVERITY_LABELS } from "@/types/activity";

const MODULE_COLORS: Record<string, string> = {
  auth: "#3b82f6",
  crm: "#22c55e",
  contact: "#a855f7",
  portfolio: "#f59e0b",
  blog: "#e11d48",
  newsletter: "#ec4899",
  calendar: "#8b5cf6",
  payment: "#10b981",
  file: "#06b6d4",
  user: "#f97316",
  system: "#6b7280",
  resume: "#14b8a6",
  testimonial: "#6366f1",
  services: "#d946ef",
  settings: "#78716c",
};

const SEVERITY_COLORS: Record<string, string> = {
  INFO: "#3b82f6",
  WARNING: "#f59e0b",
  ERROR: "#ef4444",
  CRITICAL: "#dc2626",
};

const COUNTRY_COLORS = [
  "#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#06b6d4",
  "#d946ef", "#84cc16", "#e11d48", "#0ea5e9", "#8b5cf6",
];

export default function ActivityDashboardPage() {
  const { data, isLoading } = useQuery<ActivityAnalytics>({
    queryKey: ["activity-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/activity/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    { title: "Total Activities", value: data.totalActivities, icon: Activity, trend: data.recentTrend },
    { title: "Today", value: data.todayActivities, icon: Clock },
    { title: "Failed Actions", value: data.failedActions, icon: AlertTriangle, trend: { value: data.failedActions, positive: data.failedActions === 0 } },
    { title: "Security Events", value: data.securityEvents, icon: ShieldAlert },
    { title: "Active Users", value: data.uniqueUsers, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Activity Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Monitoring all platform activity and events
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Daily Activity (30 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyCounts}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#activityGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Login Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Login Activity (30 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.loginActivity}>
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
                <Bar dataKey="success" name="Success" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="auth" />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="auth" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* By Module */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">By Module</h3>
          <div className="space-y-2">
            {data.byModule.slice(0, 8).map((m) => (
              <div key={m.module} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: MODULE_COLORS[m.module] || "#6b7280" }}
                  />
                  <span className="text-xs text-muted-foreground dark:text-zinc-400">
                    {MODULE_LABELS[m.module as keyof typeof MODULE_LABELS] || m.module}
                  </span>
                </div>
                <span className="text-xs font-medium text-zinc-900 dark:text-white">{m.count}</span>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/activity/logs"
            className="mt-3 block text-center text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View all logs →
          </Link>
        </motion.div>

        {/* By Severity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">By Severity</h3>
          <div className="space-y-3">
            {data.bySeverity.map((s) => (
              <div key={s.severity} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[s.severity] || "#6b7280" }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground dark:text-zinc-400">
                      {SEVERITY_LABELS[s.severity as keyof typeof SEVERITY_LABELS]}
                    </span>
                    <span className="text-xs font-medium text-zinc-900 dark:text-white">{s.count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${data.totalActivities > 0 ? (s.count / data.totalActivities) * 100 : 0}%`,
                        backgroundColor: SEVERITY_COLORS[s.severity] || "#6b7280",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* By Country */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
            <Globe className="mr-1.5 inline h-4 w-4 text-blue-500" />
            By Country
          </h3>
          {data.byCountry.length === 0 ? (
            <p className="text-sm text-zinc-500">No geographic data yet</p>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={data.byCountry}
                      dataKey="count"
                      nameKey="country"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={35}
                      paddingAngle={2}
                    >
                      {data.byCountry.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 w-full space-y-1.5">
                {data.byCountry.slice(0, 6).map((c, i) => (
                  <div key={c.country} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                      />
                      <span className="text-muted-foreground dark:text-zinc-400">{c.country || "Unknown"}</span>
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Users */}
      {data.topUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
            <Users className="mr-1.5 inline h-4 w-4 text-blue-500" />
            Top Users
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="pb-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">User</th>
                  <th className="pb-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">Activities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.topUsers.slice(0, 10).map((u) => (
                  <tr key={u.userId}>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          {(u.name || u.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-900 dark:text-white">{u.name || "Unknown"}</p>
                          {u.email && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{u.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white">{u.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link
            href="/dashboard/activity/logs"
            className="mt-3 block text-center text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View all logs →
          </Link>
        </motion.div>
      )}

      {/* Security Incidents */}
      {data.securityIncidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Security Incidents (30 days)</h3>
            <Link
              href="/dashboard/activity/security"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Security Dashboard →
            </Link>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.securityIncidents}>
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
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
