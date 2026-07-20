import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    subscriber: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      update: mockUpdate,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeSub(overrides: Record<string, unknown> = {}) {
  return {
    createdAt: new Date(),
    lastOpenedAt: null,
    lastClickedAt: null,
    campaignEvents: [],
    ...overrides,
  };
}

describe("calculateEngagementScore", () => {
  it("returns 0 when subscriber not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("nonexistent");
    expect(score).toBe(0);
  });

  it("returns 0 for subscriber with no events and recent signup", async () => {
    mockFindUnique.mockResolvedValue(makeSub());
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("new-sub");
    expect(score).toBe(0);
  });

  it("awards points for opens (capped at 40)", async () => {
    mockFindUnique.mockResolvedValue(makeSub({ campaignEvents: Array.from({ length: 5 }, () => ({ eventType: "opened" })) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("many-opens");
    expect(score).toBe(40);
  });

  it("awards points for clicks (capped at 30)", async () => {
    mockFindUnique.mockResolvedValue(makeSub({ campaignEvents: Array.from({ length: 3 }, () => ({ eventType: "clicked" })) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("many-clicks");
    expect(score).toBe(30);
  });

  it("gives recency bonus for lastOpenedAt within 7 days", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({ lastOpenedAt: new Date(now - 86400000) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("recent-open");
    expect(score).toBe(20);
  });

  it("gives recency bonus for lastOpenedAt within 30 days", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({ lastOpenedAt: new Date(now - 15 * 86400000) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("month-open");
    expect(score).toBe(10);
  });

  it("gives recency bonus for lastOpenedAt within 90 days", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({ lastOpenedAt: new Date(now - 60 * 86400000) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("old-open");
    expect(score).toBe(5);
  });

  it("gives click recency bonus within 7 days", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({ lastClickedAt: new Date(now - 86400000) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("recent-click");
    expect(score).toBe(10);
  });

  it("gives click recency bonus within 30 days", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({ lastClickedAt: new Date(now - 15 * 86400000) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("month-click");
    expect(score).toBe(5);
  });

  it("gives subscription age bonus for >365 days", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({ createdAt: new Date(now - 400 * 86400000) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("old-sub");
    expect(score).toBe(5);
  });

  it("gives subscription age bonus for >90 days", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({ createdAt: new Date(now - 180 * 86400000) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("mid-sub");
    expect(score).toBe(3);
  });

  it("combines all score components correctly", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({
      createdAt: new Date(now - 400 * 86400000),
      lastOpenedAt: new Date(now - 86400000),
      lastClickedAt: new Date(now - 86400000),
      campaignEvents: [
        { eventType: "opened" },
        { eventType: "opened" },
        { eventType: "clicked" },
      ],
    }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("engaged-sub");
    expect(score).toBe(70);
  });

  it("clamps score to 100 max", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({
      createdAt: new Date(now - 400 * 86400000),
      lastOpenedAt: new Date(now - 86400000),
      lastClickedAt: new Date(now - 86400000),
      campaignEvents: [
        { eventType: "opened" },
        { eventType: "opened" },
        { eventType: "opened" },
        { eventType: "opened" },
        { eventType: "clicked" },
        { eventType: "clicked" },
      ],
    }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("max-sub");
    expect(score).toBe(100);
  });

  it("handles null campaignEvents gracefully", async () => {
    mockFindUnique.mockResolvedValue(makeSub({ campaignEvents: null }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("null-events");
    expect(score).toBe(0);
  });

  it("no recency bonus when lastOpenedAt is very old (>90 days)", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({ lastOpenedAt: new Date(now - 180 * 86400000) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("very-old-open");
    expect(score).toBe(0);
  });

  it("no click recency bonus when lastClickedAt very old (>30 days)", async () => {
    const now = Date.now();
    mockFindUnique.mockResolvedValue(makeSub({ lastClickedAt: new Date(now - 60 * 86400000) }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("very-old-click");
    expect(score).toBe(0);
  });

  it("no subscription age bonus for very recent subscriber", async () => {
    mockFindUnique.mockResolvedValue(makeSub({ createdAt: new Date() }));
    const { calculateEngagementScore } = await import("../scoring");
    const score = await calculateEngagementScore("brand-new");
    expect(score).toBe(0);
  });
});

describe("recalculateAllScores", () => {
  it("recalculates scores for all subscribers and updates them", async () => {
    mockFindMany.mockResolvedValue([{ id: "sub-1" }, { id: "sub-2" }]);
    mockFindUnique.mockResolvedValueOnce(makeSub({ campaignEvents: [{ eventType: "opened" }] }));
    mockFindUnique.mockResolvedValueOnce(makeSub({
      createdAt: new Date(Date.now() - 400 * 86400000),
      campaignEvents: [{ eventType: "clicked" }, { eventType: "clicked" }],
    }));
    mockUpdate.mockResolvedValue({});

    const { recalculateAllScores } = await import("../scoring");
    const count = await recalculateAllScores();

    expect(count).toBe(2);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, { where: { id: "sub-1" }, data: { engagementScore: 10 } });
    expect(mockUpdate).toHaveBeenNthCalledWith(2, { where: { id: "sub-2" }, data: { engagementScore: 35 } });
  });

  it("returns 0 when no subscribers exist", async () => {
    mockFindMany.mockResolvedValue([]);

    const { recalculateAllScores } = await import("../scoring");
    const count = await recalculateAllScores();

    expect(count).toBe(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
