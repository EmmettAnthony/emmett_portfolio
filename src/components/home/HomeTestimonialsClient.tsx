"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";
import { TestimonialCarousel } from "@/components/testimonials/testimonial-carousel";
import { cn } from "@/lib/utils";

interface TestimonialData {
  id: string;
  name: string;
  jobTitle: string | null;
  company: string | null;
  companyLogo: string | null;
  photo: string | null;
  title: string | null;
  content: string;
  rating: number;
}

interface TestimonialSettings {
  enabled: boolean;
  layout: "carousel" | "grid" | "masonry" | "single";
  columns: 2 | 3 | 4;
  limit: number;
  title: string;
  subtitle: string;
}

export function HomeTestimonialsClient({
  testimonials,
  settings,
}: {
  testimonials: TestimonialData[];
  settings: TestimonialSettings;
}) {
  const displayTestimonials = testimonials.slice(0, settings.limit);

  if (settings.layout === "single") {
    const t = displayTestimonials[0];
    if (!t) return null;
    return (
      <section className="bg-zinc-50 py-20 dark:bg-surface md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title={settings.title} subtitle={settings.subtitle} />
          <div className="mt-16 mx-auto max-w-3xl text-center">
            <AnimateOnScroll className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-5 w-5", i < t.rating ? "fill-amber-400 text-amber-400" : "fill-none text-zinc-300")} />
                ))}
              </div>
              <blockquote className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
                &ldquo;{t.content}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center justify-center gap-4">
                {t.photo ? (
                  <Image src={t.photo} alt={t.name} width={56} height={56} className="rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-base font-semibold text-zinc-900 dark:text-white">{t.name}</p>
                  {(t.jobTitle || t.company) && (
                    <p className="text-sm text-zinc-500">{[t.jobTitle, t.company].filter(Boolean).join(" at ")}</p>
                  )}
                </div>
                {t.companyLogo && (
                  <Image src={t.companyLogo} alt={t.company || ""} width={32} height={32} className="ml-2 rounded object-contain" />
                )}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    );
  }

  if (settings.layout === "carousel") {
    return (
      <section className="bg-zinc-50 py-20 dark:bg-surface md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title={settings.title} subtitle={settings.subtitle} />
          <div className="mt-16">
            <TestimonialCarousel testimonials={displayTestimonials} />
          </div>
        </div>
      </section>
    );
  }

  const gridCols: Record<number, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className="bg-zinc-50 py-20 dark:bg-surface md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={settings.title} subtitle={settings.subtitle} />

        <div className={cn("mt-16 grid gap-8", settings.layout === "masonry" ? "" : gridCols[settings.columns])}>
          {settings.layout === "masonry" ? (
            <MasonryGrid testimonials={displayTestimonials} />
          ) : (
            displayTestimonials.map((t, index) => (
              <AnimateOnScroll key={t.id} delay={index * 0.1}
                className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < t.rating ? "fill-amber-400 text-amber-400" : "fill-none text-zinc-300 dark:text-muted-foreground")} />
                  ))}
                </div>
                {t.title && <h4 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">{t.title}</h4>}
                <blockquote className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground dark:text-zinc-400">
                  &ldquo;{t.content}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  {t.photo ? (
                    <Image src={t.photo} alt={t.name} width={48} height={48} className="rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t.name}</p>
                    {(t.jobTitle || t.company) && (
                      <p className="text-xs text-zinc-500">{[t.jobTitle, t.company].filter(Boolean).join(" at ")}</p>
                    )}
                  </div>
                  {t.companyLogo && (
                    <Image src={t.companyLogo} alt={t.company || ""} width={28} height={28} className="ml-auto rounded object-contain" />
                  )}
                </div>
              </AnimateOnScroll>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function MasonryGrid({ testimonials }: { testimonials: TestimonialData[] }) {
  const cols: TestimonialData[][] = [[], []];
  testimonials.forEach((t, i) => cols[i % 2].push(t));

  return (
    <div className="flex gap-8">
      {cols.map((col, ci) => (
        <div key={ci} className="flex flex-1 flex-col gap-8">
          {col.map((t) => (
            <div key={t.id} className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < t.rating ? "fill-amber-400 text-amber-400" : "fill-none text-zinc-300 dark:text-muted-foreground")} />
                ))}
              </div>
              <blockquote className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground dark:text-zinc-400">&ldquo;{t.content}&rdquo;</blockquote>
              <div className="mt-6 flex items-center gap-4">
                {t.photo ? (
                  <Image src={t.photo} alt={t.name} width={48} height={48} className="rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t.name}</p>
                  {(t.jobTitle || t.company) && <p className="text-xs text-zinc-500">{[t.jobTitle, t.company].filter(Boolean).join(" at ")}</p>}
                </div>
                {t.companyLogo && (
                  <Image src={t.companyLogo} alt={t.company || ""} width={24} height={24} className="ml-auto rounded object-contain" />
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
