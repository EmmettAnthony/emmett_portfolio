import { prisma } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { getSiteSettings } from "@/lib/get-site-settings";
import { escalationTranscriptTemplate } from "@/lib/email/escalation-template";

export async function sendEscalationEmail(conversationId: string) {
  try {
    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        lead: true,
      },
    });

    if (!conversation) {
      console.warn(`Escalation email skipped: conversation ${conversationId} not found`);
      return;
    }

    if (conversation.status !== "ESCALATED") {
      console.warn(`Escalation email skipped: conversation ${conversationId} has status "${conversation.status}"`);
      return;
    }

    const { subject, html } = escalationTranscriptTemplate({
      conversationId: conversation.id,
      visitorName: conversation.visitorName,
      visitorEmail: conversation.visitorEmail,
      visitorId: conversation.visitorId,
      messageCount: conversation.messageCount,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      source: conversation.source,
      language: conversation.language,
    });

    const settings = await getSiteSettings();
    const resend = getResend();
    const result = await resend.emails.send({
      from: `Chatbot <${process.env.RESEND_FROM_EMAIL || "noreply@emmettanthony.dev"}>`,
      to: settings.email,
      replyTo: conversation.visitorEmail || undefined,
      subject,
      html,
      tags: [
        { name: "type", value: "chat_escalation" },
        { name: "conversationId", value: conversationId },
      ],
    });

    if (result.error) {
      console.error("Failed to send escalation email:", result.error);
    } else {
      console.log(`Escalation email sent for conversation ${conversationId}`);
    }

    return result;
  } catch (error) {
    console.error("Failed to send escalation email:", error);
    return null;
  }
}
