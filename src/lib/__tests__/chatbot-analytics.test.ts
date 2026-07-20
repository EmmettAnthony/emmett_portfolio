import { describe, it, expect, vi, beforeEach } from "vitest";

const mockChatAnalyticsUpsert = vi.fn();
const mockChatAnalyticsFindUnique = vi.fn();
const mockChatAnalyticsUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    chatAnalytics: {
      upsert: mockChatAnalyticsUpsert,
      findUnique: mockChatAnalyticsFindUnique,
      update: mockChatAnalyticsUpdate,
    },
  },
}));

describe("trackChatMetric", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("upserts chat analytics for today", async () => {
    mockChatAnalyticsUpsert.mockResolvedValue({});
    const { trackChatMetric } = await import("../chatbot/analytics");
    await trackChatMetric("conv-1");
    expect(mockChatAnalyticsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ date: expect.any(Date) }),
        update: expect.objectContaining({ totalMessages: { increment: 1 } }),
      })
    );
  });

  it("handles errors gracefully", async () => {
    mockChatAnalyticsUpsert.mockRejectedValue(new Error("fail"));
    const { trackChatMetric } = await import("../chatbot/analytics");
    await expect(trackChatMetric("conv-1")).resolves.not.toThrow();
  });
});

describe("trackConversationCreated", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("increments totalConversations", async () => {
    mockChatAnalyticsUpsert.mockResolvedValue({});
    const { trackConversationCreated } = await import("../chatbot/analytics");
    await trackConversationCreated();
    expect(mockChatAnalyticsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ totalConversations: { increment: 1 } }),
      })
    );
  });

  it("handles errors gracefully", async () => {
    mockChatAnalyticsUpsert.mockRejectedValue(new Error("fail"));
    const { trackConversationCreated } = await import("../chatbot/analytics");
    await expect(trackConversationCreated()).resolves.not.toThrow();
  });
});

describe("trackLeadGenerated", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("increments leadsGenerated", async () => {
    mockChatAnalyticsUpsert.mockResolvedValue({});
    const { trackLeadGenerated } = await import("../chatbot/analytics");
    await trackLeadGenerated();
    expect(mockChatAnalyticsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ leadsGenerated: { increment: 1 } }),
      })
    );
  });
});

describe("updateSatisfactionScore", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("updates average score when analytics exist", async () => {
    mockChatAnalyticsFindUnique.mockResolvedValue({
      date: new Date(),
      satisfactionScore: 4,
    });
    mockChatAnalyticsUpdate.mockResolvedValue({});
    const { updateSatisfactionScore } = await import("../chatbot/analytics");
    await updateSatisfactionScore(5);
    expect(mockChatAnalyticsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { date: expect.any(Date) },
        data: expect.objectContaining({ satisfactionScore: expect.any(Number) }),
      })
    );
  });

  it("does nothing when no analytics exist", async () => {
    mockChatAnalyticsFindUnique.mockResolvedValue(null);
    const { updateSatisfactionScore } = await import("../chatbot/analytics");
    await updateSatisfactionScore(5);
    expect(mockChatAnalyticsUpdate).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockChatAnalyticsFindUnique.mockRejectedValue(new Error("fail"));
    const { updateSatisfactionScore } = await import("../chatbot/analytics");
    await expect(updateSatisfactionScore(5)).resolves.not.toThrow();
  });
});
