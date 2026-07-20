import dynamic from "next/dynamic";
import { HeroSection } from "@/components/home/HeroSection";
import { getHomepageData } from "@/components/home/HomepageDataProvider";

// Dynamically import below-the-fold sections to defer framer-motion JS
const FeaturedProjects = dynamic(
  () => import("@/components/home/FeaturedProjects").then((m) => m.FeaturedProjects),
  { ssr: true }
);

const SkillsOverview = dynamic(
  () => import("@/components/home/SkillsOverview").then((m) => m.SkillsOverview),
  { ssr: true }
);

const ServicesOverview = dynamic(
  () => import("@/components/home/ServicesOverview").then((m) => m.ServicesOverview),
  { ssr: true }
);

const Testimonials = dynamic(
  () => import("@/components/home/Testimonials").then((m) => m.Testimonials),
  { ssr: true }
);

const LatestArticles = dynamic(
  () => import("@/components/home/LatestArticles").then((m) => m.LatestArticles),
  { ssr: true }
);

const ContactCTA = dynamic(
  () => import("@/components/home/ContactCTA").then((m) => m.ContactCTA),
  { ssr: true }
);

export default async function Home() {
  const data = await getHomepageData();
  const hero = data.homepage;

  return (
    <>
      <HeroSection
        headline={hero?.heroHeadline}
        description={hero?.heroDescription}
        primaryCta={hero?.heroPrimaryCta}
        primaryLink={hero?.heroPrimaryLink}
        secondaryCta={hero?.heroSecondaryCta}
        secondaryLink={hero?.heroSecondaryLink}
        heroTypewriterTexts={hero?.heroTypewriterTexts}
      />
      <FeaturedProjects />
      <SkillsOverview />
      <ServicesOverview />
      <Testimonials />
      <LatestArticles />
      <ContactCTA />
    </>
  );
}
