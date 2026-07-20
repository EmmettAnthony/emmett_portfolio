"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Clock,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/StatsCard";

interface SLATicket {
  id: string;
  number: string;
  subject: string;
  priority: string;
  status: string;
  assignedTo: { name: string } | null;
  createdAt: string;
  slaDeadline: string;
  slaStatus: "ok" | "at_risk" | "breached";
}

interface SLAData {
  breachCount: number;
  atRiskCount: number;
  okCount: number;
  tickets: SLATicket[];
}

const SLA_STYLES: Record<string, string> = {
  ok: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  at_risk: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  breached: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function SLAPage() {
  const { data, isLoading } = useQuery<SLAData>({
    queryKey: ["support-sla"],
    queryFn: async () => {
      const res = await fetch("/api/support/sla");
      if (!res.ok) throw new Error("Failed to fetch SLA data");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
        No SLA data available.
      </div>
    );
  }

  const statCards = [
    { title: "SLA Breached", value: data.breachCount, icon: ShieldAlert },
    { title: "At Risk", value: data.atRiskCount, icon: AlertTriangle },
    { title: "Within SLA", value: data.okCount, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">SLA Monitoring</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track service-level agreement compliance for support tickets
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((_stat, _i) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket SLA Status</CardTitle>
        </CardHeader>
        <CardContent>
          {data.tickets.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">No tickets with SLA data</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Assigned</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Deadline</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.tickets.map((ticket) => (
                    <tr key={ticket.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 text-sm font-mono text-zinc-500">{ticket.number}</td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">{ticket.subject}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">{ticket.assignedTo?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {new Date(ticket.slaDeadline).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", SLA_STYLES[ticket.slaStatus])}>
                          {ticket.slaStatus === "breached" && <ShieldAlert className="h-3 w-3" />}
                          {ticket.slaStatus === "at_risk" && <AlertTriangle className="h-3 w-3" />}
                          {ticket.slaStatus === "ok" && <Clock className="h-3 w-3" />}
                          {ticket.slaStatus.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
