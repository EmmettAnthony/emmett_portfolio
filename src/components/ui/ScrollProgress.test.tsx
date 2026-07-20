import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ScrollProgress } from "./ScrollProgress";

// Mock framer-motion
vi.mock("framer-motion")
;

describe("ScrollProgress", () => {
  it("renders a div element", () => {
    const { container } = render(<ScrollProgress />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("has fixed positioning", () => {
    const { container } = render(<ScrollProgress />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("fixed");
  });

  it("is positioned at the top", () => {
    const { container } = render(<ScrollProgress />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("inset-x-0");
    expect(div.className).toContain("top-0");
  });

  it("has gradient background", () => {
    const { container } = render(<ScrollProgress />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("bg-gradient-to-r");
    expect(div.className).toContain("from-blue-600");
    expect(div.className).toContain("via-purple-600");
    expect(div.className).toContain("to-pink-600");
  });

  it("has a small height", () => {
    const { container } = render(<ScrollProgress />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("h-0.5");
  });

  it("has high z-index", () => {
    const { container } = render(<ScrollProgress />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("z-50");
  });

  it("has origin-left for scale animation", () => {
    const { container } = render(<ScrollProgress />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("origin-left");
  });
});
