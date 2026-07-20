import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, renderHook, waitFor } from "@testing-library/react";
import { ChatProvider, useChat } from "./ChatProvider";
import React from "react";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

function TestConsumer() {
  const { isOpen, open, close, toggle, isFullScreen, setFullScreen, messages, clearMessages, visitorId, sendMessage, proactiveMessage, clearProactiveMessage } = useChat();
  return (
    <div>
      <span data-testid="isOpen">{String(isOpen)}</span>
      <span data-testid="isFullScreen">{String(isFullScreen)}</span>
      <span data-testid="visitorId">{visitorId}</span>
      <span data-testid="messages">{messages.length}</span>
      {proactiveMessage && <span data-testid="proactive">{proactiveMessage}</span>}
      <button data-testid="open" onClick={open}>Open</button>
      <button data-testid="close" onClick={close}>Close</button>
      <button data-testid="toggle" onClick={toggle}>Toggle</button>
      <button data-testid="setFullScreen" onClick={() => setFullScreen(true)}>FullScreen</button>
      <button data-testid="clear" onClick={clearMessages}>Clear</button>
      <button data-testid="clearProactive" onClick={clearProactiveMessage}>ClearProactive</button>
      <button data-testid="send" onClick={() => sendMessage("test message")}>Send</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <ChatProvider>
      <TestConsumer />
    </ChatProvider>,
  );
}

describe("ChatProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children", () => {
    render(
      <ChatProvider>
        <div data-testid="child">Hello</div>
      </ChatProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("starts closed", () => {
    renderProvider();
    expect(screen.getByTestId("isOpen")).toHaveTextContent("false");
  });

  it("opens when open() is called", () => {
    renderProvider();
    act(() => { screen.getByTestId("open").click(); });
    expect(screen.getByTestId("isOpen")).toHaveTextContent("true");
  });

  it("closes when close() is called", () => {
    renderProvider();
    act(() => { screen.getByTestId("open").click(); });
    act(() => { screen.getByTestId("close").click(); });
    expect(screen.getByTestId("isOpen")).toHaveTextContent("false");
  });

  it("toggles open/close", () => {
    renderProvider();
    act(() => { screen.getByTestId("toggle").click(); });
    expect(screen.getByTestId("isOpen")).toHaveTextContent("true");
    act(() => { screen.getByTestId("toggle").click(); });
    expect(screen.getByTestId("isOpen")).toHaveTextContent("false");
  });

  it("sets full screen", () => {
    renderProvider();
    act(() => { screen.getByTestId("setFullScreen").click(); });
    expect(screen.getByTestId("isFullScreen")).toHaveTextContent("true");
  });

  it("generates a visitorId", () => {
    renderProvider();
    expect(screen.getByTestId("visitorId").textContent).toBeTruthy();
  });

  it("generates visitorId with fallback when crypto.randomUUID is missing", () => {
    const origRandomUUID = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
    renderProvider();
    const vid = screen.getByTestId("visitorId").textContent;
    expect(vid).toMatch(/^visitor-/);
    Object.defineProperty(crypto, "randomUUID", { value: origRandomUUID, configurable: true });
  });

  it("clears messages and resets state", () => {
    renderProvider();
    act(() => { screen.getByTestId("clear").click(); });
    expect(screen.getByTestId("messages")).toHaveTextContent("0");
  });

  it("provides context to useChat hook", () => {
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it("throws error when useChat is used outside provider", () => {
    expect(() => renderHook(() => useChat())).toThrow("useChat must be used within ChatProvider");
  });

  it("calls clearProactiveMessage", () => {
    renderProvider();
    act(() => { screen.getByTestId("clearProactive").click(); });
  });

  describe("sendMessage", () => {
    it("calls sendMessage via context", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ conversationId: "conv-1", message: "Hello!" }),
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("Hi there");
      });
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/chat/completion",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("does not send empty messages", async () => {
      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("   ");
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("handles HTTP error response", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: "Bad request" }),
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });

      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[1].metadata?.isError).toBe(true);
      consoleSpy.mockRestore();
    });

    it("handles 429 rate limit error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValue({ ok: false, status: 429 });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });

      expect(result.current.messages.some(m => m.metadata?.isError)).toBe(true);
      consoleSpy.mockRestore();
    });

    it("handles fetch rejection", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error("Network failure"));

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });

      expect(result.current.messages.some(m => m.metadata?.isError)).toBe(true);
      consoleSpy.mockRestore();
    });

    it("handles streaming SSE response", async () => {
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

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });

      expect(result.current.conversationId).toBe("conv-1");
    });

    it("handles streaming lead_captured event", async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"lead_captured"}\n\ndata: {"type":"done","conversationId":"conv-1"}\n\n'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/event-stream" }),
        body: stream,
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.conversationId).toBe("conv-1");
    });

    it("handles streaming booking_suggested event", async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"booking_suggested"}\n\ndata: {"type":"done","conversationId":"conv-1"}\n\n'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/event-stream" }),
        body: stream,
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.conversationId).toBe("conv-1");
    });

    it("handles streaming humanHandoff event", async () => {
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

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.conversationId).toBe("conv-1");
    });

    it("handles non-streaming leadCaptured response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ conversationId: "conv-1", message: "ok", leadCaptured: true }),
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.messages.some(m => m.metadata?.leadCaptured)).toBe(true);
    });

    it("handles non-streaming bookingSuggested response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ conversationId: "conv-1", message: "ok", bookingSuggested: true }),
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(mockFetch).toHaveBeenCalled();
    });

    it("handles error response with text body", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockBadFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: async () => { throw new Error("not json"); },
        text: async () => "Internal server error",
      });
      // Override the global fetch
      const originalFetch = global.fetch;
      global.fetch = mockBadFetch;

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });

      expect(result.current.messages.some(m => m.metadata?.isError)).toBe(true);
      global.fetch = originalFetch;
      consoleSpy.mockRestore();
    });

    it("persists conversationId to localStorage after sendMessage", async () => {
      vi.useFakeTimers();
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ conversationId: "conv-persist", message: "ok" }),
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "chat-conversation-id",
        JSON.stringify("conv-persist"),
      );
      vi.useRealTimers();
    });

    it("loads visitorId from localStorage when stored", () => {
      localStorageMock.setItem("chat-visitor-id", JSON.stringify("stored-visitor"));
      renderProvider();
      expect(screen.getByTestId("visitorId")).toHaveTextContent("stored-visitor");
    });

    it("loads messages from server when conversationId is restored", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ messages: [{ id: "m1", content: "server msg", role: "assistant", metadata: null, createdAt: new Date().toISOString() }] }),
      });

      localStorageMock.setItem("chat-conversation-id", JSON.stringify("existing-conv"));

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });

      await waitFor(() => {
        expect(result.current.messages.length).toBeGreaterThan(0);
      });
    });

    it("covers loadFromStorage catch when localStorage.getItem throws", () => {
      localStorageMock.getItem.mockImplementationOnce(() => { throw new Error("storage error"); });
      renderProvider();
      expect(screen.getByTestId("visitorId").textContent).toBeTruthy();
    });

    it("covers sendMessage history mapping with pre-existing messages", async () => {
      const existingMsg = { id: "existing-1", role: "assistant", content: "hi", metadata: null, createdAt: new Date().toISOString(), conversationId: "" };
      localStorageMock.setItem("chat-messages", JSON.stringify([existingMsg]));

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ conversationId: "conv-1", message: "Hello!" }),
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    it("handles streaming response with null reader", async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"content":"Hello"}\n\n'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/event-stream" }),
        body: null,
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.messages.some(m => m.metadata?.isError)).toBe(true);
      consoleSpy.mockRestore();
    });

    it("handles streaming with invalid SSE JSON", async () => {
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

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.conversationId).toBe("conv-1");
    });

    it("handles streaming with bookingSuggested in done event", async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"done","conversationId":"conv-1","bookingSuggested":true}\n\n'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "text/event-stream" }),
        body: stream,
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.showBookingCards).toBe(true);
    });

    it("handles loadMessages server error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValue({ ok: false });
      localStorageMock.setItem("chat-conversation-id", JSON.stringify("existing-conv"));

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });

    it("handles error response with empty message field", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "" }),
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.messages.some(m => m.metadata?.isError)).toBe(true);
    });

    it("handles error where json throws and text is empty", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => { throw new Error("parse error"); },
        text: async () => "",
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.messages.some(m => m.metadata?.isError)).toBe(true);
    });

    it("handles JSON response without content-type header", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({}),
        json: async () => ({ conversationId: "conv-1", message: "Hello!" }),
      });

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    it("handles SSE event with unknown type and no content", async () => {
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

      const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });
      await act(async () => {
        await result.current.sendMessage("hello");
      });
      expect(result.current.conversationId).toBe("conv-1");
    });

  });
});
