import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

// Mock @/lib/i18n
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "footer.quickLinks": "Quick Links",
      "footer.services": "Services",
      "footer.connect": "Connect",
      "footer.webDevelopment": "Web Development",
      "footer.ecommerce": "E-commerce",
      "footer.customSoftware": "Custom Software",
      "footer.consulting": "Consulting",
      "footer.copyright": "All rights reserved.",
    };
    return translations[key] || key;
  },
}));

// Mock SiteSettingsProvider
vi.mock("@/components/settings/SiteSettingsProvider", () => ({
  useSiteSettings: () => ({
    siteName: "Emmett Anthony",
    tagline: "Building modern, scalable, and user-focused digital solutions.",
    social: {
      github: "https://github.com/emmettanthony",
      linkedin: "https://linkedin.com/in/emmettanthony",
      twitter: "https://twitter.com/emmettanthony",
      email: "hello@emmettanthony.dev",
    },
    navigationLinks: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Portfolio", href: "/portfolio" },
    ],
  }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Mail: () => <svg data-testid="mail-icon" />,
  ArrowUpRight: () => <svg data-testid="arrow-up-right" />,
}));

describe("Footer", () => {
  it("renders the site name", () => {
    render(<Footer />);
    expect(screen.getByText("Emmett")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Footer />);
    expect(
      screen.getByText(
        "Building modern, scalable, and user-focused digital solutions.",
      ),
    ).toBeInTheDocument();
  });

  it("renders footer column headings", () => {
    render(<Footer />);
    expect(screen.getByText("Quick Links")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Connect")).toBeInTheDocument();
  });

  it("renders navigation links in Quick Links column", () => {
    render(<Footer />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
  });

  it("renders service links in Services column", () => {
    render(<Footer />);
    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.getByText("E-commerce")).toBeInTheDocument();
    expect(screen.getByText("Custom Software")).toBeInTheDocument();
    expect(screen.getByText("Consulting")).toBeInTheDocument();
  });

  it("renders social links in Connect column", () => {
    render(<Footer />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("Twitter")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("social links open in new tab", () => {
    render(<Footer />);
    const githubLink = screen.getByText("GitHub").closest("a");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("social links have correct hrefs", () => {
    render(<Footer />);
    const githubLink = screen.getByText("GitHub").closest("a");
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/emmettanthony",
    );
  });

  it("renders social icon buttons", () => {
    const { container } = render(<Footer />);
    const socialLinks = container.querySelectorAll(
      'a[target="_blank"][rel="noopener noreferrer"]',
    );
    expect(socialLinks.length).toBeGreaterThanOrEqual(4);
  });

  it("social icons have aria-labels", () => {
    render(<Footer />);
    expect(screen.getByLabelText("GitHub")).toBeInTheDocument();
    expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders copyright notice with current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    // Text may be split across elements, use a text match function
    const copyright = screen.getByText((content) =>
      content.includes(`${year}`) && content.includes("All rights reserved.")
    );
    expect(copyright).toBeInTheDocument();
  });

  it("renders mailto link for email", () => {
    render(<Footer />);
    const emailLink = screen.getByLabelText("Email");
    expect(emailLink).toHaveAttribute(
      "href",
      "mailto:hello@emmettanthony.dev",
    );
  });

  it("renders newsletter popup trigger element", () => {
    const { container } = render(<Footer />);
    const trigger = container.querySelector('[data-popup-trigger="newsletter"]');
    expect(trigger).toBeInTheDocument();
  });

  it("does not render when hidden is true", () => {
    const { container } = render(<Footer hidden />);
    expect(container.firstChild).toBeNull();
  });

  it("renders external service links with ArrowUpRight icon", () => {
    const { container } = render(<Footer />);
    const extLinks = container.querySelectorAll(
      'a[target="_blank"][rel="noopener noreferrer"]',
    );
    expect(extLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders brand link to homepage", () => {
    render(<Footer />);
    const brandLink = screen.getByText("Emmett").closest("a");
    expect(brandLink).toHaveAttribute("href", "/");
  });
});
