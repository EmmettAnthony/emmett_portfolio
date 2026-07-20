import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockResendSend = vi.fn();

vi.mock("@/lib/resend", () => ({
  getResend: vi.fn(() => ({
    emails: {
      send: (...args: unknown[]) => mockResendSend(...args),
    },
  })),
}));

describe("email/index", () => {
  let OLD_ENV: NodeJS.ProcessEnv;

  beforeEach(() => {
    OLD_ENV = process.env;
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_BASE_URL = "https://emmettanthony.dev";
    process.env.NEWSLETTER_FROM_EMAIL = "noreply@emmettanthony.dev";
    process.env.NEWSLETTER_REPLY_TO = "help@emmettanthony.dev";
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.clearAllMocks();
  });

  describe("personalizeContent", () => {
    it("returns content with variables still present", async () => {
      const { personalizeContent } = await import("../email/index");
      const content = "Hello {{first_name}} {{last_name}}!";
      const subscriber = { firstName: "John", lastName: "Doe", email: "john@example.com" };
      const result = personalizeContent(content, subscriber as any);
      expect(result).toBe("Hello {{first_name}} {{last_name}}!");
    });

    it("does not replace unknown variables", async () => {
      const { personalizeContent } = await import("../email/index");
      const result = personalizeContent("Hello {{unknown_var}}", { firstName: "Test", email: "t@t.com" } as any);
      expect(result).toBe("Hello {{unknown_var}}");
    });

    it("handles subscriber with missing fields", async () => {
      const { personalizeContent } = await import("../email/index");
      const result = personalizeContent("text {{first_name}} end", { lastName: "" } as any);
      expect(result).toBe("text {{first_name}} end");
    });

    it("handles null subscriber fields", async () => {
      const { personalizeContent } = await import("../email/index");
      const result = personalizeContent("{{first_name}}", { firstName: null, email: null } as any);
      expect(result).toBe("{{first_name}}");
    });

    it("processes vars map entries sequentially", async () => {
      const { personalizeContent } = await import("../email/index");
      const result = personalizeContent("{{first_name}} {{last_name}}", { firstName: "A", lastName: "B", email: "c@c.com" } as any);
      expect(result).toBe("{{first_name}} {{last_name}}");
    });
  });

  describe("getOpenTrackingPixel", () => {
    it("generates tracking pixel URL with env base URL", async () => {
      const { getOpenTrackingPixel } = await import("../email/index");
      const url = getOpenTrackingPixel("camp-1", "sub-1");
      expect(url).toBe("https://emmettanthony.dev/api/newsletter/track/open?campaignId=camp-1&subscriberId=sub-1");
    });

    it("falls back to default URL when env not set", async () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;
      const { getOpenTrackingPixel } = await import("../email/index");
      const url = getOpenTrackingPixel("camp-2", "sub-2");
      expect(url).toBe("https://emmettanthony.dev/api/newsletter/track/open?campaignId=camp-2&subscriberId=sub-2");
    });
  });

  describe("getClickTrackingUrl", () => {
    it("generates click tracking URL with encoded target URL", async () => {
      const { getClickTrackingUrl } = await import("../email/index");
      const url = getClickTrackingUrl("camp-1", "sub-1", "https://example.com/page?q=1");
      expect(url).toContain("campaignId=camp-1");
      expect(url).toContain("subscriberId=sub-1");
      expect(url).toContain("url=https%3A%2F%2Fexample.com%2Fpage%3Fq%3D1");
    });

    it("falls back to default base URL", async () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;
      const { getClickTrackingUrl } = await import("../email/index");
      const url = getClickTrackingUrl("camp-2", "sub-2", "https://test.com");
      expect(url).toContain("https://emmettanthony.dev");
    });
  });

  describe("wrapEmailContent", () => {
    it("wraps content with tracking pixel and footer", async () => {
      const { wrapEmailContent } = await import("../email/index");
      const result = wrapEmailContent("<p>Hello</p>", "camp-1", "sub-1", "user@test.com");
      expect(result).toContain("<p>Hello</p>");
      expect(result).toContain("track/open?campaignId=camp-1&subscriberId=sub-1");
      expect(result).toContain("camp-1");
      expect(result).toContain("sub-1");
      expect(result).toContain("Unsubscribe");
      expect(result).toContain("Update Preferences");
    });

    it("omits tracking pixel when trackOpens=false", async () => {
      const { wrapEmailContent } = await import("../email/index");
      const result = wrapEmailContent("<p>No tracking</p>", "camp-1", "sub-1", "user@test.com", { trackOpens: false });
      expect(result).not.toContain("track/open");
    });

    it("uses custom unsubscribe footer when provided", async () => {
      const { wrapEmailContent } = await import("../email/index");
      const result = wrapEmailContent("<p>Custom footer</p>", "camp-1", "sub-1", "user@test.com", {
        unsubscribeFooter: "<p>Custom Footer</p>",
      });
      expect(result).toContain("Custom Footer");
      expect(result).not.toContain("You're receiving this");
    });

    it("encodes email in URLs", async () => {
      const { wrapEmailContent } = await import("../email/index");
      const result = wrapEmailContent("", "c1", "s1", "user+tag@test.com");
      expect(result).toContain("user%2Btag%40test.com");
    });
  });

  describe("sendEmail", () => {
    it("sends email successfully", async () => {
      mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
      const { sendEmail } = await import("../email/index");
      const result = await sendEmail({
        to: "user@test.com",
        subject: "Test",
        html: "<p>Hello</p>",
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: "email-1" });
      expect(result.error).toBeNull();
    });

    it("uses custom from and replyTo", async () => {
      mockResendSend.mockResolvedValue({ data: { id: "email-2" }, error: null });
      const { sendEmail } = await import("../email/index");
      await sendEmail({
        to: "user@test.com",
        subject: "Test",
        html: "<p>Hi</p>",
        from: "Custom <custom@test.com>",
        replyTo: "reply@test.com",
      });
      expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
        from: "Custom <custom@test.com>",
        replyTo: "reply@test.com",
      }));
    });

    it("falls back to env for from and replyTo", async () => {
      mockResendSend.mockResolvedValue({ data: { id: "email-3" }, error: null });
      const { sendEmail } = await import("../email/index");
      await sendEmail({
        to: "user@test.com",
        subject: "Test",
        html: "<p>Hi</p>",
      });
      expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
        from: "noreply@emmettanthony.dev",
        replyTo: "help@emmettanthony.dev",
      }));
    });

    it("falls back to DEFAULT_FROM when no env set", async () => {
      delete process.env.NEWSLETTER_FROM_EMAIL;
      mockResendSend.mockResolvedValue({ data: { id: "email-4" }, error: null });
      const { sendEmail } = await import("../email/index");
      await sendEmail({
        to: "user@test.com",
        subject: "Test",
        html: "<p>Hi</p>",
      });
      expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
        from: "Emmett Anthony <newsletter@emmettanthony.dev>",
      }));
    });

    it("includes campaign tags when campaignId provided", async () => {
      mockResendSend.mockResolvedValue({ data: { id: "email-5" }, error: null });
      const { sendEmail } = await import("../email/index");
      await sendEmail({
        to: "user@test.com",
        subject: "Test",
        html: "<p>Hi</p>",
        campaignId: "camp-1",
        subscriberId: "sub-1",
      });
      expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
        tags: [
          { name: "campaignId", value: "camp-1" },
          { name: "subscriberId", value: "sub-1" },
        ],
      }));
    });

    it("omits tags when no campaignId", async () => {
      mockResendSend.mockResolvedValue({ data: { id: "email-6" }, error: null });
      const { sendEmail } = await import("../email/index");
      await sendEmail({
        to: "user@test.com",
        subject: "Test",
        html: "<p>Hi</p>",
      });
      expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
        tags: undefined,
      }));
    });

    it("handles array of recipients", async () => {
      mockResendSend.mockResolvedValue({ data: { id: "email-7" }, error: null });
      const { sendEmail } = await import("../email/index");
      await sendEmail({
        to: ["a@test.com", "b@test.com"],
        subject: "Broadcast",
        html: "<p>Hi</p>",
      });
      expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
        to: ["a@test.com", "b@test.com"],
      }));
    });

    it("returns error when resend throws", async () => {
      mockResendSend.mockRejectedValue(new Error("Network error"));
      const { sendEmail } = await import("../email/index");
      const result = await sendEmail({
        to: "user@test.com",
        subject: "Fail",
        html: "<p>Oops</p>",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("handles non-Error exception", async () => {
      mockResendSend.mockRejectedValue("string error");
      const { sendEmail } = await import("../email/index");
      const result = await sendEmail({
        to: "user@test.com",
        subject: "Fail",
        html: "<p>Oops</p>",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("returns resend error from response", async () => {
      mockResendSend.mockResolvedValue({ data: null, error: { message: "Rate limited" } });
      const { sendEmail } = await import("../email/index");
      const result = await sendEmail({
        to: "user@test.com",
        subject: "Fail",
        html: "<p>Oops</p>",
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Rate limited" });
    });
  });

  describe("sendCampaignEmail", () => {
    it("sends personalized campaign email", async () => {
      mockResendSend.mockResolvedValue({ data: { id: "campaign-1" }, error: null });
      const { sendCampaignEmail } = await import("../email/index");
      const campaign = {
        id: "camp-1",
        subject: "Hello {{first_name}}!",
        content: "<p>Hi {{first_name}} {{last_name}},</p>",
        senderName: "Emmett",
        senderEmail: "emmett@test.com",
      } as any;
      const subscriber = {
        id: "sub-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
      } as any;

      const result = await sendCampaignEmail(campaign, subscriber);
      expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
        to: ["john@test.com"],
        subject: "Hello {{first_name}}!",
        from: "Emmett <emmett@test.com>",
        replyTo: "emmett@test.com",
        tags: expect.arrayContaining([
          { name: "campaignId", value: "camp-1" },
          { name: "subscriberId", value: "sub-1" },
        ]),
      }));
      const htmlArg = mockResendSend.mock.calls[0][0].html;
      expect(htmlArg).toContain("<p>Hi {{first_name}} {{last_name}},</p>");
      expect(htmlArg).toContain("track/open?campaignId=camp-1&subscriberId=sub-1");
      expect(htmlArg).toContain("Unsubscribe");
      expect(result).toEqual({ success: true, data: { id: "campaign-1" }, error: null });
    });

    it("handles missing sender info", async () => {
      mockResendSend.mockResolvedValue({ data: { id: "campaign-2" }, error: null });
      const { sendCampaignEmail } = await import("../email/index");
      const campaign = {
        id: "camp-2",
        subject: "Test",
        content: "<p>Hi</p>",
      } as any;
      const subscriber = {
        id: "sub-2",
        firstName: "Jane",
        email: "jane@test.com",
      } as any;

      await sendCampaignEmail(campaign, subscriber);
      expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
        from: "noreply@emmettanthony.dev",
      }));
    });

    it("passes tracking options (trackOpens=false)", async () => {
      mockResendSend.mockResolvedValue({ data: { id: "campaign-3" }, error: null });
      const { sendCampaignEmail } = await import("../email/index");
      const campaign = { id: "camp-3", subject: "Test", content: "<p>Hi</p>" } as any;
      const subscriber = { id: "sub-3", firstName: "Bob", email: "bob@test.com" } as any;

      await sendCampaignEmail(campaign, subscriber, { trackOpens: false, unsubscribeFooter: null });
      const htmlArg = mockResendSend.mock.calls[0][0].html;
      expect(htmlArg).not.toContain("track/open");
    });
  });

  describe("buildEmailFromBlocks", () => {
    it("renders a text block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "text", content: { text: "Hello World" } }]);
      expect(result).toContain("Hello World");
      expect(result).toContain("font-size:14px");
    });

    it("renders a text block with custom style", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "text", content: { text: "Styled", fontSize: "18", color: "#ff0000", alignment: "center" } }]);
      expect(result).toContain("font-size:18px");
      expect(result).toContain("color:#ff0000");
      expect(result).toContain("text-align:center");
    });

    it("renders an image block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "image", content: { src: "https://example.com/img.jpg", alt: "Test" } }]);
      expect(result).toContain("img.jpg");
      expect(result).toContain('alt="Test"');
    });

    it("returns empty for image without src", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "image", content: { alt: "No src" } }]);
      expect(result).not.toContain("<img");
    });

    it("renders a button block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "button", content: { text: "Click Me", url: "https://example.com" } }]);
      expect(result).toContain("Click Me");
      expect(result).toContain("https://example.com");
    });

    it("renders button with defaults", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "button", content: {} }]);
      expect(result).toContain("Click Here");
      expect(result).toContain('href="#"');
    });

    it("renders a divider block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "divider", content: { color: "#000", style: "dashed", thickness: "2" } }]);
      expect(result).toContain("border-top:2px dashed #000");
    });

    it("renders divider with defaults", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "divider", content: {} }]);
      expect(result).toContain("border-top:1px solid #e5e7eb");
    });

    it("renders a spacer block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "spacer", content: { height: 40 } }]);
      expect(result).toContain("padding:40px 0");
    });

    it("renders spacer with default height", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "spacer", content: {} }]);
      expect(result).toContain("padding:20px 0");
    });

    it("renders a header block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "header", content: { text: "Big Title", size: "h1" } }]);
      expect(result).toContain("<h1");
      expect(result).toContain("Big Title");
      expect(result).toContain("font-size:28px");
    });

    it("renders header with defaults", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "header", content: {} }]);
      expect(result).toContain("<h2");
    });

    it("renders a footer block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "footer", content: { text: "Footer text" } }]);
      expect(result).toContain("Footer text");
      expect(result).toContain("font-size:12px");
    });

    it("renders a cta block with all fields", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "cta", content: {
        heading: "Act Now",
        description: "Limited time offer",
        buttonText: "Buy",
        buttonUrl: "https://shop.com",
        buttonColor: "#00ff00",
      } }]);
      expect(result).toContain("Act Now");
      expect(result).toContain("Limited time offer");
      expect(result).toContain("Buy");
      expect(result).toContain("https://shop.com");
      expect(result).toContain("background-color:#00ff00");
    });

    it("renders cta with minimal fields", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "cta", content: {} }]);
      expect(result).toContain("Get Started");
      expect(result).not.toContain("<h2");
      expect(result).not.toContain("<p");
    });

    it("renders columns block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "columns", content: {
        leftContent: "<p>Left</p>",
        rightContent: "<p>Right</p>",
        leftWidth: "60",
        rightWidth: "40",
        gap: 20,
      } }]);
      expect(result).toContain("<p>Left</p>");
      expect(result).toContain("<p>Right</p>");
    });

    it("renders a table block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "table", content: {
        headers: ["Name", "Age"],
        rows: [["Alice", "30"], ["Bob", "25"]],
        borderColor: "#ccc",
      } }]);
      expect(result).toContain("Alice");
      expect(result).toContain("Bob");
      expect(result).toContain("<th");
    });

    it("renders table without headers", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "table", content: { rows: [["Data"]] } }]);
      expect(result).not.toContain("<thead");
      expect(result).toContain("Data");
    });

    it("renders a variable block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "variable", content: { variable: "{{name}}" } }]);
      expect(result).toContain("{{name}}");
      expect(result).toContain("background:#dbeafe");
    });

    it("renders variable with default", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "variable", content: {} }]);
      expect(result).toContain("{{variable}}");
    });

    it("renders an html block", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "html", content: { html: "<custom>raw</custom>" } }]);
      expect(result).toContain("<custom>raw</custom>");
    });

    it("skips unknown block types", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([{ type: "unknown", content: {} }]);
      expect(result).toContain("max-width:600px");
    });

    it("combines multiple blocks", async () => {
      const { buildEmailFromBlocks } = await import("../email/index");
      const result = buildEmailFromBlocks([
        { type: "text", content: { text: "Block1" } },
        { type: "divider", content: {} },
        { type: "text", content: { text: "Block2" } },
      ]);
      expect(result).toContain("Block1");
      expect(result).toContain("Block2");
      expect(result).toContain("<hr");
    });
  });
});
