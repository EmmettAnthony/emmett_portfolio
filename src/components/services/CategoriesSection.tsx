"use client";

import Link from "next/link";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

interface CategoryService {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  icon: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  _count: { services: number };
  services: CategoryService[];
}

interface CategoriesSectionProps {
  categories: Category[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-zinc-50 py-20 dark:bg-surface md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Service Categories
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
              Explore my range of professional services designed to help your
              business succeed online.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <AnimateOnScroll
              key={category.id}
              delay={index * 0.08}
            >
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-blue-500/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {category.icon || "📦"}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    {category.name}
                  </h3>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {category._count.services}
                  </span>
                </div>

                {category.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                    {category.description}
                  </p>
                )}

                {category.services.length > 0 && (
                  <ul className="mt-5 space-y-2 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                    {category.services.map((svc) => (
                      <li key={svc.id}>
                        <Link
                          href={`/services/${svc.slug}`}
                          className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                        >
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                          {svc.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
