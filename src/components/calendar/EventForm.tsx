"use client";

import { useTranslations } from "@/lib/i18n";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createEventSchema } from "@/lib/validations/calendar";
import type { z } from "zod";
import type { CalendarEvent } from "@/types/calendar";

type EventFormData = z.input<typeof createEventSchema>;

const EVENT_TYPES = [
  { value: "MEETING", label: "Meeting", color: "#3b82f6" },
  { value: "CONSULTATION", label: "Consultation", color: "#10b981" },
  { value: "PROJECT_DEADLINE", label: "Project Deadline", color: "#ef4444" },
  { value: "PERSONAL", label: "Personal", color: "#f59e0b" },
  { value: "TASK", label: "Task", color: "#8b5cf6" },
  { value: "REMINDER", label: "Reminder", color: "#ec4899" },
];

const STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: string;
}

export function EventForm({ isOpen, onClose, event, defaultDate }: EventFormProps) {
  const t = useTranslations("calendar.eventForm");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!event?.id;

  const today = defaultDate || new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: today,
      endDate: today,
      startTime: "",
      endTime: "",
      allDay: false,
      eventType: "MEETING",
      status: "SCHEDULED",
      priority: "MEDIUM",
      color: "#3b82f6",
      location: "",
      link: "",
      notes: "",
    },
  });

  const allDay = watch("allDay"); // eslint-disable-line react-hooks/incompatible-library
     
    const watchEventType = watch("eventType");

  // Auto-set color when event type changes
  useEffect(() => {
    const match = EVENT_TYPES.find((t) => t.value === watchEventType);
    if (match) {
      setValue("color", match.color);
    }
  }, [watchEventType, setValue]);

  // Populate form when editing or opening
  useEffect(() => {
    if (event) {
      reset({
        title: event.title || "",
        description: event.description || "",
        startDate: event.startDate || today,
        endDate: event.endDate || event.startDate || today,
        startTime: "",
        endTime: "",
        allDay: event.allDay || false,
        eventType: (event.eventType as EventFormData["eventType"]) || "MEETING",
        status: (event.status as EventFormData["status"]) || "SCHEDULED",
        priority: (event.priority as EventFormData["priority"]) || "MEDIUM",
        color: event.color || "#3b82f6",
        location: event.location || "",
        link: event.link || "",
        notes: event.notes || "",
      });
    } else {
      reset({
        title: "",
        description: "",
        startDate: defaultDate || today,
        endDate: defaultDate || today,
        startTime: "",
        endTime: "",
        allDay: false,
        eventType: "MEETING",
        status: "SCHEDULED",
        priority: "MEDIUM",
        color: "#3b82f6",
        location: "",
        link: "",
        notes: "",
      });
    }
  }, [event, defaultDate, isOpen, reset, today]);

  const mutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const url = isEditing ? `/api/calendar/events/${event!.id}` : "/api/calendar/events";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          startDate: `${data.startDate}T${data.startTime || "00:00"}`,
          endDate: data.endDate ? `${data.endDate}T${data.endTime || "23:59"}` : null,
          link: data.link || null,
        }),
      });
      if (!res.ok) throw new Error(t("failedToSave"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast("success", isEditing ? t("eventUpdated") : t("eventCreated"));
      onClose();
    },
    onError: () => toast("error", t("failedToSave")),
  });

  const onSubmit = (data: EventFormData) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{isEditing ? t("editEvent") : t("newEvent")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("title")} *</label>
            <input
              {...register("title")}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 aria-[invalid=true]:border-red-500"
              placeholder={t("titlePlaceholder")}
              aria-invalid={errors.title ? "true" : "false"}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          {/* Start / End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("startDate")}</label>
              <input
                type="date"
                {...register("startDate")}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white aria-[invalid=true]:border-red-500"
                aria-invalid={errors.startDate ? "true" : "false"}
              />
              {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("startTime")}</label>
                <input
                  type="time"
                  {...register("startTime")}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("endDate")}</label>
              <input
                type="date"
                {...register("endDate")}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("endTime")}</label>
                <input
                  type="time"
                  {...register("endTime")}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* All day */}
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              {...register("allDay")}
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
            />
            {t("allDay")}
          </label>

          {/* Type / Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("type")}</label>
              <select
                {...register("eventType")}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white aria-[invalid=true]:border-red-500"
                aria-invalid={errors.eventType ? "true" : "false"}
              >
                {EVENT_TYPES.map((et) => <option key={et.value} value={et.value}>{t("eventType" + et.value)}</option>)}
              </select>
              {errors.eventType && <p className="mt-1 text-xs text-red-500">{errors.eventType.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("status")}</label>
              <select
                {...register("status")}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{t("status" + s)}</option>)}
              </select>
            </div>
          </div>

          {/* Priority / Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("priority")}</label>
              <select
                {...register("priority")}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{t("priority" + p)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("color")}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...register("color")}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700"
                />
                <span className="text-xs text-zinc-500">{watch("color")}</span>
              </div>
              {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color.message}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("location")}</label>
            <input
              {...register("location")}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
              placeholder={t("locationPlaceholder")}
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("link")}</label>
            <input
              {...register("link")}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
              placeholder={t("linkPlaceholder")}
              aria-invalid={errors.link ? "true" : "false"}
            />
            {errors.link && <p className="mt-1 text-xs text-red-500">{t("invalidUrl")}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("description")}</label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("notes")}</label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
              placeholder={t("internalNotesPlaceholder")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
            >
              {isSubmitting || mutation.isPending ? t("saving") : isEditing ? t("updateEvent") : t("createEvent")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
