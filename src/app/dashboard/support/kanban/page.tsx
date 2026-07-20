"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, User } from "lucide-react";
import Link from "next/link";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  fullName: string;
  priority: { name: string; color: string; textColor?: string };
  status: { id: string; name: string; color: string; bgColor: string };
  createdAt: string;
  assignedTo?: { name: string } | null;
}

interface StatusGroup {
  id: string;
  name: string;
  tickets: Ticket[];
}

export default function SupportKanbanPage() {
  const [columns, setColumns] = useState<StatusGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support/kanban");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setColumns(data.columns || []);
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Catch clause error type
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchTickets(), 0);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  const moveTicket = async (ticketId: string, newStatusId: string) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      tickets: col.tickets.filter(t => t.id !== ticketId),
    })));

    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: newStatusId }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchTickets();
    } catch {
      await fetchTickets();
    }
  };

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Kanban Board</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Drag tickets between columns to update status
          </p>
        </div>
        <Link
          href="/dashboard/support/tickets/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {columns.map((column) => (
          <div key={column.id} className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between rounded-t-xl border-b border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{column.name}</h3>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {column.tickets.length}
              </span>
            </div>
            <div className="space-y-2 p-2">
              {column.tickets.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-zinc-400">No tickets</p>
                </div>
              ) : (
                column.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={() => setSelectedTicket(ticket.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (selectedTicket) {
                        moveTicket(selectedTicket, column.id);
                        setSelectedTicket(null);
                      }
                    }}
                    onClick={() => router.push(`/dashboard/support/tickets/${ticket.id}`)}
                    className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-primary/50"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-zinc-400">{ticket.ticketNumber}</span>
                      {ticket.priority.name && (
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${ticket.priority.color || "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}>
                          {ticket.priority.name}
                        </span>
                      )}
                    </div>
                    <p className="mb-2 line-clamp-2 text-sm font-medium text-zinc-900 dark:text-white">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>{ticket.fullName}</span>
                      {ticket.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
