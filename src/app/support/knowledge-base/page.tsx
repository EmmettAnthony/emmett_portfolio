"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, ChevronDown, FileText } from "lucide-react";
import Link from "next/link";

type KBCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { articles: number };
};

export default function KnowledgeBasePage() {
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type assertion for external lib
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sendFeedback = async (articleId: string, helpful: boolean) => {
    try {
      await fetch(`/api/support/knowledge-base/${articleId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpful }),
      });
      setArticles((prev: Record<string, unknown>[]) => prev.map(a =>
        a.id === articleId
          ? { ...a, helpfulCount: (a.helpfulCount || 0) + (helpful ? 1 : 0), notHelpfulCount: (a.notHelpfulCount || 0) + (helpful ? 0 : 1) }
          : a
      ));
    } catch {}
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/support/knowledge-base").then((r) => {
        if (!r.ok) throw new Error("Failed to fetch articles");
        return r.json();
      }),
      fetch("/api/support/knowledge-base/categories").then((r) => {
        if (!r.ok) throw new Error("Failed to fetch categories");
        return r.json();
      }),
    ])
      .then(([articlesData, categoriesData]) => {
        setArticles(articlesData);
        setCategories(categoriesData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          (a.excerpt && a.excerpt.toLowerCase().includes(search.toLowerCase()))
      )
    : articles;

  const grouped = categories
    .map((cat) => ({
      ...cat,
      articles: filtered.filter((a) => a.category?.id === cat.id),
    }))
    .filter((g) => g.articles.length > 0);

  const uncategorized = filtered.filter((a) => !a.category);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/support" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">Knowledge Base</h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">Browse guides, tutorials, and documentation.</p>

        <div className="relative max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-blue-800"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {!error && filtered.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
          <p className="text-lg font-medium text-zinc-900 dark:text-white">No articles found</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {search ? "Try a different search term." : "No articles have been published yet."}
          </p>
        </div>
      )}

      <div className="space-y-8">
        {grouped.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-white">{cat.name}</h2>
            {cat.description && (
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{cat.description}</p>
            )}
            <div className="space-y-3">
              {cat.articles.map((article) => (
                <details
                  key={article.id}
                  className="group rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all open:border-blue-200 open:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:open:border-blue-800"
                >
                  <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
                    <span className="flex-1">{article.title}</span>
                    {article.readingTime && (
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-500">{article.readingTime} min read</span>
                    )}
                  </summary>
                  <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
                    {article.excerpt && (
                      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{article.excerpt}</p>
                    )}
                    <div className="prose-chat max-w-none text-sm text-zinc-700 dark:text-zinc-300">
                      {article.content}
                    </div>
                    <div className="mt-3 flex items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-700">
                      <span className="text-xs text-zinc-400">Was this helpful?</span>
                      <button onClick={() => sendFeedback(article.id, true)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950">
                        👍 {article.helpfulCount || 0}
                      </button>
                      <button onClick={() => sendFeedback(article.id, false)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                        👎 {article.notHelpfulCount || 0}
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        {uncategorized.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-white">Other Articles</h2>
            <div className="space-y-3">
              {uncategorized.map((article) => (
                <details
                  key={article.id}
                  className="group rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all open:border-blue-200 open:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:open:border-blue-800"
                >
                  <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
                    <span className="flex-1">{article.title}</span>
                    {article.readingTime && (
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-500">{article.readingTime} min read</span>
                    )}
                  </summary>
                  <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
                    {article.excerpt && (
                      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{article.excerpt}</p>
                    )}
                    <div className="prose-chat max-w-none text-sm text-zinc-700 dark:text-zinc-300">
                      {article.content}
                    </div>
                    <div className="mt-3 flex items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-700">
                      <span className="text-xs text-zinc-400">Was this helpful?</span>
                      <button onClick={() => sendFeedback(article.id, true)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950">
                        👍 {article.helpfulCount || 0}
                      </button>
                      <button onClick={() => sendFeedback(article.id, false)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                        👎 {article.notHelpfulCount || 0}
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
