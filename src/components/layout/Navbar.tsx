"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useSiteSettings } from "@/components/settings/SiteSettingsProvider";
import { useTranslations } from "@/lib/i18n";

const i18nKeyMap: Record<string, string> = {
  "/": "navigation.home",
  "/about": "navigation.about",
  "/portfolio": "navigation.portfolio",
  "/services": "navigation.services",
  "/resume": "navigation.resume",
  "/blog": "navigation.blog",
  "/contact": "navigation.contact",
};

export function Navbar({ hidden }: { hidden?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const translate = useTranslations();
  const settings = useSiteSettings();

  // Track pathname changes to close mobile menu
  const prevPathname = useRef(pathname);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  if (hidden) return null;

  const navLinks = settings.navigationLinks;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white"
        >
          {settings.siteName.split(" ")[0]}
          <span className="text-blue-700">.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const i18nKey = i18nKeyMap[link.href];
            const displayLabel = (i18nKey && translate(i18nKey)) || link.label;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                  pathname === link.href
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                )}
              >
                {displayLabel}
              </Link>
            );
          })}
          <div className="ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
            <LanguageSwitcher variant="minimal" />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher variant="minimal" />
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label={translate("navigation.toggleMenu")}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="space-y-1 px-4 pb-4 pt-2">
              {navLinks.map((link) => {
                const i18nKey = i18nKeyMap[link.href];
                const displayLabel = (i18nKey && translate(i18nKey)) || link.label;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    {displayLabel}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
