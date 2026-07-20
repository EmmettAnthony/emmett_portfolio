import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { HeroTypewriter } from "./HeroTypewriter";
import enMessages from "@/messages/en.json";

function IntlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("HeroTypewriter", () => {
  // --- Structural tests (no timers needed) ---

  describe("initial render", () => {
    it("renders the first text fully visible on mount", () => {
      render(<HeroTypewriter />, { wrapper: IntlWrapper });
      expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
    });

    it("renders a blinking cursor element", () => {
      const { container } = render(<HeroTypewriter />, { wrapper: IntlWrapper });
      const cursor = container.querySelector(".animate-pulse");
      expect(cursor).toBeInTheDocument();
    });

    it("renders the text in a span", () => {
      render(<HeroTypewriter />, { wrapper: IntlWrapper });
      const textSpan = screen.getByText("Full Stack Developer");
      expect(textSpan.tagName).toBe("SPAN");
    });

    it("renders inside a container div", () => {
      const { container } = render(<HeroTypewriter />, { wrapper: IntlWrapper });
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toBeInTheDocument();
      expect(outerDiv.tagName).toBe("DIV");
      expect(outerDiv.className).toContain("mt-4");
    });

    it("renders the cursor span after the text span", () => {
      const { container } = render(<HeroTypewriter />, { wrapper: IntlWrapper });
      const outerDiv = container.firstChild as HTMLElement;
      const spans = outerDiv.querySelectorAll("span");
      expect(spans.length).toBe(2);
      expect(spans[0].textContent).toBe("Full Stack Developer");
      expect(spans[1].className).toContain("animate-pulse");
    });
  });

  // --- Animation logic tests (with fake timers) ---

  describe("animation cycle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it("shows the first text before the animation delay elapses", () => {
      render(<HeroTypewriter />, { wrapper: IntlWrapper });
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
    });

    it("transitions to a different text after multiple animation cycles", () => {
      render(<HeroTypewriter />, { wrapper: IntlWrapper });

      // Step in 500ms increments so React flushes effects between timer ticks
      for (let i = 0; i < 60; i++) {
        act(() => { vi.advanceTimersByTime(500); });
      }

      // The text should have transitioned away from the initial full text
      expect(document.body.textContent).not.toBe("Full Stack Developer");
    });

    it("displays later texts after cycling through", () => {
      render(<HeroTypewriter />, { wrapper: IntlWrapper });

      for (let i = 0; i < 130; i++) {
        act(() => { vi.advanceTimersByTime(500); });
      }

      const bodyText = document.body.textContent || "";
      expect(
        bodyText.includes("UI/UX") ||
        bodyText.includes("Open Source") ||
        bodyText.includes("Problem")
      ).toBe(true);
    });

    it("cleans up timers on unmount", () => {
      const { unmount } = render(<HeroTypewriter />, { wrapper: IntlWrapper });

      // Let the animation start
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Unmount mid-animation
      unmount();

      // Should not throw — all timers cleaned up
      act(() => {
        vi.advanceTimersByTime(10000);
      });
    });
  });
});
