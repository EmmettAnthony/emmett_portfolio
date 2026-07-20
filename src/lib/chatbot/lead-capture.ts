import { prisma } from "@/lib/db";
import { extractLeadInfo } from "./lead-detection";

function calculateLeadScore(info: { name?: string; email?: string; phone?: string; company?: string }): number {
  let score = 10;
  if (info.name) score += 20;
  if (info.email) score += 25;
  if (info.phone) score += 15;
  if (info.company) score += 20;
  if (info.name && info.email && info.phone) score += 10;
  return Math.min(score, 100);
}

function calculatePriority(info: { name?: string; email?: string; phone?: string; company?: string }): string {
  const score = calculateLeadScore(info);
  if (score >= 80) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

export async function captureLeadFromConversation(conversationId: string, userMessage: string, _aiResponse: string) {
  const existing = await prisma.chatLead.findUnique({ where: { conversationId } });
  if (existing) return existing;

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return null;

  const leadInfo = await extractLeadInfo(conversation.messages);
  if (!leadInfo.name || !leadInfo.email) return null;

  const lead = await prisma.chatLead.create({
    data: {
      conversationId,
      name: leadInfo.name,
      email: leadInfo.email,
      phone: leadInfo.phone ?? null,
      company: leadInfo.company ?? null,
      requirements: leadInfo.requirements ?? userMessage,
      leadScore: calculateLeadScore(leadInfo),
      priority: calculatePriority(leadInfo),
      status: "NEW",
    },
  });

  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { leadId: lead.id, isHighPriority: lead.priority === "HIGH" || lead.priority === "URGENT" },
  });

  try {
    const existingContact = await prisma.contact.findFirst({ where: { email: leadInfo.email } });
    if (!existingContact) {
      await prisma.contact.create({
        data: {
          fullName: leadInfo.name,
          email: leadInfo.email,
          phone: leadInfo.phone ?? null,
          company: leadInfo.company ?? null,
          projectType: "chatbot_lead",
          projectDetails: leadInfo.requirements ?? userMessage,
          leadScore: calculateLeadScore(leadInfo),
          status: "NEW",
          tags: "chatbot,ai-captured",
        },
      });
    }
  } catch {
    // Non-critical
  }

  return lead;
}