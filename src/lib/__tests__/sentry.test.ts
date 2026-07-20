import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRequire } from "module";

const req = createRequire(import.meta.url);

beforeEach(() => {
  vi.resetModules();
  delete process.env.SENTRY_DSN;
  delete process.env.NODE_ENV;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
});

describe("captureError", () => {
  it("calls sentry.captureException when SENTRY_DSN is set and sentry is available", async () => {
    const sentry = req("@sentry/nextjs");
    const captureExceptionSpy = vi.spyOn(sentry, "captureException").mockImplementation(() => {});
    const initSpy = vi.spyOn(sentry, "init").mockImplementation(() => {});
    const isInitializedSpy = vi.spyOn(sentry, "isInitialized").mockReturnValue(false);

    process.env.SENTRY_DSN = "https://key@sentry.io/project";
    const { captureError } = await import("../sentry");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    captureError(new Error("test"), "test message");

    expect(captureExceptionSpy).toHaveBeenCalledWith(new Error("test"), {
      extra: { message: "test message" },
    });
    expect(consoleSpy).toHaveBeenCalledWith("test message", new Error("test"));

    captureExceptionSpy.mockRestore();
    initSpy.mockRestore();
    isInitializedSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("falls back to console.error when sentry is not available", async () => {
    const sentry = req("@sentry/nextjs");
    const captureExceptionSpy = vi.spyOn(sentry, "captureException").mockImplementation(() => {});
    const isInitializedSpy = vi.spyOn(sentry, "isInitialized").mockImplementation(() => { throw new Error("unavailable"); });
    const initSpy = vi.spyOn(sentry, "init").mockImplementation(() => {});

    process.env.SENTRY_DSN = "https://key@sentry.io/project";
    const { captureError } = await import("../sentry");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    captureError(new Error("test"), "test message");

    expect(captureExceptionSpy).toHaveBeenCalledTimes(0);
    expect(consoleSpy).toHaveBeenCalledWith("test message", new Error("test"));

    captureExceptionSpy.mockRestore();
    isInitializedSpy.mockRestore();
    initSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("falls back to console.error when SENTRY_DSN is not set", async () => {
    const sentry = req("@sentry/nextjs");
    const captureExceptionSpy = vi.spyOn(sentry, "captureException").mockImplementation(() => {});

    const { captureError } = await import("../sentry");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    captureError(new Error("test"), "test message");

    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("test message", new Error("test"));

    captureExceptionSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe("getSentry (internal)", () => {
  it("returns null on require failure", async () => {
    const sentry = req("@sentry/nextjs");
    const captureExceptionSpy = vi.spyOn(sentry, "captureException").mockImplementation(() => {});
    const initSpy = vi.spyOn(sentry, "init").mockImplementation(() => {});
    const isInitializedSpy = vi.spyOn(sentry, "isInitialized").mockImplementation(() => { throw new Error("module not found"); });

    process.env.SENTRY_DSN = "https://key@sentry.io/project";
    const { captureError } = await import("../sentry");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    captureError(new Error("test"), "test message");

    expect(initSpy).not.toHaveBeenCalled();
    expect(captureExceptionSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("test message", new Error("test"));

    captureExceptionSpy.mockRestore();
    initSpy.mockRestore();
    isInitializedSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("returns cached sentryClient on subsequent calls", async () => {
    const sentry = req("@sentry/nextjs");
    const captureExceptionSpy = vi.spyOn(sentry, "captureException").mockImplementation(() => {});
    const initSpy = vi.spyOn(sentry, "init").mockImplementation(() => {});
    const isInitializedSpy = vi.spyOn(sentry, "isInitialized").mockReturnValue(false);

    process.env.SENTRY_DSN = "https://key@sentry.io/project";
    const { captureError } = await import("../sentry");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    captureError(new Error("first"), "first");
    captureError(new Error("second"), "second");

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(isInitializedSpy).toHaveBeenCalledTimes(1);
    expect(captureExceptionSpy).toHaveBeenCalledTimes(2);

    captureExceptionSpy.mockRestore();
    initSpy.mockRestore();
    isInitializedSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe("sentry.init", () => {
  it("is called when sentry is not initialized and DSN is set", async () => {
    const sentry = req("@sentry/nextjs");
    const initSpy = vi.spyOn(sentry, "init").mockImplementation(() => {});
    const isInitializedSpy = vi.spyOn(sentry, "isInitialized").mockReturnValue(false);

    process.env.SENTRY_DSN = "https://key@sentry.io/project";
    const { captureError } = await import("../sentry");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    captureError(new Error("test"), "test message");

    expect(initSpy).toHaveBeenCalledWith({
      dsn: "https://key@sentry.io/project",
      environment: "production",
      tracesSampleRate: 0.1,
    });

    initSpy.mockRestore();
    isInitializedSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("is NOT called when isInitialized returns true", async () => {
    const sentry = req("@sentry/nextjs");
    const initSpy = vi.spyOn(sentry, "init").mockImplementation(() => {});
    const isInitializedSpy = vi.spyOn(sentry, "isInitialized").mockReturnValue(true);

    process.env.SENTRY_DSN = "https://key@sentry.io/project";
    const { captureError } = await import("../sentry");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    captureError(new Error("test"), "test message");

    expect(initSpy).not.toHaveBeenCalled();

    initSpy.mockRestore();
    isInitializedSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
