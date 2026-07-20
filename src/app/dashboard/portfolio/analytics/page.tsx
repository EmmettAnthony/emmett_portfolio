"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  BarChart3,
  Eye,
  FileEdit,
  Star,
  FolderKanban,
  Code2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ViewTrendItem {
  date: string;
  _sum: { count: number | null };
}

interface AnalyticsData {
  stats: {
    totalProjects: number;
    publishedProjects: number;
    draftProjects: number;
    featuredProjects: number;
    totalCategories: number;
    totalTechnologies: number;
    totalViews: number;
  };
  mostViewed: { id: string; title: string; slug: string; viewCount: number }[];
  projectsByCategory: { id: string; name: string; _count: { projects: number } }[];
  technologyUsage: { id: string; name: string; slug: string; category: string | null; _count: { projects: number } }[];
  viewTrend: ViewTrendItem[];
}

const TECH_CATEGORIES = [
  { value: "frontend", label: "Frontend", color: "text-sky-600 bg-sky-100 dark:text-sky-400 dark:bg-sky-900/30" },
  { value: "backend", label: "Backend", color: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30" },
  { value: "database", label: "Database", color: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30" },
  { value: "devops", label: "DevOps", color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30" },
  { value: "mobile", label: "Mobile", color: "text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30" },
  { value: "other", label: "Other", color: "text-muted-foreground bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800" },
];

export default function PortfolioAnalyticsPage() {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data, isLoading, error, isRefetching, refetch } = useQuery<AnalyticsData>({
    queryKey: ["dashboard-portfolio-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/portfolio/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
    setLastUpdated(new Date());
    toast("success", "Analytics refreshed");
  }, [refetch, toast]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <BarChart3 className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load analytics</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  const maxCategoryCount = data
    ? Math.max(...data.projectsByCategory.map((c) => c._count.projects), 1)
    : 1;

  type TechUsageItem = AnalyticsData["technologyUsage"][number];

  const groupedTechnologies: { value: string; label: string; color: string; items: TechUsageItem[] }[] =
    data
      ? TECH_CATEGORIES.map((cat) => ({
          ...cat,
          items: data.technologyUsage.filter((t) => (t.category ?? "other") === cat.value),
        })).filter((g) => g.items.length > 0)
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Portfolio Analytics</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefetching}>
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : !data ? null : data.stats.totalProjects === 0 && data.mostViewed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No data available yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Start by creating portfolio projects.
          </p>
          <Link href="/dashboard/portfolio/create">
            <Button className="mt-6">Create Project</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Projects</p>
                  <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
                    <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
                  <AnimatedCounter to={data.stats.totalProjects} />
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Published Projects</p>
                  <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-900/30">
                    <FileEdit className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
                  <AnimatedCounter to={data.stats.publishedProjects} />
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {data.stats.draftProjects} drafts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Views</p>
                  <div className="rounded-xl bg-amber-100 p-2 dark:bg-amber-900/30">
                    <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
                  <AnimatedCounter to={data.stats.totalViews} />
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Featured Projects</p>
                  <div className="rounded-xl bg-rose-100 p-2 dark:bg-rose-900/30">
                    <Star className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
                  <AnimatedCounter to={data.stats.featuredProjects} />
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Most Viewed Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {data.mostViewed.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-400">No views yet</p>
                ) : (
                  <ol className="space-y-3">
                    {data.mostViewed.map((project, idx) => (
                      <li key={project.id}>
                        <Link
                          href={`/dashboard/portfolio/${project.id}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                idx === 0
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                              )}
                            >
                              {idx + 1}
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-white">
                              {project.title}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-sm text-zinc-500">
                            <Eye className="h-3.5 w-3.5" />
                            {project.viewCount.toLocaleString()}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {data.projectsByCategory.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-400">No categories yet</p>
                ) : (
                  <div className="space-y-4">
                    {data.projectsByCategory.map((cat) => (
                      <div key={cat.id}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-medium text-zinc-700 dark:text-muted-foreground">
                            {cat.name}
                          </span>
                          <span className="text-zinc-500">{cat._count.projects}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${(cat._count.projects / maxCategoryCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Views (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.viewTrend && data.viewTrend.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.viewTrend.map((d) => ({ date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), views: d._sum.count ?? 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="currentColor" className="text-zinc-400" />
                      <YAxis tick={{ fontSize: 12 }} stroke="currentColor" className="text-zinc-400" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--tooltip-bg, #fff)",
                          border: "1px solid var(--tooltip-border, #e4e4e7)",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                        labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                      />
                      <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-zinc-400">No view data yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technology Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {data.technologyUsage.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-400">No technologies used yet</p>
              ) : (
                <div className="space-y-6">
                  {groupedTechnologies.map((group) => (
                    <div key={group.value}>
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline" className={group.color}>
                          <Code2 className="mr-1 h-3 w-3" />
                          {group.label}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {group.items.map((tech) => (
                          <div
                            key={tech.id}
                            className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                          >
                            <span className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                              {tech.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {tech._count.projects} {tech._count.projects === 1 ? "project" : "projects"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
