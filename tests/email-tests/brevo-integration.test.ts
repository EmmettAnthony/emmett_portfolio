import { describe, it, expect, vi } from "vitest";

interface SendEmailInput {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  from?: { email: string; name?: string };
  replyTo?: { email: string };
  attachments?: Array<{ content: string; filename: string; type?: string }>;
}

interface EmailProvider {
  send: (input: SendEmailInput) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  validateEmail: (email: string) => boolean;
  getDeliveryStatus: (messageId: string) => Promise<{ status: string; details?: string }>;
}

function createBrevoProvider(apiKey: string): EmailProvider {
  return {
    async send(input) {
      if (!apiKey) return { success: false, error: "API key not configured" };
      if (!input.to?.length) return { success: false, error: "No recipients" };
      if (!input.subject) return { success: false, error: "Subject required" };
      if (!input.html) return { success: false, error: "Content required" };

      for (const recipient of input.to) {
        if (!this.validateEmail(recipient.email)) {
          return { success: false, error: `Invalid email: ${recipient.email}` };
        }
      }

      return { success: true, messageId: `brevo-msg-${Date.now()}` };
    },

    validateEmail(email: string) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    async getDeliveryStatus(messageId: string) {
      if (!messageId) return { status: "unknown" };
      return { status: "delivered", details: "Email delivered successfully" };
    },
  };
}

describe("Brevo Email Integration", () => {
  const provider = createBrevoProvider("test-api-key");

  describe("send", () => {
    it("sends email successfully", async () => {
      const result = await provider.send({
        to: [{ email: "user@example.com", name: "John" }],
        subject: "Test Email",
        html: "<h1>Hello</h1>",
      });
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^brevo-msg-/);
    });

    it("sends to multiple recipients", async () => {
      const result = await provider.send({
        to: [
          { email: "user1@example.com" },
          { email: "user2@example.com" },
        ],
        subject: "Broadcast",
        html: "<p>Broadcast message</p>",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing API key", async () => {
      const badProvider = createBrevoProvider("");
      const result = await badProvider.send({
        to: [{ email: "user@example.com" }],
        subject: "Test",
        html: "<p>Test</p>",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("API key");
    });

    it("rejects invalid email", async () => {
      const result = await provider.send({
        to: [{ email: "not-an-email" }],
        subject: "Test",
        html: "<p>Test</p>",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty recipients", async () => {
      const result = await provider.send({
        to: [],
        subject: "Test",
        html: "<p>Test</p>",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing subject", async () => {
      const result = await provider.send({
        to: [{ email: "user@example.com" }],
        subject: "",
        html: "<p>Test</p>",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("validates correct email", () => {
      expect(provider.validateEmail("test@example.com")).toBe(true);
    });

    it("rejects invalid email", () => {
      expect(provider.validateEmail("not-email")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(provider.validateEmail("")).toBe(false);
    });
  });

  describe("getDeliveryStatus", () => {
    it("returns status for valid message ID", async () => {
      const result = await provider.getDeliveryStatus("brevo-msg-123");
      expect(result.status).toBe("delivered");
    });

    it("returns unknown for empty ID", async () => {
      const result = await provider.getDeliveryStatus("");
      expect(result.status).toBe("unknown");
    });
  });
});
