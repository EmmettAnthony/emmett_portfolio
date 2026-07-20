"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  TicketCheck,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Ticket {
  id: string;
  number: string;
  subject: string;
  customer: { name: string; email: string };
  status: string;
  priority: string;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
}

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "ALL", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

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

export default function SupportTicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "ALL");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hasActiveFilters = search || statusFilter !== "ALL" || priorityFilter !== "ALL";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState<"status" | "assign" | "priority" | "delete" | null>(null);
  const [bulkPriority, setBulkPriority] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/support/users").then(r => r.json()).then(data => {
      setUsers(data.users || []);
    }).catch(() => {});
  }, []);

  const executeBulk = async () => {
    const ids = Array.from(selectedIds);
    try {
      if (bulkAction === "delete") {
        await Promise.all(ids.map(id => fetch(`/api/support/tickets/${id}`, { method: "DELETE" })));
      } else if (bulkAction === "status" && bulkStatus) {
        await fetch("/api/support/tickets/bulk", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "status", value: bulkStatus }),
        });
      } else if (bulkAction === "assign" && bulkAssignee) {
        await fetch("/api/support/tickets/bulk", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "assign", value: bulkAssignee }),
        });
      } else if (bulkAction === "priority" && bulkPriority) {
        await fetch("/api/support/tickets/bulk", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "priority", value: bulkPriority }),
        });
      }
      setSelectedIds(new Set());
      setBulkStatus("");
      setBulkAssignee("");
      setBulkPriority("");
      setBulkAction(null);
      setShowBulkConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    } catch {}
  };

  const queryKey = ["support-tickets", search, statusFilter, priorityFilter, page];

  const { data, isLoading, error } = useQuery<TicketsResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      params.set("page", String(page));
      params.set("pageSize", "15");
      const res = await fetch(`/api/support/tickets?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return res.json();
    },
  });

  const updateURL = useCallback((params: { search?: string; status?: string; priority?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const s = params.search ?? search;
    const st = params.status ?? statusFilter;
    const pr = params.priority ?? priorityFilter;
    const p = params.page ?? page;
    if (s) sp.set("search", s);
    if (st && st !== "ALL") sp.set("status", st);
    if (pr && pr !== "ALL") sp.set("priority", pr);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    router.replace(`/dashboard/support/tickets${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, statusFilter, priorityFilter, page, router]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      updateURL({ search: value, page: 1 });
    }, 300);
  };

  const handleStatusChange = (value: string | null) => {
    const v = value ?? "ALL";
    setStatusFilter(v);
    setPage(1);
    updateURL({ status: v, page: 1 });
  };

  const handlePriorityChange = (value: string | null) => {
    const v = value ?? "ALL";
    setPriorityFilter(v);
    setPage(1);
    updateURL({ priority: v, page: 1 });
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setPage(1);
    router.replace("/dashboard/support/tickets", { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage });
  };

  useEffect(() => {
    return () => clearTimeout(searchTimeout.current);
  }, []);

  const tickets = data?.tickets ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Tickets</h2>
          <p className="text-sm text-zinc-500">{data?.total ?? 0} total tickets</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); updateURL({ search: "", page: 1 }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 dark:border-primary/30 dark:bg-primary/10">
          <span className="text-sm font-medium text-zinc-900 dark:text-white">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-600" />
          <select
            value={bulkAssignee}
            onChange={(e) => { setBulkAssignee(e.target.value); setBulkAction("assign"); setShowBulkConfirm(true); }}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
          >
            <option value="">Assign To</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select
            value={bulkStatus}
            onChange={(e) => { setBulkStatus(e.target.value); setBulkAction("status"); setShowBulkConfirm(true); }}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
          >
            <option value="">Change Status</option>
            {STATUS_OPTIONS.filter(s => s.value !== "ALL").map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            value={bulkPriority}
            onChange={(e) => { setBulkPriority(e.target.value); setBulkAction("priority"); setShowBulkConfirm(true); }}
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
          >
            <option value="">Change Priority</option>
            {PRIORITY_OPTIONS.filter(p => p.value !== "ALL").map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button
            onClick={() => { setBulkAction("delete"); setShowBulkConfirm(true); }}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-3 w-3" /> Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <TicketCheck className="mb-3 h-10 w-10 text-red-400" />
          <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load tickets</p>
          <p className="mt-1 text-sm">Please try refreshing the page.</p>
        </div>
      )}

      {isLoading && (
        <Card>
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      )}

      {!isLoading && !error && tickets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TicketCheck className="mb-3 h-10 w-10 text-muted-foreground" />
            {hasActiveFilters ? (
              <>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No tickets match your filters</p>
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No tickets yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && tickets.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={tickets.length > 0 && selectedIds.size === tickets.length}
                      onChange={() => {
                        if (selectedIds.size === tickets.length) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(new Set(tickets.map(t => t.id)));
                        }
                      }}
                      className="rounded border-zinc-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Ticket#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className={`transition-colors ${selectedIds.has(ticket.id) ? "bg-primary/5" : ""} hover:bg-zinc-50 dark:hover:bg-zinc-800/50`}>
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(ticket.id)}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(ticket.id)) next.delete(ticket.id); else next.add(ticket.id);
                          setSelectedIds(next);
                        }}
                        className="rounded border-zinc-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-500">{ticket.number}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/support/tickets/${ticket.id}`}
                        className="text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{ticket.customer.name}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", STATUS_STYLES[ticket.status] || STATUS_STYLES.OPEN)}>
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.LOW)}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{ticket.assignedTo?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/support/tickets/${ticket.id}`}
                        className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  const total = data.totalPages;
                  const current = data.page;
                  if (total <= 7) return true;
                  if (p === 1 || p === total) return true;
                  if (Math.abs(p - current) <= 1) return true;
                  return false;
                })
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-zinc-400">...</span>}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                          p === data.page
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBulkConfirm(false)}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Confirm Bulk Action</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {bulkAction === "delete"
                ? `Are you sure you want to delete ${selectedIds.size} ticket(s)? This cannot be undone.`
                : `Apply "${bulkAction?.replace(/_/g, " ")}" to ${selectedIds.size} ticket(s)?`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowBulkConfirm(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700">Cancel</button>
              <button onClick={executeBulk} className={`rounded-lg px-4 py-2 text-sm text-white ${bulkAction === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
