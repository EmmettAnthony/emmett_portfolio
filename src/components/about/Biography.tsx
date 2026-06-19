"use client";

import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Award, Code2 } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import resume from "@/data/resume.json";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { GlassCard } from "@/components/ui/GlassCard";

interface Stat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  text?: string;
  suffix?: string;
}

const stats: Stat[] = [
  { icon: Briefcase, label: "Years Experience", value: 3, suffix: "+" },
  { icon: Code2, label: "Projects Completed", value: 25, suffix: "+" },
  { icon: GraduationCap, label: "Education", text: "B.S. CS" },
  { icon: Award, label: "Certifications", value: 3 },
];

export function Biography() {
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          About{" "}
          <span className="text-blue-700">{siteConfig.name.split(" ")[0]}</span>
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          {siteConfig.description}
        </p>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          I specialize in building high-performance web applications using modern frameworks
          like Next.js and React, with a strong focus on clean code architecture, responsive
          design, and exceptional user experiences. My approach combines technical expertise
          with a deep understanding of business needs to deliver solutions that drive results.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          When I&apos;m not coding, you&apos;ll find me contributing to open source projects,
          writing technical articles, or exploring new technologies to stay at the
          cutting edge of web development.
        </p>

        {/* Stats grid */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-4 text-center" intensity="medium"
            >
              <div className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600 backdrop-blur-sm dark:bg-blue-900/40 dark:text-blue-400">
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="mt-2 text-xl font-bold text-zinc-900 dark:text-white">
                {stat.value !== undefined ? (
                  <AnimatedCounter to={stat.value} suffix={stat.suffix ?? ""} />
                ) : (
                  stat.text
                )}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative"
      >
        {/* Code window */}
        <div className="sticky top-28 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <div className="ml-2 text-xs text-zinc-500">about.ts</div>
          </div>
          <div className="p-6 font-mono text-sm leading-relaxed">
            <div>
              <span className="text-purple-600 dark:text-purple-400">interface</span>{" "}
              <span className="text-amber-600 dark:text-amber-400">Developer</span> {"{"}
            </div>
            <div className="ml-4">
              name:{" "}
              <span className="text-green-600 dark:text-green-400">&ldquo;{siteConfig.name}&rdquo;</span>;
            </div>
            <div className="ml-4">
              title:{" "}
              <span className="text-green-600 dark:text-green-400">&ldquo;{siteConfig.title}&rdquo;</span>;
            </div>
            <div className="ml-4">
              experience:{" "}
              <span className="text-amber-600 dark:text-amber-400">{resume.experience.length}</span> positions;
            </div>
            <div className="ml-4">
              education:{" "}
              <span className="text-green-600 dark:text-green-400">&ldquo;{resume.education[0].degree}&rdquo;</span>;
            </div>
            <div className="ml-4">
              remote: <span className="text-blue-700 dark:text-blue-400">true</span>;
            </div>
            <div>{"}"}</div>
            <div className="mt-2 text-zinc-500">// Always learning, always building.</div>
            <div className="text-zinc-500">// Available for freelance & full-time.</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
