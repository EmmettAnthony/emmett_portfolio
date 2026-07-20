import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ChatFeedback } from "./ChatFeedback";
import { ChatContext } from "./ChatProvider";
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

vi.mock("framer-motion")
;

const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultContextValue = {
  conversationId: "test-conv-123",
  setFeedbackScore: vi.fn(),
};

function renderWithContext(ui: React.ReactElement, ctxValue = defaultContextValue) {
  return render(
    <IntlWrapper>
      <ChatContext.Provider value={ctxValue as never}>
        {ui}
      </ChatContext.Provider>
    </IntlWrapper>,
  );
}

describe("ChatFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the prompt and five score buttons", () => {
    renderWithIntl(<ChatFeedback conversationId="test-id" />);
    expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it("does not show comment input initially", () => {
    renderWithIntl(<ChatFeedback conversationId="test-id" />);
    expect(screen.queryByPlaceholderText("Any additional feedback?")).not.toBeInTheDocument();
  });

  it("shows comment input after clicking a score button", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ChatFeedback conversationId="test-id" />);
    await user.click(screen.getByText("4"));
    expect(screen.getByPlaceholderText("Any additional feedback?")).toBeInTheDocument();
  });

  it("submits feedback on Enter in the comment input", async () => {
    const user = userEvent.setup();
    const setFeedbackScore = vi.fn();
    renderWithIntl(
      <ChatFeedback conversationId="test-conv" setFeedbackScore={setFeedbackScore} />,
    );
    await user.click(screen.getByText("3"));
    const input = screen.getByPlaceholderText("Any additional feedback?");
    await user.type(input, "Great{Enter}");
    expect(mockFetch).toHaveBeenCalledWith("/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: "test-conv",
        score: 3,
        comment: "Great",
        category: "neutral",
      }),
    });
    expect(setFeedbackScore).toHaveBeenCalledWith(3);
  });

  it("shows thanks message after successful submission", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ChatFeedback conversationId="test-id" />);
    await user.click(screen.getByText("5"));
    const input = screen.getByPlaceholderText("Any additional feedback?");
    await user.type(input, "{Enter}");
    expect(screen.getByText("Thanks for your feedback!")).toBeInTheDocument();
  });

  it("sends category 'positive' for score >= 4", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ChatFeedback conversationId="test-id" />);
    await user.click(screen.getByText("5"));
    await user.type(screen.getByPlaceholderText("Any additional feedback?"), "{Enter}");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/chat/feedback",
      expect.objectContaining({
        body: expect.stringContaining('"category":"positive"'),
      }),
    );
  });

  it("sends category 'negative' for score <= 2", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ChatFeedback conversationId="test-id" />);
    await user.click(screen.getByText("1"));
    await user.type(screen.getByPlaceholderText("Any additional feedback?"), "{Enter}");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/chat/feedback",
      expect.objectContaining({
        body: expect.stringContaining('"category":"negative"'),
      }),
    );
  });

  it("uses context values when no props provided", () => {
    renderWithContext(<ChatFeedback />);
    expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("does not call fetch when conversationId is null", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ChatFeedback />);
    await user.click(screen.getByText("3"));
    await user.type(screen.getByPlaceholderText("Any additional feedback?"), "{Enter}");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("prioritizes props over context values", () => {
    const propSetFeedback = vi.fn();
    const ctxSetFeedback = vi.fn();
    renderWithContext(
      <ChatFeedback
        conversationId="prop-conv"
        setFeedbackScore={propSetFeedback}
      />,
      {
        conversationId: "ctx-conv",
        setFeedbackScore: ctxSetFeedback,
      },
    );
    expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
  });

  it("submits feedback with score selected and empty comment", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ChatFeedback conversationId="test-id" />);
    await user.click(screen.getByText("2"));
    await user.type(screen.getByPlaceholderText("Any additional feedback?"), "{Enter}");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/chat/feedback",
      expect.objectContaining({
        body: expect.stringContaining('"comment":null'),
      }),
    );
  });

  it("has correct button styling classes", () => {
    const { container } = renderWithIntl(<ChatFeedback conversationId="test-id" />);
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(5);
    buttons.forEach((btn) => {
      expect(btn.className).toContain("rounded-full");
    });
  });

  it("submits with category 'neutral' for score 3", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ChatFeedback conversationId="test-id" />);
    await user.click(screen.getByText("3"));
    await user.type(screen.getByPlaceholderText("Any additional feedback?"), "{Enter}");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/chat/feedback",
      expect.objectContaining({
        body: expect.stringContaining('"category":"neutral"'),
      }),
    );
  });

  it("handles fetch failure gracefully", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error("Network error"));
    renderWithIntl(<ChatFeedback conversationId="test-id" />);
    await user.click(screen.getByText("4"));
    await user.type(screen.getByPlaceholderText("Any additional feedback?"), "{Enter}");
    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to submit feedback");
    });
    consoleSpy.mockRestore();
  });
});
