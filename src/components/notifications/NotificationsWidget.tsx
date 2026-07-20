"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Bell,
  Loader2,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/dashboard/StatsCard";
import type { NotificationData, NotificationType, NotificationPriority } from "@/types/notifications";
import { PRIORITY_LABELS } from "@/types/notifications";

const typeIcons: Record<NotificationType, typeof Bell> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const typeColors: Record<NotificationType, string> = {
  INFO: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  SUCCESS: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  WARNING: "bg-badge-warning-bg text-badge-warning-text",
  ERROR: "bg-badge-error-bg text-badge-error-text",
};

const priorityBorders: Record<NotificationPriority, string> = {
  LOW: "border-l-zinc-300 dark:border-l-zinc-700",
  MEDIUM: "border-l-blue-400 dark:border-l-blue-600",
  HIGH: "border-l-amber-400 dark:border-l-amber-500",
  CRITICAL: "border-l-red-500 dark:border-l-red-600",
};

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

export function NotificationsWidget() {

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-widget"],
    queryFn: async () => {
      const [notifRes, analyticsRes] = await Promise.all([
        fetch("/api/notifications?limit=5&read=false&archived=false&sort=priority"),
        fetch("/api/notifications/analytics"),
      ]);
      return {
        notifications: notifRes.ok ? (await notifRes.json()).notifications : [],
        analytics: analyticsRes.ok ? await analyticsRes.json() : null,
      };
    },
    refetchInterval: 30000,
  });

  const notifications: NotificationData[] = data?.notifications || [];
  const analytics = data?.analytics;

  return (
    <div className="space-y-4">
      {/* Priority Alerts Banner */}
      {notifications.filter((n) => n.priority === "CRITICAL" && !n.acknowledged).length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              Priority Alerts
            </span>
          </div>
          <div className="space-y-1">
            {notifications
              .filter((n) => n.priority === "CRITICAL" && !n.acknowledged)
              .slice(0, 3)
              .map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "/dashboard/notifications"}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-100/50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <span className="line-clamp-1">{n.title}</span>
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Unread"
          value={analytics?.unreadCount ?? notifications.length}
          icon={Bell}
          trend={analytics?.recentTrend}
        />
        <StatsCard
          title="Read Rate"
          value={`${analytics?.readRate ?? 0}%`}
          icon={CheckCircle}
        />
        <StatsCard
          title="Delivery Rate"
          value={`${analytics?.deliverySuccessRate ?? 100}%`}
          icon={Info}
        />
      </div>

      {/* Recent Notifications List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Notifications</h3>
          <Link
            href="/dashboard/notifications"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Bell className="mb-2 h-6 w-6 text-zinc-300 dark:text-muted-foreground" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No new notifications</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.slice(0, 5).map((n) => {
              const TypeIcon = typeIcons[n.notifType] || Info;
              return (
                <Link
                  key={n.id}
                  href={n.link || "/dashboard/notifications"}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border-l-4 p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                    priorityBorders[n.priority],
                    "bg-white dark:bg-zinc-900"
                  )}
                >
                  <div className={cn("flex-shrink-0 rounded-lg p-1.5", typeColors[n.notifType])}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1">
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {n.message}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-400">
                        <TimeAgo date={n.createdAt} />
                      </span>
                      <span
                        className={cn(
                          "rounded px-1 py-0.5 text-[10px] font-medium",
                          n.priority === "CRITICAL"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : n.priority === "HIGH"
                              ? "bg-badge-warning-bg text-badge-warning-text"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        )}
                      >
                        {PRIORITY_LABELS[n.priority]}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-400 mt-1" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
