"use client";

import dynamic from "next/dynamic";

const ScrollManager = dynamic(
  () => import("@/components/ui/ScrollManager").then((m) => m.ScrollManager),
  { ssr: false }
);

/**
 * Thin client wrapper to allow `ssr: false` dynamic import of ScrollManager.
 * Keeps framer-motion out of the server bundle entirely.
 */
export function ScrollManagerWrapper() {
  return <ScrollManager />;
}
