"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Calendar, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Appointment {
  id: string;
  name: string;
  email: string;
  preferredDate: string;
  preferredTime: string | null;
  duration: number;
  status: string;
}

interface ReminderLog {
  id: string;
  to: string;
  subject: string;
  status: string;
  error: string | null;
  appointmentId: string | null;
  createdAt: string;
}

interface ReminderData {
  pendingReminders: number;
  sentToday: number;
  upcoming: Appointment[];
  recentLogs: ReminderLog[];
}

export default function BookingRemindersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<ReminderData>({
    queryKey: ["booking-reminders"],
    queryFn: async () => {
      const res = await fetch("/api/booking/reminders");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/booking/reminders", { method: "POST" });
      if (!res.ok) throw new Error("Failed to send reminders");
      return res.json() as Promise<{ sent: number; errors: number }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["booking-reminders"] });
      toast("success", `Sent ${result.sent} reminder${result.sent !== 1 ? "s" : ""}${result.errors ? ` (${result.errors} failed)` : ""}`);
    },
    onError: () => toast("error", "Failed to send reminders"),
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "SUCCESS": return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "FAILED": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      default: return "text-muted-foreground bg-zinc-50 dark:bg-zinc-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a
          href="/dashboard/contact/booking"
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Reminders</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage appointment reminder notifications
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {isLoading
          ? [1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            ))
          : [
              {
                label: "Pending Reminders",
                value: data?.pendingReminders ?? 0,
                icon: Bell,
                color: "text-amber-600",
              },
              {
                label: "Sent Today",
                value: data?.sentToday ?? 0,
                icon: BellRing,
                color: "text-green-600",
              },
              {
                label: "Upcoming",
                value: data?.upcoming?.length ?? 0,
                icon: Calendar,
                color: "text-blue-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500">{s.label}</p>
                  <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                </div>
              </div>
            ))}
      </div>

      {/* Action */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Send Reminders</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {data?.pendingReminders
                ? `${data.pendingReminders} appointment${data.pendingReminders !== 1 ? "s" : ""} need${data.pendingReminders === 1 ? "s" : ""} a reminder`
                : "No pending reminders"}
            </p>
          </div>
          <button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !data?.pendingReminders}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <BellRing className="h-4 w-4" />
            {sendMutation.isPending ? "Sending..." : "Send Pending Reminders"}
          </button>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {data?.upcoming && data.upcoming.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Appointments Needing Reminders
            </h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.upcoming.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {apt.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                      {apt.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {new Date(apt.preferredDate).toLocaleDateString()}
                      {apt.preferredTime && ` at ${apt.preferredTime}`}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Reminder Logs</h3>
        </div>
        {data?.recentLogs && data.recentLogs.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                    {log.to}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {new Date(log.createdAt).toLocaleString()}
                    {log.error && ` — ${log.error}`}
                  </p>
                </div>
                <span className={cn("ml-4 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", statusColor(log.status))}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <Bell className="mb-2 h-8 w-8" />
            <p className="text-sm font-medium">No reminder logs yet</p>
            <p className="text-xs">Reminders sent will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
