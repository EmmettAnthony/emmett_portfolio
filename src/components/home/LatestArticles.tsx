"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Calendar } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/shared/SectionHeader";
import blog from "@/data/blog.json";
import { formatDate } from "@/lib/utils";

export function LatestArticles() {
  const latest = blog.slice(0, 3);

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Latest Articles"
          subtitle="Thoughts on web development, best practices, and technology."
        />

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {latest.map((post, index) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-900 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-400">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-400">
                    Read More
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
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
            href="/blog"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-300 px-5 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            View All Articles
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
