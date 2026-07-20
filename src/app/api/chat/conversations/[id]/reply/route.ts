import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";
import { getResend } from "@/lib/resend";
import { getSiteSettings } from "@/lib/get-site-settings";
import { adminReplyTemplate } from "@/lib/email/reply-notification-template";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { message, sendEmail } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 10000) {
      return NextResponse.json({ error: "Message too long (max 10,000 chars)" }, { status: 400 });
    }

    // Verify conversation exists
    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Only allow replies to ACTIVE, WAITING, or ESCALATED conversations
    if (!["ACTIVE", "WAITING", "ESCALATED"].includes(conversation.status)) {
      return NextResponse.json({
        error: `Cannot reply to a conversation with status "${conversation.status}"`,
      }, { status: 400 });
    }

    // Save the reply as a new message
    const reply = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        role: "assistant",
        content: message.trim(),
        metadata: { source: "admin_reply" },
      },
    });

    // Update conversation metadata
    await prisma.chatConversation.update({
      where: { id },
      data: {
        messageCount: { increment: 1 },
        lastActivityAt: new Date(),
        status: conversation.status === "ESCALATED" ? "RESOLVED" : undefined,
      },
    });

    // Optionally send email notification to the visitor
    if (sendEmail !== false) {
      const recipientEmail = conversation.visitorEmail || conversation.lead?.email;
      if (recipientEmail?.trim()) {
        try {
          const adminName = session.user?.name || "Emmett";
          const settings = await getSiteSettings();
          const { subject, html } = await adminReplyTemplate({
            visitorName: conversation.visitorName || "there",
            message: message.trim(),
            adminName,
            conversationId: id,
          });

          const resend = getResend();
          await resend.emails.send({
            from: `${adminName} <${process.env.RESEND_FROM_EMAIL || "noreply@emmettanthony.dev"}>`,
            to: recipientEmail,
            replyTo: settings.email,
            subject,
            html,
            tags: [
              { name: "type", value: "chat_admin_reply" },
              { name: "conversationId", value: id },
            ],
          });
        } catch (emailError) {
          // Non-critical — reply was saved even if email fails
          console.error("Failed to send reply email:", emailError);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: reply,
      status: conversation.status === "ESCALATED" ? "RESOLVED" : conversation.status,
    });
  } catch (error) {
    console.error("Failed to send reply:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
