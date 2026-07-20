import { getPrisma } from "@/lib/db";
import { LegalPageRenderer } from "@/components/legal/LegalPageRenderer";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.terms");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TermsOfService() {
  const t = await getTranslations("legal.terms");

  let page = await getPrisma().legalPage.findUnique({ where: { slug: "terms" } });

  if (!page) {
    page = {
      id: "",
      slug: "terms",
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
