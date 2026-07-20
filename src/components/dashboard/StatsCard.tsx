"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-badge-info-bg text-badge-info-text">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (            <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.positive
                ? "bg-badge-success-bg text-badge-success-text"
                : "bg-badge-error-bg text-badge-error-text"
            )}
          >
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}
