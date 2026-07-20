"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search as SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import projects from "@/data/projects.json";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { NewsletterSkeleton } from "@/components/shared/NewsletterSkeleton";
import { cn } from "@/lib/utils";

const categories = [
  "All",
  ...Array.from(new Set(projects.map((p) => p.category))),
];

export default function Portfolio() {
  const t = useTranslations();
  const [ready, setReady] = useState(false);
  const deferredReady = useDeferredValue(ready);
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // useDeferredValue naturally holds the old value for at least one frame,
  // giving the skeleton time to render before content appears
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const mockEmpty = searchParams.get("mock_empty") === "true";

  const filtered = useMemo(() => {
    // Dev-only: ?mock_empty=true forces empty state for visual debugging
    if (mockEmpty) return [];

    return projects.filter((project) => {
      const matchesCategory =
        activeCategory === "All" || project.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, mockEmpty]);

  return (
    <main className="pt-24">
      <AnimatedSection>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title={t("portfolio.title")}
            subtitle={t("portfolio.subtitle")}
          />

          {/* Search and Filter */}
          <div className="mt-12 space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    activeCategory === category
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("portfolio.search")}
                className="w-full rounded-xl border border-zinc-300 bg-transparent py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500 sm:w-64"
              />
            </div>
          </div>

          {/* Project grid */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-16"
            >
              <p className="text-center text-muted-foreground dark:text-zinc-400">
                {t("portfolio.noResults")}
              </p>
              <div className="mt-12">
                <NewsletterSection />
              </div>
            </motion.div>
          )}
        </div>
      </AnimatedSection>

      {!deferredReady ? (
        <NewsletterSkeleton />
      ) : (
        filtered.length > 0 && <NewsletterSection />
      )}
    </main>
  );
}
