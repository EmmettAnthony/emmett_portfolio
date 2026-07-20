import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { FullPageChat } from "@/components/chat/FullPageChat";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("chat.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <FullPageChat />
    </main>
  );
}
