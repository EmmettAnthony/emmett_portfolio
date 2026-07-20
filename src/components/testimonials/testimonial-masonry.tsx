"use client";

import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Testimonial {
  id: string;
  name: string;
  jobTitle: string | null;
  company: string | null;
  companyLogo: string | null;
  photo: string | null;
  content: string;
  rating: number;
}

export function TestimonialMasonry({ testimonials }: { testimonials: Testimonial[] }) {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setColumns(1);
      else if (window.innerWidth < 1024) setColumns(2);
      else setColumns(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (testimonials.length === 0) return null;

  // Distribute items into columns
  const cols: Testimonial[][] = Array.from({ length: columns }, () => []);
  testimonials.forEach((t, i) => cols[i % columns].push(t));

  return (
    <div className={cn("flex gap-6", columns === 1 ? "flex-col" : "flex-row")}>
      {cols.map((col, ci) => (
        <div key={ci} className="flex flex-1 flex-col gap-6">
          {col.map((t) => (
            <div key={t.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <Quote className="mb-3 h-5 w-5 text-blue-500/20 dark:text-blue-400/20" />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
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
              <div className="mt-4 flex items-center gap-3">
                {t.photo ? (
                  <Image src={t.photo} alt={t.name} width={32} height={32} className="rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500 dark:bg-zinc-800">
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
