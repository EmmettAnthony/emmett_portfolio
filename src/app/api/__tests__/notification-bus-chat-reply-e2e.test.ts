// ──────────────────────────────────────────────────────────────────────────────
// Notification Bus — Chat Reply Email Guard Test
// ──────────────────────────────────────────────────────────────────────────────
// Tests that POST /api/chat/conversations/[id]/reply correctly skips email
// sending when recipientEmail is null, empty, or whitespace-only.
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ─────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn());
const mockEmailSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: {}, error: null }));

const mockConversationFindUnique = vi.hoisted(() => vi.fn());
const mockMessageCreate = vi.hoisted(() => vi.fn());
const mockConversationUpdate = vi.hoisted(() => vi.fn());
const mockNotifCreate = vi.hoisted(() => vi.fn());
const mockNotifPrefFindUnique = vi.hoisted(() => vi.fn());
const mockNotifLogCreate = vi.hoisted(() => vi.fn());
const mockLogActivity = vi.hoisted(() => vi.fn());

// ─── Module-level mocks ───────────────────────────────────────────────────

vi.mock("@/../auth", () => ({ auth: mockAuth }));

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({
    emails: { send: mockEmailSend },
  })),
}));

vi.mock("@/lib/email/reply-notification-template", () => ({
  adminReplyTemplate: vi.fn(() => ({
    subject: "💬 Emmett has replied to your message",
    html: "<p>Reply content</p>",
  })),
}));

vi.mock("@/lib/sentry", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/activity", () => ({ logActivity: mockLogActivity }));

vi.mock("@/lib/db", () => {
  const prismaObj = {
    chatConversation: {
      findUnique: (...args: unknown[]) => mockConversationFindUnique(...args),
      update: (...args: unknown[]) => mockConversationUpdate(...args),
    },
    chatMessage: {
      create: (...args: unknown[]) => mockMessageCreate(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotifCreate(...args),
    },
    notificationPreference: {
      findUnique: (...args: unknown[]) => mockNotifPrefFindUnique(...args),
    },
    notificationLog: {
      create: (...args: unknown[]) => mockNotifLogCreate(...args),
    },
  };
  return {
    getPrisma: vi.fn(() => prismaObj),
    prisma: prismaObj,
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────

const BASE_CONVERSATION = {
  id: "conv-reply-1",
  status: "ACTIVE",
  visitorName: "Alice Smith",
  visitorEmail: "alice@example.com",
  lead: null,
  messageCount: 3,
  lastActivityAt: new Date(),
};

// ═════════════════════════════════════════════════════════════════════════════
// Setup
// ═════════════════════════════════════════════════════════════════════════════

beforeEach(() => {
  vi.clearAllMocks();

  mockAuth.mockResolvedValue({ user: { id: "admin-1", name: "Emmett" } });

  mockConversationFindUnique.mockResolvedValue(BASE_CONVERSATION);
  mockMessageCreate.mockResolvedValue({
    id: "msg-1",
    conversationId: "conv-reply-1",
    role: "assistant",
    content: "Thanks for reaching out!",
  });
  mockConversationUpdate.mockResolvedValue({});
});

// ═════════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════════

describe("Chat Reply Email Guard: POST /api/chat/conversations/[id]/reply", () => {
  const REPLY_URL = "http://localhost:3000/api/chat/conversations/conv-reply-1/reply";

  it("sends email when recipientEmail is valid", async () => {
    const { POST } = await import("@/app/api/chat/conversations/[id]/reply/route");

const request = new Request(REPLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Thanks for reaching out!" }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "conv-reply-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        subject: expect.stringContaining("has replied"),
      })
    );
  });

  it("does NOT send email when recipientEmail is null", async () => {
    mockConversationFindUnique.mockResolvedValue({
      ...BASE_CONVERSATION,
      visitorEmail: null,
      lead: null,
    });

    const { POST } = await import("@/app/api/chat/conversations/[id]/reply/route");

const request = new Request(REPLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Reply to anonymous" }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "conv-reply-1" }),
    });

    expect(response.status).toBe(200);
    // Reply saved, but no email sent
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("does NOT send email when recipientEmail is empty string", async () => {
    mockConversationFindUnique.mockResolvedValue({
      ...BASE_CONVERSATION,
      visitorEmail: "",
      lead: null,
    });

    const { POST } = await import("@/app/api/chat/conversations/[id]/reply/route");

const request = new Request(REPLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Reply with empty email" }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "conv-reply-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("does NOT send email when recipientEmail is whitespace-only", async () => {
    mockConversationFindUnique.mockResolvedValue({
      ...BASE_CONVERSATION,
      visitorEmail: "   ",
      lead: null,
    });

    const { POST } = await import("@/app/api/chat/conversations/[id]/reply/route");

const request = new Request(REPLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Reply whitespace email" }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "conv-reply-1" }),
    });

    expect(response.status).toBe(200);
    // Whitespace-only is caught by .trim() — no email sent
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("does NOT send email when sendEmail is explicitly false", async () => {
    const { POST } = await import("@/app/api/chat/conversations/[id]/reply/route");

const request = new Request(REPLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Thanks!", sendEmail: false }),
    });

    const response = await POST(// eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextRequest type compat
request as any, {
      params: Promise.resolve({ id: "conv-reply-1" }),
    });

    expect(response.status).toBe(200);
    // sendEmail: false skips the entire email block
    expect(mockEmailSend).not.toHaveBeenCalled();
  });
});
