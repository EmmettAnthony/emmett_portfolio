"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";

export function ContactCTA() {
  const t = useTranslations();
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-8 py-16 text-center sm:px-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950"
        >
          {/* Overlay gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />

          {/* Background pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border-[20px] border-white" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full border-[20px] border-white" />
          </div>

          <div className="relative">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
              {t("home.cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-400">
              {t("home.cta.description")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 hover:shadow-xl"
              >
                {t("home.cta.primaryButton")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href={`mailto:hello@emmettanthony.dev`}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-zinc-600 bg-transparent px-6 text-sm font-semibold text-white transition-all hover:bg-zinc-800"
              >
                {t("home.cta.secondaryButton")}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
