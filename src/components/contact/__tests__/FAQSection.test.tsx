import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FAQSection } from "../FAQSection";

// Mock framer-motion
vi.mock("framer-motion")
;

// Mock AnimateOnScroll
vi.mock("@/components/shared/AnimateOnScroll", () => ({
  AnimateOnScroll: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("FAQSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders section title", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ faqs: [] }) });
    render(<FAQSection />);
    await waitFor(() => {
      expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
    });
  });

  it("renders section description", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ faqs: [] }) });
    render(<FAQSection />);
    await waitFor(() => {
      expect(screen.getByText(/Everything you need to know before reaching out/)).toBeInTheDocument();
    });
  });

  it("shows loading skeleton while fetching", () => {
    // Don't resolve the fetch promise so the component stays in loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<FAQSection />);
    const skeletonItems = document.querySelectorAll(".animate-pulse");
    expect(skeletonItems.length).toBe(3);
  });

  it("shows fallback FAQ questions when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    render(<FAQSection />);

    // The fallback FAQ questions are rendered in the accordion buttons (always visible)
    await waitFor(() => {
      expect(screen.getByText("How quickly do you respond?")).toBeInTheDocument();
    });
    expect(screen.getByText("What services do you provide?")).toBeInTheDocument();
    expect(screen.getByText("Do you work internationally?")).toBeInTheDocument();
  });

  it("shows fallback FAQs when API returns empty", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ faqs: [] }) });
    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText("How quickly do you respond?")).toBeInTheDocument();
    });
  });

  it("shows fetched FAQ questions when API returns data", async () => {
    const faqsFromApi = [
      { id: "1", question: "Custom question?", answer: "Custom answer." },
    ];
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ faqs: faqsFromApi }) });
    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText("Custom question?")).toBeInTheDocument();
    });
  });

  it("renders all 5 fallback FAQ items", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText("How quickly do you respond?")).toBeInTheDocument();
    });
    expect(screen.getByText("What services do you provide?")).toBeInTheDocument();
    expect(screen.getByText("Do you work internationally?")).toBeInTheDocument();
    expect(screen.getByText("How does the project process work?")).toBeInTheDocument();
    expect(screen.getByText("What payment methods do you accept?")).toBeInTheDocument();
  });

  it("toggles FAQ accordion open and closed on click", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValue(new Error("Network error"));
    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText("How quickly do you respond?")).toBeInTheDocument();
    });

    const firstFaqButton = screen.getByText("How quickly do you respond?").closest("button")!;

    // Initially not expanded
    expect(firstFaqButton).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    await user.click(firstFaqButton);
    expect(firstFaqButton).toHaveAttribute("aria-expanded", "true");

    // Click to collapse
    await user.click(firstFaqButton);
    expect(firstFaqButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes previously open FAQ when a new one is opened", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValue(new Error("Network error"));
    render(<FAQSection />);

    await waitFor(() => {
      expect(screen.getByText("How quickly do you respond?")).toBeInTheDocument();
    });

    const firstFaqButton = screen.getByText("How quickly do you respond?").closest("button")!;
    const secondFaqButton = screen.getByText("What services do you provide?").closest("button")!;

    // Open first FAQ
    await user.click(firstFaqButton);
    expect(firstFaqButton).toHaveAttribute("aria-expanded", "true");

    // Open second FAQ - first should close
    await user.click(secondFaqButton);
    expect(firstFaqButton).toHaveAttribute("aria-expanded", "false");
    expect(secondFaqButton).toHaveAttribute("aria-expanded", "true");
  });

  it("fetches FAQs from correct API endpoint", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ faqs: [] }) });
    render(<FAQSection />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/contact/faqs?published=true");
    });
  });
});
