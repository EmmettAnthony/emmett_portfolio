import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import { QuickContactCards } from "../QuickContactCards";

function renderComponent(className?: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <QuickContactCards className={className} />
    </NextIntlClientProvider>,
  );
}

describe("QuickContactCards", () => {
  it("renders all four contact cards", () => {
    renderComponent();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Location")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
  });

  it("renders contact values", () => {
    renderComponent();
    expect(screen.getByText("emmettanthony998@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("+231 775 623 283")).toBeInTheDocument();
    expect(screen.getByText("Congo Town, Liberia")).toBeInTheDocument();
    expect(screen.getByText("Chat with me")).toBeInTheDocument();
  });

  it("renders email link with correct href", () => {
    renderComponent();
    const emailLink = screen.getByText("emmettanthony998@gmail.com").closest("a");
    expect(emailLink).toHaveAttribute("href", "mailto:emmettanthony998@gmail.com");
  });

  it("renders phone link with correct href", () => {
    renderComponent();
    const phoneLink = screen.getByText("+231 775 623 283").closest("a");
    expect(phoneLink).toHaveAttribute("href", "tel:+231775623283");
  });

  it("renders WhatsApp link with correct href", () => {
    renderComponent();
    const waLink = screen.getByText("WhatsApp").closest("a");
    expect(waLink).toHaveAttribute("href", "https://wa.me/231775623283");
  });

  it("opens external links in new tab", () => {
    renderComponent();
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href?.startsWith("http")) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
    });
  });

  it("applies custom className", () => {
    const { container } = renderComponent("custom-class");
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
