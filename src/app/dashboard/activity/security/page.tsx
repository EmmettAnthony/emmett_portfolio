"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  Loader2,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Lock,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  ACTIVITY_SEVERITIES,
  SEVERITY_LABELS,
  SECURITY_EVENT_LABELS
} from "@/types/activity";
import { useToast } from "@/components/ui/toast";
import type { SecurityEventData, SecurityEventType, ActivitySeverity } from "@/types/activity";

const severityStyles: Record<string, string> = {
  INFO: "bg-badge-info-bg text-badge-info-text",
  WARNING: "bg-badge-warning-bg text-badge-warning-text",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-red-500/50",
};

const severityIcons: Record<string, typeof ShieldAlert> = {
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  CRITICAL: ShieldAlert,
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

export default function SecurityDashboardPage() {

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [eventType, setEventType] = useState("");
  const [severity, setSeverity] = useState("");
  const [showResolved, setShowResolved] = useState<boolean | undefined>(false);
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (eventType) params.set("eventType", eventType);
    if (severity) params.set("severity", severity);
    if (showResolved !== undefined) params.set("resolved", String(showResolved));
    if (userId) params.set("userId", userId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", String(page));
    params.set("limit", "20");
    return params.toString();
  }, [eventType, severity, showResolved, userId, startDate, endDate, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["security-events", buildQuery()],
    queryFn: async () => {
      const res = await fetch(`/api/activity/security?${buildQuery()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/activity/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-events"] });
      toast("success", "Security event resolved");
    },
    onError: () => toast("error", "Failed to resolve event"),
  });

  const events: SecurityEventData[] = data?.events || [];
  const total = data?.total || 0;
  const unresolvedCount = data?.unresolvedCount || 0;
  const pages = data?.pages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Security Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {unresolvedCount > 0 ? (
              <span className="text-red-500 font-medium">{unresolvedCount} unresolved events</span>
            ) : (
              "All clear — no unresolved security events"
            )}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
            showFilters
              ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Events" value={total} icon={ShieldAlert} />
        <StatsCard
          title="Unresolved"
          value={unresolvedCount}
          icon={AlertTriangle}
          trend={unresolvedCount > 0 ? { value: unresolvedCount, positive: false } : undefined}
        />
        <StatsCard
          title="Resolved"
          value={total - unresolvedCount}
          icon={CheckCircle}
        />
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
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => { setEventType(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">All Events</option>
                    {Object.entries(SECURITY_EVENT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">All Severities</option>
                    {ACTIVITY_SEVERITIES.map((s) => (
                      <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Status</label>
                  <select
                    value={showResolved === undefined ? "" : String(showResolved)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShowResolved(val === "" ? undefined : val === "true");
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="">All</option>
                    <option value="false">Unresolved</option>
                    <option value="true">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">User ID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => { setUserId(e.target.value); setPage(1); }}
                    placeholder="Filter by user ID..."
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldAlert className="mb-2 h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
          <p className="text-sm font-medium text-zinc-500">No security events found</p>
          <p className="text-xs text-zinc-400 mt-1">
            {showResolved === false ? "No unresolved events — you're secure!" : "Security events will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, idx) => {
            const SevIcon = severityIcons[event.severity] || Info;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  event.resolved
                    ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    : "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", severityStyles[event.severity] || "")}>
                    <SevIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                          {SECURITY_EVENT_LABELS[event.eventType as SecurityEventType] || event.eventType}
                          {!event.resolved && (
                            <span className="flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-0.5">{event.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", severityStyles[event.severity] || "")}>
                          {SEVERITY_LABELS[event.severity as ActivitySeverity]}
                        </span>
                        {!event.resolved && (
                          <button
                            onClick={() => resolveMutation.mutate(event.id)}
                            className="rounded-lg p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                            title="Mark as resolved"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <TimeAgo date={event.createdAt} />
                      </span>
                      {event.ipAddress && (
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {event.ipAddress}
                        </span>
                      )}
                      {event.resolved && (
                        <span className="text-green-500 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Resolved {event.resolvedAt ? <TimeAgo date={event.resolvedAt} /> : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700 dark:text-muted-foreground"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700 dark:text-muted-foreground"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
