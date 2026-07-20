import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import { BackToTop } from "./BackToTop";

// Use hoisted mock variables so they can be changed in tests
const { mockGetScrollProgress } = vi.hoisted(() => ({
  mockGetScrollProgress: vi.fn(() => 0.5),
}));

// Mock framer-motion with hoisted mock — uses vi.hoisted mockGetScrollProgress for per-test control
// (vi.mock factory closures over the hoisted variable)
vi.mock("framer-motion", () => {
  const MOTION_ONLY_PROPS = new Set([
    "whileInView", "whileHover", "whileTap", "whileFocus", "whileDrag",
    "initial", "animate", "exit", "variants", "transition",
    "layout", "layoutId", "onAnimationStart", "onAnimationComplete",
    "viewport", "drag", "dragConstraints", "custom", "inherit",
  ]);

  function safeProps(props: Record<string, unknown>): Record<string, unknown> {
    const safe: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (!MOTION_ONLY_PROPS.has(key)) safe[key] = props[key];
    }
    return safe;
  }

  return {
    motion: {
      button: ({ children, ...props }: Record<string, unknown>) => (
        <button {...(safeProps(props) as Record<string, unknown>)}>
          {children as React.ReactNode}
        </button>
      ),
    },
    useScroll: () => ({
      scrollYProgress: { get: mockGetScrollProgress, onChange: vi.fn() },
    }),
    useSpring: (value: unknown) => value,
  };
});

function renderComponent() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <BackToTop />
    </NextIntlClientProvider>,
  );
}

describe("BackToTop", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    mockGetScrollProgress.mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a button with accessible label", () => {
    renderComponent();
    expect(screen.getByLabelText("Back to top")).toBeInTheDocument();
  });

  it("renders the ArrowUp icon", () => {
    const { container } = renderComponent();
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("scrolls to top when clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    const button = screen.getByLabelText("Back to top");
    await user.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("has fixed positioning classes", () => {
    renderComponent();
    const button = screen.getByLabelText("Back to top");
    expect(button.className).toContain("fixed");
    expect(button.className).toContain("bottom-8");
    expect(button.className).toContain("right-8");
  });

  it("is visible when scroll progress is above threshold", () => {
    mockGetScrollProgress.mockReturnValue(0.5);
    renderComponent();
    const button = screen.getByLabelText("Back to top");
    expect(button.style.opacity).toBe("1");
    expect(button.style.pointerEvents).toBe("auto");
  });

  it("is hidden when scroll progress is below threshold", () => {
    mockGetScrollProgress.mockReturnValue(0.1);
    renderComponent();
    const button = screen.getByLabelText("Back to top");
    expect(button.style.opacity).toBe("0");
    expect(button.style.pointerEvents).toBe("none");
  });

  it("is hidden when scrollYProgress is undefined", () => {
    mockGetScrollProgress.mockReturnValue(undefined);
    renderComponent();
    const button = screen.getByLabelText("Back to top");
    expect(button.style.opacity).toBe("0");
    expect(button.style.pointerEvents).toBe("none");
  });
});
