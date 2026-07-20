import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";

// Mock @/lib/i18n
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "error.somethingWentWrong": "Something went wrong",
      "error.unexpectedError": "An unexpected error occurred",
      "error.tryAgain": "Try again",
    };
    return translations[`error.${key}`] || key;
  },
}));

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const Child = ({ throwError = false }: { throwError?: boolean }) => {
    if (throwError) {
      throw new Error("Test error");
    }
    return <div>Normal content</div>;
  };

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders error fallback when child throws", () => {
    render(
      <ErrorBoundary>
        <Child throwError />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <Child throwError />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("renders try again button that resets error state", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ErrorBoundary>
        <Child throwError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Try again")).toBeInTheDocument();

    // Re-render with non-throwing child FIRST, then click "Try again"
    // This prevents the ErrorBoundary from catching a re-throw before the child changes
    rerender(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>,
    );
    await user.click(screen.getByText("Try again"));
    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("displays the error message from thrown error", () => {
    render(
      <ErrorBoundary>
        <Child throwError />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("renders unexpected error message when no error message", () => {
    const ThrowsWithoutMessage = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <ThrowsWithoutMessage />
      </ErrorBoundary>,
    );
    // When error.message is empty, it falls back to "unexpectedError"
    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
  });

  it("renders error icon (AlertTriangle)", () => {
    const { container } = render(
      <ErrorBoundary>
        <Child throwError />
      </ErrorBoundary>,
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });
});
