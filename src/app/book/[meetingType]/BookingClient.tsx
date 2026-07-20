"use client";

import { useTranslations } from "@/lib/i18n";
import { useState, useEffect, useCallback, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, Send, User,
  AlertCircle, ArrowLeft, ArrowRight, Sparkles, Briefcase, Code, Users, Coffee,
  RefreshCw, CheckCircle2, Globe, Shield, Zap, Star,
  ChevronDown, Upload, X, FileText,
  Monitor,
} from "lucide-react";
import { Turnstile } from "@/components/ui/Turnstile";
import { publicBookingSchema } from "@/lib/validations/calendar";
import { useSiteSettings } from "@/components/settings/SiteSettingsProvider";
import { uploadFiles } from "@/lib/uploadthing-client";

import { ACCEPTED_FILE_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/contact-schema";
import Link from "next/link";

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
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar: CalendarDays, Clock, Sparkles, Briefcase, Code, Users, Coffee,
};

const TIMEZONES = Intl.supportedValuesOf?.("timeZone") || [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland",
];

const ACCEPTED_EXTS = ACCEPTED_FILE_EXTENSIONS.toLowerCase().split(",");

function SlotsSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-8 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="grid grid-cols-2 gap-1.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        ))}
      </div>
    </div>
  );
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 overflow-hidden dark:border-zinc-800">
          <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:text-white dark:hover:bg-zinc-800/50">
            {item.q}
            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <p className="border-t border-zinc-100 px-5 py-3.5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}


export function BookingClient({ meetingType }: { meetingType: MeetingType }) {
  const settings = useSiteSettings();
  const formRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("booking");
  const f = useTranslations("booking.form");

  const formatTime = useCallback((time: string) => {
    const [h, m] = time.split(":").map(Number);
    const period = h < 12 ? t("am") : t("pm");
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  }, [t]);

  const dayNames = [f("dayShortSun"), f("dayShortMon"), f("dayShortTue"), f("dayShortWed"), f("dayShortThu"), f("dayShortFri"), f("dayShortSat")];
  const monthNames = [f("monthJanuary"), f("monthFebruary"), f("monthMarch"), f("monthApril"), f("monthMay"), f("monthJune"), f("monthJuly"), f("monthAugust"), f("monthSeptember"), f("monthOctober"), f("monthNovember"), f("monthDecember")];

  const projectTypeOptions = [
    { value: "Business Website", label: f("projectTypeBusinessWebsite") },
    { value: "E-Commerce Website", label: f("projectTypeECommerceWebsite") },
    { value: "Web Application", label: f("projectTypeWebApplication") },
    { value: "SaaS Platform", label: f("projectTypeSaaSPlatform") },
    { value: "WordPress Website", label: f("projectTypeWordPressWebsite") },
    { value: "Website Redesign", label: f("projectTypeWebsiteRedesign") },
    { value: "Website Maintenance", label: f("projectTypeWebsiteMaintenance") },
    { value: "Technical Consultation", label: f("projectTypeTechnicalConsultation") },
    { value: "API Integration", label: f("projectTypeAPIIntegration") },
    { value: "Custom Software", label: f("projectTypeCustomSoftware") },
    { value: "Other", label: f("projectTypeOther") },
  ];
  const budgetOptions = [
    { value: "Under $500", label: f("budgetUnder500") },
    { value: "$500 - $1,000", label: f("budget5001000") },
    { value: "$1,000 - $5,000", label: f("budget10005000") },
    { value: "$5,000 - $10,000", label: f("budget500010000") },
    { value: "$10,000+", label: f("budget10000Plus") },
  ];
  const timelineOptions = [
    { value: "ASAP", label: f("timelineASAP") },
    { value: "Within 1 Month", label: f("timelineWithin1Month") },
    { value: "1-3 Months", label: f("timeline1to3Months") },
    { value: "3-6 Months", label: f("timeline3to6Months") },
    { value: "Flexible", label: f("timelineFlexible") },
  ];

  const [step, setStep] = useState<"calendar" | "form">("calendar");

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [projectType, setProjectType] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("email");
  const [newsletter, setNewsletter] = useState(false);
  const [terms, setTerms] = useState(false);

  const [timezone, setTimezone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { setTimezone("America/New_York"); }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFieldErrors({});
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedDate, selectedTime]);

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setSlotsError(false);
    try {
      const res = await fetch(`/api/booking/slots?date=${date}&duration=${meetingType.duration}`);
      if (!res.ok) throw new Error(t("failed"));
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch { setSlots([]); setSlotsError(true); }
    setSlotsLoading(false);
  }, [meetingType.duration, t]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSubmitError("");
    setSlotsError(false);
    fetchSlots(date);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) { setSubmitError(f("fileTooLarge")); return; }
    const ext = "." + selected.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.some((a) => ext === a.trim().toLowerCase())) { setSubmitError(f("invalidFileType")); return; }
    setFile(selected);
    setSubmitError("");
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setSubmitError(f("securityCheck"));
      return;
    }

    const parseResult = publicBookingSchema.safeParse({
      firstName, lastName, email,
      phone: phone || undefined,
      company: company || undefined,
      website: website || undefined,
      country: country || undefined,
      projectType: projectType || undefined,
      budget: budget || undefined,
      timeline: timeline || undefined,
      projectDescription: projectDescription || undefined,
      preferredContactMethod: preferredContactMethod || undefined,
      preferredDate: selectedDate,
      preferredTime: selectedTime,
      duration: meetingType.duration,
      timezone,
      meetingTypeId: meetingType.id,
      newsletter,
      terms,
    });

    if (!parseResult.success) {
      const errors = parseResult.error.flatten().fieldErrors;
      const flat: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(errors)) if (msgs && msgs.length > 0) flat[key] = msgs[0];
      setFieldErrors(flat);
      setSubmitError(Object.values(flat)[0] || f("checkInput"));
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    setSubmitError("");

    let fileUrl = "";
    let fileName = "";
    if (file) {
      try {
        const [result] = await uploadFiles("attachmentUploader", { files: [file] });
        fileUrl = result.url;
        fileName = result.name || file.name;
      } catch { setSubmitError(f("fileUploadFailed")); setSubmitting(false); return; }
    }

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parseResult.data,
          fileUrl: fileUrl || undefined,
          fileName: fileName || undefined,
          timezone,
          source: "WEBSITE",
          turnstileToken,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: t("somethingWentWrong") }));
        if (res.status === 409) { setSelectedTime(null); fetchSlots(selectedDate); }
        throw new Error(err.error || `Error ${res.status}`);
      }
      setShowConfirmation(true);
    } catch (e) {
      console.error("[Booking] error:", e);
      setSubmitError(e instanceof Error ? e.message : f("failedToBook"));
      setSubmitting(false);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const generateCalendarDays = () => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const IconComponent = iconMap[meetingType.icon ?? ""] || CalendarDays;
  const meetingLink = meetingType.link || t("googleMeet");

  if (showConfirmation) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </motion.div>
            </div>
            <h1 className="mt-6 text-3xl font-bold text-zinc-900 dark:text-white">{t("bookingConfirmed")}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t("checkEmail")}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10 space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-4">
                <div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-blue-500 dark:text-blue-400" /><div><p className="text-xs text-zinc-500 dark:text-zinc-400">{t("meeting")}</p><p className="font-medium text-zinc-900 dark:text-white">{meetingType.name}</p></div></div>
                <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" /><div><p className="text-xs text-zinc-500 dark:text-zinc-400">{t("duration")}</p><p className="font-medium text-zinc-900 dark:text-white">{meetingType.duration} {t("minutes")}</p></div></div>
                <div className="flex items-center gap-3"><Monitor className="h-5 w-5 text-blue-500 dark:text-blue-400" /><div><p className="text-xs text-zinc-500 dark:text-zinc-400">{t("platform")}</p><p className="font-medium text-zinc-900 dark:text-white">{meetingLink}</p></div></div>
                <div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-blue-500 dark:text-blue-400" /><div><p className="text-xs text-zinc-500 dark:text-zinc-400">{t("dateTime")}</p><p className="font-medium text-zinc-900 dark:text-white">{new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {formatTime(selectedTime!)}</p></div></div>
                <div className="flex items-center gap-3"><User className="h-5 w-5 text-blue-500 dark:text-blue-400" /><div><p className="text-xs text-zinc-500 dark:text-zinc-400">{t("host")}</p><p className="font-medium text-zinc-900 dark:text-white">{settings.siteName}</p></div></div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">{t("returnHome")}</Link>
              <Link href="/book" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-300 px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">{t("bookAnother")}</Link>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top nav */}
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-end px-4 py-3 sm:px-6 lg:px-8">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock className="h-3.5 w-3.5" /> {meetingType.duration} {t("min")}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/book" className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </Link>
        <div className="grid gap-10 lg:grid-cols-[380px_1fr_300px] xl:grid-cols-[400px_1fr_320px]">
          {/* ── RIGHT PANEL (Calendar + Form) — first in DOM order so calendar is visible above the fold on mobile ── */}
          <div className="min-w-0 order-1 lg:order-2">
            {step === "calendar" ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{t("selectDateTime")}</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("chooseSlot")}</p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  {/* Calendar header */}
                  <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
                    <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); }} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800" aria-label={f("previousMonth")}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">{monthNames[currentMonth]} {currentYear}</span>
                    <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); }} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800" aria-label={f("nextMonth")}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-px px-5 pt-4 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500">
                    {dayNames.map((d, i) => <div key={i} className="pb-1.5">{d}</div>)}
                  </div>

                  {/* Calendar days grid */}
                  <div className="grid grid-cols-7 gap-px px-5 pb-4 pt-1">
                    {generateCalendarDays().map((day, i) => {
                      if (day === null) return <div key={`e-${i}`} />;
                      const dateObj = new Date(currentYear, currentMonth, day);
                      const dateKey = formatDateKey(dateObj);
                      const isPast = dateObj < today;
                      const isSelected = selectedDate === dateKey;
                      const isToday = dateObj.getTime() === today.getTime();
                      return (
                        <button key={dateKey} disabled={isPast}
                          onClick={() => handleDateSelect(dateKey)}
                          className={`rounded-lg py-2 text-sm font-medium transition-all ${
                            isSelected ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900" : isPast ? "cursor-not-allowed text-zinc-200 dark:text-zinc-700" :
                            isToday ? "text-zinc-900 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-100 dark:text-white dark:ring-zinc-600 dark:hover:bg-zinc-800" :
                            "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          }`}
                        >{day}</button>
                      );
                    })}
                  </div>

                  {/* Time slots - appears inline below calendar when a date is selected */}
                  {selectedDate && (
                    <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
                      <AnimatePresence mode="wait">
                        {slotsLoading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><SlotsSkeleton /></motion.div>
                        ) : slotsError ? (
                          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex min-h-[160px] items-center justify-center rounded-lg border border-red-200 bg-red-50/50 p-6 dark:border-red-900 dark:bg-red-950/20"
                          >
                            <div className="text-center">
                              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/30"><AlertCircle className="h-5 w-5" /></div>
                              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{t("failedToLoadTimes")}</p>
                              <button onClick={() => fetchSlots(selectedDate)} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"><RefreshCw className="h-3 w-3" /> {t("retry")}</button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div key="slots" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                                </p>
                                <p className="text-xs text-zinc-400">{t("selectTimeBelow")}</p>
                              </div>
                              <button onClick={() => { setSelectedDate(null); setSelectedTime(""); setSlots([]); }} className="text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-600 hover:underline dark:hover:text-zinc-300">{t("changeDate")}</button>
                            </div>

                            {/* Timezone */}
                            <div className="mb-4 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                              <Globe className="h-3.5 w-3.5 text-zinc-400" />
                              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="flex-1 bg-transparent text-xs font-medium text-zinc-600 outline-none dark:text-zinc-400">
                                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
                              </select>
                            </div>

                            {slots.length === 0 ? (
                              <div className="flex min-h-[100px] items-center justify-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                                <p className="text-sm text-zinc-400">{t("noAvailableTimes")}</p>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                                  {slots.map((slot) => (
                                    <button key={slot.time} disabled={!slot.available}
                                      onClick={() => { setSelectedTime(slot.time); setSubmitError(""); }}
                                      className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-all ${
                                        selectedTime === slot.time ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900" :
                                        slot.available ? "border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500" :
                                        "cursor-not-allowed border-zinc-100 text-zinc-200 dark:border-zinc-800 dark:text-zinc-700"
                                      }`}
                                    >{formatTime(slot.time)}</button>
                                  ))}
                                </div>

                                {selectedTime && (
                                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex items-center justify-between rounded-xl bg-green-50 px-4 py-3 dark:bg-green-950/20">
                                    <div className="flex items-center gap-2.5">
                                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                      <div>
                                        <p className="text-sm font-medium text-green-800 dark:text-green-300">{t("timeSelected")}</p>
                                        <p className="text-xs text-green-600 dark:text-green-400">{formatTime(selectedTime)}</p>
                                      </div>
                                    </div>
                                    <button onClick={() => { setStep("form"); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-green-600 px-4 text-xs font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:text-white"
                                    >
                                      {t("continue")} <ArrowRight className="h-3 w-3" />
                                    </button>
                                  </motion.div>
                                )}
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── BOOKING FORM ── */
              <motion.div ref={formRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={() => setStep("calendar")} className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> {t("backToSelection")}
                </button>

                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"><User className="h-5 w-5" /></div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{t("yourInformation")}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("confirmationEmailNotice")}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={f("firstName")} required error={fieldErrors.firstName}>
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} placeholder={f("firstNamePlaceholder")} className={inputClass(fieldErrors.firstName)} aria-invalid={!!fieldErrors.firstName} />
                      </Field>
                      <Field label={f("lastName")} required error={fieldErrors.lastName}>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} placeholder={f("lastNamePlaceholder")} className={inputClass(fieldErrors.lastName)} aria-invalid={!!fieldErrors.lastName} />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={f("email")} required error={fieldErrors.email}>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} placeholder={f("emailPlaceholder")} className={inputClass(fieldErrors.email)} aria-invalid={!!fieldErrors.email} />
                      </Field>
                      <Field label={f("phone")} error={fieldErrors.phone}>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder={f("phonePlaceholder")} className={inputClass(fieldErrors.phone)} />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={f("company")}>
                        <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={100} placeholder={f("companyPlaceholder")} className={inputClass()} />
                      </Field>
                      <Field label={f("website")}>
                        <input value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={200} placeholder={f("websitePlaceholder")} className={inputClass()} />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={f("country")}>
                        <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={100} placeholder={f("countryPlaceholder")} className={inputClass()} />
                      </Field>
                      <Field label={f("projectType")} required={false} error={fieldErrors.projectType}>
                        <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className={selectClass(fieldErrors.projectType)}>
                          <option value="">{f("projectTypeSelectPlaceholder")}</option>
                          {projectTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={f("budget")}>
                        <select value={budget} onChange={(e) => setBudget(e.target.value)} className={selectClass()}>
                          <option value="">{f("budgetSelectPlaceholder")}</option>
                          {budgetOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </Field>
                      <Field label={f("timeline")}>
                        <select value={timeline} onChange={(e) => setTimeline(e.target.value)} className={selectClass()}>
                          <option value="">{f("timelineSelectPlaceholder")}</option>
                          {timelineOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </Field>
                    </div>

                    <Field label={f("projectDescription")}>
                      <textarea rows={3} value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} maxLength={5000} placeholder={f("projectDescriptionPlaceholder")} className={inputClass() + " resize-none"} />
                    </Field>

                    <Field label={f("preferredContact")}>
                      <div className="flex gap-3">
                        {[
                          { value: "email", label: f("contactMethodEmail") },
                          { value: "phone", label: f("contactMethodPhone") },
                          { value: "whatsapp", label: f("contactMethodWhatsApp") },
                        ].map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setPreferredContactMethod(opt.value)}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                              preferredContactMethod === opt.value ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900" :
                              "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
                            }`}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </Field>

                    {/* File upload */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{f("attachFiles")}</label>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">{f("uploadHint")}</p>
                      {file ? (
                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/20">
                          <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate dark:text-white">{file.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                          </div>
                          <button onClick={() => setFile(null)} className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-green-200 hover:text-zinc-600 dark:hover:bg-green-800"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <label
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setIsDragging(false);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const dt = e.dataTransfer;
                            if (dt.files[0]) {
                              const syntheticEvent = {
                                target: { files: dt.files },
                              } as React.ChangeEvent<HTMLInputElement>;
                              handleFileChange(syntheticEvent);
                            }
                          }}
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
                            isDragging
                              ? "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800"
                              : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <Upload className="h-6 w-6 text-zinc-400" />
                          <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">{f("dropFile")}</p>
                          <input type="file" accept={ACCEPTED_FILE_EXTENSIONS} onChange={handleFileChange} className="hidden" />
                        </label>
                      )}
                    </div>

                    <Turnstile onSuccess={(token) => setTurnstileToken(token)} />

                    {submitError && (
                      <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 text-sm text-red-500">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {submitError}
                      </motion.p>
                    )}

                    {/* Checkboxes */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{f("sendTips")}</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className={`h-4 w-4 rounded ${fieldErrors.terms ? "border-red-500" : "border-zinc-300"} text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700`} />
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">{f.rich("termsAgreement", { link: (chunks) => <a href="/terms" className="underline hover:text-zinc-900 dark:hover:text-white">{chunks}</a> })}</span>
                      </label>
                      {fieldErrors.terms && <p className="text-xs text-red-500">{fieldErrors.terms}</p>}
                    </div>

                    <button type="button" onClick={handleSubmit} disabled={submitting || !firstName || !lastName || !email || (!turnstileToken && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {f("booking")}</> : <><Send className="h-4 w-4" /> {f("bookMeeting")}</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── LEFT PANEL ── */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-4 ring-zinc-100 dark:ring-zinc-800" style={{ backgroundColor: `${meetingType.color}18`, color: meetingType.color }}>
                  <IconComponent className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-zinc-900 dark:text-white">{meetingType.name}</h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{meetingType.duration} {t("min")} · {meetingLink}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t("sessionDescription")}
              </p>

              <div className="mt-5 space-y-2.5">
              {[
                t("benefit1"),
                t("benefit2"),
                t("benefit3"),
                t("benefit4"),
                t("benefit5"),
                t("benefit6"),
              ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-50 to-white p-5 dark:border-zinc-800 dark:from-amber-950/20 dark:to-zinc-900">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Star, label: t("cardProfessional"), sub: t("cardProfessionalSub") },
                  { icon: Zap, label: t("cardFastResponse"), sub: t("cardFastResponseSub") },
                  { icon: Globe, label: t("cardRemoteWorldwide"), sub: t("cardRemoteWorldwideSub") },
                  { icon: Shield, label: t("cardSecureMeeting"), sub: t("cardSecureMeetingSub") },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">{label}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-6">
            {/* Meeting summary */}
            <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">{t("meetingSummary")}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-400">{t("meeting")}</span><span className="font-medium text-zinc-900 dark:text-white">{meetingType.name}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-400">{t("duration")}</span><span className="font-medium text-zinc-900 dark:text-white">{meetingType.duration} {t("min")}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-400">{t("platform")}</span><span className="font-medium text-zinc-900 dark:text-white">{meetingLink}</span></div>
                <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800" />
                <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-400">{t("summaryDate")}</span><span className="font-medium text-zinc-900 dark:text-white text-right">{selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-400">{t("summaryTime")}</span><span className="font-medium text-zinc-900 dark:text-white">{selectedTime ? formatTime(selectedTime) : "—"}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-400">{t("summaryTimezone")}</span><span className="font-medium text-zinc-900 dark:text-white text-right text-xs">{timezone.split("/")[1]?.replace(/_/g, " ") || timezone}</span></div>
                <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800" />
                <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-400">{t("host")}</span><span className="font-medium text-zinc-900 dark:text-white">{settings.siteName}</span></div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-zinc-800 dark:from-blue-950/20 dark:to-zinc-900">
              <div className="flex items-center gap-0.5 mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 italic">{t("testimonialText")}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">{t("testimonialInitials")}</div>
                <div><p className="text-xs font-semibold text-zinc-900 dark:text-white">{t("testimonialName")}</p><p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t("testimonialTitle")}</p></div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">{t("faq")}</h3>
              <Accordion items={[
                { q: t("faq1q"), a: t("faq1a") },
                { q: t("faq2q"), a: t("faq2a") },
                { q: t("faq3q"), a: t("faq3a") },
                { q: t("faq4q"), a: t("faq4a") },
                { q: t("faq5q"), a: t("faq5a") },
              ]} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function inputClass(error?: string) {
  return `mt-1 w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 dark:text-white ${
    error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/20 dark:border-zinc-700 dark:focus:border-white dark:focus:ring-white/20"
  }`;
}

function selectClass(error?: string) {
  return inputClass(error) + " appearance-none cursor-pointer";
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
      {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}