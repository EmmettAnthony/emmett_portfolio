import { getPrisma } from "@/lib/db";

export async function getHomepageData() {
  const prisma = getPrisma();
  
  try {
    const homepage = await prisma.homepage.findFirst({
      include: {
        trustedLogos: { where: { enabled: true }, orderBy: { order: "asc" } },
        homepageStats: { orderBy: { order: "asc" } },
        homepageTechs: { orderBy: { order: "asc" } },
      },
    });

    const [services, testimonials, projects, posts, profile, awards] = await Promise.all([
      prisma.service.findMany({ where: { published: true, featured: true }, orderBy: { order: "asc" }, take: 6 }),
      prisma.testimonial.findMany({ where: { status: "APPROVED", archived: false, displayOnHomepage: true }, orderBy: [{ featured: "desc" }, { order: "asc" }], take: homepage?.testimonialsCount ?? 6 }),
      prisma.portfolioProject.findMany({ where: { published: true, featured: true }, orderBy: { order: "asc" }, include: { technologies: true }, take: homepage?.projectsCount ?? 6 }),
      prisma.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: homepage?.blogCount ?? 3 }),
      prisma.aboutPage.findFirst(),
      prisma.award.findMany({ orderBy: { order: "asc" }, take: 10 }),
    ]);

    const certifications = await prisma.certification.findMany({ orderBy: { order: "asc" }, take: 10 });

    return {
      homepage: homepage ? {
        heroHeadline: homepage.heroHeadline,
        heroHighlight: homepage.heroHighlight,
        heroSubheadline: homepage.heroSubheadline,
        heroDescription: homepage.heroDescription,
        heroImage: homepage.heroImage,
        heroTypewriterTexts: homepage.heroTypewriterTexts as string[],
        heroPrimaryCta: homepage.heroPrimaryCta,
        heroPrimaryLink: homepage.heroPrimaryLink,
        heroSecondaryCta: homepage.heroSecondaryCta,
        heroSecondaryLink: homepage.heroSecondaryLink,
        heroResumeCta: homepage.heroResumeCta,
        heroBackground: homepage.heroBackground,
        statsTitle: homepage.statsTitle,
        statsSubtitle: homepage.statsSubtitle,
        statsEnabled: homepage.statsEnabled,
        whyChooseTitle: homepage.whyChooseTitle,
        whyChooseSubtitle: homepage.whyChooseSubtitle,
        whyChooseItems: homepage.whyChooseItems as Record<string, unknown>[],
        processTitle: homepage.processTitle,
        processSubtitle: homepage.processSubtitle,
        processSteps: homepage.processSteps as Record<string, unknown>[],
        projectsTitle: homepage.projectsTitle,
        projectsSubtitle: homepage.projectsSubtitle,
        projectsEnabled: homepage.projectsEnabled,
        layout: homepage.layout,
        testimonialsTitle: homepage.testimonialsTitle,
        testimonialsSubtitle: homepage.testimonialsSubtitle,
        testimonialsEnabled: homepage.testimonialsEnabled,
        testimonialLayout: homepage.testimonialLayout,
        servicesTitle: homepage.servicesTitle,
        servicesSubtitle: homepage.servicesSubtitle,
        blogTitle: homepage.blogTitle,
        blogSubtitle: homepage.blogSubtitle,
        blogEnabled: homepage.blogEnabled,
        certTitle: homepage.certTitle,
        certSubtitle: homepage.certSubtitle,
        certEnabled: homepage.certEnabled,
        faqTitle: homepage.faqTitle,
        faqSubtitle: homepage.faqSubtitle,
        faqs: homepage.faqs as Record<string, unknown>[],
        faqEnabled: homepage.faqEnabled,
        newsletterTitle: homepage.newsletterTitle,
        newsletterDesc: homepage.newsletterDesc,
        newsletterEnabled: homepage.newsletterEnabled,
        ctaTitle: homepage.ctaTitle,
        ctaDescription: homepage.ctaDescription,
        ctaBackground: homepage.ctaBackground,
        ctaPrimaryButton: homepage.ctaPrimaryButton,
        ctaPrimaryLink: homepage.ctaPrimaryLink,
        ctaSecondaryButton: homepage.ctaSecondaryButton,
        ctaSecondaryLink: homepage.ctaSecondaryLink,
        ctaEnabled: homepage.ctaEnabled,
        metaTitle: homepage.metaTitle,
        metaDescription: homepage.metaDescription,
        published: homepage.published,
      } : null,
      trustedLogos: homepage?.trustedLogos ?? [],
      homepageStats: homepage?.homepageStats ?? [],
      homepageTechs: homepage?.homepageTechs ?? [],
      services,
      testimonials,
      projects,
      posts,
      profile,
      certifications,
      awards,
    };
  } catch (error) {
    console.error("Failed to load homepage data:", error);
    return {
      homepage: null, trustedLogos: [], homepageStats: [], homepageTechs: [],
      services: [], testimonials: [], projects: [], posts: [],
      profile: null, certifications: [], awards: [],
    };
  }
}
