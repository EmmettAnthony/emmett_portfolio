"use client";

import Link from "next/link";
import { Check, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  deliveryTime: string | null;
  revisions: number | null;
  isPopular: boolean;
  order: number;
}

interface ComparisonTableProps {
  packages: Package[];
}

export function ComparisonTable({ packages }: ComparisonTableProps) {
  if (packages.length === 0) return null;

  const allFeatures = Array.from(
    new Set(packages.flatMap((pkg) => pkg.features || []))
  );

  const getFeatureValue = (
    pkg: Package,
    feature: string
  ): boolean | string => {
    if (pkg.features?.includes(feature)) return true;
    return false;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={cn(
              "flex min-w-[260px] flex-1 flex-col rounded-2xl border p-6 transition-all",
              pkg.isPopular
                ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            )}
          >
            {pkg.isPopular && (
              <div className="mb-4 self-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
            )}
            <h3
              className={cn(
                "text-lg font-semibold",
                pkg.isPopular
                  ? "text-white"
                  : "text-zinc-900 dark:text-white"
              )}
            >
              {pkg.name}
            </h3>
            {pkg.description && (
              <p
                className={cn(
                  "mt-1 text-sm",
                  pkg.isPopular
                    ? "text-blue-100"
                    : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                {pkg.description}
              </p>
            )}
            <div className="mt-4">
              <span
                className={cn(
                  "text-3xl font-bold",
                  pkg.isPopular
                    ? "text-white"
                    : "text-zinc-900 dark:text-white"
                )}
              >
                ${pkg.price}
              </span>
            </div>

            <div className="mt-6 flex-1 space-y-3">
              {allFeatures.map((feature) => {
                const val = getFeatureValue(pkg, feature);
                return (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm"
                  >
                    {val === true ? (
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          pkg.isPopular
                            ? "text-blue-200"
                            : "text-blue-600 dark:text-blue-400"
                        )}
                      />
                    ) : (
                      <X
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          pkg.isPopular
                            ? "text-blue-300/50"
                            : "text-muted-foreground dark:text-muted-foreground"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        pkg.isPopular
                          ? "text-blue-100"
                          : "text-muted-foreground dark:text-zinc-400"
                      )}
                    >
                      {feature}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <Link
                href="/contact"
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all",
                  pkg.isPopular
                    ? "bg-white text-blue-700 hover:bg-blue-50"
                    : "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg hover:from-brand-500 hover:to-brand-600 hover:shadow-blue-500/25"
                )}
              >
                Get Started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
