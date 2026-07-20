// ──────────────────────────────────────────────────────────────────────────────
// Next.js Image Shared Test Mock
// ──────────────────────────────────────────────────────────────────────────────
// This mock replaces next/image in tests. It strips Next.js Image-only props
// (fill, priority, sizes, loader, etc.) before passing remaining props to a
// plain <img> element, preventing React "Received `true` for a non-boolean
// attribute `fill`" warnings.
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";

// Next.js Image-specific props that are NOT valid DOM attributes
const NEXT_IMAGE_PROPS = new Set([
  "fill",
  "priority",
  "sizes",
  "loader",
  "placeholder",
  "blurDataURL",
  "unoptimized",
  "onLoadingComplete",
  "loading",
  "quality",
]);

/**
 * Default mock for next/image.
 * Strips Next.js Image-only props and renders a plain <img> element.
 */
function NextImageMock(props: Record<string, unknown>) {
  const { alt, ...rest } = props;

  // Filter out Next.js Image-only props
  const imgProps: Record<string, unknown> = {};
  for (const key of Object.keys(rest)) {
    if (!NEXT_IMAGE_PROPS.has(key)) {
      imgProps[key] = rest[key];
    }
  }

  return (
    <img
      alt={(alt as string) || ""}
      data-testid="next-image"
      {...(imgProps as Record<string, unknown>)}
    />
  );
}

export default NextImageMock;
