import { prisma } from "@/lib/db";

export async function getChatbotStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalConversations,
    todayConversations,
    activeConversations,
    totalLeads,
    todayLeads,
    totalMessages,
    avgSatisfaction,
  ] = await Promise.all([
    prisma.chatConversation.count(),
    prisma.chatConversation.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.chatConversation.count({ where: { status: "ACTIVE" } }),
    prisma.chatLead.count(),
    prisma.chatLead.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.chatMessage.count(),
    prisma.chatFeedback.aggregate({ _avg: { score: true } }),
  ]);

  return {
    totalConversations,
    todayConversations,
    activeConversations,
    totalLeads,
    todayLeads,
    totalMessages,
    avgSatisfaction: avgSatisfaction._avg.score ?? 0,
    conversionRate: totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0,
  };
}

export async function getChatbotConversations(params: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { status, page = 1, limit = 20, search } = params;
  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (search) {
    where.OR = [
      { visitorName: { contains: search, mode: "insensitive" } },
      { visitorEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [conversations, total] = await Promise.all([
    prisma.chatConversation.findMany({
      where,
      orderBy: { lastActivityAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 3 },
        lead: true,
        feedback: true,
        _count: { select: { messages: true } },
      },
    }),
    prisma.chatConversation.count({ where }),
  ]);

  return {
    conversations,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function getChatbotAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const dailyStats = await prisma.chatAnalytics.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    orderBy: { date: "asc" },
  });

  const topTopics = await prisma.chatConversation.findMany({
    where: { createdAt: { gte: thirtyDaysAgo }, tags: { isEmpty: false } },
    select: { tags: true },
  });

  const topicCount: Record<string, number> = {};
  topTopics.forEach((c) => {
    c.tags.forEach((tag) => {
      topicCount[tag] = (topicCount[tag] || 0) + 1;
    });
  });

  const sortedTopics = Object.entries(topicCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));

  const conversationsOverTime = dailyStats.map((d) => ({
    date: d.date.toISOString().split("T")[0],
    count: d.totalConversations,
  }));

  const leadsOverTime = dailyStats.map((d) => ({
    date: d.date.toISOString().split("T")[0],
    count: d.leadsGenerated,
  }));

  return {
    dailyStats,
    topTopics: sortedTopics,
    conversationsOverTime,
    leadsOverTime,
  };
}
