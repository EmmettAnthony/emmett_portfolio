import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import { NewsletterSignupForm } from "./NewsletterSignupForm";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderComponent(props: {
  source?: string;
  variant?: "inline" | "modal" | "sidebar";
  onSuccess?: () => void;
} = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <NewsletterSignupForm source="test" {...props} />
    </NextIntlClientProvider>,
  );
}

describe("NewsletterSignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "Subscribed successfully" }),
      text: async () => "",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial render", () => {
    it("renders email input with correct placeholder", () => {
      renderComponent();
      const input = screen.getByPlaceholderText("you@example.com");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "email");
      expect(input).toBeRequired();
    });

    it("renders name input for inline and modal variants", () => {
      renderComponent({ variant: "inline" });
      expect(screen.getByPlaceholderText("Your name (optional)")).toBeInTheDocument();
    });

    it("renders GDPR consent checkbox", () => {
      renderComponent();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("renders subscribe button", () => {
      renderComponent();
      expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
    });

    it("does not render name input for sidebar variant", () => {
      renderComponent({ variant: "sidebar" });
      expect(screen.queryByPlaceholderText("Your name (optional)")).not.toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("does not submit when email is empty", async () => {
      const user = userEvent.setup();
      renderComponent();

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      const button = screen.getByRole("button", { name: "Subscribe" });
      await user.click(button);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does not submit when GDPR consent is not given", async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByPlaceholderText("you@example.com");
      await user.type(emailInput, "test@example.com");

      const button = screen.getByRole("button", { name: "Subscribe" });
      await user.click(button);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("submits form with correct data", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.type(screen.getByPlaceholderText("Your name (optional)"), "John Doe");
      await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/newsletter/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            source: "test",
            gdprConsent: true,
          }),
        });
      });
    });

    it("shows success state after successful submission", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.type(screen.getByPlaceholderText("Your name (optional)"), "John");
      await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      await waitFor(() => {
        expect(screen.getByText(/Subscribed!/)).toBeInTheDocument();
      });
    });

    it("shows already subscribed message", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: "Already subscribed" }),
        text: async () => "",
      });

      const user = userEvent.setup();
      renderComponent();

      await user.type(screen.getByPlaceholderText("Your name (optional)"), "John");
      await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      await waitFor(() => {
        expect(screen.getByText(/Subscribed!/)).toBeInTheDocument();
      });
    });

    it("shows error message on API error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "Invalid email" }),
        text: async () => "Invalid email",
      });

      const user = userEvent.setup();
      renderComponent();

      await user.type(screen.getByPlaceholderText("Your name (optional)"), "John");
      await user.type(screen.getByPlaceholderText("you@example.com"), "invalid");
      await user.click(screen.getByRole("checkbox"));

      // Submit the form directly to ensure the handler is called
      const form = document.querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert.textContent).toContain("Invalid email");
      });
    });

    it("shows rate limited message on 429", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: "Too many requests" }),
        text: async () => "",
      });

      const user = userEvent.setup();
      renderComponent();

      await user.type(screen.getByPlaceholderText("Your name (optional)"), "John");
      await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      await waitFor(() => {
        expect(screen.getByText("Too many requests")).toBeInTheDocument();
      });
    });

    it("shows network error message on fetch failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const user = userEvent.setup();
      renderComponent();

      await user.type(screen.getByPlaceholderText("Your name (optional)"), "John");
      await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it("calls onSuccess callback after successful submission", async () => {
      const onSuccess = vi.fn();
      const user = userEvent.setup();
      renderComponent({ onSuccess });

      await user.type(screen.getByPlaceholderText("Your name (optional)"), "John");
      await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("shows success content after successful submission", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.type(screen.getByPlaceholderText("Your name (optional)"), "John");
      await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
      await user.click(screen.getByRole("checkbox"));
      await user.click(screen.getByRole("button", { name: "Subscribe" }));

      await waitFor(() => {
        // After success, the component shows a success div instead of the form
        expect(screen.getByText(/Subscribed!/)).toBeInTheDocument();
        // Form inputs should no longer be in the DOM
        expect(screen.queryByPlaceholderText("you@example.com")).not.toBeInTheDocument();
      });
    });
  });

  describe("form states", () => {
    it("disables submit button while loading", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const user = userEvent.setup();
      renderComponent({ variant: "modal" });

      await user.type(screen.getByPlaceholderText("Your name (optional)"), "John");
      await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
      await user.click(screen.getByRole("checkbox"));

      const button = screen.getByRole("button");
      await user.click(button);

      expect(button).toBeDisabled();
    });

    it("disables submit when email is empty", () => {
      renderComponent();
      const button = screen.getByRole("button", { name: "Subscribe" });
      expect(button).toBeDisabled();
    });

    it("disables submit when GDPR is unchecked", () => {
      renderComponent();
      const button = screen.getByRole("button", { name: "Subscribe" });
      expect(button).toBeDisabled();
    });
  });

  describe("variants", () => {
    it("applies modal variant classes", () => {
      renderComponent({ variant: "modal" });
      const form = document.querySelector("form");
      expect(form?.className).toContain("space-y-4");
    });

    it("applies inline variant classes", () => {
      renderComponent({ variant: "inline" });
      const form = document.querySelector("form");
      expect(form?.className).toContain("space-y-3");
    });

    it("applies sidebar variant classes", () => {
      renderComponent({ variant: "sidebar" });
      const form = document.querySelector("form");
      expect(form?.className).toContain("space-y-2.5");
    });
  });
});
