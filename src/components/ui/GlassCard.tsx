"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "heavy";
}

export function GlassCard({ children, className, intensity = "medium" }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-lg backdrop-blur-xl transition-all",
        // Light mode: white with transparency + subtle border
        "bg-white/70 border-white/20",
        // Dark mode: darker with transparency  
        "dark:bg-zinc-900/60 dark:border-white/10",
        // Intensity variants
        intensity === "light" && "bg-white/40 dark:bg-zinc-900/30",
        intensity === "heavy" && "bg-white/85 dark:bg-zinc-900/75 shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
