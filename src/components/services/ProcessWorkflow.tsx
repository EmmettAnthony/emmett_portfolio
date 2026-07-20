"use client";

import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

const steps = [
  {
    number: "01",
    title: "Discovery",
    description:
      "We discuss your goals, requirements, and vision to define the project scope and objectives.",
  },
  {
    number: "02",
    title: "Planning",
    description:
      "I create a detailed project plan with timeline, milestones, and technical architecture.",
  },
  {
    number: "03",
    title: "Design",
    description:
      "Wireframes and visual mockups are crafted to ensure the design aligns with your brand.",
  },
  {
    number: "04",
    title: "Development",
    description:
      "Clean, efficient code is written following best practices and modern standards.",
  },
  {
    number: "05",
    title: "Testing",
    description:
      "Rigorous testing across devices and browsers ensures everything works flawlessly.",
  },
  {
    number: "06",
    title: "Launch",
    description:
      "Your project is deployed to production with careful monitoring and optimization.",
  },
  {
    number: "07",
    title: "Support",
    description:
      "Ongoing maintenance and support to keep your digital product running smoothly.",
  },
];

export function ProcessWorkflow() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              How I Work
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
              A proven process that delivers exceptional results from concept to
              launch and beyond.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="relative mt-16">
          <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 md:block" />

          <div className="space-y-12 md:space-y-16">
            {steps.map((step, index) => (
              <AnimateOnScroll
                key={step.number}
                delay={index * 0.1}
                direction={index % 2 === 0 ? "left" : "right"}
              >
                <div
                  className={cn(
                    "relative flex flex-col gap-4 md:flex-row md:items-start",
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  )}
                >
                  <div className="hidden md:block md:w-1/2" />
                  <div className="relative z-10 flex-shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                      <span className="bg-gradient-to-br from-brand-600 to-brand-700 bg-clip-text text-xl font-bold text-transparent">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900",
                      "md:w-1/2"
                    )}
                  >
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
