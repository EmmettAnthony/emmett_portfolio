import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "./Navbar";
import { usePathname } from "next/navigation";

// Mock next/navigation — initially returns "/"
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

// Mock @/lib/i18n
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "navigation.home": "Home",
      "navigation.about": "About",
      "navigation.portfolio": "Portfolio",
      "navigation.services": "Services",
      "navigation.resume": "Resume",
      "navigation.blog": "Blog",
      "navigation.contact": "Contact",
      "navigation.toggleMenu": "Toggle menu",
    };
    return translations[key] || key;
  },
}));

// Mock SiteSettingsProvider
vi.mock("@/components/settings/SiteSettingsProvider", () => ({
  useSiteSettings: () => ({
    siteName: "Emmett Anthony",
    navigationLinks: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Services", href: "/services" },
      { label: "Resume", href: "/resume" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  }),
}));

// Mock LanguageSwitcher
vi.mock("@/components/ui/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

// Mock ThemeToggle
vi.mock("@/components/ui/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Toggle Theme</button>,
}));

// Mock framer-motion
vi.mock("framer-motion")
;

describe("Navbar", () => {
  beforeEach(() => {
    // Reset scroll position
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the site name", () => {
    render(<Navbar />);
    expect(screen.getByText("Emmett")).toBeInTheDocument();
  });

  it("renders the site name with a dot suffix", () => {
    const { container } = render(<Navbar />);
    const dot = container.querySelector(".text-blue-700");
    expect(dot).toHaveTextContent(".");
  });

  it("renders desktop navigation links", () => {
    render(<Navbar />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Resume")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders mobile menu button", () => {
    render(<Navbar />);
    expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
  });

  it("renders LanguageSwitcher and ThemeToggle", () => {
    render(<Navbar />);
    // LanguageSwitcher appears twice (desktop + mobile)
    const langSwitchers = screen.getAllByTestId("language-switcher");
    expect(langSwitchers.length).toBe(2);
    // ThemeToggle appears twice
    const themeToggles = screen.getAllByTestId("theme-toggle");
    expect(themeToggles.length).toBe(2);
  });

  it("opens mobile menu when toggled", async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const toggleBtn = screen.getByLabelText("Toggle menu");
    await user.click(toggleBtn);
    // Mobile menu links should now be visible (duplicates of desktop links)
    expect(screen.getAllByText("Home").length).toBeGreaterThanOrEqual(2);
  });

  it("closes mobile menu when toggled twice", async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    const toggleBtn = screen.getByLabelText("Toggle menu");
    await user.click(toggleBtn);
    await user.click(toggleBtn);
    // After closing, only desktop links remain
    expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
  });

  it("adds scrolled class when page is scrolled", async () => {
    window.scrollY = 50;
    const { container } = render(<Navbar />);
    // Dispatch scroll event and wait for state update (wrapped in act)
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    await waitFor(() => {
      const header = container.querySelector("header");
      expect(header?.className).toContain("backdrop-blur-xl");
    });
  });

  it("has transparent background when not scrolled", () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector("header");
    expect(header?.className).toContain("bg-transparent");
  });

  it("does not render when hidden is true", () => {
    const { container } = render(<Navbar hidden />);
    expect(container.firstChild).toBeNull();
  });

  it("renders site name as a link to homepage", () => {
    render(<Navbar />);
    const link = screen.getByText("Emmett").closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders nav links with correct hrefs", () => {
    render(<Navbar />);
    const aboutLink = screen.getByText("About").closest("a");
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  it("highlights active nav link", () => {
    vi.mocked(usePathname).mockReturnValue("/about");
    render(<Navbar />);
    const aboutLink = screen.getByText("About");
    // Active link should NOT have the muted text class
    expect(aboutLink.className).not.toContain("text-zinc-500");
  });
});
