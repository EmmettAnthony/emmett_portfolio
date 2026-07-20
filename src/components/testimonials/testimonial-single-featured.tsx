"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";
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

export function TestimonialSingleFeatured({ testimonial }: { testimonial: Testimonial }) {
  if (!testimonial) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 px-8 py-12 text-white dark:from-zinc-950 dark:to-zinc-900 sm:px-16 sm:py-16">
      <Quote className="absolute right-8 top-8 h-20 w-20 text-white/5" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {testimonial.title && (
          <h3 className="mb-4 text-2xl font-bold">{testimonial.title}</h3>
        )}

        <p className="whitespace-pre-wrap text-lg leading-relaxed text-zinc-300">
          &ldquo;{testimonial.content}&rdquo;
        </p>

        <div className="mt-6 flex justify-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(
              "h-6 w-6",
              i < testimonial.rating ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground"
            )} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          {testimonial.photo ? (
            <Image src={testimonial.photo} alt={testimonial.name} width={48} height={48} className="rounded-full border-2 border-white/20 object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-semibold">
              {testimonial.name.charAt(0)}
            </div>
          )}
          <div className="text-left">
            <p className="font-semibold">{testimonial.name}</p>
            {(testimonial.jobTitle || testimonial.company) && (
              <p className="text-sm text-zinc-400">
                {[testimonial.jobTitle, testimonial.company].filter(Boolean).join(" at ")}
              </p>
            )}
          </div>
          {testimonial.companyLogo && (
            <Image src={testimonial.companyLogo} alt={testimonial.company || ""} width={32} height={32} className="ml-2 rounded object-contain brightness-0 invert" />
          )}
        </div>
      </div>
    </div>
  );
}
