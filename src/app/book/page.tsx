import Link from "next/link";
import { prisma } from "@/lib/db";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { QuickBookCards } from "./QuickBookCards";
import { Calendar, Clock, ArrowRight, Sparkles, Briefcase, Code, Users, Coffee } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("booking.meta.title"),
    description: t("booking.meta.description"),
  };
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  Clock,
  Sparkles,
  Briefcase,
  Code,
  Users,
  Coffee,
};

export default async function BookPage() {
  const t = await getTranslations();
  const meetingTypes = await prisma.meetingType.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-white pb-32 pt-24 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/10" />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-100 dark:ring-blue-900/50">
            <Calendar className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            {t("booking.title")}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t("booking.heroDescription")}
          </p>
        </div>
      </section>

      {/* Platform Cards */}
      <section className="relative z-10 -mt-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <QuickBookCards />
        </div>
      </section>

      {/* Meeting Types */}
      {meetingTypes.length > 0 && (
        <section className="pb-24 pt-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {t("booking.scheduleDetailed")}
                </h2>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                  {t("booking.scheduleSubtitle")}
                </p>
              </div>

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {meetingTypes.map((type) => {
                  const Icon = iconMap[type.icon ?? ""] || Calendar;
                  return (
                    <Link
                      key={type.id}
                      href={`/book/${type.slug}`}
                      className="group relative rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5 dark:ring-white/10"
                          style={{ backgroundColor: `${type.color}15`, color: type.color }}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-zinc-900 dark:text-white">
                            {type.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                            <Clock className="h-3 w-3" />
                            {type.duration} {t("booking.minutes")}
                          </span>
                        </div>
                      </div>
                      {type.description && (
                        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {type.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {type.duration} {t("booking.min")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 dark:text-blue-400">
                          {t("booking.select")}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}
    </main>
  );
}
