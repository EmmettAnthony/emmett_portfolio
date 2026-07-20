"use client";

import { motion } from "framer-motion";
import {
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiNodedotjs,
  SiPostgresql,
  SiPrisma,
  SiDocker,
  SiGit,
  SiFigma,
  SiPython,
  SiGraphql,
  SiCloudflare,
  SiVercel,
  SiPostman,
  SiGithubactions,
} from "@icons-pack/react-simple-icons";
import { useTranslations } from "@/lib/i18n";
import { SectionHeader } from "@/components/shared/SectionHeader";

interface TechItem {
  icon: React.ComponentType<{ className?: string; title?: string }>;
  name: string;
}

export function TechStack(_props: { technologies?: Array<{ name: string; category: string; logo: string | null }> }) {
  const t = useTranslations();
  const categories: { title: string; items: TechItem[] }[] = [
    {
      title: t("about.techStack.categories.frontend"),
      items: [
        { icon: SiNextdotjs, name: "Next.js" },
        { icon: SiReact, name: "React" },
        { icon: SiTypescript, name: "TypeScript" },
        { icon: SiTailwindcss, name: "Tailwind CSS" },
      ],
    },
    {
      title: t("about.techStack.categories.backend"),
      items: [
        { icon: SiNodedotjs, name: "Node.js" },
        { icon: SiPython, name: "Python" },
        { icon: SiGraphql, name: "GraphQL" },
        { icon: SiPostgresql, name: "PostgreSQL" },
      ],
    },
    {
      title: t("about.techStack.categories.devops"),
      items: [
        { icon: SiDocker, name: "Docker" },
        { icon: SiGit, name: "Git" },
        { icon: SiCloudflare, name: "Cloudflare" },
        { icon: SiVercel, name: "Vercel" },
      ],
    },
    {
      title: t("about.techStack.categories.other"),
      items: [
        { icon: SiPrisma, name: "Prisma" },
        { icon: SiFigma, name: "Figma" },
        { icon: SiPostman, name: "Postman" },
        { icon: SiGithubactions, name: "CI/CD" },
      ],
    },
  ];
  return (
    <section className="py-20 md:py-28">
      <SectionHeader
        title={t("about.techStack.title")}
        subtitle={t("about.techStack.subtitle")}
      />

      <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((category, catIndex) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: catIndex * 0.1 }}
          >
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {category.title}
            </h3>
            <div className="space-y-3">
              {category.items.map((tech, itemIndex) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: catIndex * 0.1 + itemIndex * 0.05 }}
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all hover:border-zinc-300 hover:bg-white hover:shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/30 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50"
                >
                  <tech.icon className="h-5 w-5 text-zinc-600 transition-colors group-hover:text-blue-600 dark:text-zinc-400 dark:group-hover:text-blue-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {tech.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
