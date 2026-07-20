"use client";

import {
  Briefcase,
  Code,
  Smartphone,
  Search,
  Shield,
  Headphones,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

const reasonKeys = [
  { icon: Briefcase, titleKey: "professionalExperience", descKey: "professionalExperienceDesc" },
  { icon: Code, titleKey: "qualityCode", descKey: "qualityCodeDesc" },
  { icon: Smartphone, titleKey: "responsiveDesign", descKey: "responsiveDesignDesc" },
  { icon: Search, titleKey: "seoBestPractices", descKey: "seoBestPracticesDesc" },
  { icon: Shield, titleKey: "securityFocused", descKey: "securityFocusedDesc" },
  { icon: Headphones, titleKey: "ongoingSupport", descKey: "ongoingSupportDesc" },
];

export function WhyChooseMe() {
  const t = useTranslations("services.whyChooseMe");
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {reasonKeys.map((reason, index) => (
            <AnimateOnScroll key={reason.titleKey} delay={index * 0.08}>
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-blue-500/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <reason.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-white">
                  {t(reason.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {t(reason.descKey)}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
