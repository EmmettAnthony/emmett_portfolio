export const BLOG_CATEGORIES = [
  "Development",
  "Design",
  "TypeScript",
  "React",
  "Next.js",
  "Accessibility",
  "Performance",
  "Tutorial",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
