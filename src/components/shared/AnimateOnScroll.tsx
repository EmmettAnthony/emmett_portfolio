"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /** HTML id attribute */
  id?: string;
  /** Delay in seconds before animation starts (staggered) */
  delay?: number;
  /** Duration of the animation in seconds */
  duration?: number;
  /** Distance to slide (in px) */
  distance?: number;
  /** Direction of entrance animation */
  direction?: "up" | "down" | "left" | "right";
}

const directionVariants = {
  up: (d: number) => ({ y: d }),
  down: (d: number) => ({ y: -d }),
  left: (d: number) => ({ x: d }),
  right: (d: number) => ({ x: -d }),
};

export function AnimateOnScroll({
  children,
  className,
  id,
  delay = 0,
  duration = 0.4,
  distance = 24,
  direction = "up",
}: AnimateOnScrollProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div id={id} className={cn(className)}>
        {children}
      </div>
    );
  }

  const hidden = {
    opacity: 0,
    ...directionVariants[direction](distance),
  };

  return (
    <motion.div
      id={id}
      className={cn(className)}
      initial={hidden}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration, ease: "easeOut" as const, delay }}
    >
      {children}
    </motion.div>
  );
}
