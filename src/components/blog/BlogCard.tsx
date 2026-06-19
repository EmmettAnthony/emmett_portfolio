"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatDate, readTime } from "@/lib/utils";

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    category: string;
    tags: string[];
    author: string;
    publishedAt: string;
  };
  index: number;
}

export function BlogCard({ post, index }: BlogCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readTime(post.content)} min read
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              {post.category}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-zinc-900 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-400">
            {post.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {post.excerpt || "Read this article..."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-400">
            Read More
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
