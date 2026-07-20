import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactCTA } from "./ContactCTA";

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "home.cta.title": "Let's Work Together",
      "home.cta.description": "Have a project in mind? Let's discuss how I can help.",
      "home.cta.primaryButton": "Get in Touch",
      "home.cta.secondaryButton": "Book a Consultation",
    };
    return translations[key] || key;
  },
}));

vi.mock("framer-motion")
;

describe("ContactCTA", () => {
  it("renders section title", () => {
    render(<ContactCTA />);
    expect(screen.getByText("Let's Work Together")).toBeInTheDocument();
  });

  it("renders section description", () => {
    render(<ContactCTA />);
    expect(screen.getByText(/Have a project in mind/)).toBeInTheDocument();
  });

  it("renders primary CTA button linking to contact page", () => {
    render(<ContactCTA />);
    const primaryLink = screen.getByText("Get in Touch").closest("a");
    expect(primaryLink).toHaveAttribute("href", "/contact");
  });

  it("renders secondary CTA button as mailto link", () => {
    render(<ContactCTA />);
    const secondaryLink = screen.getByText("Book a Consultation").closest("a");
    expect(secondaryLink?.getAttribute("href")).toContain("mailto:");
  });
});
