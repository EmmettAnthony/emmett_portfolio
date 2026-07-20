"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4">
      <AlertTriangle className="h-14 w-14 text-amber-500 dark:text-amber-400" />
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {t("error.title")}
      </h1>
      <p className="max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-500">
        {error.message || t("error.title")}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t("error.tryAgain")}
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-xl border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t("error.goHome")}
        </Link>
      </div>
    </div>
  );
}
