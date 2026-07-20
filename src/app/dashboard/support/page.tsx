"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  TicketCheck,
  Clock,
  MessageSquare,
  Smile,
  Plus,
  BookOpen,
  HelpCircle,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  number: string;
  subject: string;
  customer: { name: string; email: string };
  status: string;
  priority: string;
  assignedTo: { name: string } | null;
  createdAt: string;
}

interface Analytics {
  openTickets: number;
  closedToday: number;
  avgResponseTime: string;
  satisfactionRate: number;
}

interface OverviewData {
  analytics: Analytics;
  recentTickets: Ticket[];
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function SupportOverview() {
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["support-overview"],
    queryFn: async () => {
      const [analyticsRes, ticketsRes] = await Promise.all([
        fetch("/api/support/analytics"),
        fetch("/api/support/tickets?limit=5"),
      ]);
      if (!analyticsRes.ok || !ticketsRes.ok) throw new Error("Failed to fetch");
      const analytics = await analyticsRes.json();
      const tickets = await ticketsRes.json();
      return { analytics, recentTickets: tickets.tickets ?? [] };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
        No support data available.
      </div>
    );
  }

  const statCards = [
    { title: "Open Tickets", value: data.analytics.openTickets, icon: TicketCheck },
    { title: "Closed Today", value: data.analytics.closedToday, icon: Clock },
    { title: "Avg Response Time", value: data.analytics.avgResponseTime, icon: MessageSquare },
    { title: "Satisfaction Rate", value: `${data.analytics.satisfactionRate}%`, icon: Smile },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTickets.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">No recent tickets</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Ticket</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {data.recentTickets.map((ticket) => (
                      <tr key={ticket.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-4 py-3 text-sm font-mono text-zinc-500">{ticket.number}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/support/tickets/${ticket.id}`}
                            className="text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                          >
                            {ticket.subject}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", STATUS_STYLES[ticket.status] || STATUS_STYLES.OPEN)}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.LOW)}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/support/tickets">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </Link>
            <Link href="/dashboard/support/knowledge-base">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4" />
                Knowledge Base
              </Button>
            </Link>
            <Link href="/dashboard/support/faqs">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4" />
                FAQs
              </Button>
            </Link>
            <Link href="/dashboard/support/analytics">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
