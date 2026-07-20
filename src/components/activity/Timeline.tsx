"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  Users,
  FolderKanban,
  Mail,
  Calendar,
  FileText,
  ShoppingBag,
  ShieldAlert,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityLogData, ActivityModule } from "@/types/activity";
import {
  MODULE_LABELS
} from "@/types/activity";

const moduleIcons: Record<string, typeof Activity> = {
  auth: ShieldAlert,
  crm: Users,
  contact: Mail,
  portfolio: FolderKanban,
  blog: FileText,
  newsletter: Mail,
  calendar: Calendar,
  payment: ShoppingBag,
  file: FileText,
  user: Users,
  system: Activity,
};    const _moduleColors: Record<string, string> = {
  auth: "border-blue-400",
  crm: "border-green-400",
  contact: "border-purple-400",
  portfolio: "border-amber-400",
  blog: "border-rose-400",
  newsletter: "border-pink-400",
  calendar: "border-indigo-400",
  payment: "border-emerald-400",
  file: "border-cyan-400",
  user: "border-orange-400",
  system: "border-zinc-400",
};

const moduleBgColors: Record<string, string> = {
  auth: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  crm: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  contact: "bg-purple-500/10 text-purple-400",
  portfolio: "bg-badge-warning-bg text-badge-warning-text",
  blog: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  newsletter: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  calendar: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  payment: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  file: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  user: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  system: "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400",
};

const severityDot: Record<string, string> = {
  INFO: "bg-blue-500",
  WARNING: "bg-amber-500",
  ERROR: "bg-red-500",
  CRITICAL: "bg-red-500 animate-pulse",
};

interface TimelineProps {
  limit?: number;
  module?: string;
  className?: string;
}

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Timeline({ limit = 15, module, className }: TimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["activity-timeline", limit, module],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (module) params.set("module", module);
      const res = await fetch(`/api/activity/logs?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const logs: ActivityLogData[] = data?.logs || [];

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <Clock className="mb-2 h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No activity yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {logs.map((log, idx) => {
        const Icon = moduleIcons[log.module] || Activity;
        const colorClass = moduleBgColors[log.module] || moduleBgColors.system;


        return (
          <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Timeline line */}
            {idx < logs.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
            )}

            {/* Icon */}
            <div className={cn("relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full", colorClass)}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-zinc-900 dark:text-white">
                    <span className="font-medium">{log.user ? (log.user.name || "User") : "System"}</span>{" "}
                    <span className="text-zinc-500">{log.description}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                      {MODULE_LABELS[log.module as ActivityModule] || log.module}
                    </span>
                    {log.entity && (
                      <span className="text-[10px] text-zinc-400">
                        {log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
                      </span>
                    )}
                    <span className={cn("h-1.5 w-1.5 rounded-full", severityDot[log.severity] || "bg-zinc-400")} />
                  </div>
                </div>
                <span className="flex-shrink-0 text-[11px] text-zinc-400">
                  <TimeAgo date={log.createdAt} />
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
