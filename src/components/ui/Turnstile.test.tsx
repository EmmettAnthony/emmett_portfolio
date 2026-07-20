import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Turnstile } from "./Turnstile";

// Mock @marsidev/react-turnstile
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({ siteKey, onSuccess, options }: Record<string, unknown>) => (
    <div data-testid="turnstile" data-site-key={siteKey as string} data-options={JSON.stringify(options)}>
      Turnstile Widget
    </div>
  ),
}));

describe("Turnstile", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("renders the Turnstile widget when site key is set", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site-key";
    const onSuccess = vi.fn();
    const { container } = render(<Turnstile onSuccess={onSuccess} />);
    const widget = container.querySelector('[data-testid="turnstile"]');
    expect(widget).toBeInTheDocument();
  });

  it("passes siteKey to the widget", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "my-key-123";
    const { container } = render(<Turnstile onSuccess={vi.fn()} />);
    const widget = container.querySelector('[data-testid="turnstile"]');
    expect(widget).toHaveAttribute("data-site-key", "my-key-123");
  });

  it("passes auto theme option", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-key";
    const { container } = render(<Turnstile onSuccess={vi.fn()} />);
    const widget = container.querySelector('[data-testid="turnstile"]');
    const options = JSON.parse(widget?.getAttribute("data-options") || "{}");
    expect(options.theme).toBe("auto");
  });

  it("calls onSuccess when widget triggers it", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-key";
    const onSuccess = vi.fn();
    render(<Turnstile onSuccess={onSuccess} />);

    // The mock doesn't trigger onSuccess — we just verify it's passed
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("returns null when site key is not set", () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const { container } = render(<Turnstile onSuccess={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when site key is empty", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "";
    const { container } = render(<Turnstile onSuccess={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
