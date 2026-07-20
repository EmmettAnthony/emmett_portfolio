"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Loader2, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { AuditTrailData } from "@/types/activity";

interface EntityHistoryProps {
  entityType: string;
  entityId: string;
  className?: string;
}

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

export function EntityHistory({ entityType, entityId, className }: EntityHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["entity-history", entityType, entityId],
    queryFn: async () => {
      const params = new URLSearchParams({ entityType, entityId });
      const res = await fetch(`/api/activity/audit?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isOpen,
  });

  const trails: AuditTrailData[] = data?.trails || [];

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
      >
        <History className="h-3.5 w-3.5" />
        History
        {trails.length > 0 && (
          <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] dark:bg-zinc-700">
            {trails.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 z-50 w-96"
          >
            <div className="rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  {entityType} History
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Close
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  </div>
                ) : trails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="mb-1 h-5 w-5 text-zinc-300 dark:text-muted-foreground" />
                    <p className="text-xs text-zinc-500">No history recorded yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {trails.map((trail) => (
                      <div key={trail.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-900 dark:text-white capitalize">
                            {trail.action}d
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            <TimeAgo date={trail.createdAt} />
                          </span>
                        </div>
                        {trail.description && (
                          <p className="mt-0.5 text-xs text-zinc-500">{trail.description}</p>
                        )}
                        {trail.field && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                            <span className="text-zinc-400">{trail.field}:</span>
                            {trail.beforeValue !== null && (
                              <span className="rounded bg-red-50 px-1 text-red-500 line-through dark:bg-red-950/30">
                                {trail.beforeValue}
                              </span>
                            )}
                            {trail.beforeValue !== null && trail.afterValue !== null && (
                              <span className="text-zinc-300">→</span>
                            )}
                            {trail.afterValue !== null && (
                              <span className="rounded bg-green-50 px-1 text-green-600 dark:bg-green-950/30">
                                {trail.afterValue}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
                <a
                  href={`/dashboard/activity/audit?entityType=${entityType}&entityId=${entityId}`}
                  className="flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <ExternalLink className="h-3 w-3" />
                  View full audit trail
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
