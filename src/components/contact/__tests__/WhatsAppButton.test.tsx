import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppButton } from "../WhatsAppButton";

// Mock site settings
vi.mock("@/components/settings/SiteSettingsProvider", () => ({
  useSiteSettings: () => ({
    phone: "+231775623283",
    social: { whatsapp: "+231775623283" },
  }),
}));

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      whatsapp: "WhatsApp",
    };
    return translations[key] || key;
  },
}));

// Mock framer-motion
vi.mock("framer-motion")
;

describe("WhatsAppButton", () => {
  it("renders a link with WhatsApp icon", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });

  it("links to correct WhatsApp URL", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toContain("https://wa.me/+231775623283");
    expect(link.getAttribute("href")).toContain("Hi%20Emmett");
  });

  it("opens in new tab", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("has WhatsApp aria label", () => {
    render(<WhatsAppButton />);
    expect(screen.getByLabelText("WhatsApp")).toBeInTheDocument();
  });

  it("renders as a fixed positioned element", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link.className).toContain("fixed");
    expect(link.className).toContain("bottom-6");
    expect(link.className).toContain("left-6");
  });

  it("has green background styling", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link");
    expect(link.className).toContain("bg-green-500");
  });
});
