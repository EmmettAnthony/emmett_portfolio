"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import testimonials from "@/data/testimonials.json";

export function Testimonials() {
  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-900/50 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="What Clients Say"
          subtitle="Trusted by businesses and startups to deliver exceptional results."
        />

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <blockquote className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                &ldquo;{testimonial.content}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                  {testimonial.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
