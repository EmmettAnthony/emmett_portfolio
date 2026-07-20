import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import { ChatWidgetWrapper } from "./ChatWidgetWrapper";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const mockOpen = vi.fn();
const mockSendMessage = vi.fn();
const mockSetTriggeredBy = vi.fn();

vi.mock("./ChatProvider", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useChat: () => ({
    open: mockOpen,
    sendMessage: mockSendMessage,
    visitorId: "test-visitor-123",
    setTriggeredBy: mockSetTriggeredBy,
  }),
}));

vi.mock("./ChatBubble", () => ({
  ChatBubble: () => <div data-testid="chat-bubble" />,
}));

vi.mock("./ChatWindow", () => ({
  ChatWindow: () => <div data-testid="chat-window" />,
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

function renderWidget() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ChatWidgetWrapper>children</ChatWidgetWrapper>
    </NextIntlClientProvider>,
  );
}

describe("ChatWidgetWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        enableWelcomeTrigger: false,
        welcomeDelayMs: 5000,
        enableExitIntent: false,
        exitIntentMessage: "Wait! Don't go!",
        welcomeMessage: "Hi! How can I help you?",
      }),
    });
    mockUsePathname.mockReturnValue("/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children and chat components on non-excluded paths", async () => {
    renderWidget();
    expect(screen.getByText("children")).toBeInTheDocument();
    const bubble = await screen.findByTestId("chat-bubble");
    expect(bubble).toBeInTheDocument();
    expect(screen.getByTestId("chat-window")).toBeInTheDocument();
  });

  it("fetches widget config on mount", async () => {
    renderWidget();
    await screen.findByTestId("chat-bubble");
    expect(mockFetch).toHaveBeenCalledWith("/api/chat/widget-config");
  });

  it("hides chat on dashboard path", async () => {
    mockUsePathname.mockReturnValue("/dashboard");
    renderWidget();
    await expect(screen.findByTestId("chat-bubble")).rejects.toThrow();
    expect(screen.queryByTestId("chat-window")).not.toBeInTheDocument();
  });

  it("hides chat on admin path", async () => {
    mockUsePathname.mockReturnValue("/admin");
    renderWidget();
    await expect(screen.findByTestId("chat-bubble")).rejects.toThrow();
    expect(screen.queryByTestId("chat-window")).not.toBeInTheDocument();
  });

  it("hides chat on chat path", async () => {
    mockUsePathname.mockReturnValue("/chat");
    renderWidget();
    await expect(screen.findByTestId("chat-bubble")).rejects.toThrow();
    expect(screen.queryByTestId("chat-window")).not.toBeInTheDocument();
  });

  it("handles config fetch failure gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    renderWidget();
    await screen.findByTestId("chat-bubble");
    expect(screen.getByTestId("chat-window")).toBeInTheDocument();
  });

  it("handles config fetch returning null", async () => {
    mockFetch.mockResolvedValue({ ok: false });
    renderWidget();
    await screen.findByTestId("chat-bubble");
    expect(screen.getByTestId("chat-window")).toBeInTheDocument();
  });

  it("triggers welcome message when enabled", async () => {
    const welcomeMsg = "Welcome visitor!";
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        enableWelcomeTrigger: true,
        welcomeDelayMs: 1,
        enableExitIntent: false,
        exitIntentMessage: "",
        welcomeMessage: welcomeMsg,
      }),
    });

    renderWidget();
    await screen.findByTestId("chat-bubble");

    await waitFor(() => expect(mockOpen).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledWith(welcomeMsg), { timeout: 3000 });
  });

  it("handles exit intent when enabled", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        enableWelcomeTrigger: false,
        welcomeDelayMs: 5000,
        enableExitIntent: true,
        exitIntentMessage: "Wait! Don't go!",
        welcomeMessage: "Hi!",
      }),
    });

    renderWidget();
    await screen.findByTestId("chat-bubble");
    // Flush React effects so the mouseleave listener is attached
    await act(async () => {});

    const event = new MouseEvent("mouseleave", { clientY: 0 });
    document.documentElement.dispatchEvent(event);
    expect(mockOpen).toHaveBeenCalled();
  });

  it("does not trigger welcome when disabled", async () => {
    renderWidget();
    await screen.findByTestId("chat-bubble");
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("handles test trigger from URL param", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        enableWelcomeTrigger: false,
        welcomeDelayMs: 5000,
        enableExitIntent: false,
        exitIntentMessage: "",
        welcomeMessage: "Test welcome!",
      }),
    });

    // Set URL search param
    window.history.replaceState({}, "", "/?chat-test=welcome");
    renderWidget();
    await screen.findByTestId("chat-bubble");

    await waitFor(() => expect(mockOpen).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledWith("Test welcome!"), { timeout: 3000 });
    window.history.replaceState({}, "", "/");
  });

  it("cancels welcome timer on unmount", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        enableWelcomeTrigger: true,
        welcomeDelayMs: 10000,
        enableExitIntent: false,
        exitIntentMessage: "",
        welcomeMessage: "Late welcome!",
      }),
    });

    const { unmount } = renderWidget();
    await screen.findByTestId("chat-bubble");

    // Unmount before the timer fires
    unmount();

    // open should not have been called
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("does not trigger exit intent when cursor is below threshold", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        enableWelcomeTrigger: false,
        welcomeDelayMs: 5000,
        enableExitIntent: true,
        exitIntentMessage: "Don't go!",
        welcomeMessage: "Hi!",
      }),
    });

    renderWidget();
    await screen.findByTestId("chat-bubble");
    await act(async () => {});

    const event = new MouseEvent("mouseleave", { clientY: 100 });
    document.documentElement.dispatchEvent(event);

    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("handles analytics fetch rejection in welcome trigger", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enabled: true,
          enableWelcomeTrigger: true,
          welcomeDelayMs: 1,
          enableExitIntent: false,
          exitIntentMessage: "",
          welcomeMessage: "Hello!",
        }),
      })
      .mockRejectedValueOnce(new Error("analytics error"));

    renderWidget();
    await screen.findByTestId("chat-bubble");

    await waitFor(() => expect(mockOpen).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("does not trigger exit intent when disabled", async () => {
    renderWidget();
    await screen.findByTestId("chat-bubble");
    await act(async () => {});

    const event = new MouseEvent("mouseleave", { clientY: 0 });
    document.documentElement.dispatchEvent(event);

    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("does not trigger exit intent when already shown", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        enableWelcomeTrigger: false,
        welcomeDelayMs: 5000,
        enableExitIntent: true,
        exitIntentMessage: "Don't go!",
        welcomeMessage: "Hi!",
      }),
    });

    localStorageMock.setItem("chat-exit-shown-test-visitor-123", "true");
    renderWidget();
    await screen.findByTestId("chat-bubble");
    await act(async () => {});

    const event = new MouseEvent("mouseleave", { clientY: 0 });
    document.documentElement.dispatchEvent(event);
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("handles exit intent analytics fetch rejection", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enabled: true,
          enableWelcomeTrigger: false,
          welcomeDelayMs: 5000,
          enableExitIntent: true,
          exitIntentMessage: "Wait!",
          welcomeMessage: "Hi!",
        }),
      })
      .mockRejectedValueOnce(new Error("analytics error"));

    renderWidget();
    await screen.findByTestId("chat-bubble");
    await act(async () => {});

    const event = new MouseEvent("mouseleave", { clientY: 0 });
    document.documentElement.dispatchEvent(event);
    expect(mockOpen).toHaveBeenCalled();
  });
});
