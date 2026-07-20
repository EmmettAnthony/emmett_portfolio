import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a button", async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  it("has accessible label indicating current mode", async () => {
    renderWithProvider();
    // Default is light (no OS preference), so label says "Switch to dark mode"
    await waitFor(() => {
      expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument();
    });
  });

  it("toggles aria-label when clicked", async () => {
    renderWithProvider();
    const btn = await screen.findByRole("button");
    act(() => {
      btn.click();
    });
    // After clicking, theme is dark, so label should say "Switch to light mode"
    await waitFor(() => {
      expect(screen.getByLabelText("Switch to light mode")).toBeInTheDocument();
    });
  });

  it("applies custom className", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle className="custom-class" />
      </ThemeProvider>,
    );
    await waitFor(() => {
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("custom-class");
    });
  });

  it("renders Sun and Moon icons", async () => {
    const { container } = renderWithProvider();
    await waitFor(() => {
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
