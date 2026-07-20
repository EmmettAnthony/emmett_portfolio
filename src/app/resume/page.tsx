import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ResumeContent } from "@/components/resume/ResumeContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resume.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function Resume() {
  return (
    <main className="pt-24">
      <AnimatedSection>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <ResumeContent />
        </div>
      </AnimatedSection>
    </main>
  );
}
