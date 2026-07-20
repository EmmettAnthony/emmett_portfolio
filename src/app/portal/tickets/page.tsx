"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Clock, AlertCircle, ChevronRight, Search } from "lucide-react";
import Link from "next/link";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: { name: string; color: string | null; slug: string };
  priority: { name: string; color: string | null; level: number } | null;
  createdAt: string;
  updatedAt: string;
}

export default function PortalTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/portal/tickets")
      .then(async (res) => {
        if (!res.ok) { if (res.status === 401) router.push("/portal"); throw new Error("Unauthorized"); }
        return res.json();
      })
      .then((data) => setTickets(data.tickets || []))
      .catch((err) => { if (err.message !== "Unauthorized") setError(err.message); })
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = tickets.filter(t =>
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 pt-24">
        <div className="mx-auto max-w-4xl px-4"><div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">My Support Tickets</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""} found</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-lg border border-zinc-300 py-2.5 pl-10 pr-4 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
          />
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
            <Ticket className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-500" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No tickets found</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {searchTerm ? "Try a different search" : "Submit a new support request to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/tickets/${ticket.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-primary/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono font-medium text-zinc-400">{ticket.ticketNumber}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ticket.priority?.color || "text-zinc-600"}`}>
                      <AlertCircle className="h-3 w-3" />{ticket.priority?.name || "Normal"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ticket.status.color || "bg-zinc-100 text-zinc-700"}`}>
                      {ticket.status.name}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-900 truncate dark:text-white">{ticket.subject}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-zinc-300 dark:text-zinc-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
