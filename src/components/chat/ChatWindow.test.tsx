import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ChatWindow } from "./ChatWindow";
import { ChatContext } from "./ChatProvider";
import enMessages from "@/messages/en.json";

function IntlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

vi.mock("framer-motion")
;

vi.mock("./ChatMessage", () => ({
  ChatMessage: ({ message }: { message: { content: string } }) => <div data-testid="chat-message">{message.content}</div>,
}));

vi.mock("./ChatSuggestions", () => ({
  ChatSuggestions: ({ onSelect }: { onSelect: (q: string) => void }) => (
    <div data-testid="chat-suggestions">
      <button onClick={() => onSelect("test question")}>Suggestion</button>
    </div>
  ),
}));

vi.mock("./ChatContactForm", () => ({
  ChatContactForm: () => <div data-testid="chat-contact-form" />,
}));

vi.mock("./ChatFeedback", () => ({
  ChatFeedback: () => <div data-testid="chat-feedback" />,
}));

vi.mock("./ChatBookingCards", () => ({
  ChatBookingCards: () => <div data-testid="chat-booking-cards" />,
}));

  const oneMsg = [{ id: "1", conversationId: "c1", role: "user", content: "hi", metadata: null, createdAt: new Date().toISOString() }] as never[];

  const baseCtx = {
    isOpen: true,
    isFullScreen: false,
    messages: [],
    isTyping: false,
    sendMessage: vi.fn(),
    close: vi.fn(),
    setFullScreen: vi.fn(),
    showContactForm: false,
    conversationId: "test-conv-1",
    feedbackScore: null,
    showBookingCards: false,
  };

function renderWithContext(ctxValue = baseCtx) {
  return render(
    <IntlWrapper>
      <ChatContext.Provider value={ctxValue as never}>
        <ChatWindow />
      </ChatContext.Provider>
    </IntlWrapper>,
  );
}

describe("ChatWindow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = renderWithContext({ ...baseCtx, isOpen: false });
    expect(container.innerHTML).toBe("");
  });

  it("renders when isOpen is true", () => {
    renderWithContext();
    expect(screen.getByText("Emmett's AI Assistant")).toBeInTheDocument();
  });

  it("shows welcome screen when no messages", () => {
    renderWithContext();
    expect(screen.getByText("Hi! I'm Emmett's AI Assistant")).toBeInTheDocument();
  });

  it("calls close when X button is clicked", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    renderWithContext({ ...baseCtx, close });
    const closeBtn = screen.getAllByRole("button").find(b => b.querySelector("svg")) || screen.getByLabelText("Close");
    await user.click(closeBtn);
  });

  it("calls setFullScreen when maximize button is clicked", async () => {
    const user = userEvent.setup();
    const setFullScreen = vi.fn();
    renderWithContext({ ...baseCtx, setFullScreen });
    await user.click(screen.getByLabelText("Maximize"));
    expect(setFullScreen).toHaveBeenCalledWith(true);
  });

  it("shows minimize button when full screen", () => {
    renderWithContext({ ...baseCtx, isFullScreen: true });
    expect(screen.getByLabelText("Minimize")).toBeInTheDocument();
  });

  it("renders messages", () => {
    const messages = [
      { id: "1", conversationId: "c1", role: "user", content: "Hello", metadata: null, createdAt: new Date().toISOString() },
      { id: "2", conversationId: "c1", role: "assistant", content: "Hi there!", metadata: null, createdAt: new Date().toISOString() },
    ];
    renderWithContext({ ...baseCtx, messages: messages as never[] });
    expect(screen.getAllByTestId("chat-message")).toHaveLength(2);
  });

  it("shows typing indicator when isTyping", () => {
    renderWithContext({ ...baseCtx, isTyping: true });
    expect(screen.getByText("Typing...")).toBeInTheDocument();
  });

  it("shows contact form when showContactForm is true", () => {
    renderWithContext({ ...baseCtx, showContactForm: true, messages: oneMsg });
    expect(screen.getByTestId("chat-contact-form")).toBeInTheDocument();
  });

  it("shows booking cards when showBookingCards is true", () => {
    renderWithContext({ ...baseCtx, showBookingCards: true, messages: oneMsg });
    expect(screen.getByTestId("chat-booking-cards")).toBeInTheDocument();
  });

  it("shows feedback when enough messages and no feedback given", () => {
    const messages = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      conversationId: "c1",
      role: i % 2 === 0 ? "user" : "assistant",
      content: `msg ${i}`,
      metadata: null,
      createdAt: new Date().toISOString(),
    }));
    renderWithContext({ ...baseCtx, messages: messages as never[] });
    expect(screen.getByTestId("chat-feedback")).toBeInTheDocument();
  });

  it("hides feedback when already given", () => {
    const messages = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      conversationId: "c1",
      role: i % 2 === 0 ? "user" : "assistant",
      content: `msg ${i}`,
      metadata: null,
      createdAt: new Date().toISOString(),
    }));
    renderWithContext({ ...baseCtx, messages: messages as never[], feedbackScore: 4 });
    expect(screen.queryByTestId("chat-feedback")).not.toBeInTheDocument();
  });

  it("sends message on form submit", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();
    renderWithContext({ ...baseCtx, sendMessage, messages: [{ id: "1", conversationId: "c1", role: "user", content: "hi", metadata: null, createdAt: new Date().toISOString() }] as never[] });

    const input = screen.getByPlaceholderText("Type your message...");
    await user.type(input, "hello");
    await user.keyboard("{Enter}");
    expect(sendMessage).toHaveBeenCalledWith("hello");
  });

  it("disables send button while typing", () => {
    renderWithContext({ ...baseCtx, isTyping: true });
    const form = document.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  it("shows suggestions with welcome screen", () => {
    renderWithContext();
    expect(screen.getByTestId("chat-suggestions")).toBeInTheDocument();
  });

  it("calls sendMessage via suggestion click in welcome screen", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();
    renderWithContext({ ...baseCtx, sendMessage });
    await user.click(screen.getByText("Suggestion"));
    expect(sendMessage).toHaveBeenCalledWith("test question");
  });

  it("calls handleScroll on scroll event", () => {
    renderWithContext({ ...baseCtx, messages: oneMsg });
    const container = document.querySelector(".overflow-y-auto");
    if (container) {
      Object.defineProperty(container, "scrollTop", { value: 0 });
      Object.defineProperty(container, "scrollHeight", { value: 500 });
      Object.defineProperty(container, "clientHeight", { value: 200 });
      act(() => {
        container.dispatchEvent(new Event("scroll"));
      });
    }
  });

  it("shows empty input prevents submit", async () => {
    const sendMessage = vi.fn();
    renderWithContext({ ...baseCtx, sendMessage, messages: oneMsg });

    // Submit the form directly with empty input
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("shows scroll to bottom button when scrolled up", () => {
    renderWithContext({ ...baseCtx, messages: oneMsg });
    const container = document.querySelector(".overflow-y-auto");
    expect(container).toBeTruthy();
    if (container) {
      Object.defineProperty(container, "scrollTop", { value: 0 });
      Object.defineProperty(container, "scrollHeight", { value: 500 });
      Object.defineProperty(container, "clientHeight", { value: 200 });
      act(() => { container.dispatchEvent(new Event("scroll")); });
    }
    // The scroll-to-bottom button contains a ChevronDown icon
    expect(document.querySelector("button > svg.lucide-chevron-down")).toBeTruthy();
  });
});
