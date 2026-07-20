import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimateOnScroll } from "./AnimateOnScroll";

// Mock framer-motion
vi.mock("framer-motion")
;

describe("AnimateOnScroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children", () => {
    render(<AnimateOnScroll>Hello</AnimateOnScroll>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders children in a div", () => {
    const { container } = render(<AnimateOnScroll>Content</AnimateOnScroll>);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("skips animation when user prefers reduced motion", async () => {
    const { useReducedMotion } = await import("framer-motion");
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const { container } = render(<AnimateOnScroll>Content</AnimateOnScroll>);
    // When reduced motion, it renders a plain div (not motion.div)
    const div = container.firstChild as HTMLElement;
    expect(div.tagName).toBe("DIV");
  });

  it("applies custom className", () => {
    render(
      <AnimateOnScroll className="custom-class">
        Content
      </AnimateOnScroll>,
    );
    const { container } = render(
      <AnimateOnScroll className="custom-class">
        Content
      </AnimateOnScroll>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("custom-class");
  });

  it("sets id attribute when provided", () => {
    const { container } = render(
      <AnimateOnScroll id="section-1">Content</AnimateOnScroll>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.getAttribute("id")).toBe("section-1");
  });

  it("does not set id when not provided", () => {
    const { container } = render(<AnimateOnScroll>Content</AnimateOnScroll>);
    const div = container.firstChild as HTMLElement;
    expect(div.getAttribute("id")).toBeNull();
  });

  it("accepts custom delay and duration props", () => {
    const { container } = render(
      <AnimateOnScroll delay={0.3} duration={0.8}>
        Content
      </AnimateOnScroll>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toBeInTheDocument();
  });

  it("accepts different direction props", () => {
    const { container } = render(
      <AnimateOnScroll direction="left">Content</AnimateOnScroll>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toBeInTheDocument();
  });
});
