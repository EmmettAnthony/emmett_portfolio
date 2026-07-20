import { describe, it, expect } from "vitest";

describe("detectFrontendLeadIntent", () => {
  it("returns true when content contains lead keywords", async () => {
    const { detectFrontendLeadIntent } = await import("../chatbot/lead-detection");
    expect(detectFrontendLeadIntent("I want to hire you")).toBe(true);
    expect(detectFrontendLeadIntent("What are your services?")).toBe(true);
    expect(detectFrontendLeadIntent("I need a pricing quote")).toBe(true);
  });

  it("returns false for non-lead content", async () => {
    const { detectFrontendLeadIntent } = await import("../chatbot/lead-detection");
    expect(detectFrontendLeadIntent("Hello, how are you?")).toBe(false);
    expect(detectFrontendLeadIntent("What is the weather like?")).toBe(false);
  });
});

describe("detectLeadIntent", () => {
  it("detects web development intent", async () => {
    const { detectLeadIntent } = await import("../chatbot/lead-detection");
    const result = detectLeadIntent("I need a website for my business");
    expect(result.isLead).toBe(true);
    expect(result.projectType).toBe("web_development");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("detects ecommerce intent", async () => {
    const { detectLeadIntent } = await import("../chatbot/lead-detection");
    const result = detectLeadIntent("I'm interested in setting up an ecommerce marketplace");
    expect(result.isLead).toBe(true);
    expect(result.projectType).toBe("ecommerce");
  });

  it("detects CRM intent", async () => {
    const { detectLeadIntent } = await import("../chatbot/lead-detection");
    const result = detectLeadIntent("Want a custom CRM for my sales pipeline");
    expect(result.isLead).toBe(true);
    expect(result.projectType).toBe("crm");
  });

  it("detects mobile app intent", async () => {
    const { detectLeadIntent } = await import("../chatbot/lead-detection");
    const result = detectLeadIntent("Interested in mobile tools for work");
    expect(result.isLead).toBe(true);
    expect(result.projectType).toBe("mobile_app");
  });

  it("detects API integration intent", async () => {
    const { detectLeadIntent } = await import("../chatbot/lead-detection");
    const result = detectLeadIntent("Require API integration with REST");
    expect(result.isLead).toBe(true);
    expect(result.projectType).toBe("api");
  });

  it("detects general hiring intent", async () => {
    const { detectLeadIntent } = await import("../chatbot/lead-detection");
    const result = detectLeadIntent("I want to hire a developer");
    expect(result.isLead).toBe(true);
    expect(result.confidence).toBe(0.6);
  });

  it("detects booking intent", async () => {
    const { detectLeadIntent } = await import("../chatbot/lead-detection");
    const result = detectLeadIntent("Can I book a consultation?");
    expect(result.suggestsBooking).toBe(true);
  });

  it("returns isLead false for non-lead message", async () => {
    const { detectLeadIntent } = await import("../chatbot/lead-detection");
    const result = detectLeadIntent("Hello, how are you today?");
    expect(result.isLead).toBe(false);
    expect(result.confidence).toBe(0);
  });
});

describe("extractLeadInfo", () => {
  it("extracts name from 'my name is' pattern", async () => {
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    const result = await extractLeadInfo([{ role: "user", content: "Hi, my name is John Doe" }]);
    expect(result.name).toBe("John Doe");
  });

  it("extracts email from text", async () => {
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    const result = await extractLeadInfo([{ role: "user", content: "Email me at john@example.com" }]);
    expect(result.email).toBe("john@example.com");
  });

  it("extracts phone number", async () => {
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    const result = await extractLeadInfo([{ role: "user", content: "Call me at +1234567890" }]);
    expect(result.phone).toBe("+1234567890");
  });

  it("extracts company from pattern", async () => {
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    const result = await extractLeadInfo([{ role: "user", content: "I work at my company called Acme Corp" }]);
    expect(result.company).toBe("Acme Corp");
  });

  it("returns undefined for missing info", async () => {
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    const result = await extractLeadInfo([{ role: "user", content: "Hello" }]);
    expect(result.name).toBeUndefined();
    expect(result.email).toBeUndefined();
    expect(result.phone).toBeUndefined();
  });

  it("includes requirements from all messages", async () => {
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    const result = await extractLeadInfo([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
      { role: "user", content: "I need a website" },
    ]);
    expect(result.requirements).toContain("Hello");
    expect(result.requirements).toContain("I need a website");
  });
});

describe("detectLanguage", () => {
  it("detects french", async () => {
    const { detectLanguage } = await import("../chatbot/lead-detection");
    expect(detectLanguage("Je suis français")).toBe("fr");
  });

  it("detects spanish", async () => {
    const { detectLanguage } = await import("../chatbot/lead-detection");
    expect(detectLanguage("Español me encanta")).toBe("es");
  });

  it("detects german", async () => {
    const { detectLanguage } = await import("../chatbot/lead-detection");
    expect(detectLanguage("Fußball ist gut")).toBe("de");
  });

  it("returns en for unknown language", async () => {
    const { detectLanguage } = await import("../chatbot/lead-detection");
    expect(detectLanguage("Hello, how are you?")).toBe("en");
  });
});
