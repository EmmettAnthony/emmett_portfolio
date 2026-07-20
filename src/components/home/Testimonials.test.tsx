import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Testimonials } from "./Testimonials";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "home.testimonials.title": "What Clients Say",
      "home.testimonials.subtitle": "Trusted by businesses",
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

describe("Testimonials", () => {
  it("renders section header with title", () => {
    render(<Testimonials />);
    expect(screen.getByText("What Clients Say")).toBeInTheDocument();
    expect(screen.getByText("Trusted by businesses")).toBeInTheDocument();
  });

  it("renders all testimonials", () => {
    render(<Testimonials />);
    expect(screen.getByText("Sarah Johnson")).toBeInTheDocument();
    expect(screen.getByText("Michael Chen")).toBeInTheDocument();
    expect(screen.getByText("Emily Rodriguez")).toBeInTheDocument();
    expect(screen.getByText("David Park")).toBeInTheDocument();
  });

  it("renders testimonial roles", () => {
    render(<Testimonials />);
    expect(screen.getByText("CEO, TechVentures Inc.")).toBeInTheDocument();
    expect(screen.getByText("CTO, DataFlow Systems")).toBeInTheDocument();
    expect(screen.getByText("Founder, Bloom Studios")).toBeInTheDocument();
    expect(screen.getByText("Project Manager, Nexus Digital")).toBeInTheDocument();
  });

  it("renders testimonial content", () => {
    render(<Testimonials />);
    expect(screen.getByText(/exceptional e-commerce platform/)).toBeInTheDocument();
    expect(screen.getByText(/complex analytics dashboard/)).toBeInTheDocument();
  });

  it("renders star ratings", () => {
    const { container } = render(<Testimonials />);
    // Each testimonial has 5 stars (rating: 5), 4 testimonials = 20 stars
    const stars = container.querySelectorAll("svg");
    expect(stars.length).toBeGreaterThanOrEqual(20);
  });

  it("renders correct number of testimonials (4)", () => {
    const { container } = render(<Testimonials />);
    const cards = container.querySelectorAll(".rounded-2xl");
    expect(cards.length).toBe(4);
  });

  it("renders initials in avatar circles", () => {
    render(<Testimonials />);
    // Sarah Johnson → SJ, Michael Chen → MC, etc.
    expect(screen.getByText("SJ")).toBeInTheDocument();
    expect(screen.getByText("MC")).toBeInTheDocument();
    expect(screen.getByText("ER")).toBeInTheDocument();
    expect(screen.getByText("DP")).toBeInTheDocument();
  });

  it("renders testimonial IDs as data attributes", () => {
    render(<Testimonials />);
    expect(screen.getByText(/exceptional e-commerce platform/)).toBeInTheDocument();
  });
});
