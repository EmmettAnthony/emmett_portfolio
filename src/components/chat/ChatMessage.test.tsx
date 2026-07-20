import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ChatMessage } from "./ChatMessage";
import enMessages from "@/messages/en.json";
import type { ChatMessageData } from "@/types/chatbot";

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

const mockWriteText = vi.fn().mockResolvedValue(undefined);

describe("ChatMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.navigator = { clipboard: { writeText: mockWriteText } } as unknown as Navigator;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseMsg: ChatMessageData = {
    id: "msg-1",
    conversationId: "conv-1",
    role: "assistant",
    content: "Hello! How can I help you?",
    metadata: null,
    createdAt: new Date().toISOString(),
  };

  it("renders an assistant message", () => {
    renderWithIntl(<ChatMessage message={baseMsg} />);
    expect(screen.getByText("Hello! How can I help you?")).toBeInTheDocument();
  });

  it("renders a user message", () => {
    const userMsg: ChatMessageData = { ...baseMsg, role: "user", content: "What services do you offer?" };
    renderWithIntl(<ChatMessage message={userMsg} />);
    expect(screen.getByText("What services do you offer?")).toBeInTheDocument();
  });

  it("renders an error message with styling", () => {
    const errorMsg: ChatMessageData = { ...baseMsg, content: "Something went wrong", metadata: { isError: true } };
    renderWithIntl(<ChatMessage message={errorMsg} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows lead captured badge", () => {
    const leadMsg: ChatMessageData = { ...baseMsg, metadata: { leadCaptured: true } };
    renderWithIntl(<ChatMessage message={leadMsg} />);
    expect(screen.getByText("Lead captured")).toBeInTheDocument();
  });

  it("shows human handoff message", () => {
    const handoffMsg: ChatMessageData = { ...baseMsg, metadata: { humanHandoff: true } };
    renderWithIntl(<ChatMessage message={handoffMsg} />);
    expect(screen.getByText(/Transferring you to a human assistant/)).toBeInTheDocument();
  });

  it("renders timestamp", () => {
    renderWithIntl(<ChatMessage message={baseMsg} />);
    const timeEl = screen.getByText(/\d{2}:\d{2}/);
    expect(timeEl).toBeInTheDocument();
  });

  it("renders markdown content for assistant messages", () => {
    const markdownMsg: ChatMessageData = {
      ...baseMsg,
      content: "This has **bold** and *italic* text",
    };
    renderWithIntl(<ChatMessage message={markdownMsg} />);
    expect(screen.getByText("bold")).toBeInTheDocument();
    expect(screen.getByText("italic")).toBeInTheDocument();
  });

  it("renders a code block with copy button", async () => {
    const user = userEvent.setup();
    const codeMsg: ChatMessageData = {
      ...baseMsg,
      content: "```typescript\nconst x = 1;\n```",
    };
    renderWithIntl(<ChatMessage message={codeMsg} />);
    const copyBtn = screen.getByRole("button", { name: /copy/i });
    expect(copyBtn).toBeInTheDocument();
    await user.click(copyBtn);
    const copiedBtn = screen.getByRole("button", { name: /copied/i });
    expect(copiedBtn).toBeInTheDocument();
  });

  it("resets copied state after 2 seconds", async () => {
    const user = userEvent.setup();
    const codeMsg: ChatMessageData = {
      ...baseMsg,
      content: "```typescript\nconst x = 1;\n```",
    };
    renderWithIntl(<ChatMessage message={codeMsg} />);
    await user.click(screen.getByRole("button", { name: /copy/i }));
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    }, { timeout: 5000, interval: 200 });
  });

  it("renders inline code without language", () => {
    const inlineCode: ChatMessageData = {
      ...baseMsg,
      content: "Use the `format()` function",
    };
    renderWithIntl(<ChatMessage message={inlineCode} />);
    expect(screen.getByText("format()")).toBeInTheDocument();
  });

  it("renders date in non-today format for old messages", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const oldMsg: ChatMessageData = { ...baseMsg, createdAt: yesterday.toISOString() };
    renderWithIntl(<ChatMessage message={oldMsg} />);
    const monthDay = yesterday.toLocaleDateString([], { month: "short", day: "numeric" });
    expect(screen.getByText(new RegExp(monthDay))).toBeInTheDocument();
  });

  it("renders a markdown link", () => {
    const linkMsg: ChatMessageData = {
      ...baseMsg,
      content: "Check out [my portfolio](https://example.com)",
    };
    renderWithIntl(<ChatMessage message={linkMsg} />);
    expect(screen.getByText("my portfolio")).toBeInTheDocument();
  });

  it("renders a markdown table", () => {
    const tableMsg: ChatMessageData = {
      ...baseMsg,
      content: "| Name | Age |\n|------|-----|\n| John | 30  |",
    };
    renderWithIntl(<ChatMessage message={tableMsg} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
  });

  it("renders a blockquote", () => {
    const quoteMsg: ChatMessageData = {
      ...baseMsg,
      content: "> This is a quote",
    };
    renderWithIntl(<ChatMessage message={quoteMsg} />);
    expect(screen.getByText("This is a quote")).toBeInTheDocument();
  });

  it("renders unordered and ordered lists", () => {
    const listMsg: ChatMessageData = {
      ...baseMsg,
      content: "- Item 1\n- Item 2\n\n1. First\n2. Second",
    };
    renderWithIntl(<ChatMessage message={listMsg} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
  });

  it("renders headings", () => {
    const headingMsg: ChatMessageData = {
      ...baseMsg,
      content: "# Heading 1\n## Heading 2\n### Heading 3",
    };
    renderWithIntl(<ChatMessage message={headingMsg} />);
    expect(screen.getByText("Heading 1")).toBeInTheDocument();
    expect(screen.getByText("Heading 2")).toBeInTheDocument();
    expect(screen.getByText("Heading 3")).toBeInTheDocument();
  });

  it("renders a horizontal rule", () => {
    const hrMsg: ChatMessageData = {
      ...baseMsg,
      content: "Before\n\n---\n\nAfter",
    };
    renderWithIntl(<ChatMessage message={hrMsg} />);
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });

  it("renders a checkbox", () => {
    const checkboxMsg: ChatMessageData = {
      ...baseMsg,
      content: "- [ ] Incomplete\n- [x] Complete",
    };
    renderWithIntl(<ChatMessage message={checkboxMsg} />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
  });
});
