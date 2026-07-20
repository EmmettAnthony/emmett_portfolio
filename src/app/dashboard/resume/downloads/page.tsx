"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Download,
  ArrowUp,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { cn } from "@/lib/utils";

interface DownloadStats {
  total: number;
  byTemplate: { template: string; count: number }[];
  trend: { date: string; count: number }[];
}

interface SectionViewStats {
  sections: { section: string; total: number; daily: { date: string; count: number }[] }[];
  totalViews: number;
  recentViews: number;
}

const SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  awards: "Awards",
  languages: "Languages",
  references: "References",
  featuredProjects: "Featured Projects",
};

export default function DownloadsPage() {
  const { data, isLoading, error } = useQuery<DownloadStats>({
    queryKey: ["dashboard-resume-downloads"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/downloads");
      if (!res.ok) throw new Error("Failed to fetch download stats");
      return res.json();
    },
  });

  const { data: sectionViews, isLoading: sectionViewsLoading } = useQuery<SectionViewStats>({
    queryKey: ["dashboard-resume-section-views"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/section-views");
      if (!res.ok) throw new Error("Failed to fetch section views");
      return res.json();
    },
  });

  const maxTemplateCount = data
    ? Math.max(...data.byTemplate.map((t) => t.count), 1)
    : 1;

  const maxTrendCount = data
    ? Math.max(...data.trend.map((t) => t.count), 1)
    : 1;

  const maxSectionCount = sectionViews
    ? Math.max(...sectionViews.sections.map((s) => s.total), 1)
    : 1;

  const mostDownloaded = data
    ? data.byTemplate.sort((a, b) => b.count - a.count)[0]
    : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Download className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load download stats</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Download className="mb-3 h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No download data yet</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Download statistics will appear once your resume is downloaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Download Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Track your resume download performance</p>
      </div>

      {/* Total + Most Downloaded */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-badge-info-bg text-badge-info-text">
                <Download className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Downloads</p>
                <p className="text-4xl font-bold text-zinc-900 dark:text-white">
                  <AnimatedCounter to={data.total} duration={2} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <ArrowUp className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Most Downloaded</p>
                {mostDownloaded ? (
                  <div>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white capitalize">{mostDownloaded.template}</p>
                    <p className="text-xs text-zinc-500">{mostDownloaded.count} download{mostDownloaded.count !== 1 ? "s" : ""}</p>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">No downloads yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downloads by Template */}
      <Card>
        <CardHeader>
          <CardTitle>Downloads by Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.byTemplate.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No template download data yet.</p>
          ) : (
            data.byTemplate.map((item) => (
              <div key={item.template} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-700 dark:text-muted-foreground capitalize">{item.template}</span>
                  <span className="text-zinc-500">{item.count}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(item.count / maxTemplateCount) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {data.trend.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No download data in the last 30 days.</p>
          ) : (
            <div className="space-y-3">
              {/* Bar chart */}
              <div className="flex items-end gap-1 h-40">
                {data.trend.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end gap-1"
                    title={`${day.date}: ${day.count} download${day.count !== 1 ? "s" : ""}`}
                  >
                    <div
                      className="w-full rounded-t-sm bg-blue-500 transition-all hover:bg-blue-600"
                      style={{
                        height: `${Math.max((day.count / maxTrendCount) * 100, day.count > 0 ? 8 : 2)}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              {/* Date labels (every 5 days) */}
              <div className="flex gap-1">
                {data.trend.map((day, i) => {
                  const date = new Date(day.date);
                  const showLabel = i % 5 === 0 || i === data.trend.length - 1;
                  return (
                    <div
                      key={day.date}
                      className={cn(
                        "flex-1 text-center text-xs text-zinc-400",
                        !showLabel && "invisible"
                      )}
                    >
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  );
                })}
              </div>
              {/* Detailed list */}
              <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span>Date</span>
                  <span className="text-center">Downloads</span>
                  <span className="text-right">Trend</span>
                </div>
                {data.trend.slice().reverse().map((day, i, arr) => {
                  const prev = arr[i + 1]?.count ?? 0;
                  const diff = day.count - prev;
                  return (
                    <div
                      key={day.date}
                      className="grid grid-cols-3 gap-2 py-2 text-sm border-b border-zinc-50 last:border-0 dark:border-zinc-800/50"
                    >
                      <span className="text-muted-foreground dark:text-zinc-400">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-center font-medium text-zinc-900 dark:text-white">
                        {day.count}
                      </span>
                      <span
                        className={cn(
                          "text-right",
                          diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-zinc-400"
                        )}
                      >
                        {diff > 0 ? `+${diff}` : diff === 0 ? "—" : diff}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Views */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-violet-500" />
            Section Views
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sectionViewsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : sectionViews && sectionViews.sections.length > 0 ? (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <span className="text-zinc-500">Total: <strong className="text-zinc-900 dark:text-white">{sectionViews.totalViews}</strong></span>
                <span className="text-zinc-500">Last 30 days: <strong className="text-zinc-900 dark:text-white">{sectionViews.recentViews}</strong></span>
              </div>
              <div className="space-y-2">
                {sectionViews.sections.map((s) => (
                  <div key={s.section} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700 dark:text-muted-foreground">
                        {SECTION_LABELS[s.section] || s.section}
                      </span>
                      <span className="text-zinc-500">{s.total}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${(s.total / maxSectionCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 py-4 text-center">No section view data yet. Visit the public resume page to start tracking.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
