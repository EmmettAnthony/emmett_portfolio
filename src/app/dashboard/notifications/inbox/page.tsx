"use client";

import {
  useState,
  useEffect,
  useRef
} from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Loader2,
  CheckCheck,
  Trash2,
  Archive,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Inbox,
  RefreshCw,
  Search,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  NOTIFICATION_CATEGORIES,
  CATEGORY_LABELS
} from "@/types/notifications";
import { useToast } from "@/components/ui/toast";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationData, NotificationCategory } from "@/types/notifications";

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

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationInboxPage() {

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { unreadCount, refresh, sseConnected } = useNotifications();

  // ─── Real-time sync: invalidate react-query when SSE pushes new notifications ──
  const prevUnreadRef = useRef(0);
  useEffect(() => {
    // Only invalidate when SSE is connected — this means unreadCount changed
    // due to a real-time push, not from the initial API fetch on page load.
    if (sseConnected && unreadCount > prevUnreadRef.current) {
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, queryClient, sseConnected]);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["notifications-inbox", selectedCategory, search],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "20",
        sort: "newest",
        archived: "false",
        ...(selectedCategory ? { category: selectedCategory } : {}),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    initialPageParam: 1,
  });

  const allNotifications = data?.pages.flatMap((p) => p.notifications || []) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Bulk actions
  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
      setSelectedIds(new Set());
      toast("success", "Action completed");
    },
    onError: () => toast("error", "Action failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
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
    if (selectedIds.size === allNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allNotifications.map((n: NotificationData) => n.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Inbox</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {totalCount} notifications · {unreadCount} unread
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="rounded-xl border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => refresh()}
            className="rounded-xl border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("")}
          className={cn(
            "flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            !selectedCategory
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          )}
        >
          All
        </button>
        {NOTIFICATION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}
            className={cn(
              "flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              selectedCategory === cat
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            )}
          >
            {CATEGORY_LABELS[cat as NotificationCategory]}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-900 dark:bg-blue-950/30">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {selectedIds.size} selected
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => bulkMutation.mutate({ ids: Array.from(selectedIds), action: "mark_read" })}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
            >
              <CheckCheck className="mr-1 inline h-3.5 w-3.5" />Mark Read
            </button>
            <button
              onClick={() => bulkMutation.mutate({ ids: Array.from(selectedIds), action: "archive" })}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Archive className="mr-1 inline h-3.5 w-3.5" />Archive
            </button>
            <button
              onClick={() => deleteMutation.mutate(Array.from(selectedIds))}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <Trash2 className="mr-1 inline h-3.5 w-3.5" />Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Select All */}
      {allNotifications.length > 0 && selectedIds.size === 0 && (
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            onChange={selectAll}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
          />
          <span className="text-xs text-zinc-500">Select all</span>
        </div>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-red-100 p-4 dark:bg-red-900/20">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Failed to load</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Try refreshing or check your connection
          </p>
          <button
            onClick={() => refresh()}
            className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            Retry
          </button>
        </div>
      ) : allNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
            <Inbox className="h-10 w-10 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Inbox is empty</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {search || selectedCategory
              ? "Try adjusting your filters"
              : "You're all caught up! New notifications will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {allNotifications.map((n: NotificationData, index: number) => {
              const TypeIcon = typeIcons[n.notifType] || Info;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3) }}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-xl border p-3.5 transition-all hover:shadow-sm",
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
                  <div className={cn("flex-shrink-0 rounded-lg p-2", typeStyles[n.notifType])}>
                    <TypeIcon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
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
                    </div>
                    {n.message && (
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {n.message}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2.5 text-xs text-zinc-400 dark:text-zinc-500">
                      <span>{CATEGORY_LABELS[n.category as NotificationCategory] || n.category}</span>
                      <span>·</span>
                      <TimeAgo date={n.createdAt} />
                      {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button
                        onClick={() => {
                          fetch("/api/notifications", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: n.id, data: { read: true } }),
                          }).then(() => queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] }));
                        }}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate([n.id])}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div className="flex justify-center py-4">
              {isFetchingNextPage ? (
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              ) : (
                <button
                  onClick={() => fetchNextPage()}
                  className="flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <ChevronDown className="h-4 w-4" />
                  Load more
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
