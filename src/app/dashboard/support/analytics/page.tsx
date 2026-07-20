"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TicketCheck,
  Clock,
  MessageSquare,
  Smile,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface AnalyticsData {
  stats: {
    totalTickets: number;
    openTickets: number;
    closedToday: number;
    avgResponseTime: string;
    satisfactionRate: number;
    resolutionRate: number;
    slaBreaches: number;
    totalAgents: number;
    avgFirstResponse: string;
    csatTrend: number[];
  };
  ticketsByDay: { date: string; count: number }[];
  ticketsByCategory: { name: string; count: number }[];
  agentPerformance: { name: string; resolved: number; open: number; avgResponseTime: string }[];
}

const CHART_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#6366f1", "#ec4899"];

export default function SupportAnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["support-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/support/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
        No analytics data available.
      </div>
    );
  }

  const statCards = [
    { title: "Total Tickets", value: data.stats.totalTickets, icon: TicketCheck },
    { title: "Open Tickets", value: data.stats.openTickets, icon: Clock },
    { title: "Closed Today", value: data.stats.closedToday, icon: TrendingUp },
    { title: "Avg Response Time", value: data.stats.avgResponseTime, icon: MessageSquare },
    { title: "Satisfaction Rate", value: `${data.stats.satisfactionRate}%`, icon: Smile },
    { title: "SLA Breaches", value: data.stats.slaBreaches ?? 0, icon: Clock },
  ];

  const csatTrend = data.stats.csatTrend || [];
  const csatLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        <Card>
          <CardHeader>
            <CardTitle>Tickets Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {data.ticketsByDay.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">No data available</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ticketsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} />
                    <YAxis stroke="#a1a1aa" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.ticketsByCategory.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">No data available</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.ticketsByCategory}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic callback type
                      label={({ payload, percent }: any) =>
                        `${payload?.name ?? ""} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {data.ticketsByCategory.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CSAT Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {csatTrend.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">No CSAT data available</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={csatTrend.map((v, i) => ({ week: csatLabels[i] || `Week ${i + 1}`, rate: v }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="week" stroke="#a1a1aa" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#a1a1aa" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">SLA Breaches</p>
                  <p className="text-xs text-zinc-500">Tickets past their deadline</p>
                </div>
                <span className="text-2xl font-bold text-red-500">{data.stats.slaBreaches ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Avg First Response</p>
                  <p className="text-xs text-zinc-500">Time to first agent reply</p>
                </div>
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">{data.stats.avgFirstResponse || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Active Agents</p>
                  <p className="text-xs text-zinc-500">Agents with open tickets</p>
                </div>
                <span className="text-2xl font-bold text-primary">{data.stats.totalAgents ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {data.agentPerformance.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">No agent data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Resolved</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Open</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Avg Response Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.agentPerformance.map((agent, i) => (
                    <tr key={i} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">{agent.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {agent.resolved}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          agent.open > 0
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        )}>
                          {agent.open}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">{agent.avgResponseTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
