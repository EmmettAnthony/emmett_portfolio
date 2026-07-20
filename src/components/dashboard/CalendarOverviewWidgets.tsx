"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  CalendarClock,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CalendarEvent,
  Appointment,
  CalendarTask
} from "@/types/calendar";

const today = new Date().toISOString().split("T")[0];

const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-badge-warning-bg text-badge-warning-text",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RESCHEDULED: "bg-purple-500/10 text-purple-400",
  NO_SHOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
};

function SectionHeader({
  title,
  href,
  count,
  icon: Icon,
}: {
  title: string;
  href: string;
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-zinc-500" />
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h4>
        {count !== undefined && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
            {count}
          </span>
        )}
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        View all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function EventItem({ event }: { event: CalendarEvent }) {
  const startDate = new Date(event.startDate);
  const timeStr = event.startTime
    ? new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <span
        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: event.color || "#3b82f6" }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{event.title}</p>
        <p className="text-xs text-zinc-500">{timeStr}</p>
      </div>
      {event.location && (
        <span className="hidden truncate text-xs text-zinc-400 sm:block">{event.location}</span>
      )}
    </div>
  );
}

function AppointmentItem({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex items-start justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{appointment.name}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              APPOINTMENT_STATUS_COLORS[appointment.status] || ""
            )}
          >
            {appointment.status}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
          <Calendar className="h-3 w-3" />
          {new Date(appointment.preferredDate).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
          {appointment.preferredTime && <> at {appointment.preferredTime}</>}
          <span className="text-muted-foreground">·</span>
          {appointment.duration} min
        </p>
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: CalendarTask }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      {task.status === "COMPLETED" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
      ) : isOverdue ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      ) : (
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm",
            task.status === "COMPLETED"
              ? "text-zinc-400 line-through"
              : "text-zinc-900 dark:text-white"
          )}
        >
          {task.title}
        </p>
        {task.dueDate && (
          <p
            className={cn(
              "text-xs",
              isOverdue && task.status !== "COMPLETED"
                ? "text-red-500 font-medium"
                : "text-zinc-500"
            )}
          >
            Due {new Date(task.dueDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>
      {task.priority === "HIGH" || task.priority === "URGENT" ? (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
      ) : null}
    </div>
  );
}

function ActivityItem({
  action,
  detail,
  time,
}: {
  action: string;
  detail?: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
        </div>
        <p className="truncate text-sm text-zinc-700 dark:text-muted-foreground">
          {action}
          {detail && (
            <span className="font-medium text-zinc-900 dark:text-white"> {detail}</span>
          )}
        </p>
      </div>
      <span className="shrink-0 text-xs text-zinc-500">{time}</span>
    </div>
  );
}

function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CalendarOverviewWidgets() {

  // Today's events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["overview-todays-events"],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: today, endDate: today, limit: "10" });
      const res = await fetch(`/api/calendar/events?${params}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ events: CalendarEvent[] }>;
    },
    refetchInterval: 60000,
  });

  // Upcoming appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["overview-upcoming-appointments"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/appointments?limit=10");
      if (!res.ok) return null;
      return res.json() as Promise<{ appointments: Appointment[] }>;
    },
    refetchInterval: 30000,
  });

  // Overdue / pending tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["overview-overdue-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/tasks?limit=20&sort=dueDate&order=asc");
      if (!res.ok) return null;
      return res.json() as Promise<{ tasks: CalendarTask[] }>;
    },
    refetchInterval: 30000,
  });

  // Recent appointment activity logs
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["overview-appointment-activity"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/appointments?limit=20");
      if (!res.ok) return null;
      const data = (await res.json()) as { appointments: Appointment[] };
      // Collect all logs from recent appointments, flatten & sort by createdAt
      const logs: { action: string; detail?: string; createdAt: string; appointmentName: string }[] = [];
      for (const a of data.appointments || []) {
        if (a.appointmentLogs) {
          for (const log of a.appointmentLogs) {
            logs.push({
              action: log.action,
              detail: log.detail || undefined,
              createdAt: log.createdAt,
              appointmentName: a.name,
            });
          }
        }
      }
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return logs.slice(0, 8);
    },
    refetchInterval: 60000,
  });

  const todayEvents = eventsData?.events || [];
  const upcomingAppointments = (appointmentsData?.appointments || []).filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED"
  );
  const overdueTasks = (tasksData?.tasks || []).filter(
    (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < new Date()
  );
  const pendingTasks = (tasksData?.tasks || []).filter((t) => t.status !== "COMPLETED");
  const recentActivity = activityData || [];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-6 lg:grid-cols-2"
    >
      {/* Today's Events */}
      <motion.div variants={item}>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <SectionHeader
            title="Today's Events"
            href="/dashboard/calendar"
            count={todayEvents.length}
            icon={Calendar}
          />
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : todayEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">No events scheduled for today</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {todayEvents.slice(0, 6).map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Upcoming Appointments */}
      <motion.div variants={item}>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <SectionHeader
            title="Upcoming Appointments"
            href="/dashboard/calendar/appointments"
            count={upcomingAppointments.length}
            icon={CalendarClock}
          />
          {appointmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">No upcoming appointments</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {upcomingAppointments.slice(0, 6).map((appointment) => (
                <AppointmentItem key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Overdue Tasks */}
      <motion.div variants={item}>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <SectionHeader
            title="Overdue Tasks"
            href="/dashboard/calendar/tasks"
            count={overdueTasks.length}
            icon={AlertCircle}
          />
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : pendingTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">No pending tasks — you&apos;re all caught up!</p>
          ) : (
            <div className="space-y-0.5">
              {overdueTasks.length > 0 && (
                <>
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-red-500">
                    Overdue ({overdueTasks.length})
                  </p>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {overdueTasks.slice(0, 4).map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </div>
                </>
              )}
              {overdueTasks.length === 0 && pendingTasks.length > 0 && (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {pendingTasks.slice(0, 5).map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Appointment Activity */}
      <motion.div variants={item}>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <SectionHeader
            title="Appointment Activity"
            href="/dashboard/calendar/appointments"
            count={recentActivity.length}
            icon={Clock}
          />
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">No recent appointment activity</p>
          ) : (
            <div className="space-y-0.5">
              {recentActivity.map((log, i) => (
                <ActivityItem
                  key={`${log.createdAt}-${i}`}
                  action={formatAction(log.action)}
                  detail={log.appointmentName}
                  time={timeAgo(log.createdAt)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    CREATED: "New booking from",
    CONFIRMED: "Confirmed appointment for",
    CANCELLED: "Cancelled appointment for",
    RESCHEDULED: "Rescheduled appointment for",
    COMPLETED: "Completed appointment with",
    NO_SHOW: "Marked no-show for",
    REMINDER_SENT: "Sent reminder to",
  };
  return labels[action] || action;
}
