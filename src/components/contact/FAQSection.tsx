"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

const fallbackFaqs: FAQItem[] = [
  {
    question: "How quickly do you respond?",
    answer:
      "I typically respond within 24 hours during business days. For urgent inquiries, I recommend reaching out via the contact form with 'URGENT' in the subject line, or connecting with me on LinkedIn for a faster response.",
  },
  {
    question: "What services do you provide?",
    answer:
      "I specialize in full-stack web development including custom websites, e-commerce platforms, web applications, API development, and technical consulting. I work primarily with modern frameworks like Next.js, React, Node.js, and various CMS platforms.",
  },
  {
    question: "Do you work internationally?",
    answer:
      "Absolutely! I work with clients from around the world. I'm based in Congo Town, Liberia, and have experience collaborating across different time zones. Communication is typically handled through email, video calls, and project management tools.",
  },
  {
    question: "How does the project process work?",
    answer:
      "My process typically follows these steps: (1) Discovery — we discuss your goals and requirements, (2) Proposal — I provide a detailed plan and timeline, (3) Development — I build your solution with regular updates, (4) Review — you test and provide feedback, (5) Launch — we deploy and optimize, and (6) Support — ongoing maintenance as needed.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "I accept payments via bank transfer, PayPal, and Stripe. For larger projects, we can arrange a payment schedule tied to project milestones. A deposit is typically required to begin work, with the remaining balance due upon completion.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>(fallbackFaqs);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch("/api/contact/faqs?published=true");
        if (res.ok) {
          const data = await res.json();
          if (data.faqs?.length > 0) {
            setFaqs(data.faqs);
          }
        }
      } catch {
        // Use fallback
      } finally {
        setLoaded(true);
      }
    };
    fetchFaqs();
  }, []);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/30 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
              Everything you need to know before reaching out.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mx-auto mt-16 max-w-3xl space-y-3">
          {!loaded ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
                />
              ))}
            </div>
          ) : (
            faqs.map((faq, index) => (
              <AnimateOnScroll key={faq.id || index} delay={index * 0.05}>
                <div
                  className={cn(
                    "group rounded-2xl border transition-all",
                    openIndex === index
                      ? "border-blue-500/30 bg-white shadow-md dark:border-blue-500/20 dark:bg-zinc-900"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  )}
                >
                  <button
                    onClick={() => toggle(index)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                    aria-expanded={openIndex === index}
                  >
                    <span className="pr-4 text-sm font-semibold text-zinc-900 dark:text-white">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex-shrink-0 rounded-lg p-1",
                        openIndex === index
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-zinc-400"
                      )}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-zinc-100 px-6 pb-5 pt-4 dark:border-zinc-800">
                          <p className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </AnimateOnScroll>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
