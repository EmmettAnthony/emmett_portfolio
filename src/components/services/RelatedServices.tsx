"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

export interface RelatedService {
  slug: string;
  title: string;
  shortDescription: string | null;
  icon: string | null;
}

interface RelatedServicesProps {
  services: RelatedService[];
}

export function RelatedServices({ services }: RelatedServicesProps) {
  if (services.length === 0) return null;

  const display = services.slice(0, 3);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {display.map((service, index) => (
        <AnimateOnScroll key={service.slug} delay={index * 0.08}>
          <Link
            href={`/services/${service.slug}`}
            className="group block rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-blue-500/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-base text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {service.icon || "→"}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              {service.title}
            </h3>
            {service.shortDescription && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                {service.shortDescription}
              </p>
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              View Service
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        </AnimateOnScroll>
      ))}
    </div>
  );
}
