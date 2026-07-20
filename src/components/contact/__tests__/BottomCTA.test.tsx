import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BottomCTA } from "../BottomCTA";

// Mock analytics
vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string, options?: Record<string, string>) => {
    const translations: Record<string, string> = {
      title: "Ready to Get Started?",
      description: "Let's work together on your next project.",
      hireMe: "Hire Me",
      scheduleCall: "Schedule a Call",
      downloadResume: "Download Resume",
      calendarTitle: "Consultation with Emmett Anthony",
      calendarDetails: "Discussing a potential project collaboration.",
    };
    return translations[key] || key;
  },
}));

// Mock CtaSection
vi.mock("@/components/shared/CtaSection", () => ({
  CtaSection: (props: Record<string, unknown>) => {
    const { title, description, primaryButton, secondaryButtons } = props as {
      title: string;
      description: string;
      primaryButton: { text: string; href: string };
      secondaryButtons: Array<{ text: string; onClick?: () => void; icon?: unknown }>;
    };
    return (
      <div data-testid="cta-section">
        <h2>{title}</h2>
        <p>{description}</p>
        <a href={primaryButton.href} data-testid="primary-btn">
          {primaryButton.text}
        </a>
        {secondaryButtons?.map((btn, i) => (
          <button key={i} onClick={btn.onClick} data-testid={`secondary-btn-${i}`}>
            {btn.text}
          </button>
        ))}
      </div>
    );
  },
}));

// Mock framer-motion for AnimateOnScroll
vi.mock("framer-motion")
;

// Fix for window.open and window.print
const originalOpen = window.open;
const originalPrint = window.print;

describe("BottomCTA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
    window.print = vi.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
    window.print = originalPrint;
  });

  it("renders CTA section with title and description", () => {
    render(<BottomCTA />);
    expect(screen.getByTestId("cta-section")).toBeInTheDocument();
    expect(screen.getByText("Ready to Get Started?")).toBeInTheDocument();
    expect(screen.getByText("Let's work together on your next project.")).toBeInTheDocument();
  });

  it("renders primary button with hire me link", () => {
    render(<BottomCTA />);
    const primaryBtn = screen.getByTestId("primary-btn");
    expect(primaryBtn).toHaveTextContent("Hire Me");
    expect(primaryBtn).toHaveAttribute("href", "/contact");
  });

  it("renders schedule call secondary button", () => {
    render(<BottomCTA />);
    expect(screen.getByText("Schedule a Call")).toBeInTheDocument();
  });

  it("renders download resume secondary button", () => {
    render(<BottomCTA />);
    expect(screen.getByText("Download Resume")).toBeInTheDocument();
  });

  it("opens Google Calendar when schedule call is clicked", async () => {
    const user = userEvent.setup();
    render(<BottomCTA />);
    const scheduleBtn = screen.getByText("Schedule a Call").closest("button")!;
    await user.click(scheduleBtn);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("calendar.google.com/calendar/render"),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("includes encoded calendar title and details in URL", async () => {
    const user = userEvent.setup();
    render(<BottomCTA />);
    const scheduleBtn = screen.getByText("Schedule a Call").closest("button")!;
    await user.click(scheduleBtn);
    const url = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(url).toContain(encodeURIComponent("Consultation with Emmett Anthony"));
    expect(url).toContain(encodeURIComponent("Discussing a potential project collaboration."));
  });

  it("calls window.print when download resume is clicked", async () => {
    const user = userEvent.setup();
    render(<BottomCTA />);
    const downloadBtn = screen.getByText("Download Resume").closest("button")!;
    await user.click(downloadBtn);
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
