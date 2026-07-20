"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2, CheckCircle2, User, Mail, MapPin } from "lucide-react";
import { useSiteSettings } from "@/components/settings/SiteSettingsProvider";
import { cn } from "@/lib/utils";

type Step = "type" | "datetime" | "details" | "confirm";

interface MeetingType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration: number;
  color: string;
  icon: string | null;
  location: string | null;
  link: string | null;
  price: number | null;
}

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  slotDuration: number;
}

interface DateException {
  id: string;
  date: string;
  type: string;
  title: string | null;
  isAvailable: boolean;
}

function generateTimeSlots(availability: AvailabilitySlot, duration: number): string[] {
  const [startH, startM] = availability.startTime.split(":").map(Number);
  const [endH, endM] = availability.endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  let breakStartMinutes: number | null = null;
  let breakEndMinutes: number | null = null;
  if (availability.breakStart && availability.breakEnd) {
    const [bsH, bsM] = availability.breakStart.split(":").map(Number);
    const [beH, beM] = availability.breakEnd.split(":").map(Number);
    breakStartMinutes = bsH * 60 + bsM;
    breakEndMinutes = beH * 60 + beM;
  }

  const slotDuration = availability.slotDuration || duration;
  const slots: string[] = [];

  for (let m = startMinutes; m + duration <= endMinutes; m += slotDuration) {
    // Skip if the slot falls within break time
    if (breakStartMinutes !== null && breakEndMinutes !== null) {
      if (m < breakEndMinutes && m + duration > breakStartMinutes) {
        continue;
      }
    }
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }

  return slots;
}

function formatTimeDisplay(time: string): string {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit"
  });
}

const EMOJI_MAP: Record<string, string> = {
  "free-consultation": "🎯",
  "project-discussion": "💼",
  "technical-consultation": "⚙️",
  "client-meeting": "🤝",
};

function BookConsultationContent() {
  const settings = useSiteSettings();
  const t = useTranslations("booking");
  const [step, setStep] = useState<Step>("type");
  const [selectedType, setSelectedType] = useState<MeetingType | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    projectType: "",
    message: "",
  });

  // Fetch booking configuration
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["booking-config"],
    queryFn: async () => {
      const res = await fetch("/api/public/booking-config");
      if (!res.ok) throw new Error("Failed to load booking configuration");
      return res.json() as Promise<{
        meetingTypes: MeetingType[];
        availability: AvailabilitySlot[];
        dateExceptions: DateException[];
      }>;
    },
    staleTime: 60_000,
  });

  const meetingTypes = configData?.meetingTypes || [];
  const availability = useMemo(() => configData?.availability || [], [configData]);
  const dateExceptions = useMemo(() => configData?.dateExceptions || [], [configData]);

  const bookMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/calendar/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to book");
      }
      return res.json();
    },
    onSuccess: () => setStep("confirm"),
  });

  // Build date options: next 60 days, filtered by availability and date exceptions
  const dateOptions = useMemo(() => {
    const options: { date: Date; dateStr: string; dayOfWeek: number; available: boolean }[] = [];
    const today = new Date();
    const exceptionMap = new Map<string, DateException>();
    dateExceptions.forEach((ex) => exceptionMap.set(ex.date.split("T")[0], ex));

    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      const exception = exceptionMap.get(dateStr);

      // Check if the day is available
      const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);
      const isActiveDay = dayAvailability?.isActive ?? false;
      const isExceptionBlocked = exception && !exception.isAvailable;
      const available = isActiveDay && !isExceptionBlocked;

      options.push({ date: d, dateStr, dayOfWeek, available });
    }

    return options;
  }, [availability, dateExceptions]);

  // Compute time slots for selected date and meeting type
  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedType) return [];
    const d = new Date(selectedDate);
    const dayOfWeek = d.getDay();
    const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);

    if (!dayAvailability || !dayAvailability.isActive) return [];
    return generateTimeSlots(dayAvailability, selectedType.duration);
  }, [selectedDate, selectedType, availability]);

  const canProceed =
    (step === "type" && selectedType) ||
    (step === "datetime" && selectedDate && selectedTime) ||
    (step === "details" && formData.name && formData.email);

  const handleBook = () => {
    if (!selectedType || !selectedDate || !selectedTime) return;
    bookMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      company: formData.company || null,
      projectType: formData.projectType || selectedType.name,
      preferredDate: selectedDate,
      preferredTime: selectedTime,
      duration: selectedType.duration,
      message: formData.message || null,
      meetingTypeId: selectedType.id,
      source: "WEBSITE",
    });
  };

  // ── Confirmation Screen ──
  if (step === "confirm") {
    const confirmDate = selectedDate && selectedTime
      ? new Date(selectedDate + "T" + selectedTime).toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric"
        })
      : "";
    const confirmTime = selectedTime ? formatTimeDisplay(selectedTime) : "";
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto max-w-lg px-4 py-24">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">{t("bookingConfirmed")}</h1>
            <p className="mt-2 text-muted-foreground dark:text-zinc-400">
              {t("confirmedDescription", { type: selectedType?.name ?? "", date: confirmDate, time: confirmTime })}
            </p>
            <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 text-left">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3"><User className="h-4 w-4 text-zinc-400" /><span>{formData.name}</span></div>
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-zinc-400" /><span>{formData.email}</span></div>
                <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-zinc-400" /><span>{t("confirmedDateAtTime", { date: selectedDate ? new Date(selectedDate).toLocaleDateString() : "", time: confirmTime })}</span></div>
                <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-zinc-400" /><span>{selectedType?.duration} {t("minutes")}</span></div>
              </div>
            </div>
            <p className="mt-6 text-sm text-zinc-500">
              {t("confirmedFooter")}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Loading State ──
  if (configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-zinc-500">{t("loadingBookingOptions")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted-foreground dark:text-zinc-400">
            {t("pageDescription", { siteName: settings.siteName })}
          </p>
        </div>

        {/* Steps Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {["type", "datetime", "details"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                step === s ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
              )}>{i + 1}</div>
              <span className={cn("text-sm", step === s ? "font-medium text-zinc-900 dark:text-white" : "text-zinc-500")}>
                {s === "type" ? t("stepType") : s === "datetime" ? t("dateTime") : t("stepDetails")}
              </span>
              {i < 2 && <div className="h-px w-8 bg-zinc-300 dark:bg-zinc-700" />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

          {/* Step 1: Meeting Type */}
          {step === "type" && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{t("selectMeetingType")}</h2>
              <p className="text-sm text-zinc-500 mb-4">{t("selectMeetingTypeDesc")}</p>
              {meetingTypes.length === 0 ? (
                <p className="text-center py-8 text-zinc-400 text-sm">{t("noMeetingTypes")}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {meetingTypes.map((mt) => (
                    <button
                      key={mt.id}
                      onClick={() => setSelectedType(mt)}
                      className={cn(
                        "rounded-xl border-2 p-5 text-left transition-all hover:shadow-md",
                        selectedType?.id === mt.id
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                      )}
                    >
                      <span className="text-2xl mb-2 block">
                        {EMOJI_MAP[mt.slug] || (mt.icon ? String.fromCodePoint(parseInt(mt.icon)) : "📅")}
                      </span>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{mt.name}</h3>
                      {mt.description && <p className="mt-1 text-xs text-zinc-500">{mt.description}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                          <Clock className="h-3 w-3" />{mt.duration} {t("min")}
                        </span>
                        {mt.price && <span className="text-xs font-medium text-emerald-600">{t("currency")}{mt.price}</span>}
                      </div>
                      {mt.location && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400">
                          <MapPin className="h-2.5 w-2.5" />{mt.location}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === "datetime" && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{t("selectDateTime")}</h2>
              <p className="text-sm text-zinc-500 mb-4">{t("selectDateTimeDesc", { type: selectedType?.name?.toLowerCase?.() ?? "" })}</p>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{t("availableDates")}</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                    {dateOptions.map(({ date, dateStr, available }) => {
                      if (!available) return null;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => { setSelectedDate(dateStr); setSelectedTime(""); }}
                          className={cn(
                            "rounded-lg border p-3 text-center transition-all",
                            selectedDate === dateStr
                              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                              : "border-zinc-200 hover:border-blue-300 dark:border-zinc-700 dark:hover:border-blue-500"
                          )}
                        >
                          <p className="text-xs text-zinc-500">
                            {date.toLocaleDateString("en-US", { weekday: "short" })}
                          </p>
                          <p className="text-lg font-bold text-zinc-900 dark:text-white">{date.getDate()}</p>
                          <p className="text-xs text-zinc-500">
                            {date.toLocaleDateString("en-US", { month: "short" })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      {t("availableTimes")}
                      <span className="text-xs text-zinc-400 ml-1">({t("minSlots", { duration: selectedType?.duration ?? 0 })})</span>
                    </label>
                    {timeSlots.length === 0 ? (
                      <p className="text-sm text-zinc-400 py-8 text-center">{t("noAvailableTimes")}</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "rounded-lg border p-2.5 text-sm text-center transition-all",
                              selectedTime === time
                                ? "border-blue-500 bg-blue-50 font-medium text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-400"
                                : "border-zinc-200 hover:border-blue-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-500"
                            )}
                          >
                            {formatTimeDisplay(time)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === "details" && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{t("yourDetails")}</h2>
              <p className="text-sm text-zinc-500 mb-4">{t("yourDetailsDesc")}</p>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("name")} *</label>
                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder={t("namePlaceholder")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("email")} *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder={t("emailPlaceholder")} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("phone")}</label>
                    <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder={t("phonePlaceholder")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("company")}</label>
                    <input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder={t("companyPlaceholder")} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("projectType")}</label>
                  <input value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder={t("projectTypePlaceholder")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t("message")}</label>
                  <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder={t("messagePlaceholder")} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => {
                if (step === "datetime") setStep("type");
                else if (step === "details") setStep("datetime");
              }}
              className={cn("flex items-center gap-1 text-sm text-muted-foreground hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
                step === "type" && "invisible")}
            >
              <ChevronLeft className="h-4 w-4" /> {t("back")}
            </button>
            <button
              onClick={() => {
                if (step === "type" && selectedType) setStep("datetime");
                else if (step === "datetime") setStep("details");
                else if (step === "details") handleBook();
              }}
              disabled={!canProceed || bookMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("bookingInProgress")}</>
              ) : step === "details" ? (
                t("confirmBooking")
              ) : (
                <>{t("next")} <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>

          {bookMutation.isError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {bookMutation.error?.message || t("failedToBook")}
            </p>
          )}

          {/* Summary */}
          <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">{t("summary")}</p>
            <div className="space-y-1.5 text-sm text-muted-foreground dark:text-zinc-400">
              <p>📋 {selectedType?.name || t("notSelected")} {selectedType && `(${selectedType.duration} ${t("min")})`}</p>
              {selectedDate && <p>📅 {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>}
              {selectedTime && <p>⏰ {formatTimeDisplay(selectedTime)}</p>}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function BookConsultationPage() {
  return <BookConsultationContent />;
}
