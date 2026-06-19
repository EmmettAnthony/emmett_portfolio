"use client";

import { ArrowUp } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  const showThreshold = 0.2;

  return (
    <motion.button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-8 right-8 z-50",
        "flex h-10 w-10 items-center justify-center rounded-full",
        "bg-zinc-900 text-white shadow-lg",
        "dark:bg-white dark:text-zinc-900",
        "hover:scale-110 active:scale-95",
        "transition-transform duration-200"
      )}
      style={{
        opacity: smoothProgress.get() !== undefined
          ? smoothProgress.get() > showThreshold
            ? 1
            : 0
          : 0,
        pointerEvents: smoothProgress.get() !== undefined
          ? smoothProgress.get() > showThreshold
            ? ("auto" as const)
            : ("none" as const)
          : ("none" as const),
      }}
      aria-label="Back to top"
    >
      <ArrowUp className="h-4 w-4" />
    </motion.button>
  );
}
