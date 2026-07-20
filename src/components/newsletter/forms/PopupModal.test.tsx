// IntersectionObserver polyfill required for mobile scroll trigger test
if (typeof globalThis.IntersectionObserver === "undefined") {
  class MockIntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { PopupModal } from "./PopupModal";
import enMessages from "@/messages/en.json";

function IntlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

function renderWithIntl(ui: React.ReactElement) {
  return render(<IntlWrapper>{ui}</IntlWrapper>);
}

const originalInnerWidth = window.innerWidth;

// Mock fetch to return an enabled popup config
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock framer-motion — render children directly so we can assert on modal content
vi.mock("framer-motion")
;

// Mock NewsletterSignupForm — return null by default so tests don't need form integration
vi.mock("./NewsletterSignupForm", () => ({
  NewsletterSignupForm: function MockForm() {
    return null;
  },
}));

function enabledConfig() {
  return Promise.resolve({
    ok: true,
    json: async () => ({
      enabled: true,
      defaultEnabled: true,
      perPage: {},
    }),
  });
}

describe("PopupModal — sessionStorage guard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    mockFetch.mockImplementation(enabledConfig);

    // Desktop viewport so the exit-intent / timer path is taken
    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    Object.defineProperty(window, "innerWidth", {
      value: originalInnerWidth,
      configurable: true,
    });
  });

  /* ── Default (maxShownPerSession = 1) ──────────────────── */

  it("opens the popup after the timer delay on a fresh visit", async () => {
    renderWithIntl(<PopupModal delay={5000} />);

    // Let config fetch resolve and effects settle
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(screen.queryByText("Never Miss an Update")).not.toBeInTheDocument();

    // Fire the 5000ms timer
    await act(() => vi.advanceTimersByTimeAsync(5000));

    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
    expect(sessionStorage.getItem("newsletter-popup-show-count")).toBe("1");
  });

  it("does NOT open the popup when the session limit has been reached", async () => {
    // Simulate having already shown the popup once this session
    sessionStorage.setItem("newsletter-popup-show-count", "1");

    renderWithIntl(<PopupModal delay={5000} />);

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(screen.queryByText("Never Miss an Update")).not.toBeInTheDocument();
  });

  it("re-opens the popup after sessionStorage has been cleared", async () => {
    // --- First visit ---
    const { unmount } = renderWithIntl(<PopupModal delay={3000} />);
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(3500));

    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
    expect(sessionStorage.getItem("newsletter-popup-show-count")).toBe("1");

    // --- Clear + unmount ---
    sessionStorage.removeItem("newsletter-popup-show-count");
    unmount();

    vi.useRealTimers();
    await act(() => Promise.resolve());
    vi.useFakeTimers();
    mockFetch.mockImplementation(enabledConfig);

    // --- Second visit ---
    renderWithIntl(<PopupModal delay={3000} />);
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(3500));

    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
    expect(sessionStorage.getItem("newsletter-popup-show-count")).toBe("1");
  });

  /* ── maxShownPerSession = 3 ────────────────────────────── */

  it("shows up to maxShownPerSession=3 times then stops", async () => {
    // Show #1
    let result = renderWithIntl(<PopupModal delay={2000} maxShownPerSession={3} />);
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(2500));
    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
    expect(sessionStorage.getItem("newsletter-popup-show-count")).toBe("1");
    result.unmount();

    // Reset timer context
    vi.useRealTimers();
    await act(() => Promise.resolve());
    vi.useFakeTimers();

    // Show #2
    mockFetch.mockImplementation(enabledConfig);
    result = renderWithIntl(<PopupModal delay={2000} maxShownPerSession={3} />);
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(2500));
    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
    expect(sessionStorage.getItem("newsletter-popup-show-count")).toBe("2");
    result.unmount();

    // Reset timer context
    vi.useRealTimers();
    await act(() => Promise.resolve());
    vi.useFakeTimers();

    // Show #3
    mockFetch.mockImplementation(enabledConfig);
    result = renderWithIntl(<PopupModal delay={2000} maxShownPerSession={3} />);
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(2500));
    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
    expect(sessionStorage.getItem("newsletter-popup-show-count")).toBe("3");
    result.unmount();

    // Reset timer context
    vi.useRealTimers();
    await act(() => Promise.resolve());
    vi.useFakeTimers();

    // Show #4 — should NOT appear (limit reached)
    mockFetch.mockImplementation(enabledConfig);
    renderWithIntl(<PopupModal delay={2000} maxShownPerSession={3} />);
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(2500));
    expect(screen.queryByText("Never Miss an Update")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("newsletter-popup-show-count")).toBe("3");
  });

  /* ── Unlimited (maxShownPerSession = Infinity) ─────────── */

  it("shows every time when maxShownPerSession is Infinity", async () => {
    for (let i = 1; i <= 4; i++) {
      // Clean previous render completely
      cleanup();
      vi.useRealTimers();
      await act(() => Promise.resolve());
      vi.useFakeTimers();

      mockFetch.mockImplementation(enabledConfig);
      renderWithIntl(<PopupModal delay={1000} maxShownPerSession={Infinity} />);

      await act(() => vi.advanceTimersByTimeAsync(100));
      await act(() => vi.advanceTimersByTimeAsync(100));
      await act(() => vi.advanceTimersByTimeAsync(1500));

      expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
      expect(sessionStorage.getItem("newsletter-popup-show-count")).toBe(
        String(i),
      );
    }
  });

  /* ── Edge case: maxShownPerSession = 0 ─────────────────── */

  it("never shows when maxShownPerSession is 0", async () => {
    renderWithIntl(<PopupModal delay={2000} maxShownPerSession={0} />);

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(screen.queryByText("Never Miss an Update")).not.toBeInTheDocument();
    // Count should not be incremented
    expect(sessionStorage.getItem("newsletter-popup-show-count")).toBeNull();
  });

  /* ── localStorage dismissed ──────────────────────────── */

  it("does NOT open the popup when permanently dismissed", async () => {
    localStorage.setItem("newsletter-popup-dismissed", "true");

    renderWithIntl(<PopupModal delay={2000} />);

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(screen.queryByText("Never Miss an Update")).not.toBeInTheDocument();
  });

  /* ── Fetch error ─────────────────────────────────────── */

  it("falls back to enabled=true when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    renderWithIntl(<PopupModal delay={2000} />);

    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(2500));

    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
  });

  /* ── perPage config ──────────────────────────────────── */

  it("does NOT open when perPage config disables it for this page", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          enabled: true,
          defaultEnabled: false,
          perPage: {},
        }),
      })
    );

    renderWithIntl(<PopupModal delay={2000} />);

    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(2500));

    expect(screen.queryByText("Never Miss an Update")).not.toBeInTheDocument();
  });

  it("opens when config.enabled is false but perPage has this page as true", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          enabled: true,
          defaultEnabled: true,
          perPage: { "/": true },
        }),
      })
    );

    renderWithIntl(<PopupModal delay={2000} />);

    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(2500));

    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
  });

  /* ── Mobile (IntersectionObserver) ───────────────────── */

  it("shows popup on mobile when trigger element scrolls into view", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 600,
      configurable: true,
    });

    // Mock IntersectionObserver as a proper constructor that stores the callback
    let observerCallback: (entries: IntersectionObserverEntry[]) => void;
    const MockObserver = class {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        observerCallback = callback;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      root = null;
      rootMargin = "";
      thresholds = [];
      takeRecords = () => [];
    };
    vi.spyOn(globalThis, "IntersectionObserver").mockImplementation(
      MockObserver as unknown as typeof IntersectionObserver
    );

    // Add a trigger element to the DOM
    const trigger = document.createElement("div");
    trigger.setAttribute("data-popup-trigger", "newsletter");
    document.body.appendChild(trigger);

    renderWithIntl(<PopupModal delay={2000} />);

    // Let config load and resize settle
    await act(() => vi.advanceTimersByTimeAsync(100));

    // Simulate the trigger element becoming visible
    act(() => {
      observerCallback!([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();

    document.body.removeChild(trigger);
  });

  it("does nothing on mobile when no trigger element exists", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 600,
      configurable: true,
    });

    renderWithIntl(<PopupModal delay={2000} />);

    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(2500));

    expect(screen.queryByText("Never Miss an Update")).not.toBeInTheDocument();
  });

  /* ── Exit intent ─────────────────────────────────────── */

  it("shows popup on exit-intent when mouse leaves the window", async () => {
    renderWithIntl(<PopupModal delay={50000} />);

    // Let config fetch resolve
    await act(() => vi.advanceTimersByTimeAsync(500));

    // Simulate mouse leaving the window (clientY <= 0)
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseleave", { clientY: -1 }));
    });

    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
  });

  it("does NOT show popup when mouse leaves but clientY > 0", async () => {
    renderWithIntl(<PopupModal delay={50000} />);

    await act(() => vi.advanceTimersByTimeAsync(500));

    act(() => {
      document.dispatchEvent(new MouseEvent("mouseleave", { clientY: 100 }));
    });

    // Should still not show the popup
    expect(screen.queryByText("Never Miss an Update")).not.toBeInTheDocument();
  });

  /* ── perPageDelay config ───────────────────────────── */

  it("uses perPageDelay override when configured", async () => {
    // Mock config with perPageDelay for the current page
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          enabled: true,
          defaultEnabled: true,
          perPage: { "/": true },
          perPageDelay: { "/": 1000 },
        }),
      })
    );

    renderWithIntl(<PopupModal delay={50000} />);

    // Config resolves
    await act(() => vi.advanceTimersByTimeAsync(500));

    // The perPageDelay overrides delay prop (1000 < 50000)
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
  });

  /* ── Invalid sessionStorage ───────────────────────── */

  it("handles NaN in sessionStorage gracefully", async () => {
    sessionStorage.setItem("newsletter-popup-show-count", "invalid");

    renderWithIntl(<PopupModal delay={2000} />);

    await act(() => vi.advanceTimersByTimeAsync(100));
    await act(() => vi.advanceTimersByTimeAsync(2500));

    // Should still show since NaN is treated as 0
    expect(screen.getByText("Never Miss an Update")).toBeInTheDocument();
    expect(sessionStorage.getItem("newsletter-popup-show-count")).toBe("1");
  });
});
