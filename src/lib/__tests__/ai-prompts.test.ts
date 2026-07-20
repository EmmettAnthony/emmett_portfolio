import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSiteSettingsFindFirst = vi.fn();
const mockChatSettingsFindFirst = vi.fn();
const mockKnowledgeBaseCount = vi.fn();
const mockKnowledgeBaseFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    chatSettings: { findFirst: mockChatSettingsFindFirst },
    knowledgeBase: { count: mockKnowledgeBaseCount, findMany: mockKnowledgeBaseFindMany },
  },
}));

vi.mock("@/lib/get-site-settings", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    email: "hello@emmettanthony.dev",
    address: "Liberia",
    social: { linkedin: "https://linkedin.com/in/emmettanthony", github: "https://github.com/emmettanthony" },
  }),
}));

describe("getDefaultSystemPrompt", () => {
  it("returns a string containing Emmett Anthony", async () => {
    const { getDefaultSystemPrompt } = await import("../ai/prompts");
    const result = getDefaultSystemPrompt();
    expect(result).toContain("Emmett Anthony");
  });

  it("contains services list", async () => {
    const { getDefaultSystemPrompt } = await import("../ai/prompts");
    const result = getDefaultSystemPrompt();
    expect(result).toContain("Web Development");
    expect(result).toContain("CRM Systems");
  });

  it("contains behavior rules", async () => {
    const { getDefaultSystemPrompt } = await import("../ai/prompts");
    const result = getDefaultSystemPrompt();
    expect(result).toContain("conversational");
    expect(result).toContain("booking");
  });
});

describe("buildSystemPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL = "https://cal.example.com";
  });

  it("returns prompt with knowledge base count", async () => {
    mockChatSettingsFindFirst.mockResolvedValue({ systemPrompt: "Custom prompt" });
    mockKnowledgeBaseCount.mockResolvedValue(10);
    const { buildSystemPrompt } = await import("../ai/prompts");
    const result = await buildSystemPrompt();
    expect(result).toContain("Custom prompt");
    expect(result).toContain("10 knowledge base articles");
    expect(result).toContain("hello@emmettanthony.dev");
    expect(result).toContain("cal.example.com");
  });

  it("uses default system prompt when no chatSettings", async () => {
    mockChatSettingsFindFirst.mockResolvedValue(null);
    mockKnowledgeBaseCount.mockResolvedValue(0);
    const { buildSystemPrompt } = await import("../ai/prompts");
    const result = await buildSystemPrompt();
    expect(result).toContain("AI assistant for Emmett Anthony");
    expect(result).toContain("0 knowledge base articles");
  });

  it("uses fallback calendar URL when env var not set", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL;
    mockChatSettingsFindFirst.mockResolvedValue({ systemPrompt: "test" });
    mockKnowledgeBaseCount.mockResolvedValue(0);
    const { buildSystemPrompt } = await import("../ai/prompts");
    const result = await buildSystemPrompt();
    expect(result).toContain("calendar.app.google");
  });
});

describe("getKnowledgeContext", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns empty string when no results", async () => {
    mockKnowledgeBaseFindMany.mockResolvedValue([]);
    const { getKnowledgeContext } = await import("../ai/prompts");
    const result = await getKnowledgeContext("test");
    expect(result).toBe("");
  });

  it("returns formatted context when results found", async () => {
    mockKnowledgeBaseFindMany.mockResolvedValue([
      { id: "1", title: "My Article", content: "Content here", tags: ["test"], category: { name: "FAQ" } },
    ]);
    const { getKnowledgeContext } = await import("../ai/prompts");
    const result = await getKnowledgeContext("test");
    expect(result).toContain("My Article");
    expect(result).toContain("FAQ");
    expect(result).toContain("Content here");
  });

  it("handles missing category gracefully", async () => {
    mockKnowledgeBaseFindMany.mockResolvedValue([
      { id: "2", title: "Article 2", content: "Some content", tags: [], category: null },
    ]);
    const { getKnowledgeContext } = await import("../ai/prompts");
    const result = await getKnowledgeContext("test");
    expect(result).toContain("Article 2");
    expect(result).not.toContain("Category:");
  });
});
