import { getChatbotStats } from "@/lib/dashboard/chatbot";
import { ChatbotOverviewClient } from "./overview-client";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function ChatbotDashboardPage() {
  const stats = await getChatbotStats();
  const t = await getTranslations("dashboard.chatbot");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("chatbotDashboard")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("chatbotDashboardDesc")}
        </p>
      </div>
      <ChatbotOverviewClient stats={stats} />
    </div>
  );
}
