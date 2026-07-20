"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileX2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations();
  return (
    <motion.div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <FileX2 className="h-16 w-16 text-muted-foreground dark:text-zinc-700" />
      <h1 className="text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        404
      </h1>
      <p className="text-xl font-medium text-zinc-700 dark:text-muted-foreground">
        {t("notFound.title")}
      </p>
      <p className="max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-500">
        {t("notFound.description")}
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {t("notFound.button")}
      </Link>
    </motion.div>
  );
}
