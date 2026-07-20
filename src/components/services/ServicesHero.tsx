"use client";

import Link from "next/link";
import { ArrowUpRight, Phone, Sparkles } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

export function ServicesHero() {
  const t = useTranslations();
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 py-24 sm:py-32">
      {/* Premium ambient glow — blue-purple-pink theme */}
      <div className="hero-glow-blue-purple-pink" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-4xl text-center">
        <AnimateOnScroll>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            {t("services.hero.badge")}
          </span>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.1}>
          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient-blue-purple">
              {t("services.hero.title1")}
            </span>
            <br />
            <span className="text-zinc-100">
              {t("services.hero.title2")}
            </span>
          </h1>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            {t("services.hero.description")}
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll
          delay={0.3}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/contact"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 text-sm font-semibold text-white shadow-lg transition-all hover:from-brand-500 hover:to-brand-600 hover:shadow-purple-500/25"
          >
            {t("services.hero.quote")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact?type=consultation"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-zinc-700 bg-surface px-8 text-sm font-semibold text-muted-foreground transition-all hover:border-zinc-500 hover:text-white hover:bg-zinc-800"
          >
            <Phone className="h-4 w-4" />
            {t("services.hero.consultation")}
          </Link>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
