"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Loader2, Trash2, Check, X, Calendar, CloudSun, Umbrella } from "lucide-react";
import { QuerySafeWrapper } from "@/lib/providers";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createMeetingTypeSchema, createDateExceptionSchema } from "@/lib/validations/calendar";
import type { z } from "zod";
import type { Availability, MeetingType, DateException } from "@/types/calendar";
import { CalendarSyncButton } from "@/components/calendar/CalendarSyncButton";

type MeetingTypeFormData = z.input<typeof createMeetingTypeSchema>;
type DateExceptionFormData = z.input<typeof createDateExceptionSchema>

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function CalendarSettingsPageInner() {
  const [activeTab, setActiveTab] = useState<"availability" | "meeting-types" | "exceptions" | "integrations">("availability");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {[
          { key: "availability", label: "Availability", icon: Clock },
          { key: "meeting-types", label: "Meeting Types", icon: Calendar },
          { key: "exceptions", label: "Exceptions", icon: Umbrella },
          { key: "integrations", label: "Integrations", icon: CloudSun },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-badge-info-bg text-badge-info-text"
                  : "text-muted-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "availability" && <AvailabilitySettings />}
      {activeTab === "meeting-types" && <MeetingTypeSettings />}
      {activeTab === "exceptions" && <DateExceptionSettings />}
      {activeTab === "integrations" && <IntegrationSettings />}
    </div>
  );
}

function AvailabilitySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async (data: { dayOfWeek: number; isActive: boolean; startTime: string; endTime: string; slotDuration: number; [key: string]: unknown }) => {
      const res = await fetch("/api/calendar/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-availability"] });
      toast("success", "Availability saved");
    },
    onError: () => toast("error", "Failed to save"),
  });

  const availability: Availability[] = data?.availability || [];
  const defaultAvailability = [
    { dayOfWeek: 0, isActive: false, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
    { dayOfWeek: 1, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
    { dayOfWeek: 2, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
    { dayOfWeek: 3, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
    { dayOfWeek: 4, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
    { dayOfWeek: 5, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
    { dayOfWeek: 6, isActive: true, startTime: "10:00", endTime: "14:00", slotDuration: 30 },
  ];

  const mergedAvailability = DAYS.map((_, i) => {
    const existing = availability.find((a: Availability) => a.dayOfWeek === i);
    return existing || defaultAvailability[i];
  });

  const handleToggle = (dayOfWeek: number) => {
    const day = mergedAvailability[dayOfWeek];
    saveMutation.mutate({
      dayOfWeek,
      isActive: !day.isActive,
      startTime: day.startTime,
      endTime: day.endTime,
      slotDuration: day.slotDuration,
    });
  };

  const handleUpdate = (dayOfWeek: number, field: string, value: unknown) => {
    const day = mergedAvailability[dayOfWeek];
    saveMutation.mutate({
      dayOfWeek,
      isActive: day.isActive,
      startTime: day.startTime,
      endTime: day.endTime,
      slotDuration: day.slotDuration,
      [field]: value,
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Working Hours</h3>
      <div className="space-y-2">
        {mergedAvailability.map((day: { dayOfWeek: number; isActive: boolean; startTime: string; endTime: string; slotDuration?: number; }, i: number) => (
          <div key={i}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <button
              onClick={() => handleToggle(i)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                day.isActive
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
              )}
            >
              {day.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
            <div className="w-24 text-sm font-medium text-zinc-900 dark:text-white">{DAYS[i]}</div>
            {day.isActive ? (
              <>
                <input type="time" value={day.startTime}
                  onChange={(e) => handleUpdate(i, "startTime", e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                <span className="text-xs text-zinc-400">to</span>
                <input type="time" value={day.endTime}
                  onChange={(e) => handleUpdate(i, "endTime", e.target.value)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Slot:</span>
                  <select value={day.slotDuration!} onChange={(e) => handleUpdate(i, "slotDuration", parseInt(e.target.value))}
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </>
            ) : (
              <span className="text-sm text-zinc-400 italic">Closed</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function MeetingTypeSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MeetingTypeFormData>({
    resolver: zodResolver(createMeetingTypeSchema),
    defaultValues: {
      name: "",
      slug: "",
      duration: 30,
      color: "#3b82f6",
      description: "",
      isActive: true,
      order: 0,
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-meeting-types"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/meeting-types");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MeetingTypeFormData) => {
      const res = await fetch("/api/calendar/meeting-types", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-meeting-types"] });
      toast("success", "Meeting type created");
      setShowForm(false);
      reset({ name: "", slug: "", duration: 30, color: "#3b82f6", description: "", isActive: true, order: 0 });
    },
    onError: () => toast("error", "Failed to create"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar/meeting-types/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-meeting-types"] });
      toast("success", "Deleted");
    },
  });

  const meetingTypes: MeetingType[] = data?.meetingTypes || [];

  const onSubmit = (data: MeetingTypeFormData) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    createMutation.mutate({ ...data, slug });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Meeting Types</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:from-brand-500 hover:to-brand-600">
          <Plus className="h-3.5 w-3.5" /> Add Type
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900" noValidate>
          <div>
            <input
              {...register("name")}
              placeholder="Name"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white aria-[invalid=true]:border-red-500"
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <input
              type="number"
              {...register("duration", { valueAsNumber: true })}
              min={15} max={480} step={5}
              className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white aria-[invalid=true]:border-red-500"
              aria-invalid={errors.duration ? "true" : "false"}
            />
            {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration.message}</p>}
          </div>
          <input
            type="color"
            {...register("color")}
            className="h-9 w-10 rounded-lg border border-zinc-300 dark:border-zinc-700"
          />
          <button type="submit"
            className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-3 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600">Add</button>
          <button type="button" onClick={() => setShowForm(false)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground">Cancel</button>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
      ) : meetingTypes.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No meeting types configured</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {meetingTypes.map((mt: MeetingType) => (
            <div key={mt.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: mt.color }} />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{mt.name}</p>
                  <p className="text-xs text-zinc-500">{mt.duration} min {!mt.isActive && "(Inactive)"}</p>
                </div>
              </div>
              <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(mt.id); }}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function DateExceptionSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DateExceptionFormData>({
    resolver: zodResolver(createDateExceptionSchema),
    defaultValues: {
      date: "",
      type: "BLOCKED",
      title: "",
      isAvailable: false,
      description: "",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-date-exceptions"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/date-exceptions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DateExceptionFormData) => {
      const res = await fetch("/api/calendar/date-exceptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-date-exceptions"] });
      toast("success", "Exception added");
      setShowForm(false);
      reset({ date: "", type: "BLOCKED", title: "", isAvailable: false, description: "" });
    },
    onError: () => toast("error", "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar/date-exceptions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-date-exceptions"] });
      toast("success", "Deleted");
    },
  });

  const dateExceptions: DateException[] = data?.dateExceptions || [];

  const typeConfig: Record<string, { label: string; color: string }> = {
    HOLIDAY: { label: "Holiday", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    VACATION: { label: "Vacation", color: "bg-badge-info-bg text-badge-info-text" },
    BLOCKED: { label: "Blocked", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    SPECIAL_HOURS: { label: "Special Hours", color: "bg-purple-500/10 text-purple-400" },
  };

  const onSubmit = (data: DateExceptionFormData) => {
    createMutation.mutate(data);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Date Exceptions</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:from-brand-500 hover:to-brand-600">
          <Plus className="h-3.5 w-3.5" /> Add Exception
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900" noValidate>
          <div>
            <input
              type="date"
              {...register("date")}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white aria-[invalid=true]:border-red-500"
              aria-invalid={errors.date ? "true" : "false"}
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
          </div>
          <input
            {...register("title")}
            placeholder="Title"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
          <select
            {...register("type")}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            <option value="BLOCKED">Blocked</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="VACATION">Vacation</option>
            <option value="SPECIAL_HOURS">Special Hours</option>
          </select>
          <button type="submit"
            className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-3 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600">Add</button>
          <button type="button" onClick={() => setShowForm(false)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground">Cancel</button>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
      ) : dateExceptions.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No exceptions configured</p>
      ) : (
        <div className="space-y-2">
          {dateExceptions.map((de: DateException) => (
            <div key={de.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium", typeConfig[de.type]?.color)}>
                  {typeConfig[de.type]?.label || de.type}
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {new Date(de.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </span>
                {de.title && <span className="text-sm text-zinc-500">— {de.title}</span>}
              </div>
              <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(de.id); }}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function CalendarSettingsPage() {
  return (
    <QuerySafeWrapper>
      <CalendarSettingsPageInner />
    </QuerySafeWrapper>
  );
}

function IntegrationSettings() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Calendar Integrations</h3>
        <p className="text-sm text-zinc-500 mb-6">
          Connect your calendar to automatically export events, appointments, and deadlines.
        </p>
        <div className="space-y-4">
          <CalendarSyncButton provider="GOOGLE" />
          <CalendarSyncButton provider="OUTLOOK" />
          <CalendarSyncButton provider="APPLE" />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Coming Soon</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Additional calendar providers will be supported in future updates.
        </p>
        <div className="flex items-center justify-center rounded-lg border border-zinc-200 p-8 text-sm text-zinc-400 dark:border-zinc-800">
          No upcoming integrations planned.
        </div>
      </div>
    </motion.div>
  );
}
