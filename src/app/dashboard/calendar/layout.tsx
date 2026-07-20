"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarDays,
  CalendarClock,
  ListTodo,
  Bell,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const calendarNavItems = [
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/calendar/events", label: "Events", icon: CalendarDays },
  { href: "/dashboard/calendar/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/dashboard/calendar/tasks", label: "Tasks", icon: ListTodo },
  { href: "/dashboard/calendar/reminders", label: "Reminders", icon: Bell },
  { href: "/dashboard/calendar/settings", label: "Settings", icon: Settings },
];

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-info-bg text-badge-info-text">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Calendar</h1>
            <p className="text-sm text-zinc-500">Manage events, appointments, tasks, and reminders</p>
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {calendarNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard/calendar" ? pathname === "/dashboard/calendar" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                active
                  ? "bg-badge-info-bg text-badge-info-text"
                  : "text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="min-h-[600px]">
        {children}
      </div>
    </div>
  );
}
