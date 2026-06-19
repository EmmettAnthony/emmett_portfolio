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
import Link from "next/link";
import { SectionHeader } from "@/components/shared/SectionHeader";
import services from "@/data/services.json";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className="h-6 w-6" />,
  Terminal: <Terminal className="h-6 w-6" />,
  ShoppingCart: <ShoppingCart className="h-6 w-6" />,
  RefreshCw: <RefreshCw className="h-6 w-6" />,
  Lightbulb: <Lightbulb className="h-6 w-6" />,
  Building2: <Building2 className="h-6 w-6" />,
};

export function ServicesOverview() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Services I Offer"
          subtitle="Professional services to help you build and grow your digital presence."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-blue-500/30 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                {iconMap[service.icon]}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {service.description}
              </p>
            </motion.div>
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
            href="/services"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            View All Services
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
