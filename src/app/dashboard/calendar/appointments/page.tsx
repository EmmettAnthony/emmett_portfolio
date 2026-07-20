"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Calendar, Clock, Phone, Mail, Building2, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Appointment, AppointmentLog } from "@/types/calendar";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-badge-warning-bg text-badge-warning-text",
  CONFIRMED: "bg-badge-info-bg text-badge-info-text",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RESCHEDULED: "bg-purple-500/10 text-purple-400",
  NO_SHOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function CalendarAppointmentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-appointments", search, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      params.set("limit", "50");
      const res = await fetch(`/api/calendar/appointments?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ appointments: Appointment[]; pagination: { page: number; total: number; pages: number } }>;
    },
    refetchInterval: 15000,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, cancellationReason }: { id: string; status: string; cancellationReason?: string }) => {
      const res = await fetch(`/api/calendar/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancellationReason }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast("success", "Appointment updated");
    },
    onError: () => toast("error", "Failed to update"),
  });

  const appointments: Appointment[] = data?.appointments || [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, company..."
              className="w-64 rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>
        <div className="text-sm text-zinc-500">{data?.pagination?.total || 0} total</div>
      </div>

      {/* Appointments Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <Calendar className="mb-2 h-8 w-8" />
          <p>No appointments found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {appointments.map((a: Appointment, i: number) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{a.name}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{a.email}</span>
                    {a.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.phone}</span>}
                  </div>
                  {a.company && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500"><Building2 className="h-3 w-3" />{a.company}</p>
                  )}
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium", STATUS_COLORS[a.status] || "")}>
                  {a.status}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-muted-foreground dark:text-zinc-400">
                <p className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(a.preferredDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  {a.preferredTime && <> at {a.preferredTime}</>}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  {a.duration} min {a.meetingType?.name || null}
                </p>
              </div>
              {a.message && (
                <p className="mt-2 text-xs text-zinc-500 line-clamp-2 italic">{a.message}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.status === "PENDING" && (
                  <>
                    <button onClick={() => statusMutation.mutate({ id: a.id, status: "CONFIRMED" })}
                      className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">Confirm</button>
                    <button onClick={() => statusMutation.mutate({ id: a.id, status: "CANCELLED" })}
                      className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">Cancel</button>
                  </>
                )}
                {a.status === "CONFIRMED" && (
                  <>
                    <button onClick={() => statusMutation.mutate({ id: a.id, status: "COMPLETED" })}
                      className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle2 className="mr-1 inline h-3 w-3" />Complete</button>
                    <button onClick={() => statusMutation.mutate({ id: a.id, status: "NO_SHOW" })}
                      className="rounded-md bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400">No Show</button>
                  </>
                )}
                {(a.status === "COMPLETED" || a.status === "NO_SHOW" || a.status === "CANCELLED") && (
                  <button onClick={() => statusMutation.mutate({ id: a.id, status: "PENDING" })}
                    className="rounded-md bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400">
                    <RotateCcw className="mr-1 inline h-3 w-3" />Reopen</button>
                )}
                {a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                  <button onClick={() => {
                    const reason = prompt("Reschedule reason (optional):");
                    statusMutation.mutate({ id: a.id, status: "RESCHEDULED", cancellationReason: reason || undefined });
                  }}
                    className="rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400">Reschedule</button>
                )}
              </div>

              {/* Activity Log */}
              {a.appointmentLogs && a.appointmentLogs.length > 0 && (
                <div className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Activity</p>
                  {a.appointmentLogs.slice(0, 3).map((log: AppointmentLog) => (
                    <p key={log.id} className="text-[11px] text-zinc-500">
                      {log.action} — {new Date(log.createdAt).toLocaleString()}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
