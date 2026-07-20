import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockQueryClient = vi.fn();
const MockQueryClientProvider = vi.fn(({ children }: { children: React.ReactNode }) => <div data-testid="provider">{children}</div>);

vi.mock("@tanstack/react-query", () => ({
  QueryClient: mockQueryClient,
  QueryClientProvider: MockQueryClientProvider,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockQueryClient.mockImplementation(function (this: unknown) {
    return {};
  });
});

describe("QueryProvider", () => {
  it("renders children inside QueryClientProvider", async () => {
    const { QueryProvider } = await import("../providers");
    render(<QueryProvider><span data-testid="child">Hello</span></QueryProvider>);

    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    expect(screen.getByTestId("provider")).toBeInTheDocument();
  });

  it("creates QueryClient with default options", async () => {
    const { QueryProvider } = await import("../providers");
    render(<QueryProvider><span>Child</span></QueryProvider>);

    expect(mockQueryClient).toHaveBeenCalledWith({
      defaultOptions: {
        queries: {
          staleTime: 60000,
          refetchOnWindowFocus: false,
        },
      },
    });
  });

  it("wraps children exactly once", async () => {
    const { QueryProvider } = await import("../providers");
    render(
      <QueryProvider>
        <span>First</span>
        <span>Second</span>
      </QueryProvider>
    );

    expect(screen.getByTestId("provider")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});

describe("QuerySafeWrapper", () => {
  it("renders children inside QueryClientProvider", async () => {
    const { QuerySafeWrapper } = await import("../providers");
    render(<QuerySafeWrapper><span data-testid="child">Safe</span></QuerySafeWrapper>);

    expect(screen.getByTestId("child")).toHaveTextContent("Safe");
    expect(screen.getByTestId("provider")).toBeInTheDocument();
  });

  it("creates QueryClient with default options when no options provided", async () => {
    const { QuerySafeWrapper } = await import("../providers");
    render(<QuerySafeWrapper><span>Child</span></QuerySafeWrapper>);

    expect(mockQueryClient).toHaveBeenCalledWith({
      defaultOptions: {
        queries: {
          staleTime: 60000,
          refetchOnWindowFocus: false,
        },
      },
    });
  });

  it("accepts custom queryClientOptions", async () => {
    const { QuerySafeWrapper } = await import("../providers");
    const customOptions = {
      defaultOptions: {
        queries: { staleTime: 5000, retry: 2 },
      },
    };
    render(<QuerySafeWrapper queryClientOptions={customOptions}><span>Custom</span></QuerySafeWrapper>);

    expect(mockQueryClient).toHaveBeenCalledWith(customOptions);
  });

  it("wraps children even without options", async () => {
    const { QuerySafeWrapper } = await import("../providers");
    render(<QuerySafeWrapper><span>No options</span></QuerySafeWrapper>);

    expect(screen.getByText("No options")).toBeInTheDocument();
  });

  it("passes children of different types", async () => {
    const { QuerySafeWrapper } = await import("../providers");
    render(
      <QuerySafeWrapper>
        <div data-testid="div">Div</div>
        <span data-testid="span">Span</span>
      </QuerySafeWrapper>
    );

    expect(screen.getByTestId("div")).toHaveTextContent("Div");
    expect(screen.getByTestId("span")).toHaveTextContent("Span");
  });
});
