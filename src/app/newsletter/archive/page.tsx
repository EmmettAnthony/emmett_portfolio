import { prisma } from "@/lib/db";
import { getTranslations, getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function NewsletterArchivePage() {
  const t = await getTranslations("newsletter.archive");
  const locale = await getLocale();
  const campaigns = await prisma.campaign.findMany({
    where: { status: "SENT", isPublic: true },
    orderBy: { sentAt: "desc" },
    select: {
      id: true,
      name: true,
      subject: true,
      previewText: true,
      content: true,
      sentAt: true,
      totalRecipients: true,
    },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        {campaigns.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400 dark:text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="group rounded-2xl border border-zinc-200 p-6 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {campaign.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {campaign.subject}
                    </p>
                    {campaign.previewText && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground dark:text-zinc-400">
                        {campaign.previewText}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
                  {campaign.sentAt && (
                    <time dateTime={campaign.sentAt.toISOString()}>
                      {campaign.sentAt.toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  )}
                  <span>{t("recipients", { count: campaign.totalRecipients })}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
