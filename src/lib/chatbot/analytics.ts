import { prisma } from "@/lib/db";

export async function trackChatMetric(_conversationId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.chatAnalytics.upsert({
      where: { date: today },
      update: {
        totalMessages: { increment: 1 },
      },
      create: {
        date: today,
        totalConversations: 1,
        totalMessages: 1,
      },
    });
  } catch {
    // Non-critical analytics tracking
  }
}

export async function trackConversationCreated() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.chatAnalytics.upsert({
      where: { date: today },
      update: {
        totalConversations: { increment: 1 },
      },
      create: {
        date: today,
        totalConversations: 1,
        totalMessages: 0,
      },
    });
  } catch {
    // Non-critical
  }
}

export async function trackLeadGenerated() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.chatAnalytics.upsert({
      where: { date: today },
      update: {
        leadsGenerated: { increment: 1 },
      },
      create: {
        date: today,
        leadsGenerated: 1,
        totalConversations: 0,
        totalMessages: 0,
      },
    });
  } catch {
    // Non-critical
  }
}

let feedbackCountStore = 0;

export async function updateSatisfactionScore(newScore: number) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await prisma.chatAnalytics.findUnique({ where: { date: today } });
    if (analytics) {
      const prevScore = analytics.satisfactionScore || 0;
      feedbackCountStore += 1;
      const newAvg = (prevScore * (feedbackCountStore - 1) + newScore) / feedbackCountStore;

      await prisma.chatAnalytics.update({
        where: { date: today },
        data: { satisfactionScore: Math.round(newAvg * 10) / 10 },
      });
    } else {
      feedbackCountStore = 1;
    }
  } catch {
    // Non-critical
  }
}
