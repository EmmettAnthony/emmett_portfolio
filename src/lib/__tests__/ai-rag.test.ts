import { describe, it, expect, vi, beforeEach } from "vitest";

const mockKnowledgeBaseFindMany = vi.fn();
const mockProjectFindMany = vi.fn();
const mockBlogPostFindMany = vi.fn();
const mockResumeProfileFindFirst = vi.fn();
const mockSupportKnowledgeArticleFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    knowledgeBase: { findMany: mockKnowledgeBaseFindMany },
    project: { findMany: mockProjectFindMany },
    blogPost: { findMany: mockBlogPostFindMany },
    resumeProfile: { findFirst: mockResumeProfileFindFirst },
    supportKnowledgeArticle: { findMany: mockSupportKnowledgeArticleFindMany },
  },
}));

vi.mock("@/lib/ai/embeddings", () => ({
  searchByVector: vi.fn(),
}));

describe("searchKnowledgeBase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses vector search when vectorIds found", async () => {
    const { searchByVector } = await import("@/lib/ai/embeddings");
    (searchByVector as ReturnType<typeof vi.fn>).mockResolvedValue(["kb-2", "kb-1"]);
    mockKnowledgeBaseFindMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) => {
      if (where?.id?.in?.includes("kb-1") && where?.id?.in?.includes("kb-2")) {
        return [{ id: "kb-1", title: "A", content: "C1", tags: [], source: null, sourceUrl: null, category: null }];
      }
      return [];
    });
    const { searchKnowledgeBase } = await import("../ai/rag");
    const results = await searchKnowledgeBase("test");
    expect(results).toHaveLength(1);
  });

  it("falls back to keyword search when no vectorIds", async () => {
    const { searchByVector } = await import("@/lib/ai/embeddings");
    (searchByVector as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    mockKnowledgeBaseFindMany.mockResolvedValue([
      { id: "kb-3", title: "Keyword Match", content: "Content", tags: [], source: null, sourceUrl: null, category: { name: "Guide" } },
    ]);
    const { searchKnowledgeBase } = await import("../ai/rag");
    const results = await searchKnowledgeBase("test");
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("Guide");
  });

  it("handles empty results", async () => {
    const { searchByVector } = await import("@/lib/ai/embeddings");
    (searchByVector as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    mockKnowledgeBaseFindMany.mockResolvedValue([]);
    const { searchKnowledgeBase } = await import("../ai/rag");
    const results = await searchKnowledgeBase("test");
    expect(results).toEqual([]);
  });

  it("truncates content over 1000 characters", async () => {
    const { searchByVector } = await import("@/lib/ai/embeddings");
    (searchByVector as ReturnType<typeof vi.fn>).mockResolvedValue(["kb-long"]);
    mockKnowledgeBaseFindMany.mockResolvedValue([
      { id: "kb-long", title: "Long", content: "x".repeat(2000), tags: [], source: null, sourceUrl: null, category: null },
    ]);
    const { searchKnowledgeBase } = await import("../ai/rag");
    const results = await searchKnowledgeBase("test");
    expect(results[0].content.length).toBe(1000);
  });

  it("handles single-character words in query", async () => {
    const { searchByVector } = await import("@/lib/ai/embeddings");
    (searchByVector as ReturnType<typeof vi.fn>).mockResolvedValue(["kb-sc"]);
    mockKnowledgeBaseFindMany.mockResolvedValue([
      { id: "kb-sc", title: "Test Title", content: "Some content", tags: [], source: null, sourceUrl: null, category: null },
    ]);
    const { searchKnowledgeBase } = await import("../ai/rag");
    const results = await searchKnowledgeBase("a b test");
    expect(results[0].score).toBeGreaterThan(0);
  });
});

describe("searchPortfolio", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns portfolio results with correct structure", async () => {
    mockProjectFindMany.mockResolvedValue([
      { id: "p1", name: "My Project", description: "A great project", tags: "react,nextjs", slug: "my-project", source: null, sourceUrl: null, category: null },
    ]);
    const { searchPortfolio } = await import("../ai/rag");
    const results = await searchPortfolio("project");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("My Project");
    expect(results[0].category).toBe("Portfolio");
    expect(results[0].sourceUrl).toBe("/portfolio/my-project");
  });

  it("returns empty array when no matches", async () => {
    mockProjectFindMany.mockResolvedValue([]);
    const { searchPortfolio } = await import("../ai/rag");
    const results = await searchPortfolio("nonexistent");
    expect(results).toEqual([]);
  });
});

describe("searchBlogPosts", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns blog results with correct structure", async () => {
    mockBlogPostFindMany.mockResolvedValue([
      { id: "b1", title: "Blog Post", excerpt: "An excerpt", slug: "blog-post", tags: "tech" },
    ]);
    const { searchBlogPosts } = await import("../ai/rag");
    const results = await searchBlogPosts("blog");
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("Blog");
    expect(results[0].sourceUrl).toBe("/blog/blog-post");
  });

  it("returns empty array when no matches", async () => {
    mockBlogPostFindMany.mockResolvedValue([]);
    const { searchBlogPosts } = await import("../ai/rag");
    const results = await searchBlogPosts("nonexistent");
    expect(results).toEqual([]);
  });
});

describe("searchResume", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns empty array when no published resume", async () => {
    mockResumeProfileFindFirst.mockResolvedValue(null);
    const { searchResume } = await import("../ai/rag");
    const results = await searchResume();
    expect(results).toEqual([]);
  });

  it("returns overview and experience entries", async () => {
    mockResumeProfileFindFirst.mockResolvedValue({
      id: "r1",
      fullName: "John Doe",
      professionalTitle: "Developer",
      summary: "Experienced dev",
      experiences: [
        { id: "e1", jobTitle: "Engineer", company: "Acme", responsibilities: ["Built X", "Fixed Y", "Led Z"], startDate: new Date(), endDate: null, current: true, achievements: null, technologies: null },
      ],
      education: [],
      skills: [],
      certifications: [],
    });
    const { searchResume } = await import("../ai/rag");
    const results = await searchResume();
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].title).toContain("Resume");
    expect(results[1].title).toContain("Engineer at Acme");
  });
});

describe("searchAll", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("combines results from all sources sorted by score", async () => {
    const { searchByVector } = await import("@/lib/ai/embeddings");
    (searchByVector as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    mockKnowledgeBaseFindMany.mockResolvedValue([]);
    mockProjectFindMany.mockResolvedValue([]);
    mockBlogPostFindMany.mockResolvedValue([]);
    mockResumeProfileFindFirst.mockResolvedValue(null);
    mockSupportKnowledgeArticleFindMany.mockResolvedValue([]);
    const { searchAll } = await import("../ai/rag");
    const results = await searchAll("test");
    expect(results).toEqual([]);
  });
});

describe("searchSupportKnowledgeBase", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns support articles", async () => {
    mockSupportKnowledgeArticleFindMany.mockResolvedValue([
      { id: "s1", title: "Support Article", excerpt: "Excerpt", content: "Long content", tags: JSON.stringify(["help"]), category: { name: "FAQ" }, viewCount: 10 },
    ]);
    const { searchSupportKnowledgeBase } = await import("../ai/rag");
    const results = await searchSupportKnowledgeBase("help");
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("FAQ");
  });

  it("returns empty array on error", async () => {
    mockSupportKnowledgeArticleFindMany.mockRejectedValue(new Error("db error"));
    const { searchSupportKnowledgeBase } = await import("../ai/rag");
    const results = await searchSupportKnowledgeBase("help");
    expect(results).toEqual([]);
  });

  it("uses content substring when excerpt is null", async () => {
    mockSupportKnowledgeArticleFindMany.mockResolvedValue([
      { id: "s2", title: "No Excerpt", excerpt: null, content: "A".repeat(500), tags: null, category: null, viewCount: 5 },
    ]);
    const { searchSupportKnowledgeBase } = await import("../ai/rag");
    const results = await searchSupportKnowledgeBase("help");
    expect(results[0].content.length).toBe(300);
    expect(results[0].category).toBe("Support");
  });

  it("parses JSON tags array", async () => {
    mockSupportKnowledgeArticleFindMany.mockResolvedValue([
      { id: "s3", title: "Tags Test", excerpt: "Excerpt", content: "Content", tags: JSON.stringify(["faq", "help"]), category: { name: "FAQ" }, viewCount: 3 },
    ]);
    const { searchSupportKnowledgeBase } = await import("../ai/rag");
    const results = await searchSupportKnowledgeBase("help");
    expect(results[0].tags).toEqual(["faq", "help"]);
  });

  it("returns articles with limit-based scoring", async () => {
    mockSupportKnowledgeArticleFindMany.mockResolvedValue([
      { id: "s4", title: "A", excerpt: "E1", content: "C1", tags: null, category: null, viewCount: 10 },
      { id: "s5", title: "B", excerpt: "E2", content: "C2", tags: null, category: null, viewCount: 5 },
    ]);
    const { searchSupportKnowledgeBase } = await import("../ai/rag");
    const results = await searchSupportKnowledgeBase("help", 2);
    expect(results).toHaveLength(2);
    expect(results[0].score).toBe(2);
    expect(results[1].score).toBe(1);
  });
});
