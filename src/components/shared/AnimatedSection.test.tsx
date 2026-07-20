import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedSection } from "./AnimatedSection";

// Mock framer-motion
vi.mock("framer-motion")
;

describe("AnimatedSection", () => {
  it("renders children", () => {
    render(<AnimatedSection>Content</AnimatedSection>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders as a section element", () => {
    const { container } = render(<AnimatedSection>Content</AnimatedSection>);
    expect(container.firstChild?.nodeName).toBe("SECTION");
  });

  it("applies default padding classes", () => {
    const { container } = render(<AnimatedSection>Content</AnimatedSection>);
    const section = container.firstChild as HTMLElement;
    expect(section.className).toContain("py-20");
    expect(section.className).toContain("md:py-28");
  });

  it("merges custom className", () => {
    const { container } = render(
      <AnimatedSection className="custom-class">
        Content
      </AnimatedSection>,
    );
    const section = container.firstChild as HTMLElement;
    expect(section.className).toContain("custom-class");
    expect(section.className).toContain("py-20");
  });

  it("accepts custom delay", () => {
    const { container } = render(
      <AnimatedSection delay={0.5}>Content</AnimatedSection>,
    );
    const section = container.firstChild as HTMLElement;
    expect(section).toBeInTheDocument();
  });

  it("renders complex children", () => {
    render(
      <AnimatedSection>
        <h2>Title</h2>
        <p>Description</p>
      </AnimatedSection>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});
