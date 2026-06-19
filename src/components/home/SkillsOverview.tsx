"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SkillBar } from "@/components/ui/SkillBar";
import skills from "@/data/skills.json";
import { Code2, Server, Database, FileText, Wrench } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Code2: <Code2 className="h-5 w-5" />,
  Server: <Server className="h-5 w-5" />,
  Database: <Database className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Wrench: <Wrench className="h-5 w-5" />,
};

export function SkillsOverview() {
  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-900/50 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Skills & Expertise"
          subtitle="Technologies and tools I work with on a daily basis."
        />

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {iconMap[category.icon]}
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {category.category}
                </h3>
              </div>
              <div className="space-y-4">
                {category.skills.map((skill) => (
                  <SkillBar
                    key={skill.name}
                    name={skill.name}
                    level={skill.level}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
