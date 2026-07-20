import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillsOverview } from "./SkillsOverview";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "home.skills.title": "Skills & Expertise",
      "home.skills.subtitle": "Technologies and tools",
    };
    return translations[key] || key;
  },
}));

vi.mock("framer-motion")
;

vi.mock("@/components/shared/SectionHeader", () => ({
  SectionHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="section-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  ),
}));

vi.mock("@/components/ui/SkillBar", () => ({
  SkillBar: ({ name, level }: { name: string; level: number }) => (
    <div data-testid="skill-bar">
      <span>{name}</span>
      <span>{level}%</span>
    </div>
  ),
}));

describe("SkillsOverview", () => {
  it("renders section header with title", () => {
    render(<SkillsOverview />);
    expect(screen.getByText("Skills & Expertise")).toBeInTheDocument();
    expect(screen.getByText("Technologies and tools")).toBeInTheDocument();
  });

  it("renders all skill categories", () => {
    render(<SkillsOverview />);
    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Database")).toBeInTheDocument();
    expect(screen.getByText("CMS")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
  });

  it("renders correct number of skill categories (5)", () => {
    const { container } = render(<SkillsOverview />);
    const categories = container.querySelectorAll(".rounded-2xl");
    expect(categories.length).toBe(5);
  });

  it("renders skill bars for each skill", () => {
    render(<SkillsOverview />);
    const skillBars = screen.getAllByTestId("skill-bar");
    expect(skillBars.length).toBeGreaterThan(0);
  });

  it("renders specific skills by name", () => {
    render(<SkillsOverview />);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("renders skill levels as percentages", () => {
    render(<SkillsOverview />);
    // Multiple skills can have the same level (e.g., Next.js and React both at 95%)
    const ninetyFivePct = screen.getAllByText("95%");
    expect(ninetyFivePct.length).toBeGreaterThanOrEqual(2);
    // TypeScript and REST APIs are both at 90%
    const ninetyPct = screen.getAllByText("90%");
    expect(ninetyPct.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("88%")).toBeInTheDocument();
  });
});
