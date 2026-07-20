"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  name: string;
  jobTitle: string | null;
  company: string | null;
  companyLogo: string | null;
  photo: string | null;
  title: string | null;
  content: string;
  rating: number;
}

export function TestimonialCarousel({ testimonials, autoPlayInterval = 5000 }: {
  testimonials: Testimonial[];
  autoPlayInterval?: number;
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((p) => (p + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPaused, next, autoPlayInterval, testimonials.length]);

  if (testimonials.length === 0) return null;

  const t = testimonials[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div
      className="relative mx-auto max-w-3xl px-4 py-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="text-center"
        >
          <Quote className="mx-auto mb-6 h-10 w-10 text-blue-500/20 dark:text-blue-400/20" />

          {t.title && (
            <h3 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">{t.title}</h3>
          )}
          <p className="mx-auto max-w-2xl whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
            &ldquo;{t.content}&rdquo;
          </p>

          <div className="mt-6 flex justify-center">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn(
                  "h-5 w-5",
                  i < t.rating ? "fill-amber-400 text-amber-400" : "fill-none text-zinc-300 dark:text-muted-foreground"
                )} />
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {t.photo ? (
              <Image src={t.photo} alt={t.name} width={48} height={48} className="rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600 ring-2 ring-zinc-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-zinc-700">
                {t.name.charAt(0)}
              </div>
            )}
            <div className="text-left">
              <p className="font-semibold text-zinc-900 dark:text-white">{t.name}</p>
              {(t.jobTitle || t.company) && (
                <p className="text-sm text-zinc-500">{[t.jobTitle, t.company].filter(Boolean).join(" at ")}</p>
              )}
            </div>
            {t.companyLogo && (
              <Image src={t.companyLogo} alt={t.company || ""} width={32} height={32} className="ml-2 rounded object-contain" />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {testimonials.length > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === current ? "w-6 bg-zinc-900 dark:bg-white" : "w-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500"
                )} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
