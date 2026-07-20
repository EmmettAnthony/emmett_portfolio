"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const DEFAULT_QUERY_OPTIONS = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
} as const;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(DEFAULT_QUERY_OPTIONS));

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * A lightweight safety net that provides a local QueryClientProvider.
 * Use this to wrap page components that use React Query hooks when the
 * root-level QueryProvider is not guaranteed to be available (e.g., during
 * SSR edge cases or for pages rendered outside the normal layout hierarchy).
 *
 * React Query handles nested QueryClientProviders gracefully — the inner
 * provider takes precedence for its subtree.
 *
 * @example
 * ```tsx
 * export default function Page() {
 *   return (
 *     <QuerySafeWrapper>
 *       <PageContent />
 *     </QuerySafeWrapper>
 *   );
 * }
 * ```
 */
export function QuerySafeWrapper({
  children,
  queryClientOptions,
}: {
  children: React.ReactNode;
  /** Optional QueryClient configuration. Defaults to sensible defaults (like QueryProvider). */
  queryClientOptions?: ConstructorParameters<typeof QueryClient>[0];
}) {
  const [queryClient] = useState(
    () => new QueryClient(queryClientOptions ?? DEFAULT_QUERY_OPTIONS)
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
