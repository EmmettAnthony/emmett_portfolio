import { getChatbotConversations } from "@/lib/dashboard/chatbot";
import { ConversationsClient } from "./conversations-client";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const data = await getChatbotConversations({ page: 1, limit: 20 });
  const t = await getTranslations("dashboard.chatbotConversations");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("conversations")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("conversationsDescription")}
        </p>
      </div>
      <ConversationsClient initialData={data} />
    </div>
  );
}
