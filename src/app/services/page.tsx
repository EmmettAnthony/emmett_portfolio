import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { ServicesGrid } from "@/components/services/ServicesGrid";
import { PricingSection } from "@/components/services/PricingSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("services.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Services() {
  return (
    <main className="pt-24">
      <AnimatedSection>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ServicesGrid />
        </div>
      </AnimatedSection>

      <div className="bg-zinc-50 py-20 dark:bg-zinc-900/50 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <PricingSection />
        </div>
      </div>

      <NewsletterSection />
    </main>
  );
}
