import { prisma } from "@/lib/db";
import { PromptsClient } from "./prompts-client";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const t = await getTranslations("dashboard.chatbotPrompts");
  const rawPrompts = await prisma.promptTemplate.findMany({
    orderBy: [{ isSystem: "desc" }, { category: "asc" }, { name: "asc" }],
  });

  const categories: string[] = [...new Set(rawPrompts.map((p: { category: string }) => p.category))];

  // Serialize dates to strings for client component compatibility
  const prompts = rawPrompts.map((p: { id: string; name: string; label: string | null; description: string | null; prompt: string; category: string; variables: unknown; isSystem: boolean; enabled: boolean; createdAt: Date; updatedAt: Date }) => ({
    id: p.id,
    name: p.name,
    label: p.label ?? "",
    description: p.description,
    prompt: p.prompt,
    category: p.category,
    variables: Array.isArray(p.variables) ? (p.variables as string[]) : [],
    isSystem: p.isSystem,
    enabled: p.enabled,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("promptTemplates")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("promptTemplatesDesc")}
        </p>
      </div>
      <PromptsClient prompts={prompts} categories={categories} />
    </div>
  );
}
