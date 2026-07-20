"use client";

import { CalendarCheck, Calendar, ExternalLink, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCalendly } from "@/components/ui/CalendlyEmbed";
import { useChat } from "./ChatProvider";

const GOOGLE_CALENDAR_URL = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL;
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;

export function ChatBookingCards() {
  const tb = useTranslations("booking");
  const tc = useTranslations("chat");
  const { setShowBookingCards } = useChat();
  const { openCalendly } = useCalendly();

  const hasAny = GOOGLE_CALENDAR_URL || CALENDLY_URL;
  if (!hasAny) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {tc("bookingTitle")}
        </p>
        <button
          type="button"
          onClick={() => setShowBookingCards(false)}
          className="rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
          aria-label={tc("dismiss")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {GOOGLE_CALENDAR_URL && (
          <a
            href={GOOGLE_CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-blue-200/70 bg-gradient-to-r from-blue-50 to-blue-100/50 px-3.5 py-2.5 transition-all hover:border-blue-300 hover:shadow-sm dark:border-blue-900/50 dark:from-blue-950/30 dark:to-blue-950/10 dark:hover:border-blue-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {tb("googleCalendar")}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {tb("googleCalendarDesc")}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-blue-400" />
          </a>
        )}

        {CALENDLY_URL && (
          <button
            type="button"
            onClick={openCalendly}
            className="flex w-full items-center gap-3 rounded-lg border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-3.5 py-2.5 text-left transition-all hover:border-emerald-300 hover:shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-emerald-950/10 dark:hover:border-emerald-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {tb("calendly")}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {tb("calendlyDesc")}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          </button>
        )}
      </div>
    </div>
  );
}
