"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/ui/SocialIcons";
import Link from "next/link";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    image: string;
    category: string;
    tags: string[];
    githubUrl: string | null;
    liveUrl: string | null;
    year: number;
  };
  index: number;
  priority?: boolean;
}

export function ProjectCard({ project, index, priority = false }: ProjectCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Project image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={project.image}
          alt={project.title}
          fill
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-zinc-900/60 opacity-0 transition-opacity group-hover:opacity-100">
          {project.githubUrl && (
            <Link
              href={project.githubUrl}
              target="_blank"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-medium text-zinc-900 transition-transform hover:scale-105"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </Link>
          )}
          {project.liveUrl && (
            <Link
              href={project.liveUrl}
              target="_blank"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-medium text-zinc-900 transition-transform hover:scale-105"
            >
              Live Demo
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
            {project.category}
          </span>
          <span className="text-xs text-zinc-500">{project.year}</span>
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {project.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
          {project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
