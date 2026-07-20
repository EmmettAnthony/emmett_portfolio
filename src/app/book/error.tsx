"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function BookError({
  _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center pt-24">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          We couldn&apos;t load the booking page. Please try again.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Try Again
          </button>
          <Link
            href="/book"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 px-6 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back to Booking
          </Link>
        </div>
      </div>
    </main>
  );
}