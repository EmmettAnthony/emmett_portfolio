"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface EmailLogEntry {
  id: string;
  email: string;
  subject: string | null;
  status: string;
  campaignId: string | null;
  subscriberId: string | null;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  opensCount: number;
  clicksCount: number;
  error: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  opened: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  clicked: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  bounced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  queued: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function EmailHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["email-history", search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/email/history?${params}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Email History</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Complete log of all sent emails
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by email or subject..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="opened">Opened</option>
          <option value="clicked">Clicked</option>
          <option value="bounced">Bounced</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Opens</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.logs && data.logs.length > 0 ? (
                data.logs.map((log: EmailLogEntry) => (
                  <tr key={log.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">{log.email}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{log.subject || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium", statusColors[log.status] || "bg-zinc-100 text-zinc-600")}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{log.opensCount}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{log.clicksCount}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center text-zinc-400">
                      <History className="mb-2 h-8 w-8" />
                      <p className="text-sm text-zinc-500">No email history found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
