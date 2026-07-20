import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ChatContactForm } from "./ChatContactForm";
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

const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultContextValue = {
  conversationId: "test-conv-123",
  setShowContactForm: vi.fn(),
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

describe("ChatContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the form with all fields", () => {
    renderWithContext(<ChatContactForm />);
    expect(screen.getByPlaceholderText("Your name *")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your email *")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Phone (optional)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Company (optional)")).toBeInTheDocument();
    expect(screen.getByText("Send Message")).toBeInTheDocument();
  });

  it("submits the form and calls setShowContactForm(false)", async () => {
    const user = userEvent.setup();
    const setShowContactForm = vi.fn();
    renderWithContext(<ChatContactForm />, { ...defaultContextValue, setShowContactForm });

    await user.type(screen.getByPlaceholderText("Your name *"), "John Doe");
    await user.type(screen.getByPlaceholderText("Your email *"), "john@example.com");
    await user.click(screen.getByText("Send Message"));

    expect(mockFetch).toHaveBeenCalledWith("/api/chat/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: "test-conv-123",
        name: "John Doe",
        email: "john@example.com",
        phone: null,
        company: null,
        requirements: "Contact form submission from John Doe",
      }),
    });
    expect(setShowContactForm).toHaveBeenCalledWith(false);
  });

  it("does not submit when name is empty", async () => {
    const user = userEvent.setup();
    const setShowContactForm = vi.fn();
    renderWithContext(<ChatContactForm />, { ...defaultContextValue, setShowContactForm });

    await user.type(screen.getByPlaceholderText("Your email *"), "john@example.com");
    await user.click(screen.getByText("Send Message"));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not submit when email is empty", async () => {
    const user = userEvent.setup();
    const setShowContactForm = vi.fn();
    renderWithContext(<ChatContactForm />, { ...defaultContextValue, setShowContactForm });

    await user.type(screen.getByPlaceholderText("Your name *"), "John Doe");
    await user.click(screen.getByText("Send Message"));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not submit when conversationId is null", async () => {
    const user = userEvent.setup();
    renderWithContext(<ChatContactForm />, { conversationId: null, setShowContactForm: vi.fn() });

    await user.type(screen.getByPlaceholderText("Your name *"), "John Doe");
    await user.type(screen.getByPlaceholderText("Your email *"), "john@example.com");
    await user.click(screen.getByText("Send Message"));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles fetch failure gracefully", async () => {
    const user = userEvent.setup();
    const setShowContactForm = vi.fn();
    mockFetch.mockRejectedValue(new Error("Network error"));
    renderWithContext(<ChatContactForm />, { ...defaultContextValue, setShowContactForm });

    await user.type(screen.getByPlaceholderText("Your name *"), "John Doe");
    await user.type(screen.getByPlaceholderText("Your email *"), "john@example.com");
    await user.click(screen.getByText("Send Message"));

    expect(setShowContactForm).toHaveBeenCalledWith(false);
  });

  it("uses props values when provided", () => {
    renderWithContext(
      <ChatContactForm conversationId="prop-conv" setShowContactForm={vi.fn()} />,
      { conversationId: "ctx-conv", setShowContactForm: vi.fn() },
    );
    expect(screen.getByPlaceholderText("Your name *")).toBeInTheDocument();
  });

  it("shows spinner while submitting", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(() => new Promise(() => {}));
    renderWithContext(<ChatContactForm />);

    await user.type(screen.getByPlaceholderText("Your name *"), "John Doe");
    await user.type(screen.getByPlaceholderText("Your email *"), "john@example.com");
    await user.click(screen.getByText("Send Message"));

    expect(screen.getByText("Send Message")).toBeInTheDocument();
  });

  it("types into phone field", async () => {
    const user = userEvent.setup();
    renderWithContext(<ChatContactForm />);
    const phoneInput = screen.getByPlaceholderText("Phone (optional)");
    await user.type(phoneInput, "+1234567890");
    expect(phoneInput).toHaveValue("+1234567890");
  });

  it("types into company field", async () => {
    const user = userEvent.setup();
    renderWithContext(<ChatContactForm />);
    const companyInput = screen.getByPlaceholderText("Company (optional)");
    await user.type(companyInput, "Acme Inc");
    expect(companyInput).toHaveValue("Acme Inc");
  });

  it("handles non-ok response from server", async () => {
    const user = userEvent.setup();
    const setShowContactForm = vi.fn();
    mockFetch.mockResolvedValue({ ok: false });
    renderWithContext(<ChatContactForm />, { ...defaultContextValue, setShowContactForm });

    await user.type(screen.getByPlaceholderText("Your name *"), "John Doe");
    await user.type(screen.getByPlaceholderText("Your email *"), "john@example.com");
    await user.click(screen.getByText("Send Message"));

    expect(mockFetch).toHaveBeenCalled();
    expect(setShowContactForm).not.toHaveBeenCalled();
  });

  it("uses fallback setShowContactForm when neither props nor context provide it", () => {
    renderWithContext(<ChatContactForm />, { conversationId: "test-conv-123", setShowContactForm: undefined as never });
    expect(screen.getByPlaceholderText("Your name *")).toBeInTheDocument();
  });
});
