"use client";

import { motion } from "framer-motion";
import { ArrowDown, Mail, FileText, ExternalLink } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { useSiteSettings } from "@/components/settings/SiteSettingsProvider";

interface HeroSectionProps {
  fullName?: string | null;
  professionalTitle?: string | null;
  shortIntro?: string | null;
}

export function HeroSection({ fullName, professionalTitle, shortIntro }: HeroSectionProps) {
  const t = useTranslations();
  const settings = useSiteSettings();

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-blue-950/10" />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-blue-50/60 px-4 py-1.5 text-xs font-medium text-blue-700 backdrop-blur-sm dark:border-blue-800/30 dark:bg-blue-950/30 dark:text-blue-400"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          {t("about.hero.openToOpportunities")}
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl"
        >
          {t("about.hero.hiPrefix")}{" "}
          <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            {fullName ?? settings.siteName}
          </span>
        </motion.h1>

        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-xl font-medium text-zinc-600 dark:text-zinc-300 sm:text-2xl"
        >
          {professionalTitle ?? settings.tagline}
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400"
        >
          {shortIntro ?? settings.description}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href={`mailto:${settings.email}`}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 transition-all hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-900/30 dark:bg-white dark:text-zinc-900 dark:shadow-white/10 dark:hover:bg-zinc-100"
          >
            <Mail className="h-4 w-4" />
            {t("about.hero.getInTouch")}
          </a>
          <a
            href="/resume"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FileText className="h-4 w-4" />
            {t("about.hero.viewResume")}
          </a>
          <a
            href={settings.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/50 px-6 py-3 text-sm font-medium text-zinc-500 backdrop-blur-sm transition-all hover:border-zinc-300 hover:text-zinc-700 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
          >
            <ExternalLink className="h-4 w-4" />
            {t("about.hero.linkedin")}
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ArrowDown className="h-5 w-5 text-zinc-400" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
