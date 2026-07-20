import { HeroSection } from "@/components/about/HeroSection";
import { Biography } from "@/components/about/Biography";
import { TechStack } from "@/components/about/TechStack";
import { TimelineSection } from "@/components/about/TimelineSection";
import { EducationSection } from "@/components/about/EducationSection";
import { ContactCta } from "@/components/services/ContactCta";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { getAboutPageData } from "@/components/about/AboutPageDataProvider";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about.meta");
  const about = await getAboutPageData();
  return {
    title: t("title", { name: about?.fullName ?? "Emmett Anthony" }),
    description: about?.shortBio ?? t("description"),
    openGraph: {
      title: t("ogTitle", { name: about?.fullName ?? "Emmett Anthony" }),
      description: about?.shortBio ?? t("ogDescription"),
    },
  };
}

export default async function About() {
  const about = await getAboutPageData();

  return (
    <main>
      <HeroSection
        fullName={about?.fullName}
        professionalTitle={about?.professionalTitle}
        shortIntro={about?.shortIntro}
      />
      <Biography about={about} />
      <AnimatedSection className="py-0">
        <TechStack technologies={about?.technologies ?? []} />
      </AnimatedSection>
      <AnimatedSection className="py-0">
        <TimelineSection experiences={about?.experiences} />
      </AnimatedSection>
      <AnimatedSection className="py-0">
        <EducationSection education={about?.education} certifications={about?.certifications} />
      </AnimatedSection>
      <AnimatedSection className="py-0">
        <ContactCta />
      </AnimatedSection>
    </main>
  );
}
