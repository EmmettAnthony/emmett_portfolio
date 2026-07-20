"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyMessage?: string;
  loading?: boolean;
  loadingRows?: number;
}

export function DataTable({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data found",
  loading = false,
  loadingRows = 6,
}: DataTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500",
                      col.className
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: loadingRows }).map((_, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-6 py-4", col.className)}
                    >
                      <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500",
                      col.className
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <Inbox className="mb-2 h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
          <p className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500",
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400",
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] as ReactNode) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
