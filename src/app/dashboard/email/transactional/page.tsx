"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionalEmail {
  id: string;
  messageId?: string;
  email: string;
  subject: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export default function TransactionalPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["email-transactional", search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("email", search);
      params.set("limit", "20");
      params.set("offset", String((page - 1) * 20));
      const res = await fetch(`/api/email/transactional?${params}`);
      if (!res.ok) throw new Error("Failed to fetch transactional emails");
      return res.json();
    },
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Icon component type
  const statusIcon: Record<string, { icon: any; color: string }> = {
    sent: { icon: CheckCircle, color: "text-emerald-500" },
    delivered: { icon: CheckCircle, color: "text-blue-500" },
    bounced: { icon: XCircle, color: "text-red-500" },
    failed: { icon: AlertTriangle, color: "text-red-500" },
    opened: { icon: Mail, color: "text-emerald-500" },
    clicked: { icon: Mail, color: "text-blue-500" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Transactional Emails</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          View and manage transactional email logs
        </p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Sent At</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Message ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.emails && data.emails.length > 0 ? (
                data.emails.map((email: TransactionalEmail) => {
                  const statusInfo = statusIcon[email.status] || { icon: Clock, color: "text-zinc-400" };
                  const StatusIconComponent = statusInfo.icon;
                  return (
                    <tr key={email.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white">{email.email}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{email.subject || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5">
                          <StatusIconComponent className={cn("h-3.5 w-3.5", statusInfo.color)} />
                          <span className="text-sm capitalize">{email.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {email.sentAt ? new Date(email.sentAt).toLocaleString() : new Date(email.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800">
                          {email.messageId ? email.messageId.substring(0, 20) + "..." : "—"}
                        </code>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center text-zinc-400">
                      <Mail className="mb-2 h-8 w-8" />
                      <p className="text-sm text-zinc-500">No transactional emails found</p>
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
