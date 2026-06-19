import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, Calendar, Clock, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import blog from "@/data/blog.json";
import { formatDate, readTime } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blog.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blog.find((p) => p.slug === slug);

  if (!post) return {};

  return {
    title: `${post.title} | Emmett Anthony`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = blog.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const paragraphs = post.content.split("\n").filter(Boolean);

  return (
    <main className="pt-24">
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <header>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="rounded-lg bg-zinc-100 px-3 py-1 font-medium dark:bg-zinc-800">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {readTime(post.content)} min read
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            {post.title}
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {post.excerpt}
          </p>

          <div className="mt-6 flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
              EA
            </div>
            <span>{post.author}</span>
          </div>
        </header>

        {/* Featured image */}
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          {post.image && (
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          )}
        </div>

        {/* Content */}
        <div className="prose prose-zinc mt-12 max-w-none dark:prose-invert prose-headings:text-zinc-900 prose-p:text-zinc-600 prose-p:leading-relaxed prose-strong:text-zinc-900 dark:prose-headings:text-white dark:prose-p:text-zinc-400 dark:prose-strong:text-white">
          {paragraphs.map((para, i) => {
            if (para.startsWith("## ")) {
              return (
                <h2 key={i} className="mt-10 mb-4 text-2xl font-bold">
                  {para.replace("## ", "")}
                </h2>
              );
            }
            return (
              <p key={i} className="mb-4 text-lg leading-relaxed">
                {para}
              </p>
            );
          })}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <Tag className="h-4 w-4 text-zinc-500" />
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Share / Navigation */}
        <div className="mt-12 flex items-center justify-between border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            All Articles
          </Link>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://emmettanthony.dev/blog/${post.slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
          >
            Share on Twitter
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </article>
    </main>
  );
}
