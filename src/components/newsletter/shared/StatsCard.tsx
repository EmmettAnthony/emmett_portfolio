"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: {
    value: number;
    label: string;
    trend?: "up" | "down";
  };
  color?: string;
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  change,
  color,
  className,
}: StatsCardProps) {
  const iconBg =
    color ??
    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        {Icon && (
          <div className={cn("rounded-xl p-2", iconBg.split(" ").slice(1).join(" "))}>
            <Icon className={cn("h-4 w-4", iconBg.split(" ")[0])} />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white">
        {value}
      </p>
      {change && (
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            change.trend === "down"
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {change.trend === "down" ? (
            <ArrowDownRight className="h-3 w-3" />
          ) : (
            <ArrowUpRight className="h-3 w-3" />
          )}
          <span>
            {change.value} {change.label}
          </span>
        </div>
      )}
    </div>
  );
}
