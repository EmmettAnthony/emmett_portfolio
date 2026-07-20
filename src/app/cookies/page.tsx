import { getPrisma } from "@/lib/db";
import { LegalPageRenderer } from "@/components/legal/LegalPageRenderer";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.cookies");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CookiesPolicy() {
  const t = await getTranslations("legal.cookies");

  let page = await getPrisma().legalPage.findUnique({ where: { slug: "cookies" } });

  if (!page) {
    page = {
      id: "",
      slug: "cookies",
      title: t("title"),
      content: t("content"),
      lastUpdated: new Date("2026-06-22"),
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return <LegalPageRenderer title={page.title} content={page.content} lastUpdated={page.lastUpdated?.toISOString?.() ?? page.lastUpdated?.toString()} />;
}
