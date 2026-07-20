import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConversationReplyPanel } from "@/components/chat/ConversationReplyPanel";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("dashboard.chatbotConversations");
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      lead: true,
      feedback: true,
    },
  });

  if (!conversation) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/chatbot/conversations"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            {conversation.visitorName || t("conversation")} 
            <span className="text-sm font-normal text-zinc-500 ml-2">— {conversation.visitorEmail || t("anonymous")}</span>
          </h1>
          <p className="text-sm text-zinc-500">{t("id")}: {id}</p>
        </div>
      </div>

      <ConversationReplyPanel
        conversationId={id}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          metadata: m.metadata as Record<string, unknown> | null,
        }))}
        visitorName={conversation.visitorName}
        visitorEmail={conversation.visitorEmail}
        language={conversation.language}
        source={conversation.source}
        messageCount={conversation.messageCount}
        status={conversation.status}
        createdAt={conversation.createdAt.toISOString()}
        lead={conversation.lead ? {
          name: conversation.lead.name,
          email: conversation.lead.email,
          phone: conversation.lead.phone,
          company: conversation.lead.company,
          budget: conversation.lead.budget,
          timeline: conversation.lead.timeline,
          status: conversation.lead.status,
        } : null}
        feedback={conversation.feedback.map((fb) => ({
          score: fb.score,
          comment: fb.comment,
          category: fb.category,
        }))}
      />
    </div>
  );
}
