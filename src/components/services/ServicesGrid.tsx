"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Terminal,
  ShoppingCart,
  RefreshCw,
  Lightbulb,
  Building2,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import services from "@/data/services.json";

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className="h-6 w-6" />,
  Terminal: <Terminal className="h-6 w-6" />,
  ShoppingCart: <ShoppingCart className="h-6 w-6" />,
  RefreshCw: <RefreshCw className="h-6 w-6" />,
  Lightbulb: <Lightbulb className="h-6 w-6" />,
  Building2: <Building2 className="h-6 w-6" />,
};

export function ServicesGrid() {
  return (
    <div>
      <SectionHeader
        title="Services"
        subtitle="Comprehensive development services to bring your ideas to life."
      />

      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            id={service.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-blue-500/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {iconMap[service.icon]}
            </div>
            <h3 className="mt-5 text-xl font-semibold text-zinc-900 dark:text-white">
              {service.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {service.description}
            </p>
            <ul className="mt-6 space-y-2">
              {service.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
