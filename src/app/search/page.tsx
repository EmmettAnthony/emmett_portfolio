"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, Suspense, startTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search as SearchIcon, FolderKanban, FileText, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface SearchItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  excerpt?: string;
  image?: string;
  url: string;
}

interface SearchResults {
  portfolio: SearchItem[];
  blog: SearchItem[];
  services: SearchItem[];
}

type SectionKey = "portfolio" | "blog" | "services";

function SearchPageInner() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryFromUrl = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(queryFromUrl);

  const sectionConfig: Record<SectionKey, { label: string; icon: React.ElementType; color: string }> = {
    portfolio: { label: t("portfolio.title"), icon: FolderKanban, color: "bg-badge-info-bg text-badge-info-text" },
    blog: { label: t("blog.title"), icon: FileText, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    services: { label: t("services.title"), icon: ShoppingBag, color: "bg-purple-500/10 text-purple-400" },
  };

  useEffect(() => {
    startTransition(() => {
      setInputValue(queryFromUrl);
    });
  }, [queryFromUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed.length >= 2) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, router]);

  const { data, isLoading, error } = useQuery<SearchResults>({
    queryKey: ["search", queryFromUrl],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(queryFromUrl)}`);
      if (!res.ok) {
        if (res.status === 400) throw new Error("Query too short");
        throw new Error("Search failed");
      }
      return res.json();
    },
    enabled: queryFromUrl.length >= 2,
  });

  const hasResults = data && (data.portfolio.length > 0 || data.blog.length > 0 || data.services.length > 0);
  const totalResults = data ? data.portfolio.length + data.blog.length + data.services.length : 0;

  const sections: SectionKey[] = ["portfolio", "blog", "services"];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{t("search.title")}</h1>
        <div className="relative mt-4">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t("search.placeholder")}
            className="h-12 w-full rounded-xl border border-zinc-300 bg-white pl-12 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>
      </motion.div>

      {isLoading && (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section}>
              <Skeleton className="mb-3 h-5 w-24" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-zinc-500 dark:text-zinc-400">{t("search.error")}</p>
        </motion.div>
      )}

      {!isLoading && !error && queryFromUrl.length >= 2 && !hasResults && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">{t("search.noResults")}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t("search.noResultsFor", { query: queryFromUrl })}
          </p>
        </motion.div>
      )}

      {!isLoading && !error && queryFromUrl.length < 2 && queryFromUrl.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("search.minChars")}</p>
        </motion.div>
      )}

      {hasResults && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-20">
          {totalResults > 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {totalResults === 1 ? t("search.resultCount", { count: totalResults, query: queryFromUrl }) : t("search.resultsCount", { count: totalResults, query: queryFromUrl })}
            </p>
          )}

          {sections.map((section) => {
            const items = data![section];
            if (items.length === 0) return null;
            const config = sectionConfig[section];
            const Icon = config.icon;

            return (
              <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-zinc-500" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{config.label}</h2>
                  <span className="text-xs text-zinc-400">({items.length})</span>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link href={item.url} className="block">
                        <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-surface">
                          <CardContent className="flex items-start gap-4 p-4">
                            {item.image && (
                              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                                  {item.title}
                                </h3>
                                <Badge variant="secondary" className={config.color}>
                                  {config.label}
                                </Badge>
                              </div>
                              {item.excerpt && (
                                <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                                  {item.excerpt}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl px-4 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-4 h-12 w-full rounded-xl" />
        </div>
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mb-3 h-5 w-24" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
