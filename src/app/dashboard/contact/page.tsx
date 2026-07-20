"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  Mail,
  ChevronDown,
  Calendar,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/dashboard/StatsCard";

interface ContactOverview {
  total: number;
  newThisMonth: number;
  avgScore: number;
  maxScore: number;
  statusBreakdown: Record<string, number>;
  recentSubmissions: {
    id: string;
    fullName: string;
    email: string;
    projectType: string;
    leadScore: number;
    status: string;
    createdAt: string;
  }[];
  faqCount: number;
  sourceBreakdown: { referralSource: string; _count: { id: number } }[];
  statusConversion: { status: string; _count: { id: number } }[];
  projectTypeDistribution: { projectType: string; _count: { id: number } }[];
  budgetDistribution: { budget: string; _count: { id: number } }[];
  monthlyTrend: { createdAt: string }[];
}

const statusColors: Record<string, string> = {
  NEW: "bg-badge-info-bg text-badge-info-text",
  CONTACTED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  QUALIFIED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function ContactOverviewPage() {
  const [showAllStatus, setShowAllStatus] = useState(false);

  const { data, isLoading } = useQuery<ContactOverview>({
    queryKey: ["dashboard-contact-overview"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/contact/overview");
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    },
  });

  const statusEntries = Object.entries(data?.statusBreakdown ?? {}).sort(
    ([, a], [, b]) => b - a
  );
  const visibleStatuses = showAllStatus
    ? statusEntries
    : statusEntries.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Contact
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Overview of form submissions and FAQs
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))
          : [
              {
                title: "Total Submissions",
                value: data?.total ?? 0,
                icon: Mail,
                trend: { value: data?.newThisMonth ?? 0, positive: true },
              },
              {
                title: "New This Month",
                value: data?.newThisMonth ?? 0,
                icon: Users,
                description: "Since the start of the month",
              },
              {
                title: "Avg Lead Score",
                value: data?.avgScore ?? 0,
                icon: TrendingUp,
                description: `Highest: ${data?.maxScore ?? 0}`,
              },
              {
                title: "Contact FAQs",
                value: data?.faqCount ?? 0,
                icon: Star,
                description: "Published on contact page",
              },
            ].map((stat) => (
              <StatsCard key={stat.title} {...stat} />
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Breakdown */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Status Breakdown
          </h3>
          <div className="mt-4 space-y-3">
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                  />
                ))
              : visibleStatuses.length === 0
                ? (
                  <p className="py-8 text-center text-sm text-zinc-400">
                    No submissions yet
                  </p>
                )
                : visibleStatuses.map(([status, count]) => {
                    const total = data?.total ?? 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                              statusColors[status] ||
                                "bg-zinc-100 text-muted-foreground"
                            )}
                          >
                            {status}
                          </span>
                          <span className="text-xs font-medium text-zinc-500">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
            {statusEntries.length > 4 && !showAllStatus && (
              <button
                onClick={() => setShowAllStatus(true)}
                className="flex w-full items-center justify-center gap-1 pt-1 text-xs text-zinc-400 transition-colors hover:text-muted-foreground"
              >
                Show all ({statusEntries.length - 4} more)
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Recent Submissions
            </h3>
            <Link
              href="/dashboard/contact/submissions"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {isLoading
              ? [1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                  />
                ))
              : data?.recentSubmissions.length === 0
                ? (
                  <p className="py-8 text-center text-sm text-zinc-400">
                    No submissions yet
                  </p>
                )
                : data?.recentSubmissions.map((sub) => (
                    <Link
                      key={sub.id}
                      href="/dashboard/contact/submissions"
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {sub.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                            {sub.fullName}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {sub.projectType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                            statusColors[sub.status] ||
                              "bg-zinc-100 text-muted-foreground"
                          )}
                        >
                          {sub.status}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {sub.leadScore}
                        </span>
                      </div>
                    </Link>
                  ))}
          </div>
        </div>
      </div>

      {/* Source & Budget */}
      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Lead Sources</h3>
            {data?.sourceBreakdown?.length ? (
              <div className="space-y-3">
                {data.sourceBreakdown.map((s: { referralSource: string; _count: { id: number } }) => {
                  const total = data.sourceBreakdown.reduce((sum: number, x: { _count: { id: number } }) => sum + x._count.id, 0);
                  const pct = Math.round((s._count.id / total) * 100);
                  return (
                    <div key={s.referralSource}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-zinc-700 dark:text-muted-foreground">{s.referralSource || "Direct"}</span>
                        <span className="text-zinc-500">{s._count.id} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No source data yet</p>
            )}
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Budget Ranges</h3>
            {data?.budgetDistribution?.length ? (
              <div className="space-y-3">
                {data.budgetDistribution.map((b: { budget: string; _count: { id: number } }) => {
                  const total = data.budgetDistribution.reduce((sum: number, x: { _count: { id: number } }) => sum + x._count.id, 0);
                  const pct = Math.round((b._count.id / total) * 100);
                  return (
                    <div key={b.budget}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-zinc-700 dark:text-muted-foreground">{b.budget}</span>
                        <span className="text-zinc-500">{b._count.id} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No budget data yet</p>
            )}
          </div>
        </div>
      )}

      {/* Project Type & Status Conversion */}
      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Project Types</h3>
            {data?.projectTypeDistribution?.length ? (
              <div className="space-y-3">
                {data.projectTypeDistribution.map((p: { projectType: string; _count: { id: number } }) => {
                  const total = data.projectTypeDistribution.reduce((sum: number, x: { _count: { id: number } }) => sum + x._count.id, 0);
                  const pct = Math.round((p._count.id / total) * 100);
                  return (
                    <div key={p.projectType}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-zinc-700 dark:text-muted-foreground">{p.projectType}</span>
                        <span className="text-zinc-500">{p._count.id} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No project type data yet</p>
            )}
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Status Breakdown</h3>
            {data?.statusConversion?.length ? (
              <div className="space-y-3">
                {data.statusConversion.map((s: { status: string; _count: { id: number } }) => {
                  const total = data.statusConversion.reduce((sum: number, x: { _count: { id: number } }) => sum + x._count.id, 0);
                  const pct = Math.round((s._count.id / total) * 100);
                  const colors: Record<string, string> = {
                    NEW: "bg-blue-500", CONTACTED: "bg-yellow-500", QUALIFIED: "bg-green-500",
                    PROPOSAL_SENT: "bg-purple-500", NEGOTIATION: "bg-orange-500", WON: "bg-emerald-500", LOST: "bg-red-500",
                  };
                  return (
                    <div key={s.status}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-zinc-700 dark:text-muted-foreground">{s.status.replace("_", " ")}</span>
                        <span className="text-zinc-500">{s._count.id} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className={`h-2 rounded-full ${colors[s.status] || "bg-zinc-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No status data yet</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/contact/submissions"
          className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-blue-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-badge-info-bg text-badge-info-text">
            <Mail className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              View All Submissions
            </p>
            <p className="text-xs text-zinc-500">
              Manage and respond to contact form inquiries
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-blue-600 dark:text-muted-foreground" />
        </Link>
        <Link
          href="/dashboard/contact/faqs"
          className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-blue-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Manage FAQs
            </p>
            <p className="text-xs text-zinc-500">
              Edit contact page frequently asked questions
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-purple-600 dark:text-muted-foreground" />
        </Link>
        <a
          href="https://calendar.app.google/wRyaaUEGemxPDZ4Y8"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-emerald-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500/20"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Booking Link
            </p>
            <p className="text-xs text-zinc-500">
              Open Google Calendar appointment booking
            </p>
          </div>
          <ExternalLink className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-emerald-600 dark:text-muted-foreground" />
        </a>
      </div>
    </div>
  );
}
