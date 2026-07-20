import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "./SectionHeader";

// Mock framer-motion
vi.mock("framer-motion")
;

describe("SectionHeader", () => {
  it("renders the title", () => {
    render(<SectionHeader title="My Title" />);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("renders title in an h2 element", () => {
    render(<SectionHeader title="Title" />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Title");
  });

  it("renders subtitle when provided", () => {
    render(<SectionHeader title="Title" subtitle="Subtitle text" />);
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<SectionHeader title="Title" />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("centers content by default", () => {
    const { container } = render(<SectionHeader title="Title" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("mx-auto");
    expect(div.className).toContain("text-center");
  });

  it("does not center when center is false", () => {
    const { container } = render(<SectionHeader title="Title" center={false} />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).not.toContain("text-center");
  });

  it("applies custom className", () => {
    const { container } = render(
      <SectionHeader title="Title" className="custom-class" />,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("custom-class");
  });

  it("has max-w-2xl constraint", () => {
    const { container } = render(<SectionHeader title="Title" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("max-w-2xl");
  });

  it("renders subtitle with muted text styling", () => {
    render(<SectionHeader title="Title" subtitle="Sub" />);
    const p = screen.getByText("Sub");
    expect(p.className).toContain("text-muted-foreground");
  });
});
