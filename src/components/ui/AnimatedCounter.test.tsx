import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedCounter } from "./AnimatedCounter";

// Mock framer-motion's useInView to simulate scroll visibility
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useInView: vi.fn(() => true), // always in view for tests
  };
});

describe("AnimatedCounter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial value", () => {
    render(<AnimatedCounter to={100} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders with prefix", () => {
    render(<AnimatedCounter to={50} prefix="$" />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("renders with suffix", () => {
    render(<AnimatedCounter to={25} suffix="+" />);
    expect(screen.getByText("0+")).toBeInTheDocument();
  });

  it("renders with decimals", () => {
    render(<AnimatedCounter to={99.9} decimals={1} />);
    expect(screen.getByText("0.0")).toBeInTheDocument();
  });

  it("renders with custom from value", () => {
    render(<AnimatedCounter from={10} to={100} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders with prefix and suffix combined", () => {
    render(<AnimatedCounter to={100} prefix="$" suffix="K" />);
    expect(screen.getByText("$0K")).toBeInTheDocument();
  });

  it("renders as a motion span element", () => {
    const { container } = render(<AnimatedCounter to={42} />);
    const span = container.firstChild;
    expect(span).toBeInTheDocument();
    expect(span?.nodeName).toBe("SPAN");
  });
});
