"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, HelpCircle, Search } from "lucide-react";
import Link from "next/link";

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
};

const categoryLabels: Record<string, string> = {
  general: "General",
  billing: "Billing",
  technical: "Technical",
  account: "Account",
  support: "Support",
  other: "Other",
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/support/faq")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load FAQs");
        return r.json();
      })
      .then(setFaqs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  const grouped: Record<string, FAQ[]> = {};
  for (const faq of filtered) {
    const key = faq.category || "other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(faq);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/support" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>

      <div className="mb-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <HelpCircle className="h-4 w-4" />
          Frequently Asked Questions
        </div>
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">FAQs</h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">Quick answers to common questions.</p>

        <div className="relative max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs..."
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
          <HelpCircle className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
          <p className="text-lg font-medium text-zinc-900 dark:text-white">No FAQs found</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {search ? "Try a different search term." : "No FAQs have been published yet."}
          </p>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-white">
              {categoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
            </h2>
            <div className="space-y-3">
              {items.map((faq) => (
                <details
                  key={faq.id}
                  className="group rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all open:border-emerald-200 open:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:open:border-emerald-800"
                >
                  <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-sm font-medium text-zinc-900 dark:text-white">
                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
                    <span className="flex-1">{faq.question}</span>
                  </summary>
                  <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
                    <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
