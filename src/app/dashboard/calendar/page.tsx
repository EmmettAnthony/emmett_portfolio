"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";

import { EventForm } from "@/components/calendar/EventForm";
import { ChevronLeft, ChevronRight, Plus, Search, Loader2, Eye, BarChart3, CalendarCheck, Clock } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { motion } from "framer-motion";
import type {
  CalendarEvent,
  CalendarEventInput
} from "@/types/calendar";

type ViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek" | "multiMonthYear";

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: "dayGridMonth", label: "Month" },
  { value: "timeGridWeek", label: "Week" },
  { value: "timeGridDay", label: "Day" },
  { value: "listWeek", label: "Agenda" },
  { value: "multiMonthYear", label: "Year" },
];

export default function CalendarPage() {

  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<ViewType>("dayGridMonth");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["calendar-events", searchQuery, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterType) params.set("eventType", filterType);
      params.set("limit", "200");
      const res = await fetch(`/api/calendar/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["calendar-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/analytics");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const analytics = analyticsData?.analytics;

  const calendarEvents: CalendarEventInput[] = (eventsData?.events || []).map((e: CalendarEvent) => ({
    id: e.id,
    title: e.title,
    start: e.startDate,
    end: e.endDate || undefined,
    allDay: e.allDay,
    backgroundColor: e.color || "#3b82f6",
    borderColor: e.color || "#3b82f6",
    textColor: "#ffffff",
    className: "rounded-lg border-0 shadow-sm",
    extendedProps: {
      eventType: e.eventType,
      status: e.status,
      description: e.description,
      location: e.location,
      priority: e.priority,
    },
  }));

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setEditingEvent(undefined);
    setDefaultDate(selectInfo.startStr.split("T")[0]);
    setShowEventForm(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = eventsData?.events?.find((e: CalendarEvent) => e.id === clickInfo.event.id);
    if (event) {
      setEditingEvent(event);
      setShowEventForm(true);
    }
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
    }
  };

  const handleDateChange = (direction: "prev" | "next") => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      if (direction === "prev") calendarApi.prev(); else calendarApi.next();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {analytics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Upcoming" value={analytics.upcomingAppointments} icon={CalendarCheck} />
          <StatsCard title="Overdue Tasks" value={analytics.overdueTasks} icon={Clock} />
          <StatsCard title="Completed" value={analytics.completedAppointments} icon={BarChart3} />
          <StatsCard title="Pending" value={analytics.pendingAppointments} icon={Eye} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => handleDateChange("prev")} className="rounded-lg border border-zinc-300 p-2 text-muted-foreground hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => handleDateChange("next")} className="rounded-lg border border-zinc-300 p-2 text-muted-foreground hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleViewChange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentView === opt.value
                    ? "bg-blue-600 text-white"
                    : "text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-48 rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="MEETING">Meeting</option>
            <option value="CONSULTATION">Consultation</option>
            <option value="PROJECT_DEADLINE">Deadline</option>
            <option value="PERSONAL">Personal</option>
            <option value="TASK">Task</option>
            <option value="REMINDER">Reminder</option>
          </select>
          <button
            onClick={() => { setEditingEvent(undefined); setDefaultDate(new Date().toISOString().split("T")[0]); setShowEventForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600"
          >
            <Plus className="h-4 w-4" />
            New Event
          </button>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <style jsx global>{`
            .fc {
              --fc-border-color: #e4e4e7;
              --fc-button-text-color: #374151;
              --fc-button-bg-color: transparent;
              --fc-button-border-color: #d4d4d8;
              --fc-button-hover-bg-color: #f4f4f5;
              --fc-button-hover-border-color: #d4d4d8;
              --fc-button-active-bg-color: #2563eb;
              --fc-button-active-border-color: #2563eb;
              --fc-today-bg-color: #eff6ff;
              --fc-event-bg-color: #3b82f6;
              --fc-event-border-color: #3b82f6;
              --fc-event-text-color: #ffffff;
              --fc-page-bg-color: transparent;
              --fc-neutral-bg-color: #fafafa;
              --fc-list-event-hover-bg-color: #f4f4f5;
            }
            .dark .fc {
              --fc-border-color: #27272a;
              --fc-button-text-color: #d4d4d8;
              --fc-button-bg-color: transparent;
              --fc-button-border-color: #3f3f46;
              --fc-button-hover-bg-color: #27272a;
              --fc-button-hover-border-color: #3f3f46;
              --fc-button-active-bg-color: #2563eb;
              --fc-button-active-border-color: #2563eb;
              --fc-today-bg-color: rgba(37, 99, 235, 0.1);
              --fc-page-bg-color: transparent;
              --fc-neutral-bg-color: #18181b;
              --fc-list-event-hover-bg-color: #27272a;
            }
            .fc .fc-toolbar-title { font-size: 1.125rem !important; font-weight: 700 !important; color: inherit; }
            .fc .fc-button { font-size: 0.8125rem; padding: 0.375rem 0.75rem; border-radius: 0.5rem; font-weight: 500; }
            .fc .fc-button-primary:not(:disabled).fc-button-active,
            .fc .fc-button-primary:not(:disabled):active { background: var(--fc-button-active-bg-color); border-color: var(--fc-button-active-border-color); color: white; }
            .fc .fc-daygrid-day-number, .fc .fc-col-header-cell-cushion { font-size: 0.8125rem; font-weight: 500; color: inherit; padding: 4px 8px; text-decoration: none; }
            .fc .fc-daygrid-day-frame { min-height: 80px; }
            .fc .fc-daygrid-event { border-radius: 6px; padding: 1px 4px; font-size: 0.75rem; margin: 1px 4px; }
            .fc .fc-timegrid-event { border-radius: 6px; }
            .fc .fc-event { cursor: pointer; }
            .fc .fc-list-event-dot { border-width: 3px; }
            .fc .fc-popover { border-radius: 0.75rem; border: 1px solid var(--fc-border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .fc .fc-more-popover .fc-popover-body { padding: 8px; }
            .fc .fc-highlight { background: rgba(37, 99, 235, 0.1); }
          `}</style>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin]}
            headerToolbar={{
              left: "title",
              center: "",
              right: "",
            }}
            initialView={currentView}
            events={calendarEvents}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={4}
            weekends={true}
            editable={true}
            droppable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            eventDrop={(info) => {
              const eventId = info.event.id;
              const newStart = info.event.start?.toISOString();
              const newEnd = info.event.end?.toISOString();
              if (newStart) {
                fetch(`/api/calendar/events/${eventId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ startDate: newStart, endDate: newEnd || null }),
                }).then(() => queryClient.invalidateQueries({ queryKey: ["calendar-events"] }));
              }
            }}
            eventResize={(info) => {
              const eventId = info.event.id;
              const newEnd = info.event.end?.toISOString();
              if (newEnd) {
                fetch(`/api/calendar/events/${eventId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ endDate: newEnd }),
                }).then(() => queryClient.invalidateQueries({ queryKey: ["calendar-events"] }));
              }
            }}
          />
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" /> Meeting</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" /> Consultation</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Deadline</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Personal</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" /> Task</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ec4899]" /> Reminder</span>
      </div>

      {/* Event Form Modal */}
      <EventForm
        isOpen={showEventForm}
        onClose={() => { setShowEventForm(false); setEditingEvent(undefined); }}
        event={editingEvent}
        defaultDate={defaultDate}
      />
    </div>
  );
}
