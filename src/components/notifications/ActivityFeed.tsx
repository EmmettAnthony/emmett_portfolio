"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Users,
  Calendar,
  Mail,
  FileText,
  Star,
  Clock,
  Activity,
  MessageCircle,
  Bell,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationData } from "@/types/notifications";
import {
  PRIORITY_LABELS
} from "@/types/notifications";
import { useTranslations } from "@/lib/i18n";

interface ActivityFeedProps {
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

const categoryIcons: Record<string, typeof Bell> = {
  CRM: Users,
  CONTACT: MessageCircle,
  CALENDAR: Calendar,
  PORTFOLIO: FolderKanban,
  NEWSLETTER: Mail,
  RESUME: FileText,
  TESTIMONIAL: Star,
  SYSTEM: Activity,
};

const categoryColors: Record<string, string> = {
  CRM: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  CONTACT: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  CALENDAR: "bg-purple-500/10 text-purple-400",
  PORTFOLIO: "bg-badge-warning-bg text-badge-warning-text",
  NEWSLETTER: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  RESUME: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  TESTIMONIAL: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  SYSTEM: "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400",
};

function TimeAgo({ date, t }: { date: string; t: ReturnType<typeof useTranslations> }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("daysAgo", { count: days });
  return new Date(date).toLocaleDateString();
}

export function ActivityFeed({ limit = 10, showTitle = true, compact = false, className }: ActivityFeedProps) {
  const t = useTranslations("dashboard.notifications");
  const { data, isLoading } = useQuery({
    queryKey: ["activity-feed", limit],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?limit=${limit}&sort=newest`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const notifications: NotificationData[] = data?.notifications || [];

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <Clock className="mb-2 h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("noRecentActivity")}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t("recentActivity")}</h3>
          <Clock className="h-4 w-4 text-zinc-400" />
        </div>
      )}

      <div className="space-y-0.5">
        {notifications.map((_n, _idx) => {
          const Icon = categoryIcons[n.category] || Activity;
          const colorClass = categoryColors[n.category] || categoryColors.SYSTEM;

          return (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                compact && "px-2 py-2"
              )}
            >
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full", colorClass)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      n.read ? "text-muted-foreground dark:text-zinc-400" : "font-medium text-zinc-900 dark:text-white",
                      compact && "text-xs"
                    )}
                  >
                    {n.title}
                  </p>
                  {!n.read && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      n.priority === "CRITICAL"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : n.priority === "HIGH"
                          ? "bg-badge-warning-bg text-badge-warning-text"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {PRIORITY_LABELS[n.priority]}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    <TimeAgo date={n.createdAt} t={t} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
