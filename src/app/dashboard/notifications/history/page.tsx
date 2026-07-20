"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Mail,
  Smartphone,
  MessageSquare,
  MessageCircle,
  Eye,
  MousePointerClick,
  Clock,  Trash2,
  History,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  NOTIFICATION_CATEGORIES,
  CATEGORY_LABELS,
  CHANNEL_LABELS,
  type NotificationCategory,
  type DeliveryChannel,
  type NotificationData,
  type NotificationLogData,
} from "@/types/notifications";
import { useToast } from "@/components/ui/toast";

interface HistoryNotification extends NotificationData {
  logs?: NotificationLogData[];
}

const channelIcons: Record<string, typeof Bell> = {
  IN_APP: Bell,
  EMAIL: Mail,
  PUSH: Smartphone,
  SMS: MessageSquare,
  WHATSAPP: MessageCircle,
};

const statusColors: Record<string, string> = {
  queued: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  opened: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  clicked: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const typeIcons: Record<string, typeof Bell> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const typeStyles: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SUCCESS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  WARNING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationHistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (dateFrom) params.set("startDate", dateFrom);
    if (dateTo) params.set("endDate", dateTo);
    params.set("page", String(page));
    params.set("limit", "20");
    params.set("sort", "newest");
    return params.toString();
  }, [search, selectedCategory, dateFrom, dateTo, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-history", buildQuery()],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?${buildQuery()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const notifications: HistoryNotification[] = data?.notifications || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Fetch delivery logs for expanded notification
  const { data: logsData } = useQuery({
    queryKey: ["notification-logs", expandedId],
    queryFn: async () => {
      if (!expandedId) return null;
      const res = await fetch(`/api/notifications/logs?id=${expandedId}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    enabled: !!expandedId,
  });

  const logs: NotificationLogData[] = logsData || [];

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-history"] });
      toast("success", "Notifications deleted");
    },
    onError: () => toast("error", "Failed to delete"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Notification History</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Complete delivery log for all notifications · {total} total
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
            showFilters
              ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {(selectedCategory || dateFrom || dateTo) && (
            <span className="ml-1 rounded-full bg-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-800 dark:text-blue-200">
              {(selectedCategory ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Search</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      placeholder="Search title or message..."
                      className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {NOTIFICATION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat as NotificationCategory]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Total Sent</p>
          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">{total}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Delivered</p>
          <p className="mt-1 text-xl font-bold text-green-600">{data?.deliveredCount ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Opened</p>
          <p className="mt-1 text-xl font-bold text-purple-600">{data?.openedCount ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Failed</p>
          <p className="mt-1 text-xl font-bold text-red-600">{data?.failedCount ?? "—"}</p>
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
            <History className="h-10 w-10 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No history found</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {search || selectedCategory
              ? "Try adjusting your search filters"
              : "Notifications will appear here as they are sent."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const TypeIcon = typeIcons[n.notifType] || Info;
            const isExpanded = expandedId === n.id;
            return (
              <div
                key={n.id}
                className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden"
              >
                {/* Main Row */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  onClick={() => setExpandedId(isExpanded ? null : n.id)}
                >
                  <div className={cn("flex-shrink-0 rounded-lg p-2", typeStyles[n.notifType])}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          n.read ? "text-zinc-700 dark:text-zinc-300" : "font-semibold text-zinc-900 dark:text-white"
                        )}
                      >
                        {n.title}
                      </p>
                      {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                    </div>
                    {n.message && (
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {n.message}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(n.createdAt)}
                      </span>
                      <span>·</span>
                      <span>{CATEGORY_LABELS[n.category as NotificationCategory] || n.category}</span>
                      {n.read && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-green-600">
                            <Eye className="h-3 w-3" /> Read
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {n.link && (
                      <a
                        href={n.link}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate([n.id]);
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Delivery Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <div className="p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Delivery Channels
                        </h4>
                        <div className="space-y-2">
                          {(logs.length > 0 ? logs : n.logs || []).length > 0 ? (
                            (logs.length > 0 ? logs : n.logs || []).map((log: NotificationLogData) => {
                              const ChannelIcon = channelIcons[log.channel] || Bell;
                              return (
                                <div
                                  key={log.id}
                                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                                >
                                  <div className="flex items-center gap-2">
                                    <ChannelIcon className="h-4 w-4 text-zinc-500" />
                                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                      {CHANNEL_LABELS[log.channel as DeliveryChannel] || log.channel}
                                    </span>
                                    <span
                                      className={cn(
                                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                                        statusColors[log.status] || "bg-zinc-100 text-zinc-600"
                                      )}
                                    >
                                      {log.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                                    {log.sentAt && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(log.sentAt)}
                                      </span>
                                    )}
                                    {log.openedAt && (
                                      <span className="flex items-center gap-1 text-purple-600">
                                        <Eye className="h-3 w-3" />
                                        Opened
                                      </span>
                                    )}
                                    {log.clickedAt && (
                                      <span className="flex items-center gap-1 text-cyan-600">
                                        <MousePointerClick className="h-3 w-3" />
                                        Clicked
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-zinc-400">No delivery logs available</div>
                          )}
                        </div>

                        {/* Metadata */}
                        {n.metadata && Object.keys(n.metadata).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                              Metadata
                            </h4>
                            <pre className="rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 overflow-x-auto">
                              {JSON.stringify(n.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                    page === pageNum
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
