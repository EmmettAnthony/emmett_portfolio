"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Loader2, Edit3, Trash2, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { EventForm } from "@/components/calendar/EventForm";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/calendar";

const EVENT_TYPE_COLORS: Record<string, string> = {
  MEETING: "bg-badge-info-bg text-badge-info-text",
  CONSULTATION: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PROJECT_DEADLINE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PERSONAL: "bg-badge-warning-bg text-badge-warning-text",
  TASK: "bg-purple-500/10 text-purple-400",
  REMINDER: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-badge-info-bg text-badge-info-text",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RESCHEDULED: "bg-badge-warning-bg text-badge-warning-text",
};

export default function CalendarEventsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-events-list", search, filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterType) params.set("eventType", filterType);
      if (filterStatus) params.set("status", filterStatus);
      params.set("limit", "100");
      const res = await fetch(`/api/calendar/events?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events-list"] });
      toast("success", "Event deleted");
    },
    onError: () => toast("error", "Failed to delete"),
  });

  const events: CalendarEvent[] = data?.events || [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-56 rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value="">All Types</option>
            <option value="MEETING">Meeting</option>
            <option value="CONSULTATION">Consultation</option>
            <option value="PROJECT_DEADLINE">Deadline</option>
            <option value="PERSONAL">Personal</option>
            <option value="TASK">Task</option>
            <option value="REMINDER">Reminder</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <option value="">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RESCHEDULED">Rescheduled</option>
          </select>
        </div>
        <button onClick={() => { setEditingEvent(undefined); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600">
          <Plus className="h-4 w-4" /> New Event
        </button>
      </div>

      {/* Events Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <Calendar className="mb-2 h-8 w-8" />
          <p>No events found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Location</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {events.map((event: CalendarEvent, i: number) => (
                <motion.tr key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: event.color || "#3b82f6" }} />
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{event.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground dark:text-zinc-400">
                    {event.startDate ? new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", EVENT_TYPE_COLORS[event.eventType] || "")}>
                      {event.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[event.status] || "")}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground dark:text-zinc-400">
                    {event.location ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingEvent(event); setShowForm(true); }}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { if (confirm("Delete this event?")) deleteMutation.mutate(event.id); }}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>{data.pagination.total} total events</span>
          <span>Page {data.pagination.page} of {data.pagination.pages}</span>
        </div>
      )}

      <EventForm isOpen={showForm} onClose={() => { setShowForm(false); setEditingEvent(undefined); }}
        event={editingEvent} />
    </div>
  );
}
