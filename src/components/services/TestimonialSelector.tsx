"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useState
} from "react";
import { Search, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  company: string | null;
}

interface TestimonialSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TestimonialSelector({ selectedIds, onChange }: TestimonialSelectorProps) {
  const t = useTranslations("testimonials");
  const [search, setSearch] = useState("");

  const { data } = useQuery<{ testimonials: Testimonial[] }>({
    queryKey: ["dashboard-testimonials"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials");
      if (!res.ok) throw new Error("Failed to fetch testimonials");
      return res.json();
    },
  });

  const testimonials = data?.testimonials ?? [];

  const filtered = testimonials.filter(
    (t) =>
      !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase()) ||
      t.company?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchTestimonials")}
          className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const t = testimonials.find((x) => x.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {t?.name ?? id}
                <button type="button" onClick={() => toggle(id)} className="hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No testimonials found.</p>
        ) : (
          filtered.map((t) => {
            const selected = selectedIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={cn(
                  "w-full rounded-lg p-3 text-left text-sm transition-colors",
                  selected
                    ? "bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-900/20 dark:ring-blue-400"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900 dark:text-white">{t.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{t.content}</p>
                {t.company && <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{t.company}</p>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
