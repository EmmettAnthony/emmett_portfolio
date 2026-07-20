"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  Briefcase,
  Trophy,
  DollarSign,
} from "lucide-react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const PIPELINE_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-badge-warning-bg text-badge-warning-text",
  "bg-purple-500/10 text-purple-400",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
];

const CHART_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#6366f1", "#ec4899"];

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
}

interface LeadSource {
  source: string;
  count: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  leadName: string;
  createdAt: string;
}

interface CrmReport {
  totalLeads: number;
  activeClients: number;
  openDeals: number;
  wonThisMonth: number;
  revenuePipeline: number;
  pipelineStages: PipelineStage[];
  leadSources: LeadSource[];
  recentActivities: Activity[];
  conversionRate: number;
  avgDealSize: number;
  proposalsSent: number;
  proposalWinRate: number;
}

export default function CrmDashboard() {
  const t = useTranslations("dashboard.crm");
  const { data, isLoading } = useQuery<CrmReport>({
    queryKey: ["crm-reports"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/crm/reports");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
        {t("noCrmData")}
      </div>
    );
  }

  const statCards = [
    { title: t("totalLeads"), value: data.totalLeads, icon: Users, delay: 0.05 },
    { title: t("activeClients"), value: data.activeClients, icon: UserCheck, delay: 0.1 },
    { title: t("openDeals"), value: data.openDeals, icon: Briefcase, delay: 0.15 },
    { title: t("wonThisMonth"), value: data.wonThisMonth, icon: Trophy, delay: 0.2, trend: { value: 8, positive: true } },
    { title: t("revenuePipeline"), value: `$${data.revenuePipeline.toLocaleString()}`, icon: DollarSign, delay: 0.25 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay as number }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("pipelineOverview")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.pipelineStages.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">{t("noPipelineData")}</div>
            ) : (
              <div className="space-y-4">
                {data.pipelineStages.map((stage, i) => (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <span className={cn("w-28 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-center", PIPELINE_COLORS[i] || PIPELINE_COLORS[0])}>
                      {stage.stage.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground dark:text-zinc-400">{t("dealsCount", { count: stage.count })}</span>
                        <span className="font-medium text-zinc-900 dark:text-white">${stage.value.toLocaleString()}</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{
                            width: `${Math.max(2, (stage.value / Math.max(...data.pipelineStages.map((s) => s.value))) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("leadSources")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.leadSources.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">{t("noLeadSourceData")}</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.leadSources}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic callback type
                      label={({ payload, percent }: any) => `${payload?.source ?? ""} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.leadSources.map((_, i) => (
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
            <CardTitle>{t("leadSourcesCount")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.leadSources.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">{t("noData")}</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.leadSources}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="source" stroke="#a1a1aa" fontSize={12} />
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
            <CardTitle>{t("keyMetrics")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t("conversionRate"), value: `${data.conversionRate}%` },
                { label: t("avgDealSize"), value: `$${data.avgDealSize.toLocaleString()}` },
                { label: t("proposalsSent"), value: data.proposalsSent },
                { label: t("proposalWinRate"), value: `${data.proposalWinRate}%` },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{metric.label}</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentActivities")}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">{t("noRecentActivity")}</div>
          ) : (
            <div className="space-y-1">
              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                    <p className="text-sm text-zinc-700 dark:text-muted-foreground">
                      {activity.description}{" "}
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {activity.leadName}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
