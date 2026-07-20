import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CtaSection } from "./CtaSection";

// Mock framer-motion via AnimateOnScroll dependency
vi.mock("framer-motion")
;

// Mock AnimateOnScroll to render children directly
vi.mock("@/components/shared/AnimateOnScroll", () => ({
  AnimateOnScroll: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

const defaultProps = {
  title: "Get Started Today",
  description: "Start your project with us",
  primaryButton: {
    text: "Contact Me",
    href: "/contact",
  },
};

describe("CtaSection", () => {
  it("renders the title", () => {
    render(<CtaSection {...defaultProps} />);
    expect(screen.getByText("Get Started Today")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<CtaSection {...defaultProps} />);
    expect(screen.getByText("Start your project with us")).toBeInTheDocument();
  });

  it("renders the primary button with correct href", () => {
    render(<CtaSection {...defaultProps} />);
    const link = screen.getByText("Contact Me");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/contact");
  });

  it("renders secondary buttons when provided", () => {
    render(
      <CtaSection
        {...defaultProps}
        secondaryButtons={[
          { text: "Learn More", href: "/about" },
          { text: "See Portfolio", href: "/portfolio" },
        ]}
      />,
    );
    expect(screen.getByText("Learn More")).toBeInTheDocument();
    expect(screen.getByText("See Portfolio")).toBeInTheDocument();
  });

  it("renders the ArrowUpRight icon in primary button by default", () => {
    render(<CtaSection {...defaultProps} />);
    const link = screen.getByText("Contact Me");
    const svg = link.closest("a")?.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders with amber overlay", () => {
    const { container } = render(
      <CtaSection {...defaultProps} overlay="amber" />,
    );
    // The overlay div has pointer-events-none; the main card also has bg-gradient-to-br
    const overlay = container.querySelector(".pointer-events-none");
    expect(overlay?.getAttribute("class")).toContain("from-amber-500/10");
  });

  it("renders with no overlay when set to none", () => {
    const { container } = render(
      <CtaSection {...defaultProps} overlay="none" />,
    );
    // overlay "none" should not render a gradient overlay div
    // Note: decoration divs also have pointer-events-none, so check for gradient classes
    const allDivs = container.querySelectorAll("div");
    const gradientOverlays = Array.from(allDivs).filter(
      (d) =>
        d.getAttribute("class")?.includes("from-blue-500") ||
        d.getAttribute("class")?.includes("from-amber-500"),
    );
    expect(gradientOverlays.length).toBe(0);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
  });

  it("renders with custom icon", () => {
    // Pass mock icon component
    const MockIcon = () => <svg data-testid="mock-icon" />;
    render(<CtaSection {...defaultProps} icon={MockIcon as never} />);
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("renders decorative circles by default", () => {
    const { container } = render(<CtaSection {...defaultProps} />);
    const circles = container.querySelectorAll(".rounded-full");
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it("hides decoration when showDecoration is false", () => {
    const { container } = render(
      <CtaSection {...defaultProps} showDecoration={false} />,
    );
    // The decoration circles have border-[20px] class
    // Use getAttribute to avoid querySelector escaping issues
    const allDivs = container.querySelectorAll("div");
    const border20px = Array.from(allDivs).filter(
      (d) => d.getAttribute("class")?.includes("border-[20px]"),
    );
    expect(border20px.length).toBe(0);
  });

  it("renders button with onClick handler", () => {
    const onClick = vi.fn();
    render(
      <CtaSection
        {...defaultProps}
        primaryButton={{ text: "Click Me", onClick }}
      />,
    );
    const btn = screen.getByText("Click Me");
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(onClick).toHaveBeenCalled();
  });

  it("opens external link in new tab", () => {
    render(
      <CtaSection
        {...defaultProps}
        primaryButton={{ text: "External", href: "https://example.com", external: true }}
      />,
    );
    const link = screen.getByText("External").closest("a");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies custom className", () => {
    const { container } = render(
      <CtaSection {...defaultProps} className="custom-section" />,
    );
    const section = container.querySelector("section");
    expect(section?.className).toContain("custom-section");
  });

  it("has default padding classes", () => {
    const { container } = render(<CtaSection {...defaultProps} />);
    const section = container.querySelector("section");
    expect(section?.className).toContain("py-20");
    expect(section?.className).toContain("md:py-28");
  });
});
