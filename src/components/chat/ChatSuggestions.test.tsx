import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ChatSuggestions } from "./ChatSuggestions";
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

describe("ChatSuggestions", () => {
  const questions = ["What services do you offer?", "What's your experience?", "Can you show me your work?"];
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the label and all suggestion buttons", () => {
    renderWithIntl(<ChatSuggestions questions={questions} onSelect={onSelect} />);
    expect(screen.getByText("Suggested questions:")).toBeInTheDocument();
    questions.forEach((q) => {
      expect(screen.getByText(q)).toBeInTheDocument();
    });
  });

  it("calls onSelect when a suggestion is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ChatSuggestions questions={questions} onSelect={onSelect} />);
    await user.click(screen.getByText(questions[1]));
    expect(onSelect).toHaveBeenCalledWith(questions[1]);
  });

  it("renders an empty list when no questions provided", () => {
    const { container } = renderWithIntl(<ChatSuggestions questions={[]} onSelect={onSelect} />);
    expect(screen.getByText("Suggested questions:")).toBeInTheDocument();
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(0);
  });
});
