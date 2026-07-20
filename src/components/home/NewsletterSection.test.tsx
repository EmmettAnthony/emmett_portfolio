// IntersectionObserver polyfill required by framer-motion's whileInView
if (typeof globalThis.IntersectionObserver === "undefined") {
  class MockIntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import { NewsletterSection } from "./NewsletterSection";

function renderComponent() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <NewsletterSection />
    </NextIntlClientProvider>,
  );
}

describe("NewsletterSection", () => {
  it("renders section title", () => {
    renderComponent();
    expect(screen.getByText("Stay Updated")).toBeInTheDocument();
  });

  it("renders section description", () => {
    renderComponent();
    expect(screen.getByText(/Get the latest articles and updates/)).toBeInTheDocument();
  });

  it("renders email input with placeholder", () => {
    renderComponent();
    const input = screen.getByPlaceholderText(/enter your email/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
    expect(input).toBeRequired();
  });

  it("renders subscribe button with submit type", () => {
    renderComponent();
    const button = screen.getByRole("button", { name: /subscribe/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("shows success state after email submission", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText(/enter your email/i);
    await user.type(input, "test@example.com");

    const button = screen.getByRole("button", { name: /subscribe/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Thanks for subscribing/)).toBeInTheDocument();
    });
  });

  it("clears email input after successful submission", async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText(/enter your email/i) as HTMLInputElement;
    await user.type(input, "test@example.com");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("disables button after successful submission", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() => {
      // Button now shows success text from en.json: "Thanks for subscribing!"
      expect(screen.getByRole("button", { name: /thanks for subscribing/i })).toBeDisabled();
    });
  });

  it("shows success arrow button after submission", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() => {
      expect(screen.getByText(/Thanks for subscribing/)).toBeInTheDocument();
    });
  });

  it("does not submit with empty email", async () => {
    const user = userEvent.setup();
    renderComponent();

    const button = screen.getByRole("button", { name: /subscribe/i });
    await user.click(button);

    // Should still show the subscribe button (not success state)
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeInTheDocument();
    expect(screen.queryByText(/Thanks for subscribing/)).not.toBeInTheDocument();
  });

  it("shows success message after submission", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText(/enter your email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() => {
      expect(screen.getByText(/Thanks for subscribing/)).toBeInTheDocument();
    });

    // Success state disables the button
    const successBtn = screen.getByRole("button");
    expect(successBtn).toBeDisabled();
  });


});
