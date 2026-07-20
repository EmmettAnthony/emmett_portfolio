"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";
import { SectionHeader } from "@/components/shared/SectionHeader";
import projects from "@/data/projects.json";

export function FeaturedProjects() {
  const t = useTranslations();
  const featured = projects.filter((p) => p.featured);

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t("home.projects.title")}
          subtitle={t("home.projects.subtitle")}
        />

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Project image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  priority={index === 0}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-zinc-900/60 opacity-0 transition-opacity group-hover:opacity-100">
                  {project.githubUrl && (
                    <Link
                      href={project.githubUrl}
                      target="_blank"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-zinc-900 transition-transform hover:scale-105"
                    >
                      {t("common.github")}
                    </Link>
                  )}
                  {project.liveUrl && (
                    <Link
                      href={project.liveUrl}
                      target="_blank"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-zinc-900 transition-transform hover:scale-105"
                    >
                      {t("common.liveDemo")}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              <div className="p-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {project.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400 line-clamp-2">
                  {project.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link
            href="/portfolio"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-300 px-5 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            {t("home.projects.viewAll")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
