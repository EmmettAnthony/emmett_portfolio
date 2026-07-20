import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassCard } from "./GlassCard";

describe("GlassCard", () => {
  it("renders children", () => {
    render(<GlassCard>Hello World</GlassCard>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders with default medium intensity", () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("rounded-2xl");
    expect(div.className).toContain("backdrop-blur-xl");
    expect(div.className).toContain("bg-white/70");
  });

  it("applies light intensity class", () => {
    const { container } = render(<GlassCard intensity="light">Content</GlassCard>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("bg-white/40");
    expect(div.className).toContain("dark:bg-zinc-900/30");
  });

  it("applies heavy intensity class", () => {
    const { container } = render(<GlassCard intensity="heavy">Content</GlassCard>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("bg-white/85");
    expect(div.className).toContain("shadow-xl");
  });

  it("merges custom className", () => {
    const { container } = render(
      <GlassCard className="custom-class">Content</GlassCard>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("custom-class");
    expect(div.className).toContain("rounded-2xl");
  });

  it("renders complex children (nested elements)", () => {
    render(
      <GlassCard>
        <h2>Title</h2>
        <p>Description</p>
      </GlassCard>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});
