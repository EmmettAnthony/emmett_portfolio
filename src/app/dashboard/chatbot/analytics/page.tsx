import { AnalyticsClient } from "./analytics-client";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const t = await getTranslations("dashboard.chatbotAnalytics");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("chatAnalytics")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("chatAnalyticsDesc")}
        </p>
      </div>
      <AnalyticsClient />
    </div>
  );
}
