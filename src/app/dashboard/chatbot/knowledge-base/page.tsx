import { prisma } from "@/lib/db";
import { KnowledgeBaseClient } from "./knowledge-client";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function KnowledgeBasePage() {
  const t = await getTranslations("dashboard.chatbotKnowledge");
  const [rawItems, rawCategories] = await Promise.all([
    prisma.knowledgeBase.findMany({
      orderBy: { updatedAt: "desc" },
      include: { category: true },
    }),
    prisma.knowledgeCategory.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { items: true } } },
    }),
  ]);

  // Serialize dates to strings for client component compatibility
  const items = rawItems.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: item.category ? { id: item.category.id, name: item.category.name, color: item.category.color } : null,
    tags: item.tags,
    source: item.source,
    enabled: item.enabled,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const categories = rawCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    color: cat.color,
    icon: cat.icon,
    _count: cat._count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("knowledgeBase")}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("knowledgeBaseDesc")}
          </p>
        </div>
      </div>
      <KnowledgeBaseClient items={items} categories={categories} />
    </div>
  );
}
