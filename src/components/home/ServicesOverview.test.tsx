import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServicesOverview } from "./ServicesOverview";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "home.services.title": "Services I Offer",
      "home.services.subtitle": "Professional services",
      "common.viewAll": "View All",
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

describe("ServicesOverview", () => {
  it("renders section header with title", () => {
    render(<ServicesOverview />);
    expect(screen.getByText("Services I Offer")).toBeInTheDocument();
    expect(screen.getByText("Professional services")).toBeInTheDocument();
  });

  it("renders all 6 services", () => {
    render(<ServicesOverview />);
    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.getByText("Software Development")).toBeInTheDocument();
    expect(screen.getByText("E-Commerce Development")).toBeInTheDocument();
    expect(screen.getByText("Website Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Technical Consulting")).toBeInTheDocument();
    expect(screen.getByText("Corporate Websites")).toBeInTheDocument();
  });

  it("renders service descriptions", () => {
    render(<ServicesOverview />);
    expect(screen.getByText(/Custom websites built with modern frameworks/)).toBeInTheDocument();
    expect(screen.getByText(/Online stores with secure payment processing/)).toBeInTheDocument();
  });

  it("renders view all link", () => {
    render(<ServicesOverview />);
    const viewAllLink = screen.getByText("View All").closest("a");
    expect(viewAllLink).toHaveAttribute("href", "/services");
  });

  it("renders correct number of service cards (6)", () => {
    const { container } = render(<ServicesOverview />);
    const cards = container.querySelectorAll(".rounded-2xl");
    expect(cards.length).toBe(6);
  });

  it("renders service icons", () => {
    const { container } = render(<ServicesOverview />);
    // Each service card has an icon container (inline-flex items with bg-blue-100)
    const iconContainers = container.querySelectorAll(".inline-flex");
    expect(iconContainers.length).toBeGreaterThanOrEqual(6);
  });
});
