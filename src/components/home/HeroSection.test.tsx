import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "./HeroSection";

// Mock dependencies
vi.mock("@/lib/i18n", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const translations: Record<string, string> = {
      "home.hero.hello": "Hello, I'm Emmett Anthony",
      "home.hero.headlineFallback": "Building Modern Software",
      "home.hero.descriptionFallback": "Helping businesses create websites.",
      "home.hero.hireMe": "Hire Me",
      "home.hero.viewProjects": "View Projects",
      "home.hero.connect": "Connect",
      "home.hero.availableForWork": "Available for work",
      "home.hero.shipFast": "Ship fast",
      "home.hero.scroll": "Scroll",
      "home.hero.github": "GitHub",
      "home.hero.linkedin": "LinkedIn",
      "home.hero.twitter": "Twitter",
    };
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return translations[fullKey] || key;
  },
}));

vi.mock("@/components/settings/SiteSettingsProvider", () => ({
  useSiteSettings: () => ({
    social: {
      github: "https://github.com/emmettanthony",
      linkedin: "https://linkedin.com/in/emmettanthony",
      twitter: "https://twitter.com/emmettanthony",
    },
  }),
}));

vi.mock("@/components/ui/GlassCard", () => ({
  GlassCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="glass-card">{children}</div>
  ),
}));

vi.mock("@/components/home/HeroTypewriter", () => ({
  HeroTypewriter: ({ texts }: { texts?: string[] }) => (
    <div data-testid="hero-typewriter">{texts?.join(", ") || "default"}</div>
  ),
}));

// Mock next/image
vi.mock("next/image");

describe("HeroSection", () => {
  it("renders the greeting text", () => {
    render(<HeroSection />);
    expect(screen.getByText("Hello, I'm Emmett Anthony")).toBeInTheDocument();
  });

  it("renders the headline from props when provided", () => {
    render(<HeroSection headline="Custom Headline" />);
    expect(screen.getByText("Custom Headline")).toBeInTheDocument();
  });

  it("renders fallback headline when no prop provided", () => {
    render(<HeroSection />);
    expect(screen.getByText("Building Modern Software")).toBeInTheDocument();
  });

  it("renders the description from props when provided", () => {
    render(<HeroSection description="Custom description for testing." />);
    expect(screen.getByText("Custom description for testing.")).toBeInTheDocument();
  });

  it("renders fallback description when no prop provided", () => {
    render(<HeroSection />);
    expect(screen.getByText("Helping businesses create websites.")).toBeInTheDocument();
  });

  it("renders HeroTypewriter component", () => {
    render(<HeroSection />);
    expect(screen.getByTestId("hero-typewriter")).toBeInTheDocument();
  });

  it("passes heroTypewriterTexts to HeroTypewriter", () => {
    const texts = ["Full Stack Developer", "UI/UX Enthusiast"];
    render(<HeroSection heroTypewriterTexts={texts} />);
    expect(screen.getByTestId("hero-typewriter")).toHaveTextContent("Full Stack Developer, UI/UX Enthusiast");
  });

  it("renders primary CTA button with default text", () => {
    render(<HeroSection />);
    const primaryLink = screen.getByText("Hire Me").closest("a");
    expect(primaryLink).toHaveAttribute("href", "/contact");
  });

  it("renders primary CTA from props", () => {
    render(<HeroSection primaryCta="Let's Talk" primaryLink="/book" />);
    const primaryLink = screen.getByText("Let's Talk").closest("a");
    expect(primaryLink).toHaveAttribute("href", "/book");
  });

  it("renders secondary CTA button with default text", () => {
    render(<HeroSection />);
    const secondaryLink = screen.getByText("View Projects").closest("a");
    expect(secondaryLink).toHaveAttribute("href", "/portfolio");
  });

  it("renders secondary CTA from props", () => {
    render(<HeroSection secondaryCta="See Work" secondaryLink="/work" />);
    const secondaryLink = screen.getByText("See Work").closest("a");
    expect(secondaryLink).toHaveAttribute("href", "/work");
  });

  it("renders social links section", () => {
    render(<HeroSection />);
    expect(screen.getByText("Connect")).toBeInTheDocument();
  });

  it("renders social media links with correct hrefs", () => {
    render(<HeroSection />);
    const githubLink = screen.getByLabelText("GitHub");
    expect(githubLink).toHaveAttribute("href", "https://github.com/emmettanthony");
    const linkedinLink = screen.getByLabelText("LinkedIn");
    expect(linkedinLink).toHaveAttribute("href", "https://linkedin.com/in/emmettanthony");
  });

  it("opens social links in new tab", () => {
    render(<HeroSection />);
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href?.startsWith("http")) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
    });
  });

  it("renders scroll indicator", () => {
    render(<HeroSection />);
    expect(screen.getByText("Scroll")).toBeInTheDocument();
  });

  it("renders the profile image", () => {
    render(<HeroSection />);
    const images = screen.getAllByTestId("next-image");
    expect(images.length).toBeGreaterThan(0);
  });

  it("renders GlassCard components", () => {
    render(<HeroSection />);
    const glassCards = screen.getAllByTestId("glass-card");
    expect(glassCards.length).toBeGreaterThan(0);
  });

  it("renders 'Available for work' badge", () => {
    render(<HeroSection />);
    expect(screen.getByText("Available for work")).toBeInTheDocument();
  });
});
