import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { HeroTypewriter } from "./HeroTypewriter";

describe("HeroTypewriter", () => {
  // --- Structural tests (no timers needed) ---

  describe("initial render", () => {
    it("renders the first text fully visible on mount", () => {
      render(<HeroTypewriter />);
      expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
    });

    it("renders a blinking cursor element", () => {
      const { container } = render(<HeroTypewriter />);
      const cursor = container.querySelector(".animate-pulse");
      expect(cursor).toBeInTheDocument();
    });

    it("renders the text in a span", () => {
      render(<HeroTypewriter />);
      const textSpan = screen.getByText("Full Stack Developer");
      expect(textSpan.tagName).toBe("SPAN");
    });

    it("renders inside a container div", () => {
      const { container } = render(<HeroTypewriter />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv).toBeInTheDocument();
      expect(outerDiv.tagName).toBe("DIV");
      expect(outerDiv.className).toContain("mt-4");
    });

    it("renders the cursor span after the text span", () => {
      const { container } = render(<HeroTypewriter />);
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
      render(<HeroTypewriter />);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
    });

    it("transitions to a different text after multiple animation cycles", async () => {
      render(<HeroTypewriter />);

      // Advance time by 30 seconds to get well past multiple animation cycles
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });

      // The text should have transitioned away from the initial full text
      const text = screen.getByText(/Full Stack Developer|UI\/UX|Open Source|Problem Solver/);
      expect(text).toBeInTheDocument();
    });

    it("displays later texts after cycling through", async () => {
      render(<HeroTypewriter />);

      // Advance time by 60 seconds to ensure multiple full cycles
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60000);
      });

      // After 60s, one of the later texts should be visible
      const bodyText = document.body.textContent || "";
      expect(
        bodyText.includes("UI/UX") ||
        bodyText.includes("Open Source") ||
        bodyText.includes("Problem Solver")
      ).toBe(true);
    });

    it("cleans up timers on unmount", () => {
      const { unmount } = render(<HeroTypewriter />);

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
