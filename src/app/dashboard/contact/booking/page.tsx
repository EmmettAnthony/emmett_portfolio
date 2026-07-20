"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, ExternalLink, ArrowLeft, HelpCircle, Eye, X, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  projectType: string | null;
  preferredDate: string;
  preferredTime: string | null;
  duration: number;
  message: string | null;
  notes: string | null;
  status: string;
  meetingType: { name: string } | null;
  contact: { id: string; fullName: string; email: string } | null;
  createdAt: string;
}

interface BookingData {
  appointments: Appointment[];
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-badge-info-bg text-badge-info-text",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RESCHEDULED: "bg-purple-500/10 text-purple-400",
  NO_SHOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground",
};

export default function ContactBookingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery<BookingData>({
    queryKey: ["dashboard-contact-booking"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/contact/booking");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/booking/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-contact-booking"] });
      toast("success", "Appointment updated");
    },
    onError: () => toast("error", "Failed to update appointment"),
  });

  const stats = data?.stats;

  const filtered = (data?.appointments ?? [])
    .filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.company?.toLowerCase().includes(q) ?? false) ||
        (a.projectType?.toLowerCase().includes(q) ?? false)
      );
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Booking</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <a href="https://calendar.app.google/wRyaaUEGemxPDZ4Y8" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
          <Calendar className="h-4 w-4" />
          Open Booking Page
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        {isLoading
          ? [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            ))
          : [
              { label: "Total", value: stats?.total ?? 0, color: "text-zinc-900 dark:text-white" },
              { label: "Pending", value: stats?.pending ?? 0, color: "text-yellow-600" },
              { label: "Confirmed", value: stats?.confirmed ?? 0, color: "text-blue-600" },
              { label: "Completed", value: stats?.completed ?? 0, color: "text-green-600" },
              { label: "Cancelled", value: stats?.cancelled ?? 0, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-medium text-zinc-500">{s.label}</p>
                <p className={cn("mt-2 text-2xl font-bold", s.color)}>{s.value}</p>
              </div>
            ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      {/* Appointments List */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Appointments</h3>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <HelpCircle className="mb-2 h-8 w-8" />
            <p className="text-sm font-medium">{search || statusFilter !== "all" ? "No matching appointments" : "No appointments yet"}</p>
            <p className="text-xs">{search || statusFilter !== "all" ? "Try adjusting your filters" : "Appointments created via the booking form will appear here"}</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {apt.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                      {apt.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {new Date(apt.preferredDate).toLocaleDateString()}
                      {apt.preferredTime && ` at ${apt.preferredTime}`}
                      {apt.projectType && ` — ${apt.projectType}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={apt.status}
                    onChange={(e) => statusMutation.mutate({ id: apt.id, status: e.target.value })}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border-0 appearance-none cursor-pointer",
                      statusColors[apt.status] || "bg-zinc-100 text-muted-foreground"
                    )}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                    <option value="NO_SHOW">NO SHOW</option>
                  </select>
                  <button
                    onClick={() => setSelected(apt)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-10" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Appointment Details</h2>
                <select
                  value={selected.status}
                  onChange={(e) => {
                    statusMutation.mutate({ id: selected.id, status: e.target.value });
                    setSelected({ ...selected, status: e.target.value });
                  }}
                  className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border-0 appearance-none cursor-pointer", statusColors[selected.status])}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="RESCHEDULED">RESCHEDULED</option>
                  <option value="NO_SHOW">NO SHOW</option>
                </select>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Name</p><p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-white">{selected.name}</p></div>
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Email</p><p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.email}</p></div>
                {selected.phone && <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Phone</p><p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.phone}</p></div>}
                {selected.company && <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Company</p><p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.company}</p></div>}
              </div>
              <hr className="border-zinc-200 dark:border-zinc-700" />
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Date</p><p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{new Date(selected.preferredDate).toLocaleDateString()}</p></div>
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Time</p><p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.preferredTime || "—"}</p></div>
                {selected.projectType && <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Project Type</p><p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.projectType}</p></div>}
              </div>
              {selected.contact && (
                <hr className="border-zinc-200 dark:border-zinc-700" />
              )}
              {selected.contact && (
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Linked Contact</p><p className="mt-0.5 text-sm text-zinc-900 dark:text-white">{selected.contact.fullName} ({selected.contact.email})</p></div>
              )}
              {selected.message && (
                <><hr className="border-zinc-200 dark:border-zinc-700" /><div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Message</p><p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400 whitespace-pre-wrap">{selected.message}</p></div></>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
