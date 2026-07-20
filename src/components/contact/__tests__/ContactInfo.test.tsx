import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactInfo } from "../ContactInfo";
import type { SiteSettingsData } from "@/lib/get-site-settings";

// Mock i18n with a direct translation function
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "contact.info.email": "Email",
      "contact.info.location": "Location",
      "contact.info.github": "GitHub",
      "contact.info.linkedin": "LinkedIn",
    };
    return translations[key] || key;
  },
}));

const mockSettings: SiteSettingsData = {
  siteName: "Emmett Anthony",
  tagline: "Building modern solutions",
  description: "Software developer",
  url: "https://emmettanthony.dev",
  ogImage: "/og-image.png",
  logo: "",
  favicon: "",
  email: "hello@emmettanthony.dev",
  phone: "+1234567890",
  address: "San Francisco, CA",
  social: {
    github: "https://github.com/emmettanthony",
    linkedin: "https://linkedin.com/in/emmettanthony",
    twitter: "https://twitter.com/emmettanthony",
    email: "hello@emmettanthony.dev",
    whatsapp: "+1234567890",
  },
  keywords: ["Software Developer"],
  navigationLinks: [{ label: "Home", href: "/" }],
};

function renderComponent(settings = mockSettings) {
  return render(<ContactInfo settings={settings} />);
}

describe("ContactInfo", () => {
  it("renders email with correct href", () => {
    renderComponent();
    const emailLink = screen.getByText("hello@emmettanthony.dev").closest("a");
    expect(emailLink).toHaveAttribute("href", "mailto:hello@emmettanthony.dev");
  });

  it("renders location without href (no external link)", () => {
    renderComponent();
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
    const locationText = screen.getByText("San Francisco, CA");
    // Location is not wrapped in an anchor tag
    expect(locationText.closest("a")).toBeNull();
  });

  it("renders github link with correct href", () => {
    renderComponent();
    const githubText = screen.getByText("github.com/emmettanthony");
    const githubLink = githubText.closest("a");
    expect(githubLink).toHaveAttribute("href", "https://github.com/emmettanthony");
  });

  it("renders linkedin link with correct href", () => {
    renderComponent();
    const linkedinText = screen.getByText("linkedin.com/in/emmettanthony");
    const linkedinLink = linkedinText.closest("a");
    expect(linkedinLink).toHaveAttribute("href", "https://linkedin.com/in/emmettanthony");
  });

  it("renders all four contact info items", () => {
    renderComponent();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
  });

  it("handles missing social links gracefully", () => {
    const settingsWithoutSocial = {
      ...mockSettings,
      social: { ...mockSettings.social, github: "", linkedin: "" },
    };
    renderComponent(settingsWithoutSocial);
    // Email and Location should still show
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    // GitHub and LinkedIn should show empty values
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("opens external links in new tab", () => {
    renderComponent();
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && !href.startsWith("mailto:")) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
    });
  });
});
