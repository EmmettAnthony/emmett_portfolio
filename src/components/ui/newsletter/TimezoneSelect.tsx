"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Globe, Search, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

interface TimezoneSelectProps {
  value: string | null;
  onChange: (timezone: string) => void;
}

interface GroupedTimezones {
  region: string;
  zones: string[];
}

function groupTimezones(all: string[]): GroupedTimezones[] {
  const groups: { label: string; zones: string[] }[] = [
    { label: "Americas", zones: [] },
    { label: "Europe", zones: [] },
    { label: "Asia / Pacific", zones: [] },
    { label: "Africa", zones: [] },
    { label: "Atlantic", zones: [] },
    { label: "Indian Ocean", zones: [] },
    { label: "Australia", zones: [] },
    { label: "Pacific", zones: [] },
    { label: "UTC", zones: [] },
  ];

  for (const tz of all) {
    if (tz === "UTC") {
      groups[8].zones.push(tz);
    } else if (tz.startsWith("America") || tz.startsWith("US/") || tz.startsWith("Canada/")) {
      groups[0].zones.push(tz);
    } else if (tz.startsWith("Europe")) {
      groups[1].zones.push(tz);
    } else if (tz.startsWith("Asia")) {
      groups[2].zones.push(tz);
    } else if (tz.startsWith("Africa")) {
      groups[3].zones.push(tz);
    } else if (tz.startsWith("Atlantic")) {
      groups[4].zones.push(tz);
    } else if (tz.startsWith("Indian")) {
      groups[5].zones.push(tz);
    } else if (tz.startsWith("Australia")) {
      groups[6].zones.push(tz);
    } else if (tz.startsWith("Pacific")) {
      groups[7].zones.push(tz);
    } else {
      groups[2].zones.push(tz);
    }
  }

  return groups.filter((g) => g.zones.length > 0).map((g) => ({
    region: g.label,
    zones: g.zones,
  }));
}

export function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [detecting, setDetecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allTimezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [];
    }
  }, []);

  const grouped = useMemo(() => {
    const filtered = search
      ? allTimezones.filter((tz) => tz.toLowerCase().includes(search.toLowerCase()))
      : allTimezones;
    return groupTimezones(filtered);
  }, [allTimezones, search]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDetect = () => {
    setDetecting(true);
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      onChange(detected);
      setOpen(false);
      setSearch("");
    } catch {
      // fallback
    } finally {
      setDetecting(false);
    }
  };

  const displayLabel = value
    ? value.replace(/_/g, " ").replace(/\//g, " / ")
    : "Select timezone";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
          "border-zinc-300 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800",
          !value && "text-zinc-400 dark:text-zinc-500"
        )}
      >
        <Globe className="h-4 w-4 shrink-0 text-zinc-400" />
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-3 dark:border-zinc-700">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchTimezones")}
              className="flex-1 bg-transparent py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
            />
            <button
              type="button"
              onClick={handleDetect}
              disabled={detecting}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            >
              {detecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Globe className="h-3 w-3" />
              )}
              Detect
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {grouped.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-sm text-zinc-400">
                No timezones found
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.region}>
                  <div className="sticky top-0 border-b border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800">
                    {group.region}
                  </div>
                  {group.zones.map((tz) => (
                    <button
                      key={tz}
                      type="button"
                      onClick={() => {
                        onChange(tz);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800",
                        tz === value
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-zinc-700 dark:text-muted-foreground"
                      )}
                    >
                      <span className="flex-1 truncate">
                        {tz.replace(/_/g, " ").replace(/\//g, " / ")}
                      </span>
                      {tz === value && (
                        <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
