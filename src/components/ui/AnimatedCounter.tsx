"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}

export function AnimatedCounter({
  from = 0,
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(from);
  const rounded = useTransform(motionValue, (v) => v.toFixed(decimals));
  const displayValue = useTransform(rounded, (v) => `${prefix}${v}${suffix}`);

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, to, {
        duration,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, motionValue, to, duration]);

  return <motion.span ref={ref}>{displayValue}</motion.span>;
}
