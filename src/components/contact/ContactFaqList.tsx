"use client";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export function ContactFaqList({ faqs }: { faqs: FaqItem[] }) {
  return (
    <div className="space-y-4">
      {faqs.map((faq) => (
        <details
          key={faq.id}
          className="group rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">
            {faq.question}
            <svg
              className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-zinc-100 px-6 py-4 text-sm leading-relaxed text-muted-foreground dark:border-zinc-800">
            {faq.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
