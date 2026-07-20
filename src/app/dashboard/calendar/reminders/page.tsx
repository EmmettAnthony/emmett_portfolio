"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Loader2, Bell, BellOff, BellRing, Clock, Trash2, Mail, Eye } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createReminderSchema } from "@/lib/validations/calendar";
import type { z } from "zod";
import type { Reminder } from "@/types/calendar";

type ReminderFormData = z.input<typeof createReminderSchema>;

const defaultReminderValues: ReminderFormData = {
  title: "",
  description: "",
  remindAt: "",
  remindType: "DASHBOARD",
  status: "PENDING",
  repeatInterval: null,
  repeatUntil: null,
  relatedType: null,
  relatedId: null,
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  DASHBOARD: <Eye className="h-3.5 w-3.5" />,
  BOTH: <BellRing className="h-3.5 w-3.5" />,
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-badge-warning-bg text-badge-warning-text",
  SENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DISMISSED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function CalendarRemindersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReminderFormData>({
    resolver: zodResolver(createReminderSchema),
    defaultValues: defaultReminderValues,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-reminders", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "50");
      const res = await fetch(`/api/calendar/reminders?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReminderFormData) => {
      const res = await fetch("/api/calendar/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-reminders"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast("success", "Reminder created");
      setShowForm(false);
      resetForm();
    },
    onError: () => toast("error", "Failed to create reminder"),
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-reminders"] });
      toast("success", "Reminder dismissed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calendar/reminders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-reminders"] });
      toast("success", "Reminder deleted");
    },
  });

  const resetForm = () => {
    reset(defaultReminderValues);
    setShowForm(false);
  };

  const onSubmit = (data: ReminderFormData) => {
    createMutation.mutate({
      ...data,
      remindAt: new Date(data.remindAt).toISOString(),
      repeatInterval: data.repeatInterval || null,
    });
  };

  const reminders: Reminder[] = data?.reminders || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reminders..."
              className="w-56 rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500" />
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600">
          <Plus className="h-4 w-4" /> New Reminder
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  {...register("title")}
                  placeholder="Reminder title..."
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 aria-[invalid=true]:border-red-500"
                  aria-invalid={errors.title ? "true" : "false"}
                />
                {errors.title && <p className="absolute -bottom-5 left-0 text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <input
                type="datetime-local"
                {...register("remindAt")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white aria-[invalid=true]:border-red-500"
                aria-invalid={errors.remindAt ? "true" : "false"}
              />
              {errors.remindAt && <p className="text-xs text-red-500">{errors.remindAt.message}</p>}
              <select
                {...register("remindType")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="DASHBOARD">Dashboard</option>
                <option value="EMAIL">Email</option>
                <option value="BOTH">Both</option>
              </select>
              <select
                {...register("repeatInterval")}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <button type="submit" disabled={isSubmitting || createMutation.isPending}
                className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50">Create</button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
            </div>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Description (optional)..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </form>
        </motion.div>
      )}

      {/* Reminders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <BellOff className="mb-2 h-8 w-8" />
          <p>No reminders</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r: Reminder, i: number) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={cn(
                "flex items-start justify-between rounded-xl border p-4 transition-colors",
                r.status === "PENDING"
                  ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  r.status === "PENDING" ? "bg-badge-warning-bg text-badge-warning-text" :
                    "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                )}>
                  {TYPE_ICONS[r.remindType] || <Bell className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-medium", r.status === "PENDING" ? "text-zinc-900 dark:text-white" : "text-zinc-500")}>
                      {r.title}
                    </p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[r.status] || "")}>
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {new Date(r.remindAt).toLocaleString("en-US", {
                      weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                    {r.repeatInterval && <> (Repeats {r.repeatInterval})</>}
                  </p>
                  {r.description && <p className="mt-1 text-xs text-zinc-500 line-clamp-1">{r.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {r.status === "PENDING" && (
                  <button onClick={() => dismissMutation.mutate(r.id)}
                    className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                    Dismiss
                  </button>
                )}
                <button onClick={() => { if (confirm("Delete this reminder?")) deleteMutation.mutate(r.id); }}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
