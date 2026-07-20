"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { NewsletterSignupForm } from "./NewsletterSignupForm";

interface PopupModalProps {
  delay?: number;
  /** How many times the popup may appear per session (default 1).
   *  Set to Infinity (or a large number) to allow unlimited re-triggers. */
  maxShownPerSession?: number;
  /** CSS selector for the element to observe via IntersectionObserver on mobile.
   *  The popup shows when this element becomes visible. Defaults to "footer". */
  triggerSelector?: string;
}

type PopupConfig = {
  enabled: boolean;
  defaultEnabled: boolean;
  perPage: Record<string, boolean>;
  /** Per-page delay overrides (ms). Falls back to the component's `delay` prop. */
  perPageDelay: Record<string, number>;
};

function getPageRoot(pathname: string): string {
  // Match dynamic routes to their parent (e.g. "/blog/some-post" -> "/blog")
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return `/${segments[0] ?? ""}`;
  return `/${segments[0]}`;
}

function isPopupEnabledForPage(config: PopupConfig, pathname: string): boolean {
  if (!config.enabled) return false;
  // Try exact match first
  if (pathname in config.perPage) return config.perPage[pathname];
  // Try parent path for nested routes (e.g., "/blog/some-post" -> "/blog")
  const parent = getPageRoot(pathname);
  if (parent in config.perPage) return config.perPage[parent];
  return config.defaultEnabled;
}

/** Read the current session show count (0 if never shown). */
function getSessionShowCount(): number {
  const raw = sessionStorage.getItem("newsletter-popup-show-count");
  const count = raw ? parseInt(raw, 10) : 0;
  return Number.isNaN(count) ? 0 : count;
}

/** Increment the session show count and return the new value. */
function incrementSessionShowCount(): number {
  const next = getSessionShowCount() + 1;
  sessionStorage.setItem("newsletter-popup-show-count", String(next));
  return next;
}

export function PopupModal({
  delay = 30000,
  maxShownPerSession = 1,
  triggerSelector = "[data-popup-trigger='newsletter']",
}: PopupModalProps) {
  const t = useTranslations("newsletter");
  const [open, setOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  // Track viewport size so the effect re-runs on resize
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch per-page popup config
  useEffect(() => {
    let cancelled = false;
    fetch("/api/newsletter/popup-config")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setConfig(data as PopupConfig);
      })
      .catch(() => {
        // On fetch error, assume enabled (default behavior)
        if (!cancelled)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
          setConfig({ enabled: true, defaultEnabled: true, perPage: {}, perPageDelay: {} } as any);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Resolve the effective delay for the current page. Falls back to the prop `delay`. */
  const getEffectiveDelay = useCallback((): number => {
    if (!config) return delay;
    const pathname = window.location.pathname;
    const parent = getPageRoot(pathname);
    return (
      config.perPageDelay?.[pathname] ??
      config.perPageDelay?.[parent] ??
      delay
    );
  }, [config, delay]);

  /** Track a popup show event */
  function trackShown(trigger: string) {
    trackEvent("popup_shown", "newsletter_popup", {
      trigger,
      pathname: window.location.pathname,
      pageTitle: document.title,
    });
  }

  useEffect(() => {
    // Wait for config to load
    if (!config) return;

    // Check if popup is enabled for this page
    if (!isPopupEnabledForPage(config, window.location.pathname)) return;

    // Respect permanent dismissal across sessions
    const dismissed = localStorage.getItem("newsletter-popup-dismissed");
    if (dismissed === "true") return;

    // Check session show limit
    if (getSessionShowCount() >= maxShownPerSession) return;

    // Wait for viewport size to be determined
    if (isMobile === null) return;

    // Resolve delay — per-page config overrides the prop
    const effectiveDelay = getEffectiveDelay();

    if (isMobile) {
      // Mobile: show popup when the trigger element scrolls into view
      const target = document.querySelector(triggerSelector);
      if (!target) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            incrementSessionShowCount();
            setOpen(true);
            trackShown("scroll");
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(target);
      return () => observer.disconnect();
    }

    // Desktop: exit-intent + timer
    let handled = false;

    const handleExitIntent = (e: MouseEvent) => {
      if (handled) return;
      if (e.clientY <= 0) {
        handled = true;
        incrementSessionShowCount();
        setOpen(true);
        trackShown("exit_intent");
      }
    };

    const timeoutId = setTimeout(() => {
      if (!handled) {
        handled = true;
        incrementSessionShowCount();
        setOpen(true);
        trackShown("timer");
      }
    }, effectiveDelay);

    document.addEventListener("mouseleave", handleExitIntent);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mouseleave", handleExitIntent);
    };
  }, [delay, triggerSelector, config, maxShownPerSession, isMobile, getEffectiveDelay]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem("newsletter-popup-dismissed", "true");
    setOpen(false);
    trackEvent("popup_dismissed", "newsletter_popup", {
      pathname: window.location.pathname,
    });
    // Reset for next visit
    setTimeout(() => setSubscribed(false), 300);
  }, []);

  const handleSuccess = useCallback(() => {
    setSubscribed(true);
    trackEvent("popup_converted", "newsletter_popup", {
      pathname: window.location.pathname,
    });
    // Auto-close after showing success for 2.5s
    setTimeout(() => {
      handleDismiss();
    }, 2500);
  }, [handleDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-7 shadow-2xl shadow-black/5 ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20 dark:ring-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            {subscribed ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {t("popup.successTitle")}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {t("popup.successDescription")}
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mb-2">
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {t("badge")}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
                    <Mail className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {t("popup.title")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {t("popup.description")}
                  </p>
                </div>

                <NewsletterSignupForm
                  source="popup"
                  variant="modal"
                  onSuccess={handleSuccess}
                />

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    {t("popup.dismiss")}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
