import Link from "next/link";
import { HelpCircle, Ticket, BookOpen, MessageCircle } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <HelpCircle className="h-4 w-4" />
          Support Center
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
          How can we help you?
        </h1>
        <p className="mx-auto mb-8 max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
          Search our knowledge base, browse FAQs, or submit a support ticket.
        </p>
        <Link href="/support/knowledge-base" className="relative mx-auto block max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <div className="w-full cursor-pointer rounded-2xl border border-zinc-300 bg-white py-4 pl-12 pr-4 text-left text-base text-zinc-400 shadow-sm transition-colors hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-blue-700">
            Search the knowledge base...
          </div>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/support/new" className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Ticket className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">Submit a Ticket</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Get personalized help from our support team.</p>
        </Link>

        <Link href="/support/faq" className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">FAQs</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Quick answers to common questions.</p>
        </Link>

        <Link href="/support/knowledge-base" className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">Knowledge Base</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Browse guides, tutorials, and documentation.</p>
        </Link>

        <Link href="/support/ticket" className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">Check Ticket Status</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Track the progress of your existing ticket.</p>
        </Link>
      </div>
    </div>
  );
}
