import { Skeleton } from "@/components/ui/skeleton";

/**
 * A skeleton placeholder that matches the NewsletterSection layout.
 * Use while content is loading, then replace with the real NewsletterSection.
 *
 * @example
 * ```tsx
 * import { NewsletterSkeleton } from "@/components/shared/NewsletterSkeleton";
 *
 * {isLoading ? <NewsletterSkeleton /> : <NewsletterSection />}
 * ```
 */
export function NewsletterSkeleton() {
  return (
    <section className="bg-zinc-50 py-20 dark:bg-zinc-900/50 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          {/* Mail icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
            <Skeleton className="h-12 w-12 rounded-2xl" />
          </div>

          {/* Title */}
          <div className="mt-4 flex justify-center">
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>

          {/* Subtitle */}
          <div className="mt-3 flex justify-center">
            <Skeleton className="h-5 w-72 rounded-lg" />
          </div>

          {/* Email input + button row */}
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
