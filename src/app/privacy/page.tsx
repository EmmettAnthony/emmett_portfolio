import { getPrisma } from "@/lib/db";
import { LegalPageRenderer } from "@/components/legal/LegalPageRenderer";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPolicy() {
  const t = await getTranslations("legal.privacy");

  let page = await getPrisma().legalPage.findUnique({ where: { slug: "privacy" } });

  if (!page) {
    page = {
      id: "",
      slug: "privacy",
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
