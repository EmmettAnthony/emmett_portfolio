"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/routing";

interface LanguageSwitcherProps {
  showLabel?: boolean;
  variant?: "dropdown" | "minimal" | "full";
  className?: string;
}

const localeColors: Record<Locale, string> = {
  en: "bg-blue-500",
  fr: "bg-blue-600",
  es: "bg-red-500",
  pt: "bg-green-600",
  ar: "bg-emerald-600",
  de: "bg-amber-500",
  it: "bg-green-500",
  zh: "bg-red-600",
  ja: "bg-white",
  ko: "bg-blue-700",
};

function LocaleCircle({ locale, size = "sm" }: { locale: Locale; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? "h-6 w-6 text-[11px]" : "h-9 w-9 text-sm";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        dimensions,
        localeColors[locale]
      )}
      title={localeFlags[locale]}
    >
      {locale.toUpperCase()}
    </span>
  );
}

export function LanguageSwitcher({
  showLabel = false,
  variant = "dropdown",
  className,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const currentLocale = useLocale() as Locale;
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function switchLocale(locale: Locale) {
    setOpen(false);
    setSearch("");
    fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    }).then(() => {
      router.refresh();
    });
  }

  const filtered = locales.filter(
    (l) =>
      localeNames[l].toLowerCase().includes(search.toLowerCase()) ||
      l.includes(search.toLowerCase())
  );

  const triggerButton = (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        variant === "minimal"
          ? "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          : "inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:shadow dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
        className
      )}
      aria-label={t("languageSwitcher.ariaLabel")}
      aria-expanded={open}
      data-testid="language-switcher-trigger"
    >
      {variant === "minimal" ? (
        <Globe className="h-4 w-4" />
      ) : (
        <>
          <Globe className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span className="text-base leading-none">{localeFlags[currentLocale]}</span>
          {showLabel && <span className="ml-0.5">{localeNames[currentLocale]}</span>}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 dark:text-zinc-500",
              open && "rotate-180"
            )}
          />
        </>
      )}
    </button>
  );

  return (
    <div className="relative" ref={dropdownRef} data-testid="language-switcher">
      {triggerButton}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-black/5 ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/20 dark:ring-white/5"
            data-testid="language-switcher-dropdown"
          >
            {/* Search */}
            <div className="relative border-b border-zinc-100 p-2 dark:border-zinc-800">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("languageSwitcher.search")}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-blue-500"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto overscroll-contain p-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:dark:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-zinc-400">
                  {t("languageSwitcher.noResults")}
                </p>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((locale) => {
                    const isActive = locale === currentLocale;
                    return (
                      <button
                        key={locale}
                        onClick={() => switchLocale(locale)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all",
                          isActive
                            ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        )}
                      >
                        <LocaleCircle locale={locale} size="sm" />
                        <span className="flex-1 truncate">{localeNames[locale]}</span>
                        {isActive && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
