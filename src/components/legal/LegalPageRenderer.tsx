

export function LegalPageRenderer({ title, content, lastUpdated }: { title: string; content: string; lastUpdated?: string }) {
  return (
    <section className="pt-24">
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pb-16 dark:from-blue-950/10 dark:via-zinc-950 dark:to-zinc-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-[200px] w-[200px] -translate-y-1/4 translate-x-1/4 rounded-full bg-blue-500/10 blur-[120px] sm:h-[400px] sm:w-[400px]" />
          <div className="absolute bottom-0 left-0 h-[150px] w-[150px] -translate-x-1/4 translate-y-1/4 rounded-full bg-purple-500/10 blur-[100px] sm:h-[300px] sm:w-[300px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
              {title}
            </h1>
            {lastUpdated && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
                Last updated: {new Date(lastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className="prose prose-zinc mx-auto max-w-3xl px-4 py-12 dark:prose-invert sm:px-6 lg:px-8"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}
