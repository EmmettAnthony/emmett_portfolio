"use client";

import { motion } from "framer-motion";
import { Check, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number | string;
    currency: string;
    interval: string;
    features: string[];
    highlighted: boolean;
  };
  index: number;
}

export function PricingCard({ plan, index }: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "relative flex flex-col rounded-2xl border p-8 transition-all hover:shadow-xl",
        plan.highlighted
          ? "border-blue-600 bg-blue-600 text-white shadow-lg"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
          Most Popular
        </div>
      )}

      <div>
        <h3
          className={cn(
            "text-lg font-semibold",
            plan.highlighted ? "text-white" : "text-zinc-900 dark:text-white"
          )}
        >
          {plan.name}
        </h3>
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed",
            plan.highlighted
              ? "text-blue-100"
              : "text-zinc-600 dark:text-zinc-400"
          )}
        >
          {plan.description}
        </p>

        <div className="mt-6">
          <span
            className={cn(
              "text-4xl font-bold",
              plan.highlighted ? "text-white" : "text-zinc-900 dark:text-white"
            )}
          >
            {plan.currency}{plan.price}
          </span>
          {plan.interval && (
            <span
              className={cn(
                "ml-1 text-sm",
                plan.highlighted
                  ? "text-blue-200"
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              /{plan.interval}
            </span>
          )}
        </div>

        <ul className="mt-8 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check
                className={cn(
                  "mt-0.5 h-4 w-4 flex-shrink-0",
                  plan.highlighted
                    ? "text-blue-200"
                    : "text-blue-700 dark:text-blue-400"
                )}
              />
              <span
                className={cn(
                  "text-sm",
                  plan.highlighted
                    ? "text-blue-100"
                    : "text-zinc-600 dark:text-zinc-400"
                )}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href="/contact"
          className={cn(
            "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all",
            plan.highlighted
              ? "bg-white text-blue-700 hover:bg-blue-50"
              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          )}
        >
          Get Started
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}
