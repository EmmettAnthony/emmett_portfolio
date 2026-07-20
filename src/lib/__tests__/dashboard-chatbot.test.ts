import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConvCount = vi.hoisted(() => vi.fn());
const mockLeadCount = vi.hoisted(() => vi.fn());
const mockMsgCount = vi.hoisted(() => vi.fn());
const mockFeedbackAggregate = vi.hoisted(() => vi.fn());
const mockConvFindMany = vi.hoisted(() => vi.fn());
const mockAnalyticsFindMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    chatConversation: {
      count: mockConvCount,
      findMany: mockConvFindMany,
    },
    chatLead: { count: mockLeadCount },
    chatMessage: { count: mockMsgCount },
    chatFeedback: { aggregate: mockFeedbackAggregate },
    chatAnalytics: { findMany: mockAnalyticsFindMany },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getChatbotStats", () => {
  it("returns stats with all values", async () => {
    const { getChatbotStats } = await import("../dashboard/chatbot");
    mockConvCount.mockResolvedValueOnce(100).mockResolvedValueOnce(5).mockResolvedValueOnce(10);
    mockLeadCount.mockResolvedValueOnce(20).mockResolvedValueOnce(3);
    mockMsgCount.mockResolvedValue(500);
    mockFeedbackAggregate.mockResolvedValue({ _avg: { score: 4.5 } });

    const stats = await getChatbotStats();

    expect(stats).toEqual({
      totalConversations: 100,
      todayConversations: 5,
      activeConversations: 10,
      totalLeads: 20,
      todayLeads: 3,
      totalMessages: 500,
      avgSatisfaction: 4.5,
      conversionRate: 20,
    });
  });

  it("returns zero avgSatisfaction when no feedback", async () => {
    const { getChatbotStats } = await import("../dashboard/chatbot");
    mockConvCount.mockResolvedValueOnce(10).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockLeadCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockMsgCount.mockResolvedValue(0);
    mockFeedbackAggregate.mockResolvedValue({ _avg: { score: null } });

    const stats = await getChatbotStats();

    expect(stats.avgSatisfaction).toBe(0);
    expect(stats.conversionRate).toBe(0);
  });

  it("calculates conversionRate correctly when there are leads", async () => {
    const { getChatbotStats } = await import("../dashboard/chatbot");
    mockConvCount.mockResolvedValueOnce(50).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockLeadCount.mockResolvedValueOnce(10).mockResolvedValueOnce(0);
    mockMsgCount.mockResolvedValue(0);
    mockFeedbackAggregate.mockResolvedValue({ _avg: { score: null } });

    const stats = await getChatbotStats();

    expect(stats.conversionRate).toBe(20);
  });

  it("handles zero totalConversations to avoid division by zero", async () => {
    const { getChatbotStats } = await import("../dashboard/chatbot");
    mockConvCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockLeadCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockMsgCount.mockResolvedValue(0);
    mockFeedbackAggregate.mockResolvedValue({ _avg: { score: null } });

    const stats = await getChatbotStats();

    expect(stats.conversionRate).toBe(0);
  });
});

describe("getChatbotConversations", () => {
  it("returns paginated conversations with default params", async () => {
    const { getChatbotConversations } = await import("../dashboard/chatbot");
    const conversations = [{ id: "conv-1" }, { id: "conv-2" }];
    mockConvFindMany.mockResolvedValue(conversations);
    mockConvCount.mockResolvedValue(10);

    const result = await getChatbotConversations({});

    expect(result.conversations).toEqual(conversations);
    expect(result.total).toBe(10);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(1);
    expect(mockConvFindMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { lastActivityAt: "desc" },
      skip: 0,
      take: 20,
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 3 },
        lead: true,
        feedback: true,
        _count: { select: { messages: true } },
      },
    });
  });

  it("filters by status", async () => {
    const { getChatbotConversations } = await import("../dashboard/chatbot");
    mockConvFindMany.mockResolvedValue([]);
    mockConvCount.mockResolvedValue(0);

    await getChatbotConversations({ status: "ACTIVE" });

    expect(mockConvFindMany.mock.calls[0][0].where.status).toBe("ACTIVE");
  });

  it("filters by search query", async () => {
    const { getChatbotConversations } = await import("../dashboard/chatbot");
    mockConvFindMany.mockResolvedValue([]);
    mockConvCount.mockResolvedValue(0);

    await getChatbotConversations({ search: "john" });

    const where = mockConvFindMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { visitorName: { contains: "john", mode: "insensitive" } },
      { visitorEmail: { contains: "john", mode: "insensitive" } },
    ]);
  });

  it("applies pagination correctly", async () => {
    const { getChatbotConversations } = await import("../dashboard/chatbot");
    mockConvFindMany.mockResolvedValue([]);
    mockConvCount.mockResolvedValue(50);

    const result = await getChatbotConversations({ page: 3, limit: 10 });

    expect(result.page).toBe(3);
    expect(result.pages).toBe(5);
    expect(mockConvFindMany.mock.calls[0][0].skip).toBe(20);
    expect(mockConvFindMany.mock.calls[0][0].take).toBe(10);
  });

  it("calculates pages correctly with remainder", async () => {
    const { getChatbotConversations } = await import("../dashboard/chatbot");
    mockConvFindMany.mockResolvedValue([]);
    mockConvCount.mockResolvedValue(25);

    const result = await getChatbotConversations({ limit: 10 });

    expect(result.pages).toBe(3);
  });
});

describe("getChatbotAnalytics", () => {
  it("returns analytics with empty stats", async () => {
    const { getChatbotAnalytics } = await import("../dashboard/chatbot");
    mockAnalyticsFindMany.mockResolvedValue([]);
    mockConvFindMany.mockResolvedValue([]);

    const result = await getChatbotAnalytics();

    expect(result.dailyStats).toEqual([]);
    expect(result.topTopics).toEqual([]);
    expect(result.conversationsOverTime).toEqual([]);
    expect(result.leadsOverTime).toEqual([]);
  });

  it("aggregates top topics from conversations", async () => {
    const { getChatbotAnalytics } = await import("../dashboard/chatbot");
    mockAnalyticsFindMany.mockResolvedValue([]);
    mockConvFindMany.mockResolvedValue([
      { tags: ["react", "frontend"] },
      { tags: ["react", "typescript"] },
      { tags: ["frontend"] },
    ]);

    const result = await getChatbotAnalytics();

    expect(result.topTopics).toEqual([
      { topic: "react", count: 2 },
      { topic: "frontend", count: 2 },
      { topic: "typescript", count: 1 },
    ]);
  });

  it("maps conversations and leads over time", async () => {
    const { getChatbotAnalytics } = await import("../dashboard/chatbot");
    const date1 = new Date("2026-07-01");
    const date2 = new Date("2026-07-02");
    mockAnalyticsFindMany.mockResolvedValue([
      { date: date1, totalConversations: 5, leadsGenerated: 2 },
      { date: date2, totalConversations: 3, leadsGenerated: 1 },
    ]);
    mockConvFindMany.mockResolvedValue([]);

    const result = await getChatbotAnalytics();

    expect(result.conversationsOverTime).toEqual([
      { date: "2026-07-01", count: 5 },
      { date: "2026-07-02", count: 3 },
    ]);
    expect(result.leadsOverTime).toEqual([
      { date: "2026-07-01", count: 2 },
      { date: "2026-07-02", count: 1 },
    ]);
  });

  it("limits top topics to 10", async () => {
    const { getChatbotAnalytics } = await import("../dashboard/chatbot");
    mockAnalyticsFindMany.mockResolvedValue([]);
    const tags = Array.from({ length: 15 }, (_, i) => `topic-${i}`);
    mockConvFindMany.mockResolvedValue(
      tags.map((t) => ({ tags: [t] }))
    );

    const result = await getChatbotAnalytics();

    expect(result.topTopics).toHaveLength(10);
  });

  it("only includes conversations with non-empty tags", async () => {
    const { getChatbotAnalytics } = await import("../dashboard/chatbot");
    mockAnalyticsFindMany.mockResolvedValue([]);
    mockConvFindMany.mockResolvedValue([
      { tags: [] },
      { tags: ["react"] },
      { tags: [] },
    ]);

    const result = await getChatbotAnalytics();

    expect(result.topTopics).toEqual([{ topic: "react", count: 1 }]);
  });
});
