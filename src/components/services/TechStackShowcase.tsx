"use client";

import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

const techCategories = [
  {
    name: "Frontend",
    items: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  },
  {
    name: "Backend",
    items: ["Node.js", "PHP", "Laravel"],
  },
  {
    name: "Database",
    items: ["PostgreSQL", "MySQL", "MongoDB"],
  },
  {
    name: "CMS",
    items: ["WordPress", "WooCommerce"],
  },
];

export function TechStackShowcase() {
  return (
    <section className="bg-zinc-50 py-20 dark:bg-surface md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Technologies I Use
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
              Modern tools and frameworks to build fast, reliable, and
              scalable digital solutions.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {techCategories.map((category, catIndex) => (
            <AnimateOnScroll
              key={category.name}
              delay={catIndex * 0.1}
            >
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {category.name}
                </h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {category.items.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-blue-500/30 hover:shadow dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-500/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
