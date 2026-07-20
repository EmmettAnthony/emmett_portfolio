"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, Clock, DollarSign, ArrowUpRight } from "lucide-react";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";
import { useTranslations } from "@/lib/i18n";

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  icon: string | null;
  featuredImage: string | null;
  startingPrice: number | null;
  estimatedTimeline: string | null;
  features: string[];
  tags: string[];
}

interface ServicesSearchProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    services: ServiceItem[];
  }>;
  featuredServices: ServiceItem[];
}

export function ServicesSearch({ categories }: ServicesSearchProps) {
  const t = useTranslations("services");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const allServices = useMemo(() => {
    const map = new Map<string, ServiceItem>();
    for (const cat of categories) {
      for (const s of cat.services) {
        map.set(s.id, s);
      }
    }
    return Array.from(map.values());
  }, [categories]);

  const filtered = useMemo(() => {
    let result = allServices;

    if (selectedCategory !== "all") {
      const cat = categories.find((c) => c.id === selectedCategory);
      if (cat) {
        const ids = new Set(cat.services.map((s) => s.id));
        result = result.filter((s) => ids.has(s.id));
      }
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.shortDescription?.toLowerCase().includes(q)) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allServices, selectedCategory, query, categories]);

  const show = query.trim().length > 0 || selectedCategory !== "all";

  return (
    <section className="border-b border-zinc-200 bg-white pb-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchServices")}
              className="w-full rounded-2xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.services.length})
              </option>
            ))}
          </select>
        </div>

        {show && (
          <AnimateOnScroll className="mt-6">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-16 dark:border-zinc-700 dark:bg-zinc-800/50">
                <Search className="h-8 w-8 text-zinc-300 dark:text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  No services match your search.
                </p>
                <button
                  onClick={() => { setQuery(""); setSelectedCategory("all"); }}
                  className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((service) => (
                  <Link
                    key={service.id}
                    href={`/services/${service.slug}`}
                    className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-blue-500/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {service.icon && <span className="text-2xl">{service.icon}</span>}
                        <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {service.title}
                        </h3>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-blue-500 dark:text-muted-foreground" />
                    </div>
                    {service.shortDescription && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2 dark:text-zinc-400">
                        {service.shortDescription}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {service.startingPrice != null && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                          <DollarSign className="h-3 w-3" />
                          From ${service.startingPrice.toLocaleString()}
                        </span>
                      )}
                      {service.estimatedTimeline && (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-500">
                          <Clock className="h-3 w-3" />
                          {service.estimatedTimeline}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </AnimateOnScroll>
        )}
      </div>
    </section>
  );
}
