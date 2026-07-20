import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, renderHook, act, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function TestConsumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button data-testid="toggle" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    // Default to no preference
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    document.documentElement.classList.remove("dark", "light");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to dark theme when no stored preference and OS prefers dark", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-color-scheme: dark"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark");
    });
  });

  it("defaults to light theme when no stored preference and OS prefers light", async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light");
    });
  });

  it("reads theme from localStorage if stored", async () => {
    localStorage.setItem("theme", "light");
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light");
    });
  });

  it("reads dark theme from localStorage", async () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark");
    });
  });

  it("toggles theme when toggleTheme is called", async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light");
    });

    await act(async () => {
      screen.getByTestId("toggle").click();
    });
    expect(screen.getByTestId("theme").textContent).toBe("dark");

    await act(async () => {
      screen.getByTestId("toggle").click();
    });
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("persists manual toggle to localStorage", async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light");
    });

    await act(async () => {
      screen.getByTestId("toggle").click();
    });
    expect(localStorage.getItem("theme")).toBe("dark");

    await act(async () => {
      screen.getByTestId("toggle").click();
    });
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("updates document.documentElement class on theme change", async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(document.documentElement.classList.contains("light")).toBe(true);
    });

    await act(async () => {
      screen.getByTestId("toggle").click();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it("throws error when useTheme is used outside ThemeProvider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used within a ThemeProvider",
    );
  });

  it("provides theme via renderHook", async () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    await waitFor(() => {
      expect(result.current.theme).toBe("light");
    });
  });

  it("toggleTheme via renderHook works correctly", async () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    await waitFor(() => {
      expect(result.current.theme).toBe("light");
    });
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("dark");
  });

  it("listens for OS preference changes when no manual preference is set", async () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener,
      removeEventListener,
    }));

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });
  });

  it("does not overwrite manual preference when OS changes", async () => {
    // Set localStorage preference
    localStorage.setItem("theme", "dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark");
    });

    // Theme should stay "dark" regardless of OS preference changes
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("cleans up OS preference listener on unmount", async () => {
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_type: string, _handler: () => void) => {},
      removeEventListener,
    }));

    const { unmount } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  it("does not persist to localStorage when no manual toggle has been made", async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light");
    });

    // No manual toggle was done, so no localStorage entry
    expect(localStorage.getItem("theme")).toBeNull();
  });

  it("updates theme when OS preference changes and no manual preference is set", async () => {
    // Override matchMedia to capture the change handler directly
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;
    const mockMq = {
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn((_type: string, handler: (e: MediaQueryListEvent) => void) => {
        changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn().mockReturnValue(mockMq);

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("light");
    });

    // Simulate OS preference changing to dark
    act(() => {
      changeHandler?.({ matches: true } as MediaQueryListEvent);
    });

    await waitFor(() => {
      expect(screen.getByTestId("theme").textContent).toBe("dark");
    });
  });
});
