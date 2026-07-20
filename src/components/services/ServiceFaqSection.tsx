"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface ServiceFaqSectionProps {
  faqs: FAQ[];
}

export function ServiceFaqSection({ faqs }: ServiceFaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (faqs.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Frequently Asked Questions
      </h2>
      <div className="mt-6 space-y-3">
        {faqs.map((faq, index) => (
          <AnimateOnScroll key={faq.id} delay={index * 0.05}>
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <button
                onClick={() =>
                  setOpenId(openId === faq.id ? null : faq.id)
                }
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                aria-expanded={openId === faq.id}
              >
                <span className="pr-4 text-sm font-semibold text-zinc-900 dark:text-white">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 flex-shrink-0 text-zinc-400 transition-transform duration-200",
                    openId === faq.id && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  openId === faq.id ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="border-t border-zinc-100 px-6 pb-5 pt-4 dark:border-zinc-800">
                  <p className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </div>
  );
}
