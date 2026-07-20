import { motion } from "framer-motion";

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-5 w-14 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="mt-4 h-8 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-1 h-3 w-36 rounded bg-zinc-100 dark:bg-zinc-800/50" />
    </div>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <div className={`grid gap-4 ${cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-4 h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800/50" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 flex-1 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonActivitySection() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-1.5">
                <div className="h-3 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCalendarWidgets() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Today's Events / Upcoming Appts */}
      <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1">
                  <div className="h-3.5 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Tasks / Activity */}
      <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-1">
                  <div className="h-3.5 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Stat cards */}
      <SkeletonRow cols={4} />

      {/* Calendar KPI cards */}
      <SkeletonRow cols={3} />

      {/* Newsletter cards */}
      <SkeletonRow cols={3} />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Campaigns table */}
      <SkeletonTable />

      {/* Calendar widgets */}
      <SkeletonCalendarWidgets />

      {/* Recent Activity */}
      <SkeletonActivitySection />
    </motion.div>
  );
}
