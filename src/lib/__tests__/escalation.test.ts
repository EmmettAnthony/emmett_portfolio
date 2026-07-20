import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  chatConversation: {
    findUnique: vi.fn(),
  },
}));

const mockResendSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null }));
const mockGetResend = vi.hoisted(() => vi.fn().mockReturnValue({ emails: { send: mockResendSend } }));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/resend", () => ({
  getResend: mockGetResend,
}));

vi.mock("@/data/site-config", () => ({
  siteConfig: {
    links: {
      email: "hello@emmettanthony.dev",
    },
    name: "Emmett Anthony",
    title: "Professional Software Developer",
  },
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("escalationTranscriptTemplate", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let escalationTranscriptTemplate: any;

  beforeAll(async () => {
    const mod = await import("@/lib/email/escalation-template");
    escalationTranscriptTemplate = mod.escalationTranscriptTemplate;
  });

  const baseParams = {
    conversationId: "conv-123",
    visitorName: "Jane Doe",
    visitorEmail: "jane@example.com",
    visitorId: "visitor-456",
    messageCount: 2,
    messages: [
      { role: "user", content: "I need help with a website", createdAt: new Date("2026-07-01T10:00:00Z") },
      { role: "assistant", content: "I'd be happy to help! What kind of website?", createdAt: new Date("2026-07-01T10:00:30Z") },
    ],
    source: "chat_widget",
    language: "en",
  };

  // ─── Subject line ───────────────────────────────────────────────────────

  it("includes visitor name in subject line", () => {
    const { subject } = escalationTranscriptTemplate(baseParams);
    expect(subject).toContain("Jane Doe");
  });

  it("falls back to 'a visitor' in subject when no visitor name", () => {
    const { subject } = escalationTranscriptTemplate({ ...baseParams, visitorName: null });
    expect(subject).toContain("a visitor");
  });

  it("falls back to 'a visitor' in subject when visitorName is undefined", () => {
    const { subject } = escalationTranscriptTemplate({ ...baseParams, visitorName: undefined });
    expect(subject).toContain("a visitor");
  });

  it("falls back to 'a visitor' in subject when visitorName is empty string", () => {
    const { subject } = escalationTranscriptTemplate({ ...baseParams, visitorName: "" });
    expect(subject).toContain("a visitor");
  });

  // ─── HTML structure ─────────────────────────────────────────────────────

  it("contains the urgency header in HTML", () => {
    const { html } = escalationTranscriptTemplate(baseParams);
    expect(html).toContain("Human Assistance Requested");
  });

  it("contains visitor details section", () => {
    const { html } = escalationTranscriptTemplate(baseParams);
    expect(html).toContain("Jane Doe");
    expect(html).toContain("jane@example.com");
    expect(html).toContain("chat_widget");
    expect(html).toContain("en");
    expect(html).toContain("2"); // message count
  });

  it("omits visitor name row when name is null", () => {
    const { html } = escalationTranscriptTemplate({ ...baseParams, visitorName: null });
    expect(html).not.toContain("Name</td>");
  });

  it("omits visitor name row when name is empty string", () => {
    const { html } = escalationTranscriptTemplate({ ...baseParams, visitorName: "" });
    expect(html).not.toContain("Name</td>");
  });

  it("omits visitor email row when email is null", () => {
    const { html } = escalationTranscriptTemplate({ ...baseParams, visitorEmail: null });
    expect(html).not.toContain("Email</td>");
  });

  it("omits visitor email row when email is empty string", () => {
    const { html } = escalationTranscriptTemplate({ ...baseParams, visitorEmail: "" });
    expect(html).not.toContain("Email</td>");
  });

  it("contains the dashboard link with conversation ID", () => {
    const { html } = escalationTranscriptTemplate(baseParams);
    expect(html).toContain("/dashboard/chatbot/conversations/conv-123");
  });

  it("contains the CTA button linking to the dashboard", () => {
    const { html } = escalationTranscriptTemplate(baseParams);
    expect(html).toContain("Open Conversation in Dashboard");
  });

  // ─── Transcript messages ────────────────────────────────────────────────

  it("includes both user and assistant messages in the transcript", () => {
    const { html } = escalationTranscriptTemplate(baseParams);
    expect(html).toContain("I need help with a website");
    expect(html).toContain("happy to help");
  });

  it("labels user messages as 'Visitor' and assistant messages as 'Assistant'", () => {
    const { html } = escalationTranscriptTemplate(baseParams);
    expect(html).toContain(">Visitor<");
    expect(html).toContain(">Assistant<");
  });

  it("shows the conversation transcript header with message count", () => {
    const { html } = escalationTranscriptTemplate(baseParams);
    expect(html).toContain("Conversation Transcript (2 messages)");
  });

  // ─── HTML escaping ──────────────────────────────────────────────────────

  it("escapes HTML in visitor name", () => {
    const { html } = escalationTranscriptTemplate({
      ...baseParams,
      visitorName: "<script>alert('xss')</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in message content", () => {
    const { html } = escalationTranscriptTemplate({
      ...baseParams,
      messages: [{ role: "user", content: "<b>bold</b> & <script>bad()</script>", createdAt: new Date() }],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;");
  });

  // ─── Empty messages ─────────────────────────────────────────────────────

  it("handles empty messages array", () => {
    const { html } = escalationTranscriptTemplate({ ...baseParams, messages: [], messageCount: 0 });
    expect(html).toContain("Conversation Transcript (0 messages)");
    expect(html).not.toContain(">Visitor<");
    expect(html).not.toContain(">Assistant<");
  });

  // ─── Footer ─────────────────────────────────────────────────────────────

  it("contains the site name in the footer", () => {
    const { html } = escalationTranscriptTemplate(baseParams);
    expect(html).toContain("Emmett Anthony");
  });
});

describe("sendEscalationEmail", () => {
  const conversationId = "conv-789";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const buildEscalatedConversation = () => ({
    id: conversationId,
    visitorId: "visitor-123",
    visitorName: "John Smith",
    visitorEmail: "john@example.com",
    status: "ESCALATED",
    source: "chat_widget",
    language: "en",
    messageCount: 3,
    messages: [
      {
        id: "msg-1",
        conversationId,
        role: "user",
        content: "I need to talk to a human",
        createdAt: new Date("2026-07-01T10:00:00Z"),
      },
    ],
    lead: null,
  });

  // ─── Conversation not found ─────────────────────────────────────────────

  it("skips email when conversation is not found", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue(null);

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    const result = await sendEscalationEmail(conversationId);

    expect(result).toBeUndefined();
    expect(mockGetResend).not.toHaveBeenCalled();
  });

  // ─── Not escalated ──────────────────────────────────────────────────────

  it("skips email when conversation status is not ESCALATED", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue({
      ...buildEscalatedConversation(),
      status: "ACTIVE",
    });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    const result = await sendEscalationEmail(conversationId);

    expect(result).toBeUndefined();
    expect(mockGetResend).not.toHaveBeenCalled();
  });

  it("skips email for RESOLVED conversations", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue({
      ...buildEscalatedConversation(),
      status: "RESOLVED",
    });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    const result = await sendEscalationEmail(conversationId);

    expect(result).toBeUndefined();
    expect(mockGetResend).not.toHaveBeenCalled();
  });

  // ─── Successful send ────────────────────────────────────────────────────

  it("sends email with correct recipient for ESCALATED conversation", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue(buildEscalatedConversation());
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    const result = await sendEscalationEmail(conversationId);

    expect(result).not.toBeNull();
    expect(mockGetResend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });

  it("sends email to the site owner email from siteConfig", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue(buildEscalatedConversation());
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    await sendEscalationEmail(conversationId);

    const callArgs = mockResendSend.mock.calls[0][0];
    expect(callArgs.to).toBe("hello@emmettanthony.dev");
  });

  it("sets replyTo to the visitor email", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue(buildEscalatedConversation());
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    await sendEscalationEmail(conversationId);

    const callArgs = mockResendSend.mock.calls[0][0];
    expect(callArgs.replyTo).toBe("john@example.com");
  });

  it("includes subject and html content in the email", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue(buildEscalatedConversation());
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    await sendEscalationEmail(conversationId);

    const callArgs = mockResendSend.mock.calls[0][0];
    expect(callArgs.subject).toContain("John Smith");
    expect(callArgs.html).toContain("John Smith");
    expect(callArgs.html).toContain("I need to talk to a human");
  });

  it("includes conversation ID tag", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue(buildEscalatedConversation());
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    await sendEscalationEmail(conversationId);

    const callArgs = mockResendSend.mock.calls[0][0];
    expect(callArgs.tags).toContainEqual({ name: "conversationId", value: conversationId });
    expect(callArgs.tags).toContainEqual({ name: "type", value: "chat_escalation" });
  });

  // ─── No visitor email ───────────────────────────────────────────────────

  it("sends email even when visitor has no email (replyTo is undefined)", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue({
      ...buildEscalatedConversation(),
      visitorEmail: null,
    });
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    await sendEscalationEmail(conversationId);

    const callArgs = mockResendSend.mock.calls[0][0];
    expect(callArgs.replyTo).toBeUndefined();
    expect(mockGetResend).toHaveBeenCalledTimes(1);
  });

  // ─── Resend API error ───────────────────────────────────────────────────

  it("handles Resend API error gracefully", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue(buildEscalatedConversation());
    mockResendSend.mockResolvedValue({ data: null, error: new Error("API rate limited") });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    const result = await sendEscalationEmail(conversationId);

    expect(result).toEqual({ data: null, error: new Error("API rate limited") });
  });

  // ─── Exception handling ─────────────────────────────────────────────────

  it("returns null when an exception is thrown", async () => {
    mockPrisma.chatConversation.findUnique.mockRejectedValue(new Error("Database connection failed"));

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    const result = await sendEscalationEmail(conversationId);

    expect(result).toBeNull();
  });

  // ─── With lead data ─────────────────────────────────────────────────────

  it("includes lead information when present", async () => {
    mockPrisma.chatConversation.findUnique.mockResolvedValue({
      ...buildEscalatedConversation(),
      lead: {
        id: "lead-1",
        name: "John Smith",
        email: "john@example.com",
        phone: "+1 555-0000",
        company: "Acme Inc",
        budget: "1000_5000",
        timeline: "1-3 months",
        requirements: "Need a website",
      },
    });
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

    const { sendEscalationEmail } = await import("@/lib/chatbot/escalation");
    await sendEscalationEmail(conversationId);

    expect(mockGetResend).toHaveBeenCalledTimes(1);
  });
});
