import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewsletterSkeleton } from "./NewsletterSkeleton";

// Skeleton renders a div with data-slot="skeleton" — just check count
describe("NewsletterSkeleton", () => {
  it("renders a section element", () => {
    const { container } = render(<NewsletterSkeleton />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
    expect(section?.className).toContain("bg-zinc-50");
  });

  it("renders skeleton placeholders", () => {
    const { container } = render(<NewsletterSkeleton />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    // 5 skeletons: icon, title, subtitle, input, button
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("has dark mode classes", () => {
    const { container } = render(<NewsletterSkeleton />);
    const section = container.querySelector("section");
    expect(section?.className).toContain("dark:bg-zinc-900/50");
  });

  it("contains a max-w-xl container", () => {
    const { container } = render(<NewsletterSkeleton />);
    const inner = container.querySelector(".max-w-xl");
    expect(inner).toBeInTheDocument();
  });

  it("renders skeleton icon placeholder", () => {
    const { container } = render(<NewsletterSkeleton />);
    const rounded2xl = container.querySelector(".rounded-2xl");
    expect(rounded2xl).toBeInTheDocument();
  });
});
