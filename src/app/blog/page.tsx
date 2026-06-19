"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Tag } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { BlogCard } from "@/components/blog/BlogCard";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import blog from "@/data/blog.json";
import { cn } from "@/lib/utils";

const allTags = Array.from(new Set(blog.flatMap((post) => post.tags || [])));
const allCategories = Array.from(new Set(blog.map((post) => post.category)));

const POSTS_PER_PAGE = 6;

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTag, setActiveTag] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return blog.filter((post) => {
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || post.category === activeCategory;
      const matchesTag =
        activeTag === "All" || (post.tags && post.tags.includes(activeTag));
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [searchQuery, activeCategory, activeTag]);

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
            title="Blog"
            subtitle="Articles about web development, best practices, and technology."
          />

          {/* Search */}
          <div className="relative mx-auto mt-12 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              placeholder="Search articles..."
              className="w-full rounded-xl border border-zinc-300 bg-transparent py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Categories */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["All", ...allCategories].map((category) => (
              <button
                key={category}
                onClick={() => handleFilterChange(setActiveCategory, category)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  activeCategory === category
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                {category}
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
                    activeTag === tag ? "All" : tag
                  )
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  activeTag === tag
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                )}
              >
                <Tag className="h-3 w-3" />
                {tag}
              </button>
            ))}
          </div>

          {/* Blog grid */}
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post, index) => (
              <BlogCard key={post.slug} post={post} index={index} />
            ))}
          </div>

          {paginatedPosts.length === 0 && (
            <p className="mt-16 text-center text-zinc-600 dark:text-zinc-400">
              No articles found matching your criteria.
            </p>
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
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
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

      <NewsletterSection />
    </main>
  );
}
