"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search, Tag, Loader2, AlertCircle } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { BlogCard } from "@/components/blog/BlogCard";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { NewsletterSkeleton } from "@/components/shared/NewsletterSkeleton";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readingTime: number;
}

const POSTS_PER_PAGE = 6;

export default function Blog() {
  const t = useTranslations();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const ALL = "All";
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [activeTag, setActiveTag] = useState(ALL);
  const [page, setPage] = useState(1);

  const mountedRef = useRef(true);

  const loadPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      if (mountedRef.current) {
        setPosts(data.posts ?? []);
        setIsLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 0);
    return () => { clearTimeout(timer); mountedRef.current = false; };
  }, [loadPosts]);

  // Derived filter options from fetched data
  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.tags || []))),
    [posts]
  );
  const allCategories = useMemo(
    () => Array.from(new Set(posts.map((post) => post.category))),
    [posts]
  );

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === ALL || post.category === activeCategory;
      const matchesTag =
        activeTag === ALL || (post.tags && post.tags.includes(activeTag));
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [posts, searchQuery, activeCategory, activeTag]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginatedPosts = filtered.slice(
    (page - 1) * POSTS_PER_PAGE,
    page * POSTS_PER_PAGE
  );

  // Reset page when filters change
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  return (
    <main className="pt-24">
      <AnimatedSection>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title={t("blog.title")}
            subtitle={t("blog.subtitle")}
          />

          {/* Search */}
          <div className="relative mx-auto mt-12 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              placeholder={t("blog.searchPlaceholder")}
              className="w-full rounded-xl border border-zinc-300 bg-transparent py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Categories */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[ALL, ...allCategories].map((category) => (
              <button
                key={category}
                onClick={() => handleFilterChange(setActiveCategory, category)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  activeCategory === category
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                {category === ALL ? t("blog.all") : category}
              </button>
            ))}
          </div>

          {/* Tags */}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  handleFilterChange(
                    setActiveTag,
                    activeTag === tag ? ALL : tag
                  )
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  activeTag === tag
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-zinc-50 text-muted-foreground hover:bg-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                )}
              >
                <Tag className="h-3 w-3" />
                {tag === ALL ? t("blog.all") : tag}
              </button>
            ))}
          </div>
          {/* Loading state */}
          {isLoading && !error && (
            <div className="mt-16 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <p className="text-sm text-muted-foreground dark:text-zinc-400">{t("blog.loading")}</p>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="mt-16 flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={loadPosts}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {t("blog.tryAgain")}
              </button>
            </div>
          )}

          {/* Blog grid */}
          {!isLoading && !error && (
            <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {paginatedPosts.map((post, index) => (
                <BlogCard key={post.slug} post={post} index={index} />
              ))}
            </div>
          )}

          {!isLoading && !error && paginatedPosts.length === 0 && (
            <div className="mt-16 text-center">
              <p className="text-muted-foreground dark:text-zinc-400">
                {t("blog.noResults")}
              </p>
              <div className="mt-8">
                <NewsletterSection />
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all",
                      pageNum === page
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    )}
                  >
                    {pageNum}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </AnimatedSection>

      {isLoading ? (
        <NewsletterSkeleton />
      ) : (
        paginatedPosts.length > 0 && <NewsletterSection />
      )}
    </main>
  );
}
