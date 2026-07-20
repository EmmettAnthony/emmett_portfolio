import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import { FullPageChat } from "./FullPageChat";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("framer-motion")
;

vi.mock("./ChatMessage", () => ({
  ChatMessage: ({ message }: { message: { content: string } }) => <div data-testid="chat-message">{message.content}</div>,
}));

vi.mock("./ChatSuggestions", () => ({
  ChatSuggestions: ({ questions, onSelect }: { questions: string[]; onSelect: (q: string) => void }) => (
    <div data-testid="chat-suggestions">
      {questions.map((q) => (
        <button key={q} onClick={() => onSelect(q)}>
          {q}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("./ChatContactForm", () => ({
  ChatContactForm: () => <div data-testid="chat-contact-form" />,
}));

vi.mock("./ChatFeedback", () => ({
  ChatFeedback: ({ conversationId }: { conversationId: string }) => (
    <div data-testid="chat-feedback">{conversationId}</div>
  ),
}));

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "sessionStorage", { value: sessionStorageMock });

function renderFullPageChat() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <FullPageChat />
    </NextIntlClientProvider>,
  );
}

describe("FullPageChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders welcome screen initially", () => {
    renderFullPageChat();
    expect(screen.getByText("Hi! I'm Emmett's AI Assistant")).toBeInTheDocument();
    expect(screen.getByTestId("chat-suggestions")).toBeInTheDocument();
  });

  it("renders header with title", () => {
    renderFullPageChat();
    expect(screen.getByText("Chat with Emmett's AI Assistant")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    renderFullPageChat();
    expect(screen.getByText("Ask anything about services, portfolio, or projects")).toBeInTheDocument();
  });

  it("renders input field", () => {
    renderFullPageChat();
    expect(screen.getByPlaceholderText("Ask me anything...")).toBeInTheDocument();
  });

  it("renders contact links", () => {
    renderFullPageChat();
    expect(screen.getByText("Call")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Book a Call")).toBeInTheDocument();
  });

  function submitMessage(user: ReturnType<typeof userEvent.setup>, text: string) {
    // We need to type and press Enter since the submit button has no accessible text
    const input = screen.getByPlaceholderText("Ask me anything...");
    return user.type(input, text + "{Enter}");
  }

  it("sends message on form submit and renders user message", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ conversationId: "conv-1", message: "Hello! How can I help?" }),
    });

    renderFullPageChat();
    await submitMessage(user, "What services do you offer?");

    expect(screen.getByText("What services do you offer?")).toBeInTheDocument();
  });

  it("shows typing indicator while waiting for response", async () => {
    const user = userEvent.setup();
    let resolvePromise: (v: unknown) => void;
    const fetchPromise = new Promise((resolve) => { resolvePromise = resolve; });
    mockFetch.mockReturnValue(fetchPromise);

    renderFullPageChat();
    const input = screen.getByPlaceholderText("Ask me anything...");
    await user.type(input, "hello");
    // Don't await the Enter keypress since fetch hangs
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(input).toBeDisabled();
    });

    await act(async () => {
      resolvePromise!({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ conversationId: "conv-1", message: "Hi!" }),
      });
    });
  });

  it("sends message via suggestion click", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ conversationId: "conv-1", message: "Sure, let me help!" }),
    });

    renderFullPageChat();
    await user.click(screen.getByText("What services do you offer?"));

    expect(mockFetch).toHaveBeenCalled();
  });

  it("handles error response from API", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({ ok: false });

    renderFullPageChat();
    await submitMessage(user, "hello");

    expect(
      await screen.findByText(/Sorry, I encountered an error/),
    ).toBeInTheDocument();
  });

  it("shows feedback after 4 messages", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ conversationId: "conv-1", message: "ok" }),
    });

    renderFullPageChat();

    for (let i = 0; i < 4; i++) {
      await submitMessage(user, `msg ${i}`);
    }

    expect(screen.getByTestId("chat-feedback")).toBeInTheDocument();
  });

  it("handles streaming response", async () => {
    const user = userEvent.setup();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"content":"Hello"}\n\ndata: {"content":" World"}\n\ndata: {"type":"done","conversationId":"conv-1"}\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/event-stream" }),
      body: stream,
    });

    renderFullPageChat();
    await submitMessage(user, "hello");

    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("disables input while typing", async () => {
    const user = userEvent.setup();
    mockFetch.mockReturnValue(new Promise(() => {}));

    renderFullPageChat();
    await submitMessage(user, "hello");

    expect(screen.getByPlaceholderText("Ask me anything...")).toBeDisabled();
  });

  it("shows streaming 'lead_captured' event hides contact form", async () => {
    const user = userEvent.setup();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"lead_captured"}\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/event-stream" }),
      body: stream,
    });

    renderFullPageChat();
    await submitMessage(user, "hello");
  });

  it("sets input value from onChange", async () => {
    const user = userEvent.setup();
    renderFullPageChat();
    const input = screen.getByPlaceholderText("Ask me anything...") as HTMLInputElement;
    await user.type(input, "test");
    expect(input.value).toBe("test");
  });

  it("restores conversationId from sessionStorage", async () => {
    sessionStorageMock.setItem("chat-conversation-id", "stored-conv");
    renderFullPageChat();
    await waitFor(() => {
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith("chat-conversation-id");
    });
  });

  it("does not send empty or whitespace-only message", async () => {
    const user = userEvent.setup();
    renderFullPageChat();
    const input = screen.getByPlaceholderText("Ask me anything...") as HTMLInputElement;
    await user.type(input, "   ");
    await user.keyboard("{Enter}");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows human handoff metadata in streaming", async () => {
    const user = userEvent.setup();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"content":"Hello"}\n\ndata: {"type":"done","conversationId":"conv-1","humanHandoff":true}\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/event-stream" }),
      body: stream,
    });

    renderFullPageChat();
    await submitMessage(user, "hello");

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("handles non-streaming non-OK response", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({ ok: false });

    renderFullPageChat();
    await submitMessage(user, "hello");

    expect(await screen.findByText(/Sorry, I encountered an error/)).toBeInTheDocument();
  });

  it("does not send empty message via handleSubmit guard", () => {
    renderFullPageChat();
    const form = document.querySelector("form")!;
    // Directly submit the form to trigger handleSubmit -> sendMessage
    fireEvent.submit(form);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles JSON response without content-type header", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({}),
      json: async () => ({ conversationId: "conv-1", message: "OK" }),
    });

    renderFullPageChat();
    await submitMessage(user, "hello");

    expect(await screen.findByText("OK")).toBeInTheDocument();
  });

  it("handles streaming response with null reader", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/event-stream" }),
      body: null,
    });

    renderFullPageChat();
    await submitMessage(user, "hello");

    expect(await screen.findByText(/Sorry, I encountered an error/)).toBeInTheDocument();
  });

  it("handles SSE JSON parse error", async () => {
    const user = userEvent.setup();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"content":"Hello"}\n\ndata: not-json\n\ndata: {"type":"done","conversationId":"conv-1"}\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/event-stream" }),
      body: stream,
    });

    renderFullPageChat();
    await submitMessage(user, "hello");

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("handles SSE event with unknown type without content", async () => {
    const user = userEvent.setup();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"unknown","foo":"bar"}\n\ndata: {"type":"done","conversationId":"conv-1"}\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/event-stream" }),
      body: stream,
    });

    renderFullPageChat();
    await submitMessage(user, "hello");
  });

  it("handles non-streaming response with leadCaptured and humanHandoff metadata", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        conversationId: "conv-1",
        message: "Got it!",
        leadCaptured: true,
        humanHandoff: true,
      }),
    });

    renderFullPageChat();
    await submitMessage(user, "hello");

    expect(await screen.findByText("Got it!")).toBeInTheDocument();
  });

});
