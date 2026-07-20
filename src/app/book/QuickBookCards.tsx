"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Video, ExternalLink, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCalendly } from "@/components/ui/CalendlyEmbed";

const GOOGLE_CALENDAR_URL = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL;
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;
const TEAMS_URL = process.env.NEXT_PUBLIC_TEAMS_BOOKING_URL;

const hasAny = GOOGLE_CALENDAR_URL || CALENDLY_URL || TEAMS_URL;

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
};

export function QuickBookCards() {
  const t = useTranslations("booking");
  const { openCalendly } = useCalendly();

  if (!hasAny) return null;

  const cards: { key: string; render: () => ReactNode }[] = [];

  if (GOOGLE_CALENDAR_URL) {
    cards.push({
      key: "google",
      render: () => (
        <motion.a
          href={GOOGLE_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          variants={cardVariants}
          className="group flex items-center gap-5 rounded-xl border-2 border-blue-200/70 bg-gradient-to-br from-white to-blue-50/50 p-5 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 dark:border-blue-900/60 dark:from-zinc-900 dark:to-blue-950/20 dark:hover:border-blue-700"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-white">
              {t("googleCalendar")}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {t("googleCalendarDesc")}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-blue-400 opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-0.5" />
        </motion.a>
      ),
    });
  }

  if (CALENDLY_URL) {
    cards.push({
      key: "calendly",
      render: () => (
        <motion.button
          onClick={openCalendly}
          variants={cardVariants}
          className="group flex items-center gap-5 rounded-xl border-2 border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-emerald-900/60 dark:from-zinc-900 dark:to-emerald-950/20 dark:hover:border-emerald-700"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-white">{t("calendly")}</p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {t("calendlyDesc")}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-emerald-400 opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-0.5" />
        </motion.button>
      ),
    });
  }

  if (TEAMS_URL) {
    cards.push({
      key: "teams",
      render: () => (
        <motion.a
          href={TEAMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          variants={cardVariants}
          className="group flex items-center gap-5 rounded-xl border-2 border-purple-200/70 bg-gradient-to-br from-white to-purple-50/50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 dark:border-purple-900/60 dark:from-zinc-900 dark:to-purple-950/20 dark:hover:border-purple-700"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
            <Video className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-white">
              {t("microsoftTeams")}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {t("microsoftTeamsDesc")}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-purple-400 opacity-0 transition-all group-hover:opacity-100 group-hover:-translate-y-0.5" />
        </motion.a>
      ),
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-10">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {t("quickBookTitle")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("quickBookSubtitle")}
        </p>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {cards.map((card, i) => (
          <motion.div
            key={card.key}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            {card.render()}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
