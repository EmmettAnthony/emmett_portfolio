import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationReplyPanel } from "./ConversationReplyPanel";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("framer-motion")
;

const baseProps = {
  conversationId: "conv-1",
  initialMessages: [
    { id: "m1", role: "user", content: "Hello!", createdAt: new Date().toISOString(), metadata: null },
    { id: "m2", role: "assistant", content: "Hi there!", createdAt: new Date().toISOString(), metadata: null },
  ],
  visitorName: "John Doe",
  visitorEmail: "john@example.com",
  language: "en",
  source: "website",
  messageCount: 2,
  status: "ACTIVE",
  createdAt: new Date().toISOString(),
  lead: null,
  feedback: [],
};

describe("ConversationReplyPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { id: "reply-1" },
        status: "WAITING",
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders messages", () => {
    render(<ConversationReplyPanel {...baseProps} />);
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    render(<ConversationReplyPanel {...baseProps} initialMessages={[]} />);
    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  it("renders visitor info in sidebar", () => {
    render(<ConversationReplyPanel {...baseProps} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Language: en")).toBeInTheDocument();
    expect(screen.getByText("Source: website")).toBeInTheDocument();
    expect(screen.getByText("Messages: 2")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<ConversationReplyPanel {...baseProps} status="ACTIVE" />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  const ACTIVE_PLACEHOLDER = "Send a message to the visitor... (Enter to send, Shift+Enter for new line)";
  const ESCALATED_PLACEHOLDER = "Write your reply to the visitor... (Enter to send, Shift+Enter for new line)";

  it("shows reply form for ACTIVE status", () => {
    render(<ConversationReplyPanel {...baseProps} />);
    expect(screen.getByPlaceholderText(ACTIVE_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText("Reply to Visitor")).toBeInTheDocument();
  });

  it("shows reply form for WAITING status", () => {
    render(<ConversationReplyPanel {...baseProps} status="WAITING" />);
    expect(screen.getByPlaceholderText(ACTIVE_PLACEHOLDER)).toBeInTheDocument();
  });

  it("shows escalated placeholder text", () => {
    render(<ConversationReplyPanel {...baseProps} status="ESCALATED" />);
    expect(screen.getByPlaceholderText(ESCALATED_PLACEHOLDER)).toBeInTheDocument();
  });

  it("disables reply for RESOLVED status", () => {
    render(<ConversationReplyPanel {...baseProps} status="RESOLVED" />);
    expect(screen.getByText(/This conversation is/)).toBeInTheDocument();
    expect(screen.getAllByText("RESOLVED")).toHaveLength(2);
    expect(screen.queryByPlaceholderText(ACTIVE_PLACEHOLDER)).not.toBeInTheDocument();
  });

  it("disables reply for ARCHIVED status", () => {
    render(<ConversationReplyPanel {...baseProps} status="ARCHIVED" />);
    expect(screen.getByText(/This conversation is/)).toBeInTheDocument();
  });

  it("renders lead info when provided", () => {
    const lead = {
      name: "John",
      email: "john@example.com",
      phone: "+1234567890",
      company: "Acme Inc",
      budget: "$10k-$50k",
      timeline: "1-3 months",
      status: "new",
    };
    render(<ConversationReplyPanel {...baseProps} lead={lead} />);
    expect(screen.getByText("Lead")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Acme Inc")).toBeInTheDocument();
    expect(screen.getByText("$10k-$50k")).toBeInTheDocument();
    expect(screen.getByText("1-3 months")).toBeInTheDocument();
  });

  it("renders feedback when provided", () => {
    const feedback = [
      { score: 5, comment: "Great!", category: "helpful" },
      { score: 4 },
    ];
    render(<ConversationReplyPanel {...baseProps} feedback={feedback} />);
    expect(screen.getAllByText(/Score:/)).toHaveLength(2);
    expect(screen.getByText("Great!")).toBeInTheDocument();
    expect(screen.getByText("helpful")).toBeInTheDocument();
  });

  it("sends a reply on button click", async () => {
    const user = userEvent.setup();
    render(<ConversationReplyPanel {...baseProps} />);

    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Thanks for reaching out!");
    await user.click(screen.getByText("Send"));

    expect(mockFetch).toHaveBeenCalledWith("/api/chat/conversations/conv-1/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Thanks for reaching out!", sendEmail: true }),
    });
  });

  it("sends reply on Enter key", async () => {
    const user = userEvent.setup();
    render(<ConversationReplyPanel {...baseProps} />);

    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.keyboard("{Enter}");

    expect(mockFetch).toHaveBeenCalled();
  });

  it("shows sending spinner while sending", async () => {
    const user = userEvent.setup();
    let resolvePromise: (v: unknown) => void;
    const fetchPromise = new Promise((resolve) => { resolvePromise = resolve; });
    mockFetch.mockReturnValue(fetchPromise);

    render(<ConversationReplyPanel {...baseProps} />);
    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.click(screen.getByText("Send"));

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({ message: { id: "r1" }, status: "WAITING" }),
      });
    });
  });

  it("shows 'Sent!' indicator after successful reply", async () => {
    const user = userEvent.setup();
    render(<ConversationReplyPanel {...baseProps} />);

    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.click(screen.getByText("Send"));

    expect(await screen.findByText("Sent!")).toBeInTheDocument();
  });

  it("does not send empty reply", async () => {
    const user = userEvent.setup();
    render(<ConversationReplyPanel {...baseProps} />);

    const sendBtn = screen.getByText("Send");
    expect(sendBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "   ");
    expect(sendBtn).toBeDisabled();
  });

  it("sends email checkbox default is checked", () => {
    render(<ConversationReplyPanel {...baseProps} />);
    expect(screen.getByLabelText("Notify visitor via email")).toBeChecked();
  });

  it("unchecking email checkbox works", async () => {
    const user = userEvent.setup();
    render(<ConversationReplyPanel {...baseProps} />);
    const checkbox = screen.getByLabelText("Notify visitor via email");
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("handles API error in handleSend", async () => {
    const user = userEvent.setup();
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const consoleMock = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Something went wrong" }),
    });

    render(<ConversationReplyPanel {...baseProps} />);
    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.click(screen.getByText("Send"));

    expect(consoleMock).toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith("Something went wrong");
    alertMock.mockRestore();
    consoleMock.mockRestore();
  });

  it("handles fetch rejection in handleSend", async () => {
    const user = userEvent.setup();
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<ConversationReplyPanel {...baseProps} />);
    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Network error");
    });
    alertMock.mockRestore();
  });

  it("updates status from API response", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { id: "r1" }, status: "RESOLVED" }),
    });

    render(<ConversationReplyPanel {...baseProps} />);
    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.click(screen.getByText("Send"));

    await waitFor(() => {
      expect(screen.getAllByText("RESOLVED").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows language fallback", () => {
    render(<ConversationReplyPanel {...baseProps} language={null as never} />);
    expect(screen.getByText("Language: N/A")).toBeInTheDocument();
  });

  it("does not send empty reply via handleSend", async () => {
    const user = userEvent.setup();
    render(<ConversationReplyPanel {...baseProps} />);
    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    textarea.focus();
    // Press Enter with empty reply — hits the guard and returns
    await user.keyboard("{Enter}");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles error response without error field", async () => {
    const user = userEvent.setup();
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<ConversationReplyPanel {...baseProps} />);
    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.click(screen.getByText("Send"));

    await waitFor(() => expect(alertMock).toHaveBeenCalledWith("Failed to send reply"));
    alertMock.mockRestore();
  });

  it("handles response without status field", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { id: "r1" } }), // no status field
    });

    render(<ConversationReplyPanel {...baseProps} />);
    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.click(screen.getByText("Send"));

    await waitFor(() => expect(screen.getByText("Sent!")).toBeInTheDocument());
  });

  it("resets sent indicator after 3 seconds", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: { id: "r1" }, status: "WAITING" }),
    });

    render(<ConversationReplyPanel {...baseProps} />);
    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.click(screen.getByText("Send"));

    await screen.findByText("Sent!");

    // Wait for the 3-second timeout to fire (wrapped in act to suppress state update warning)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3500));
    });

    expect(screen.queryByText("Sent!")).not.toBeInTheDocument();
  });

  it("handles non-Error rejection in handleSend", async () => {
    const user = userEvent.setup();
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    mockFetch.mockImplementation(() => Promise.reject("string error"));

    render(<ConversationReplyPanel {...baseProps} />);
    const textarea = screen.getByPlaceholderText(ACTIVE_PLACEHOLDER);
    await user.type(textarea, "Hello");
    await user.click(screen.getByText("Send"));

    await act(async () => {
      await waitFor(() => expect(alertMock).toHaveBeenCalledWith("Failed to send reply"));
    });
    alertMock.mockRestore();
  });

  it("renders unknown status with fallback color", () => {
    render(<ConversationReplyPanel {...baseProps} status="UNKNOWN_STATUS" />);
    const statusElements = screen.getAllByText("UNKNOWN_STATUS");
    expect(statusElements.length).toBeGreaterThanOrEqual(1);
  });
});
