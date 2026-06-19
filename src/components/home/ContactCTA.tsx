"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Mail } from "lucide-react";
import Link from "next/link";

export function ContactCTA() {
  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-900/50 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 px-8 py-16 text-center sm:px-16"
        >
          {/* Background pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border-[20px] border-white" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full border-[20px] border-white" />
          </div>

          <div className="relative">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
              Let&apos;s Work Together
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-blue-100">
              Have a project in mind? Let&apos;s discuss how I can help bring your ideas to life.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-blue-700 transition-all hover:bg-blue-50 hover:shadow-lg"
              >
                Get in Touch
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href={`mailto:hello@emmettanthony.dev`}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-transparent px-6 text-sm font-medium text-white transition-all hover:bg-white/10"
              >
                Send an Email
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
