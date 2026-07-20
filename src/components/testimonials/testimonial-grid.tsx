"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
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

export function TestimonialGrid({ testimonials, columns = 3 }: {
  testimonials: Testimonial[];
  columns?: 2 | 3 | 4;
}) {
  const gridCols: Record<number, string> = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };

  if (testimonials.length === 0) return null;

  return (
    <div className={cn("grid gap-6", gridCols[columns])}>
      {testimonials.map((t) => (
        <div key={t.id}
          className="group relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
          <Quote className="mb-3 h-6 w-6 text-blue-500/20 dark:text-blue-400/20" />

          {t.title && (
            <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">{t.title}</h4>
          )}

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground line-clamp-4 dark:text-zinc-400">
            &ldquo;{t.content}&rdquo;
          </p>

          <div className="mt-3 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn(
                "h-3.5 w-3.5",
                i < t.rating ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground dark:text-muted-foreground"
              )} />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {t.photo ? (
              <Image src={t.photo} alt={t.name} width={36} height={36} className="rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-500 dark:bg-zinc-800">
                {t.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{t.name}</p>
              {(t.jobTitle || t.company) && (
                <p className="truncate text-xs text-zinc-500">
                  {[t.jobTitle, t.company].filter(Boolean).join(" at ")}
                </p>
              )}
            </div>
            {t.companyLogo && (
              <Image src={t.companyLogo} alt={t.company || ""} width={28} height={28} className="ml-auto rounded object-contain" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
