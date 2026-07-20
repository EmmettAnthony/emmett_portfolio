import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import enMessages from "@/messages/en.json";

function IntlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

const mockOpenCalendly = vi.fn();

vi.mock("@/components/ui/CalendlyEmbed", () => ({
  useCalendly: () => ({ openCalendly: mockOpenCalendly }),
}));

const setShowBookingCards = vi.fn();

describe("ChatBookingCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function renderCards() {
    const { ChatContext } = await import("./ChatProvider");
    const { ChatBookingCards } = await import("./ChatBookingCards");
    return render(
      <IntlWrapper>
        <ChatContext.Provider value={{ setShowBookingCards } as never}>
          <ChatBookingCards />
        </ChatContext.Provider>
      </IntlWrapper>,
    );
  }

  it("renders nothing when no URLs are configured", async () => {
    // Explicitly ensure no env vars are set (user may have them in their environment)
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CALENDLY_URL", "");
    const { container } = await renderCards();
    expect(container.innerHTML).toBe("");
  });

  it("renders Google Calendar card when URL is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "https://calendar.google.com");
    await renderCards();
    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
  });

  it("renders Calendly card when URL is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_CALENDLY_URL", "https://calendly.com/emmett");
    await renderCards();
    expect(screen.getByText("Calendly")).toBeInTheDocument();
  });

  it("renders both cards when both URLs are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "https://calendar.google.com");
    vi.stubEnv("NEXT_PUBLIC_CALENDLY_URL", "https://calendly.com/emmett");
    await renderCards();
    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
    expect(screen.getByText("Calendly")).toBeInTheDocument();
  });

  it("calls openCalendly when Calendly card is clicked", async () => {
    const user = userEvent.setup();
    vi.stubEnv("NEXT_PUBLIC_CALENDLY_URL", "https://calendly.com/emmett");
    await renderCards();
    await user.click(screen.getByText("Calendly"));
    expect(mockOpenCalendly).toHaveBeenCalledOnce();
  });

  it("calls setShowBookingCards(false) when dismiss button is clicked", async () => {
    const user = userEvent.setup();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CALENDAR_URL", "https://calendar.google.com");
    await renderCards();
    await user.click(screen.getByLabelText("Dismiss"));
    expect(setShowBookingCards).toHaveBeenCalledWith(false);
  });
});
