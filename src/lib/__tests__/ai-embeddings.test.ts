import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();

const mockKnowledgeBaseFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    knowledgeBase: {
      findMany: mockKnowledgeBaseFindMany,
    },
  },
}));

describe("generateEmbedding", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  it("returns null when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    const { generateEmbedding } = await import("../ai/embeddings");
    const result = await generateEmbedding("hello");
    expect(result).toBeNull();
  });

  it("returns null when fetch fails with non-ok", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    mockFetch.mockResolvedValue({ ok: false });
    const { generateEmbedding } = await import("../ai/embeddings");
    const result = await generateEmbedding("hello");
    expect(result).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    mockFetch.mockRejectedValue(new Error("network error"));
    const { generateEmbedding } = await import("../ai/embeddings");
    const result = await generateEmbedding("hello");
    expect(result).toBeNull();
  });

  it("returns embedding array on success", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
    });
    const { generateEmbedding } = await import("../ai/embeddings");
    const result = await generateEmbedding("hello");
    expect(result).toEqual([0.1, 0.2, 0.3]);
  });

  it("returns null when data array is empty", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [] }),
    });
    const { generateEmbedding } = await import("../ai/embeddings");
    const result = await generateEmbedding("hello");
    expect(result).toBeNull();
  });

  it("truncates input text to 8000 chars", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    let capturedBody: string | undefined;
    mockFetch.mockImplementation(async (_url: string, opts: RequestInit) => {
      capturedBody = opts.body as string;
      return { ok: true, json: vi.fn().mockResolvedValue({ data: [{ embedding: [1] }] }) };
    });
    const { generateEmbedding } = await import("../ai/embeddings");
    const longText = "a".repeat(10000);
    await generateEmbedding(longText);
    expect(capturedBody).toBeDefined();
    if (capturedBody) {
      const parsed = JSON.parse(capturedBody);
      expect(parsed.input.length).toBe(8000);
    }
  });
});

describe("searchByVector", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    mockKnowledgeBaseFindMany.mockReset();
    process.env.OPENAI_API_KEY = "sk-test";
  });

  it("returns empty array when generateEmbedding returns null", async () => {
    mockFetch.mockResolvedValue({ ok: false });
    const { searchByVector } = await import("../ai/embeddings");
    const result = await searchByVector("hello");
    expect(result).toEqual([]);
  });

  it("returns results from cosine similarity search", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [{ embedding: [1, 0] }] }),
    });
    mockKnowledgeBaseFindMany.mockResolvedValue([
      { id: "kb-1", title: "", content: "", embedding: "[1, 0]" },
      { id: "kb-2", title: "", content: "", embedding: "[0, 1]" },
      { id: "kb-3", title: "", content: "", embedding: "[0.9, 0.1]" },
    ]);
    const { searchByVector } = await import("../ai/embeddings");
    const result = await searchByVector("hello", 2);
    expect(result).toEqual(["kb-1", "kb-3"]);
  });

  it("returns empty array when prisma query fails", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [{ embedding: [0.1] }] }),
    });
    mockKnowledgeBaseFindMany.mockRejectedValue(new Error("db error"));
    const { searchByVector } = await import("../ai/embeddings");
    const result = await searchByVector("hello");
    expect(result).toEqual([]);
  });
});
