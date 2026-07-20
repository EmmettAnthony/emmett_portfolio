"use client";

import { motion } from "framer-motion";
import { Briefcase, Code2, Globe, Users, CheckCircle } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { useSiteSettings } from "@/components/settings/SiteSettingsProvider";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import type { AboutPageData } from "@/components/about/AboutPageDataProvider";

const fallbackStats = [
  { icon: Briefcase, label: "Years Experience", value: 3, suffix: "+" },
  { icon: Code2, label: "Projects Completed", value: 25, suffix: "+" },
  { icon: Globe, label: "Clients Served", value: 15, suffix: "+" },
  { icon: Users, label: "Technologies", value: 20, suffix: "+" },
];

const fallbackHighlights = [
  "Full-stack development with modern JavaScript frameworks",
  "Scalable cloud-native applications and APIs",
  "Responsive, accessible, and performant web experiences",
  "End-to-end project delivery from concept to deployment",
];

export function Biography({ about }: { about: AboutPageData | null }) {
  const t = useTranslations();
  const settings = useSiteSettings();

  const stats = about?.statistics?.length
    ? about.statistics.map((s) => ({
        icon: Briefcase,
        label: s.title,
        value: parseInt(s.value) || 0,
        suffix: s.suffix ?? "+",
      }))
    : fallbackStats;

  const bioText = about?.shortBio || about?.fullBiography || settings.description;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-5">
          {/* Left: Bio Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {t("about.biography.badge")}
              </span>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                {t("about.biography.title")}{" "}
                <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  {t("about.biography.titleHighlight")}
                </span>
              </h2>

              <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                <p>{bioText}</p>
              </div>
            </motion.div>

            {/* Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 grid gap-3 sm:grid-cols-2"
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic field access */}
              {(about?.whyWorkWithMe?.length ? about.whyWorkWithMe.map((w: Record<string, unknown>) => String(w.title ?? "")) : fallbackHighlights).map((item: string) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white/50 p-4 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/30"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{item}</span>
                </div>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="rounded-xl border border-zinc-200/60 bg-white/60 p-4 text-center backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/40"
                >
                  <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-400">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                    <AnimatedCounter to={stat.value} suffix={stat.suffix ?? ""} />
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: Code widget + mini-bio */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="sticky top-28 space-y-6"
            >
              {/* Code window */}
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-1.5 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="ml-3 text-xs text-zinc-400">developer.ts</div>
                </div>
                <div className="p-5 font-mono text-sm leading-relaxed">
                  <div>
                    <span className="text-purple-600 dark:text-purple-400">interface</span>{" "}
                    <span className="text-amber-600 dark:text-amber-400">Developer</span> {"{"}
                  </div>
                  <div className="ml-4">
                    name:{" "}
                    <span className="text-green-600 dark:text-green-400">&ldquo;{about?.fullName ?? settings.siteName}&rdquo;</span>;
                  </div>
                  <div className="ml-4">
                    title:{" "}
                    <span className="text-green-600 dark:text-green-400">&ldquo;{about?.professionalTitle ?? settings.tagline}&rdquo;</span>;
                  </div>
                  <div className="ml-4">
                    experience:{" "}
                    <span className="text-amber-600 dark:text-amber-400">{about?.yearsOfExperience ?? 3}+</span> years;
                  </div>
                  <div className="ml-4">
                    remote: <span className="text-blue-700 dark:text-blue-400">true</span>;
                  </div>
                  <div>{"}"}</div>
                  <div className="mt-3 border-t border-zinc-100 pt-3 text-zinc-400 dark:border-zinc-800">
                    <div className="text-xs italic">{t("about.comment1")}</div>
                    <div className="text-xs italic">{t("about.comment2")}</div>
                  </div>
                </div>
              </div>

              {/* Quick contact card */}
              <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6">
                <h3 className="text-sm font-semibold text-white">
                  {t("about.biography.ctaTitle")}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {t("about.biography.ctaDescription")}
                </p>
                <a
                  href={`mailto:${settings.email}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 transition-all hover:bg-zinc-100"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {settings.email}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
