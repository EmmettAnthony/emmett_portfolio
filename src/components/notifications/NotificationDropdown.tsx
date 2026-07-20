"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Pin,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationData, NotificationType, NotificationPriority } from "@/types/notifications";
import { PRIORITY_LABELS } from "@/types/notifications";
import { useTranslations } from "@/lib/i18n";

interface NotificationDropdownProps {
  notifications: NotificationData[];
  loading: boolean;
  unreadCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onRefresh: () => void;
}

const typeIcons: Record<NotificationType, typeof Bell> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const typeColors: Record<NotificationType, string> = {
  INFO: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
  SUCCESS: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  WARNING: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  ERROR: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
};

const priorityBorders: Record<NotificationPriority, string> = {
  LOW: "border-l-zinc-300 dark:border-l-zinc-600",
  MEDIUM: "border-l-blue-400 dark:border-l-blue-500",
  HIGH: "border-l-amber-400 dark:border-l-amber-500",
  CRITICAL: "border-l-red-500 dark:border-l-red-600",
};

function TimeAgo({ date, t }: { date: string; t: ReturnType<typeof useTranslations> }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>{t("justNow")}</span>;
  if (mins < 60) return <span>{t("minutesAgo", { count: mins })}</span>;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return <span>{t("hoursAgo", { count: hours })}</span>;
  const days = Math.floor(hours / 24);
  if (days < 7) return <span>{t("daysAgo", { count: days })}</span>;
  return <span>{new Date(date).toLocaleDateString()}</span>;
}

export function NotificationDropdown({
  notifications,
  loading,
  unreadCount,
  soundEnabled,
  onToggleSound,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClose,
  onRefresh: _onRefresh,
}: NotificationDropdownProps) {
  const t = useTranslations("dashboard.notifications");
  const router = useRouter();

  const handleClick = (n: NotificationData) => {
    if (!n.read) onMarkRead(n.id);
    if (n.link) {
      router.push(n.link);
      onClose();
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">{t("notifications")}</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSound}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              soundEnabled
                ? "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                : "text-zinc-300 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:bg-zinc-800"
            )}
            title={soundEnabled ? t("muteNotificationSounds") : t("enableNotificationSounds")}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title={t("markAllAsRead")}
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-2 h-8 w-8 text-zinc-300 dark:text-muted-foreground" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("noNewNotifications")}</p>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{t("allCaughtUp")}</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {notifications.map((n) => {
              const TypeIcon = typeIcons[n.notifType] || Info;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "group relative flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer border-l-2",
                    priorityBorders[n.priority],
                    n.read
                      ? "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      : "bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  )}
                  onClick={() => handleClick(n)}
                >
                  {/* Priority indicator */}
                  {n.priority === "CRITICAL" && (
                    <span className="absolute right-2 top-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  )}

                  {/* Type Icon */}
                  <div className={cn("flex-shrink-0 rounded-lg p-1.5", typeColors[n.notifType])}>
                    <TypeIcon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm leading-snug line-clamp-2",
                          n.read
                            ? "text-zinc-700 dark:text-zinc-300"
                            : "font-medium text-zinc-900 dark:text-white"
                        )}
                      >
                        {n.title}
                      </p>
                    </div>
                    {n.message && (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {n.message}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        <TimeAgo date={n.createdAt} t={t} />
                      </span>
                      {n.priority !== "LOW" && (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            n.priority === "CRITICAL"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : n.priority === "HIGH"
                                ? "bg-badge-warning-bg text-badge-warning-text"
                                : "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400"
                          )}
                        >
                          {PRIORITY_LABELS[n.priority]}
                        </span>
                      )}
                      {n.pinned && <Pin className="h-3 w-3 text-zinc-400" />}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(n.id);
                        }}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        title={t("markAsRead")}
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(n.id);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title={t("delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
          <button
            onClick={() => {
              router.push("/dashboard/notifications");
              onClose();
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("viewAllNotifications")}
          </button>
        </div>
      )}
    </div>
  );
}
