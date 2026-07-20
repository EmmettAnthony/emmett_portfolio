import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ChatBubble } from "./ChatBubble";
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

function renderWithContext(ui: React.ReactElement, ctxValue: Record<string, unknown>) {
  return render(
    <IntlWrapper>
      <ChatContext.Provider value={ctxValue as never}>
        {ui}
      </ChatContext.Provider>
    </IntlWrapper>,
  );
}

describe("ChatBubble", () => {
  const baseCtx = {
    isOpen: false,
    toggle: vi.fn(),
    unreadCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the chat button", () => {
    renderWithContext(<ChatBubble />, baseCtx);
    expect(screen.getByLabelText("Open chat")).toBeInTheDocument();
  });

  it("shows close icon when open", () => {
    renderWithContext(<ChatBubble />, { ...baseCtx, isOpen: true });
    expect(screen.getByLabelText("Close chat")).toBeInTheDocument();
  });

  it("shows unread count badge when there are unread messages", () => {
    renderWithContext(<ChatBubble />, { ...baseCtx, unreadCount: 3, isOpen: false });
    expect(screen.getByText("3 new messages")).toBeInTheDocument();
  });

  it("shows singular new message text", () => {
    renderWithContext(<ChatBubble />, { ...baseCtx, unreadCount: 1, isOpen: false });
    expect(screen.getByText("1 new message")).toBeInTheDocument();
  });

  it("does not show unread badge when chat is open", () => {
    renderWithContext(<ChatBubble />, { ...baseCtx, unreadCount: 3, isOpen: true });
    expect(screen.queryByText(/new messages?/)).not.toBeInTheDocument();
  });

  it("does not show unread badge when count is 0", () => {
    renderWithContext(<ChatBubble />, baseCtx);
    expect(screen.queryByText(/new messages?/)).not.toBeInTheDocument();
  });

  it("calls toggle on click", async () => {
    const toggle = vi.fn();
    const user = userEvent.setup();
    renderWithContext(<ChatBubble />, { ...baseCtx, toggle });
    await user.click(screen.getByLabelText("Open chat"));
    expect(toggle).toHaveBeenCalledOnce();
  });
});
