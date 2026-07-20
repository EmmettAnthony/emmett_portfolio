import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline } from "./Timeline";

// Mock framer-motion
vi.mock("framer-motion")
;

const sampleItems = [
  {
    id: "1",
    title: "Senior Developer",
    subtitle: "Tech Corp",
    date: "2023",
    description: ["Led team of 5 developers", "Delivered 10+ projects"],
  },
  {
    id: "2",
    title: "Junior Developer",
    subtitle: "Startup Inc",
    date: "2020 - 2022",
    description: ["Built full-stack applications"],
  },
];

describe("Timeline", () => {
  it("renders all timeline items", () => {
    render(<Timeline items={sampleItems} />);
    expect(screen.getByText("Senior Developer")).toBeInTheDocument();
    expect(screen.getByText("Junior Developer")).toBeInTheDocument();
  });

  it("renders subtitles", () => {
    render(<Timeline items={sampleItems} />);
    expect(screen.getByText("Tech Corp")).toBeInTheDocument();
    expect(screen.getByText("Startup Inc")).toBeInTheDocument();
  });

  it("renders dates", () => {
    render(<Timeline items={sampleItems} />);
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("2020 - 2022")).toBeInTheDocument();
  });

  it("renders all description items", () => {
    render(<Timeline items={sampleItems} />);
    expect(screen.getByText("Led team of 5 developers")).toBeInTheDocument();
    expect(screen.getByText("Delivered 10+ projects")).toBeInTheDocument();
    expect(screen.getByText("Built full-stack applications")).toBeInTheDocument();
  });

  it("renders the vertical line", () => {
    const { container } = render(<Timeline items={sampleItems} />);
    const verticalLine = container.querySelector(".w-px");
    expect(verticalLine).toBeInTheDocument();
    expect(verticalLine?.className).toContain("bg-zinc-200");
  });

  it("renders dot indicators for each item", () => {
    const { container } = render(<Timeline items={sampleItems} />);
    const dots = container.querySelectorAll(".rounded-full");
    // There should be at least one dot per item (the border-2 ones)
    const borderDots = container.querySelectorAll(".border-2");
    expect(borderDots.length).toBe(sampleItems.length);
  });

  it("renders date in uppercase styling", () => {
    const { container } = render(<Timeline items={sampleItems} />);
    const dateSpan = container.querySelector(".uppercase");
    expect(dateSpan).toHaveTextContent("2023");
  });

  it("renders empty items array without error", () => {
    const { container } = render(<Timeline items={[]} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.querySelectorAll("li").length).toBe(0);
  });

  it("renders description as list items", () => {
    render(
      <Timeline
        items={[
          {
            id: "test",
            title: "Test",
            subtitle: "Sub",
            date: "2024",
            description: ["Item 1", "Item 2", "Item 3"],
          },
        ]}
      />,
    );
    const listItems = screen.getAllByRole("listitem");
    expect(listItems.length).toBe(3);
  });

  it("renders title as heading (h3)", () => {
    render(<Timeline items={sampleItems} />);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBe(sampleItems.length);
    expect(headings[0]).toHaveTextContent("Senior Developer");
  });
});
