"use client";

import { CalendarCheck, Calendar, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCalendly } from "@/components/ui/CalendlyEmbed";

const GOOGLE_CALENDAR_URL = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL;
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;

export function CalendarContactCards() {
  const t = useTranslations("booking");
  const { openCalendly } = useCalendly();

  const hasAny = GOOGLE_CALENDAR_URL || CALENDLY_URL;
  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {t("title")}
      </h3>

      {GOOGLE_CALENDAR_URL && (
        <a
          href={GOOGLE_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("googleCalendar")}
            </p>
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {t("googleCalendarDesc")}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-blue-600 dark:text-zinc-500" />
        </a>
      )}

      {CALENDLY_URL && (
        <button
          type="button"
          onClick={openCalendly}
          className="group flex w-full items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 text-left transition-all hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400 dark:group-hover:bg-emerald-600 dark:group-hover:text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("calendly")}
            </p>
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
              {t("calendlyDesc")}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-emerald-600 dark:text-zinc-500" />
        </button>
      )}
    </div>
  );
}
