"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function TicketLookupPage() {
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = ticketNumber.trim().toUpperCase();
    if (!val) return;
    router.push(`/support/ticket/${val}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Link href="/support" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>
      <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">Check Ticket Status</h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        Enter your ticket number to view its current status and history.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ticket Number</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="e.g. SUP-ABCDE"
              className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-blue-800"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!ticketNumber.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Search className="h-4 w-4" />
          Look Up Ticket
        </button>
      </form>

      <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
        Your ticket number was provided when you submitted your support request. It typically looks like <span className="font-mono font-medium">SUP-XXXXX</span>.
      </p>
    </div>
  );
}
