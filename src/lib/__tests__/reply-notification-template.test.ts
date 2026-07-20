import { describe, it, expect, beforeAll } from "vitest";

describe("adminReplyTemplate", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adminReplyTemplate: any;

  beforeAll(async () => {
    const mod = await import("@/lib/email/reply-notification-template");
    adminReplyTemplate = mod.adminReplyTemplate;
  });

  const baseParams = {
    visitorName: "Alice Smith",
    message: "Thanks for your question! I'd be happy to help with your website project.",
    adminName: "Emmett",
    conversationId: "conv-123",
  };

  // ─── Basic rendering ────────────────────────────────────────────────────

  it("includes visitor name in the greeting", async () => {
    const { html } = await adminReplyTemplate(baseParams);
    expect(html).toContain("Hi Alice Smith");
  });

  it("includes admin name in the subject line", async () => {
    const { subject } = await adminReplyTemplate(baseParams);
    expect(subject).toContain("Emmett");
  });

  it("includes admin name in the header", async () => {
    const { html } = await adminReplyTemplate(baseParams);
    expect(html).toContain("Reply from Emmett");
  });

  it("includes the reply message in the message box", async () => {
    const { html } = await adminReplyTemplate(baseParams);
    expect(html).toContain("Thanks for your question!");
    expect(html).toContain("happy to help with your website");
  });

  // ─── Empty visitorName ──────────────────────────────────────────────────

  it("renders greeting with empty visitorName", async () => {
    const { html } = await adminReplyTemplate({ ...baseParams, visitorName: "" });
    expect(html).toContain("Hi ,");
    expect(html).not.toContain("null");
    expect(html).not.toContain("undefined");
  });

  // ─── Empty adminName ────────────────────────────────────────────────────

  it("renders subject with empty adminName", async () => {
    const { subject } = await adminReplyTemplate({ ...baseParams, adminName: "" });
    expect(subject).toContain("has replied");
    expect(subject).not.toContain("null");
    expect(subject).not.toContain("undefined");
  });

  it("renders header with empty adminName", async () => {
    const { html } = await adminReplyTemplate({ ...baseParams, adminName: "" });
    expect(html).toContain("Reply from");
    expect(html).not.toContain("null");
    expect(html).not.toContain("undefined");
  });

  // ─── Empty message ──────────────────────────────────────────────────────

  it("renders reply box with empty message", async () => {
    const { html } = await adminReplyTemplate({ ...baseParams, message: "" });
    expect(html).toContain("Reply from Emmett");
    expect(html).not.toContain("null");
    expect(html).not.toContain("undefined");
  });

  // ─── HTML escaping ──────────────────────────────────────────────────────

  it("renders visitorName as-is without HTML escaping", async () => {
    const { html } = await adminReplyTemplate({
      ...baseParams,
      visitorName: "<b>Visitor</b>",
    });
    expect(html).toContain("<b>Visitor</b>");
    expect(html).toContain(">Visitor<");
  });

  it("renders adminName as-is without HTML escaping", async () => {
    const { html, subject } = await adminReplyTemplate({
      ...baseParams,
      adminName: "<b>Admin</b>",
    });
    expect(html).toContain("<b>Admin</b>");
    expect(subject).toContain("<b>Admin</b>");
  });

  it("escapes HTML in message content", async () => {
    const { html } = await adminReplyTemplate({
      ...baseParams,
      message: "<script>alert('xss')</script> & special <chars>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&lt;chars&gt;");
  });
});
