import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactFaqList } from "../ContactFaqList";

const sampleFaqs = [
  { id: "1", question: "How quickly do you respond?", answer: "Within 24 hours." },
  { id: "2", question: "Do you work internationally?", answer: "Yes, worldwide." },
];

describe("ContactFaqList", () => {
  it("renders all FAQ questions", () => {
    render(<ContactFaqList faqs={sampleFaqs} />);
    expect(screen.getByText("How quickly do you respond?")).toBeInTheDocument();
    expect(screen.getByText("Do you work internationally?")).toBeInTheDocument();
  });

  it("renders all FAQ answers", () => {
    render(<ContactFaqList faqs={sampleFaqs} />);
    expect(screen.getByText("Within 24 hours.")).toBeInTheDocument();
    expect(screen.getByText("Yes, worldwide.")).toBeInTheDocument();
  });

  it("renders correct number of FAQ items", () => {
    const { container } = render(<ContactFaqList faqs={sampleFaqs} />);
    expect(container.querySelectorAll("details").length).toBe(2);
  });

  it("renders each FAQ in a details element with summary", () => {
    render(<ContactFaqList faqs={sampleFaqs} />);
    const details = document.querySelectorAll("details");
    expect(details.length).toBe(2);
    details.forEach((d, i) => {
      const summary = d.querySelector("summary");
      expect(summary).toHaveTextContent(sampleFaqs[i].question);
    });
  });

  it("renders empty container when no FAQs provided", () => {
    const { container } = render(<ContactFaqList faqs={[]} />);
    // The container is the top-level div from render
    // Inner content should have no details elements
    expect(container.querySelector("details")).toBeNull();
  });

  it("has accessible details/summary elements that can be toggled", () => {
    render(<ContactFaqList faqs={sampleFaqs} />);
    const details = document.querySelectorAll("details");
    // details elements are interactive by default in HTML
    expect(details[0]).toBeInstanceOf(HTMLElement);
    // Can toggle open attribute
    expect(details[0].open).toBe(false);
  });
});
