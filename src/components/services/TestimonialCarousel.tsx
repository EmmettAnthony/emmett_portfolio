"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  company: string | null;
  jobTitle: string | null;
  photo: string | null;
  projectName: string | null;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

export function TestimonialCarousel({
  testimonials,
}: TestimonialCarouselProps) {
  if (testimonials.length === 0) return null;

  const display = testimonials.slice(0, 6);

  return (
    <section className="bg-zinc-50 py-20 dark:bg-surface md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              What Clients Say
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
              Feedback from clients I&apos;ve had the pleasure of working with.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {display.map((testimonial, index) => (
            <AnimateOnScroll key={testimonial.id} delay={index * 0.08}>
              <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < testimonial.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-none text-zinc-300 dark:text-muted-foreground"
                      )}
                    />
                  ))}
                </div>

                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                  &ldquo;{testimonial.content}&rdquo;
                </blockquote>

                <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {testimonial.name}
                  </p>
                  {testimonial.company && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {testimonial.company}
                    </p>
                  )}
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
