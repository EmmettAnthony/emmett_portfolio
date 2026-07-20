"use client";

import { useState, useCallback } from "react";import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationType, NotificationCategory, NotificationPriority, NotificationData } from "@/types/notifications";
import { Bell, CheckCheck, Trash2, Archive, Pin, Search, Filter, Info, CheckCircle, AlertTriangle, XCircle, ExternalLink, Flag, X, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS
} from "@/types/notifications";
import { useToast } from "@/components/ui/toast";
import type { NotificationType, NotificationCategory, NotificationPriority, NotificationData } from "@/types/notifications";

const typeIcons: Record<NotificationType, typeof Bell> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const typeStyles: Record<NotificationType, string> = {
  INFO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SUCCESS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  WARNING: "bg-badge-warning-bg text-badge-warning-text",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const priorityStyles: Record<NotificationPriority, string> = {
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
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsCenterPage() {

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [showRead, setShowRead] = useState<boolean | undefined>(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"newest" | "oldest" | "priority">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Build query params
  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedPriority) params.set("priority", selectedPriority);
    if (selectedType) params.set("notifType", selectedType);
    if (showRead !== undefined) params.set("read", String(showRead));
    params.set("archived", "false");
    params.set("page", String(page));
    params.set("limit", "20");
    params.set("sort", sort);
    return params.toString();
  }, [search, selectedCategory, selectedPriority, selectedType, showRead, page, sort]);

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", buildQuery()],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?${buildQuery()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const notifications: NotificationData[] = data?.notifications || [];
  const total = data?.total || 0;
  const unreadCount = data?.unreadCount || 0;
  const totalPages = Math.ceil(total / 20);

  // Mutations
  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast("success", "All notifications marked as read");
    },
    onError: () => toast("error", "Failed to mark all as read"),
  });

  const bulkAction = useMutation({
    mutationFn: async (action: string) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setSelectedIds(new Set());
      toast("success", "Action completed");
    },
    onError: () => toast("error", "Action failed"),
  });

  const deleteAction = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setSelectedIds(new Set());
      toast("success", "Notifications deleted");
    },
    onError: () => toast("error", "Failed to delete"),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {total} total &middot; {unreadCount} unread
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </button>
          )}
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
            {(selectedCategory || selectedPriority || selectedType) && (
              <span className="ml-1 rounded-full bg-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                {(selectedCategory ? 1 : 0) + (selectedPriority ? 1 : 0) + (selectedType ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search notifications..."
                  className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {/* Category Filter */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</label>
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

                {/* Priority Filter */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => { setSelectedPriority(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">All Priorities</option>
                    {NOTIFICATION_PRIORITIES.map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p as NotificationPriority]}</option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    {NOTIFICATION_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t as NotificationType]}</option>
                    ))}
                  </select>
                </div>

                {/* Read Status */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</label>
                  <select
                    value={showRead === undefined ? "" : String(showRead)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShowRead(val === "" ? undefined : val === "true");
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">All</option>
                    <option value="false">Unread</option>
                    <option value="true">Read</option>
                  </select>
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sort:</span>
                {(["newest", "oldest", "priority"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      sort === s
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-900 dark:bg-blue-950/30">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {selectedIds.size} selected
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => bulkAction.mutate("mark_read")} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30">
              <CheckCheck className="mr-1 inline h-3.5 w-3.5" />Mark Read
            </button>
            <button onClick={() => bulkAction.mutate("archive")} className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <Archive className="mr-1 inline h-3.5 w-3.5" />Archive
            </button>
            <button onClick={() => deleteAction.mutate(Array.from(selectedIds))} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30">
              <Trash2 className="mr-1 inline h-3.5 w-3.5" />Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <X className="mr-1 inline h-3.5 w-3.5" />Clear
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
            <Inbox className="h-10 w-10 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No notifications</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {search || selectedCategory
              ? "Try adjusting your filters"
              : "You're all caught up! New notifications will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select All */}
          <div className="flex items-center gap-2 px-1 py-1">
            <input
              type="checkbox"
              checked={selectedIds.size === notifications.length && notifications.length > 0}
              onChange={selectAll}
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
            />
            <span className="text-xs text-zinc-500">
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${notifications.length} selected`
                : "Select all"}
            </span>
          </div>

          {notifications.map((n, index) => {
            const TypeIcon = typeIcons[n.notifType] || Info;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className={cn(
                  "group relative flex items-start gap-4 rounded-2xl border p-4 transition-all hover:shadow-sm border-l-4",
                  priorityStyles[n.priority],
                  n.read
                    ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    : "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
                )}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(n.id)}
                  onChange={() => toggleSelect(n.id)}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
                />

                {/* Icon */}
                <div className={cn("flex-shrink-0 rounded-xl p-2.5", typeStyles[n.notifType])}>
                  <TypeIcon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          n.read
                            ? "text-zinc-700 dark:text-zinc-300"
                            : "font-semibold text-zinc-900 dark:text-white"
                        )}
                      >
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {n.message}
                        </p>
                      )}
                    </div>

                    {/* Priority badge */}
                    {n.priority !== "LOW" && (
                      <span
                        className={cn(
                          "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
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
                  </div>

                  {/* Meta */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                    <span>{CATEGORY_LABELS[n.category as NotificationCategory] || n.category}</span>
                    <span>·</span>
                    <TimeAgo date={n.createdAt} />
                    {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    {n.pinned && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Pin className="h-3 w-3" /> Pinned
                      </span>
                    )}
                    {n.priority === "CRITICAL" && !n.acknowledged && (
                      <span className="flex items-center gap-1 text-red-500 font-medium">
                        <Flag className="h-3 w-3" /> Requires acknowledgement
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {n.link && (
                    <a
                      href={n.link}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      title="View details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {!n.read && (
                    <button
                      onClick={() => {
                        fetch("/api/notifications", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: n.id, data: { read: true } }),
                        }).then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
                      }}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                      title="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAction.mutate([n.id])}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
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
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                    page === pageNum
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
