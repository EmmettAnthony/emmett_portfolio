"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/data/site-config";
import { GithubIcon, LinkedInIcon, TwitterIcon } from "@/components/ui/SocialIcons";
import { GlassCard } from "@/components/ui/GlassCard";
import { HeroTypewriter } from "@/components/home/HeroTypewriter";

export function HeroSection() {

  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white dark:from-blue-950/20 dark:via-zinc-950 dark:to-zinc-950" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/4 rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">            {/* Left content - statically rendered for fast LCP */}
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Hello, I&apos;m
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl">
              {siteConfig.name.split(" ")[0]}{" "}
              <span className="text-blue-700 dark:text-blue-400">{siteConfig.name.split(" ")[1]}</span>
            </h1>
            {/* Typing effect - extracted into lightweight client component */}
            <HeroTypewriter />
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-700 dark:text-zinc-400">
              {siteConfig.description}
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:shadow-lg dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Hire Me
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-zinc-300 bg-transparent px-6 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                View Projects
              </Link>
            </div>

            {/* Social links */}
            <div className="mt-8 flex items-center gap-4">
              <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                Connect
              </span>
              <span className="h-px w-8 bg-zinc-300 dark:bg-zinc-700" />
              <div className="flex gap-3">
                {[
                  { icon: GithubIcon, href: siteConfig.links.github, label: "GitHub" },
                  { icon: LinkedInIcon, href: siteConfig.links.linkedin, label: "LinkedIn" },
                  { icon: TwitterIcon, href: siteConfig.links.twitter, label: "Twitter" },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 text-zinc-600 transition-all hover:border-zinc-900 hover:text-zinc-900 hover:shadow-md dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right - illustration */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto max-w-md">
              {/* Profile photo */}
              <div className="relative z-10 mx-auto -mb-20 h-40 w-40">
                <div className="relative h-full w-full">
                  <Image
                    src="/avatar.png"
                    alt={siteConfig.name}
                    className="h-full w-full rounded-2xl object-cover shadow-xl ring-4 ring-white/80 dark:ring-zinc-800/80"
                    width={160}
                    height={160}
                    priority
                  />
                  <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-emerald-500 p-2 shadow-lg ring-2 ring-white dark:ring-zinc-900">
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                </div>
              </div>
              {/* Code window decoration with glassmorphism */}
              <GlassCard className="relative overflow-hidden pt-20" intensity="heavy">
                {/* Window header */}
                <div className="flex items-center gap-2 border-b border-zinc-200/50 px-4 py-3 dark:border-zinc-700/50">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <div className="ml-2 text-xs text-zinc-500">portfolio.tsx</div>
                </div>
                {/* Code content */}
                <div className="p-6 text-left font-mono text-sm leading-relaxed">
                  <div>
                    <span className="text-purple-600 dark:text-purple-400">const</span>{" "}
                    <span className="text-blue-700 dark:text-blue-400">developer</span>{" "}
                    <span className="text-zinc-500">=</span> {"{"}
                  </div>
                  <div className="ml-4">
                    <span className="text-zinc-500">name</span>:{" "}
                    <span className="text-green-600 dark:text-green-400">&ldquo;Emmett Anthony&rdquo;</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-zinc-500">role</span>:{" "}
                    <span className="text-green-600 dark:text-green-400">&ldquo;Software Developer&rdquo;</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-zinc-500">experience</span>:{" "}
                    <span className="text-amber-600 dark:text-amber-400">3+ years</span>,
                  </div>
                  <div className="ml-4">
                    <span className="text-zinc-500">passion</span>: [
                  </div>
                  <div className="ml-8 text-zinc-500">
                    &ldquo;Clean Code&rdquo;,
                  </div>
                  <div className="ml-8 text-zinc-500">
                    &ldquo;User Experience&rdquo;,
                  </div>
                  <div className="ml-8 text-zinc-500">
                    &ldquo;Performance&rdquo;,
                  </div>
                  <div className="ml-4">],</div>
                  <div>
                    {"}"}
                  </div>
                  <div className="mt-2">
                    <span className="text-purple-600 dark:text-purple-400">export</span>{" "}
                    <span className="text-purple-600 dark:text-purple-400">default</span>{" "}
                    developer;
                  </div>
                </div>
              </GlassCard>
              {/* Floating badges with glassmorphism */}
              <GlassCard className="absolute -left-4 top-12 px-3 py-2" intensity="light">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Available for work
                  </span>
                </div>
              </GlassCard>
              <GlassCard className="absolute -right-4 bottom-12 px-3 py-2" intensity="light">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚀</span>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Ship fast
                  </span>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* Scroll indicator - CSS-only animation, no framer-motion needed */}
        <div className="mt-16 flex justify-center">
          <div className="animate-bounce flex flex-col items-center gap-2 text-zinc-500">
            <span className="text-xs font-medium uppercase tracking-widest">
              Scroll
            </span>
            <ArrowDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </section>
  );
}
