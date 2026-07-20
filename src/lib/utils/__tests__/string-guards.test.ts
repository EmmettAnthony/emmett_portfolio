import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { escapeHtml, safe, safeVal, formatTime, hasRecipient } from "@/lib/utils/string-guards";

// ─── Setup: mock RESEND_API_KEY for hasRecipient tests ───────────────────

const ORIGINAL_RESEND_API_KEY = process.env.RESEND_API_KEY;


// ──────────────────────────────────────────────────────────────────────────────
// escapeHtml
// ──────────────────────────────────────────────────────────────────────────────

describe("escapeHtml", () => {
  it("returns an empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns a plain string without special chars unchanged", () => {
    expect(escapeHtml("Hello world")).toBe("Hello world");
  });

  it("escapes & to &amp;", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes < to &lt;", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes > to &gt;", () => {
    expect(escapeHtml("5 > 3")).toBe("5 &gt; 3");
  });

  it("escapes double quotes to &quot;", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes all special chars in one string", () => {
    const input = '<a href="x&y">click</a>';
    const expected = "&lt;a href=&quot;x&amp;y&quot;&gt;click&lt;/a&gt;";
    expect(escapeHtml(input)).toBe(expected);
  });

  it("handles consecutive special characters", () => {
    expect(escapeHtml("<<<>>>&&&")).toBe("&lt;&lt;&lt;&gt;&gt;&gt;&amp;&amp;&amp;");
  });

  it("handles strings with no special characters (numbers, spaces, punctuation)", () => {
    expect(escapeHtml("Hello, World! 123.")).toBe("Hello, World! 123.");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// safe
// ──────────────────────────────────────────────────────────────────────────────

describe("safe", () => {
  it("escapes and returns a valid string", () => {
    expect(safe("Hello <World>")).toBe("Hello &lt;World&gt;");
  });

  it("escapes ampersands in the string", () => {
    expect(safe("a & b")).toBe("a &amp; b");
  });

  it("returns null for null", () => {
    expect(safe(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(safe(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safe("")).toBeNull();
  });

  it("returns escaped whitespace string as-is (whitespace is truthy)", () => {
    expect(safe("   ")).toBe("   ");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// safeVal
// ──────────────────────────────────────────────────────────────────────────────

describe("safeVal", () => {
  it("returns a valid string as-is (no escaping)", () => {
    expect(safeVal("Hello <World>")).toBe("Hello <World>");
  });

  it("returns null for null", () => {
    expect(safeVal(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(safeVal(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safeVal("")).toBeNull();
  });

  it("returns whitespace string as-is (whitespace is truthy)", () => {
    expect(safeVal("   ")).toBe("   ");
  });

  it("returns a simple string unchanged", () => {
    expect(safeVal("alice@example.com")).toBe("alice@example.com");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// formatTime
// ──────────────────────────────────────────────────────────────────────────────

describe("formatTime", () => {
  it("formats morning time correctly", () => {
    expect(formatTime("09:30")).toBe("9:30 AM");
  });

  it("formats afternoon time correctly", () => {
    expect(formatTime("14:30")).toBe("2:30 PM");
  });

  it("formats midnight as 12:00 AM", () => {
    expect(formatTime("00:00")).toBe("12:00 AM");
  });

  it("formats noon as 12:00 PM", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });

  it("formats single-digit hour", () => {
    expect(formatTime("09:05")).toBe("9:05 AM");
  });

  it("formats single-digit minute with leading zero", () => {
    expect(formatTime("10:05")).toBe("10:05 AM");
  });

  it("returns empty string for null", () => {
    expect(formatTime(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatTime(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatTime("")).toBe("");
  });

  it("coerces whitespace to NaN and handles gracefully", () => {
    // Whitespace isn't a valid time format; split produces [NaN] which toString() throws
    // This documents current behavior — callers should pass valid "HH:mm" strings
    expect(() => formatTime("   ")).toThrow();
  });

  it("formats 11:59 PM", () => {
    expect(formatTime("23:59")).toBe("11:59 PM");
  });

  it("formats 1:00 AM", () => {
    expect(formatTime("01:00")).toBe("1:00 AM");
  });

  it("formats 12:01 PM", () => {
    expect(formatTime("12:01")).toBe("12:01 PM");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// hasRecipient
// ──────────────────────────────────────────────────────────────────────────────

describe("hasRecipient", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = ORIGINAL_RESEND_API_KEY;
  });

  describe("when RESEND_API_KEY is set", () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = "test-key";
    });

    it("returns true for a valid email", () => {
      expect(hasRecipient("alice@example.com")).toBe(true);
    });

    it("returns false for null", () => {
      expect(hasRecipient(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(hasRecipient(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(hasRecipient("")).toBe(false);
    });

    it("returns false for whitespace-only string", () => {
      expect(hasRecipient("   ")).toBe(false);
    });
  });

  describe("when RESEND_API_KEY is not set", () => {
    it("returns false even with a valid email", () => {
      expect(hasRecipient("alice@example.com")).toBe(false);
    });

    it("returns false for null", () => {
      expect(hasRecipient(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(hasRecipient(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(hasRecipient("")).toBe(false);
    });
  });
});
