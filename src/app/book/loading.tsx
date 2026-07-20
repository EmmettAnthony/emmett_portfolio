export default function BookLoading() {
  return (
    <main>
      <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-white pb-32 pt-24 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
          <div className="mx-auto mt-6 h-10 w-56 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          <div className="mx-auto mt-4 h-5 w-80 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="-mt-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-zinc-200 bg-white/80 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-10">
            <div className="mx-auto mb-7 h-5 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
      <div className="pb-24 pt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 h-6 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}