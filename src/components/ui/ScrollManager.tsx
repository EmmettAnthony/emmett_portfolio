"use client";

import { ArrowUp } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useTranslations } from "next-intl";

/**
 * Merged scroll-aware component combining scroll progress bar and back-to-top button.
 * Shares a single framer-motion `useScroll` hook to reduce overhead.
 */
export function ScrollManager() {
  const t = useTranslations();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  const showThreshold = 0.2;

  return (
    <>
      {/* Progress bar */}
      <motion.div
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
        style={{ scaleX }}
      />

      {/* Back to top button */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200 dark:bg-white dark:text-zinc-900"
        style={{
          opacity: smoothProgress.get() > showThreshold ? 1 : 0,
          pointerEvents: smoothProgress.get() > showThreshold ? ("auto" as const) : ("none" as const),
        }}
        aria-label={t("backToTop.ariaLabel")}
      >
        <ArrowUp className="h-4 w-4" />
      </motion.button>
    </>
  );
}
