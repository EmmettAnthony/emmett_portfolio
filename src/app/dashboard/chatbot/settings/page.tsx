import { prisma } from "@/lib/db";
import { SettingsClient } from "./settings-client";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const t = await getTranslations("dashboard.chatbotSettings");
  let settings = await prisma.chatSettings.findFirst();
  
  if (!settings) {
    settings = await prisma.chatSettings.create({
      data: {
        provider: "openai",
        model: "gpt-4o-mini",
        systemPrompt: "",
        welcomeMessage: "Hi! I'm Emmett's AI assistant. How can I help you today?",
        suggestedQuestions: [
          "What services do you offer?",
          "Tell me about your experience",
          "Can you show me your portfolio?",
          "How can I hire you?",
        ],
        blockedWords: [],
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("chatbotSettings")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("chatbotSettingsDesc")}
        </p>
      </div>
      <SettingsClient settings={JSON.parse(JSON.stringify(settings))} />
    </div>
  );
}
