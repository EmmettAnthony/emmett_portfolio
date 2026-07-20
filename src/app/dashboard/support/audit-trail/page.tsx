"use client";

import { useEffect, useState } from "react";
import { Search, Clock, User, ArrowUpRight, Activity } from "lucide-react";
import Link from "next/link";

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  userName?: string;
  ticketNumber?: string;
  ticketId?: string;
}

export default function SupportAuditTrailPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterAction) params.set("action", filterAction);
    fetch(`/api/support/audit-trail?${params}`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.data || data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterAction]);

  const filtered = entries.filter(e =>
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const actionOptions = ["created", "replied", "status_changed", "assigned", "closed", "rated", "bulk_assign", "bulk_status", "bulk_priority", "bulk_delete"];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Audit Trail</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track all changes and actions on support tickets
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
        >
          <option value="">All Actions</option>
          {actionOptions.map(a => (
            <option key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
            <Activity className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No audit entries found</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {searchTerm ? "Try a different search" : "Activity will appear here as tickets are created and updated"}
            </p>
          </div>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className="flex items-start gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {entry.action?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  {entry.ticketId && (
                    <Link href={`/dashboard/support/tickets/${entry.ticketId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      View Ticket <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{entry.description}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  {entry.userName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {entry.userName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
