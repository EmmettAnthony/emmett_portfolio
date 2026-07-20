"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  Clock,
  History,
  FileText,
  Users,
  Briefcase,
  FolderKanban,
  Mail,
  Calendar,
  Star,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { AuditTrailData } from "@/types/activity";

const entityTypeIcons: Record<string, typeof FileText> = {
  Lead: Users,
  Client: Briefcase,
  Project: FolderKanban,
  BlogPost: FileText,
  Campaign: Mail,
  Appointment: Calendar,
  Testimonial: Star,
  Service: ShoppingBag,
  PortfolioProject: FolderKanban,
  Subscriber: Mail,
};

const entityTypeColors: Record<string, string> = {
  Lead: "bg-badge-info-bg text-badge-info-text",
  Client: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  Project: "bg-purple-500/10 text-purple-400",
  BlogPost: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  Campaign: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  Appointment: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  Testimonial: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  Service: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  PortfolioProject: "bg-badge-warning-bg text-badge-warning-text",
  Subscriber: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
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

function DiffView({ before, after }: { before: string | null; after: string | null }) {
  if (!before && !after) return <span className="text-zinc-400">-</span>;
  if (before === after) return <span className="text-zinc-500">{before || "(empty)"}</span>;

  return (
    <div className="flex items-center gap-2 text-xs">
      {before !== null && (
        <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through dark:bg-red-950/30 dark:text-red-400">
          {before || "(empty)"}
        </span>
      )}
      {before !== null && after !== null && <span className="text-zinc-400">→</span>}
      {after !== null && (
        <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-600 dark:bg-green-950/30 dark:text-green-400">
          {after || "(empty)"}
        </span>
      )}
    </div>
  );
}

export default function AuditTrailPage() {
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [searchEntityId, setSearchEntityId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-trails", entityType, searchEntityId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (entityType) params.set("entityType", entityType);
      if (searchEntityId) params.set("entityId", searchEntityId);
      const res = await fetch(`/api/activity/audit?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!entityType || !!searchEntityId,
  });

  const trails: AuditTrailData[] = data?.trails || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Audit Trail</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Track all field-level changes across entities
        </p>
      </div>

      {/* Entity Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setSearchEntityId(""); }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            <option value="">All Entity Types</option>
            {Object.keys(entityTypeIcons).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">Entity ID</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Search by entity ID..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        </div>
        <button
          onClick={() => setSearchEntityId(entityId)}
          className="flex h-10 items-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Search
        </button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : !entityType && !searchEntityId ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <History className="mb-2 h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
          <p className="text-sm font-medium text-zinc-500">Select an entity type to view audit trail</p>
          <p className="text-xs text-zinc-400 mt-1">Track all field-level changes</p>
        </div>
      ) : trails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="mb-2 h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
          <p className="text-sm font-medium text-zinc-500">No audit records found</p>
          <p className="text-xs text-zinc-400 mt-1">Changes will appear here once entities are modified</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">{total} audit records found</p>
          {trails.map((trail, idx) => {
            const Icon = entityTypeIcons[trail.entityType] || FileText;
            const colorClass = entityTypeColors[trail.entityType] || "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400";

            return (
              <motion.div
                key={trail.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-white capitalize">
                          {trail.action}d
                        </span>
                        <span className="text-xs text-zinc-500">{trail.entityType}</span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 dark:bg-zinc-800">
                          #{trail.entityId.slice(0, 8)}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        <TimeAgo date={trail.createdAt} />
                      </span>
                    </div>

                    {trail.description && (
                      <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{trail.description}</p>
                    )}

                    {trail.field && (
                      <div className="mt-2 flex items-start gap-2">
                        <span className="text-[11px] font-medium text-zinc-500 uppercase min-w-[100px] pt-0.5">
                          {trail.field}:
                        </span>
                        <DiffView before={trail.beforeValue} after={trail.afterValue} />
                      </div>
                    )}

                    {trail.beforeData && trail.afterData && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                          View full snapshot diff
                        </summary>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] font-medium text-red-500 mb-1">Before</p>
                            <pre className="overflow-auto rounded-lg bg-red-50 p-2 text-[10px] text-red-800 dark:bg-red-950/20 dark:text-red-300 max-h-40">
                              {JSON.stringify(trail.beforeData, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-green-500 mb-1">After</p>
                            <pre className="overflow-auto rounded-lg bg-green-50 p-2 text-[10px] text-green-800 dark:bg-green-950/20 dark:text-green-300 max-h-40">
                              {JSON.stringify(trail.afterData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
