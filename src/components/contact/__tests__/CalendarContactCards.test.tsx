import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";

// Mock Calendly
const mockOpenCalendly = vi.fn();
vi.mock("@/components/ui/CalendlyEmbed", () => ({
  useCalendly: () => ({ openCalendly: mockOpenCalendly }),
}));

/** Render the CalendarContactCards component using a fresh import to pick up env vars */
async function renderCards() {
  // Reset modules so CalendarContactCards re-evaluates its module-level env consts
  vi.resetModules();
  const { CalendarContactCards } = await import("../CalendarContactCards");
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <CalendarContactCards />
    </NextIntlClientProvider>,
  );
}

describe("CalendarContactCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders nothing when no URLs are configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CALENDLY_URL", "");
    const { container } = await renderCards();
    expect(container.innerHTML).toBe("");
  });

  it("renders Google Calendar card when URL is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "https://calendar.google.com/meet");
    await renderCards();
    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
  });

  it("renders Calendly card when URL is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_CALENDLY_URL", "https://calendly.com/emmett");
    await renderCards();
    expect(screen.getByText("Calendly")).toBeInTheDocument();
  });

  it("renders both cards when both URLs are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "https://calendar.google.com/meet");
    vi.stubEnv("NEXT_PUBLIC_CALENDLY_URL", "https://calendly.com/emmett");
    await renderCards();
    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
    expect(screen.getByText("Calendly")).toBeInTheDocument();
  });

  it("renders Google Calendar link with correct href", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "https://calendar.google.com/meet");
    await renderCards();
    const googleLink = screen.getByText("Google Calendar").closest("a");
    expect(googleLink).toHaveAttribute("href", "https://calendar.google.com/meet");
  });

  it("opens Google Calendar in new tab", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "https://calendar.google.com/meet");
    await renderCards();
    const googleLink = screen.getByText("Google Calendar").closest("a");
    expect(googleLink).toHaveAttribute("target", "_blank");
    expect(googleLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders Calendly as a button", async () => {
    vi.stubEnv("NEXT_PUBLIC_CALENDLY_URL", "https://calendly.com/emmett");
    await renderCards();
    const calendlyButton = screen.getByText("Calendly").closest("button");
    expect(calendlyButton).toBeInTheDocument();
  });

  it("renders the title", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "https://calendar.google.com/meet");
    await renderCards();
    // The booking.title key in en.json is "Book a Call" when scoped to "booking" namespace
    expect(screen.getByText("Book a Call")).toBeInTheDocument();
  });
});
