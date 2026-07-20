import { describe, it, expect } from "vitest";

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function hasSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bOR\b.*\b1\s*=\s*1\b)/i,
    /'(\s*OR\s*|\s*AND\s*)'?'?\s*\w+\s*=\s*\w+/i,
    /--\s*$/m,
    /;\s*$/,
  ];
  return sqlPatterns.some((pattern) => pattern.test(input));
}

function hasXss(input: string): boolean {
  const xssPatterns = [
    /<script[\s>]/i,
    /javascript\s*:/i,
    /on\w+\s*=\s*["']/i,
    /<iframe[\s>]/i,
    /<img[\s>].*onerror/i,
    /alert\s*\(/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /<svg[\s>]/i,
    /<[^>]*on\w+\s*=/i,
  ];
  return xssPatterns.some((pattern) => pattern.test(input));
}

function validateFileUpload(filename: string, sizeBytes: number, mimeType: string): { valid: boolean; error?: string } {
  const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".gif", ".svg"];
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
  ];
  const maxSizeBytes = 10 * 1024 * 1024;

  if (sizeBytes <= 0) return { valid: false, error: "File is empty" };
  if (sizeBytes > maxSizeBytes) return { valid: false, error: "File exceeds 10MB limit" };

  const ext = "." + filename.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(ext)) return { valid: false, error: `File extension ${ext} not allowed` };
  if (!allowedMimeTypes.includes(mimeType)) return { valid: false, error: `MIME type ${mimeType} not allowed` };

  if (ext === ".svg" && mimeType === "image/svg+xml") {
    return { valid: true, warning: "SVG files may contain embedded scripts" };
  }

  return { valid: true };
}

function rateLimit(requests: number[], windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recentRequests = requests.filter((t) => t > windowStart);
  return recentRequests.length >= maxRequests;
}

function validatePasswordStrength(password: string): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 20;
  else feedback.push("At least 8 characters");

  if (/[A-Z]/.test(password)) score += 20;
  else feedback.push("Include uppercase letter");

  if (/[a-z]/.test(password)) score += 20;
  else feedback.push("Include lowercase letter");

  if (/[0-9]/.test(password)) score += 20;
  else feedback.push("Include number");

  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  else feedback.push("Include special character");

  return { score, feedback };
}

describe("Security Tests", () => {
  describe("sanitizeInput", () => {
    it("escapes HTML tags", () => {
      expect(sanitizeInput("<script>alert('xss')</script>")).not.toContain("<script>");
    });

    it("preserves safe text", () => {
      expect(sanitizeInput("Hello, world!")).toBe("Hello, world!");
    });

    it("escapes quotes", () => {
      expect(sanitizeInput(`He said "hello"`)).toContain("&quot;");
    });

    it("handles empty string", () => {
      expect(sanitizeInput("")).toBe("");
    });
  });

  describe("hasSqlInjection", () => {
    it("detects SELECT FROM injection", () => {
      expect(hasSqlInjection("SELECT * FROM users")).toBe(true);
    });

    it("detects OR 1=1 injection", () => {
      expect(hasSqlInjection("SELECT * FROM users WHERE id = 1 OR 1=1")).toBe(true);
    });

    it("detects DROP TABLE injection", () => {
      expect(hasSqlInjection("DROP TABLE invoices")).toBe(true);
    });

    it("detects UNION injection", () => {
      expect(hasSqlInjection("UNION SELECT * FROM passwords")).toBe(true);
    });

    it("allows safe input", () => {
      expect(hasSqlInjection("John Doe")).toBe(false);
    });
  });

  describe("hasXss", () => {
    it("detects script tags", () => {
      expect(hasXss("<script>alert(1)</script>")).toBe(true);
    });

    it("detects event handlers", () => {
      expect(hasXss('<img src=x onerror="alert(1)">')).toBe(true);
    });

    it("detects javascript: protocol", () => {
      expect(hasXss('javascript:alert(1)')).toBe(true);
    });

    it("detects iframe injection", () => {
      expect(hasXss("<iframe src='http://evil.com'></iframe>")).toBe(true);
    });

    it("allows safe HTML", () => {
      expect(hasXss("<p>Safe content</p>")).toBe(false);
    });
  });

  describe("validateFileUpload", () => {
    it("accepts valid PDF", () => {
      expect(validateFileUpload("document.pdf", 500000, "application/pdf").valid).toBe(true);
    });

    it("rejects executable", () => {
      expect(validateFileUpload("virus.exe", 1000, "application/x-msdownload").valid).toBe(false);
    });

    it("rejects oversized file", () => {
      expect(validateFileUpload("large.pdf", 50 * 1024 * 1024, "application/pdf").valid).toBe(false);
    });

    it("rejects empty file", () => {
      expect(validateFileUpload("empty.pdf", 0, "application/pdf").valid).toBe(false);
    });

    it("warns about SVG files", () => {
      const result = validateFileUpload("image.svg", 10000, "image/svg+xml");
      expect(result.valid).toBe(true);
      expect(result.warning).toBeDefined();
    });
  });

  describe("rateLimit", () => {
    it("blocks when limit exceeded", () => {
      const now = Date.now();
      const requests = [now - 100, now - 200, now - 300, now - 400, now - 500];
      expect(rateLimit(requests, 1000, 5)).toBe(true);
    });

    it("allows when under limit", () => {
      const now = Date.now();
      const requests = [now - 100, now - 200];
      expect(rateLimit(requests, 1000, 5)).toBe(false);
    });

    it("considers window", () => {
      const now = Date.now();
      const requests = [now - 5000, now - 4000, now - 3000, now - 2000, now - 1000];
      expect(rateLimit(requests, 2000, 5)).toBe(false);
    });
  });

  describe("validatePasswordStrength", () => {
    it("scores strong password 100", () => {
      const result = validatePasswordStrength("StrongP@ss1");
      expect(result.score).toBe(100);
    });

    it("provides feedback for weak password", () => {
      const result = validatePasswordStrength("weak");
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });
});
