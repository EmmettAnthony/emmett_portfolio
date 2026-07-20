import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillBar } from "./SkillBar";

// Mock framer-motion
vi.mock("framer-motion")
;

describe("SkillBar", () => {
  it("renders the skill name", () => {
    render(<SkillBar name="React" level={90} />);
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders the skill level percentage", () => {
    render(<SkillBar name="React" level={90} />);
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("renders the progress bar container", () => {
    const { container } = render(<SkillBar name="React" level={75} />);
    const progressBars = container.querySelectorAll(".rounded-full");
    expect(progressBars.length).toBeGreaterThanOrEqual(1);
  });

  it("applies gradient to the motion div", () => {
    const { container } = render(<SkillBar name="React" level={50} />);
    const innerDiv = container.querySelector(".bg-gradient-to-r");
    expect(innerDiv).toBeInTheDocument();
  });

  it("renders with different level values", () => {
    render(<SkillBar name="CSS" level={100} />);
    expect(screen.getByText("CSS")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("has dark mode text classes", () => {
    const { container } = render(<SkillBar name="JS" level={80} />);
    const nameSpan = screen.getByText("JS");
    expect(nameSpan.className).toContain("dark:text-zinc-300");
  });
});
