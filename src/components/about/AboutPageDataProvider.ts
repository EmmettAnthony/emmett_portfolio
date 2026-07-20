import { getPrisma } from "@/lib/db";

export interface AboutPageData {
  fullName: string | null;
  professionalTitle: string | null;
  shortIntro: string | null;
  photo: string | null;
  shortBio: string | null;
  fullBiography: string | null;
  yearsOfExperience: number | null;
  summaryHeading: string | null;
  missionStatement: string | null;
  statistics: Array<{ title: string; value: string; suffix: string | null; icon: string | null; order: number }>;
  technologies: Array<{ name: string; category: string; logo: string | null; order: number }>;
  whyWorkWithMe: Record<string, unknown>[];
  workProcess: Record<string, unknown>[];
  personalInterests: Record<string, unknown>[];
  socialLinks: Record<string, unknown>[];
  faqs: Record<string, unknown>[];
  experiences: Array<{
    id: string;
    jobTitle: string;
    company: string;
    location: string | null;
    startDate: Date;
    endDate: Date | null;
    current: boolean;
    responsibilities: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: Date;
    endDate: Date | null;
    grade: string | null;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    organization: string;
    issueDate: Date;
    credentialUrl: string | null;
  }>;
}

export async function getAboutPageData(): Promise<AboutPageData | null> {
  try {
    const prisma = getPrisma();
    const about = await prisma.aboutPage.findFirst({
      include: {
        statistics: { orderBy: { order: "asc" } },
        technologies: { orderBy: { order: "asc" } },
      },
    });

    if (!about) return null;

    const [resumeProfile] = await Promise.all([
      prisma.resumeProfile.findFirst({
        include: {
          experiences: { orderBy: { startDate: "desc" } },
          education: { orderBy: { startDate: "desc" } },
          certifications: { orderBy: { issueDate: "desc" } },
        },
      }),
    ]);

    return {
      fullName: about.fullName,
      professionalTitle: about.professionalTitle,
      shortIntro: about.shortIntro,
      photo: about.photo,
      shortBio: about.shortBio,
      fullBiography: about.fullBiography,
      yearsOfExperience: about.yearsOfExperience,
      summaryHeading: about.summaryHeading,
      missionStatement: about.missionStatement,
      statistics: about.statistics.map((s) => ({
        title: s.title,
        value: s.value,
        suffix: s.suffix,
        icon: s.icon,
        order: s.order,
      })),
      technologies: about.technologies.map((t) => ({
        name: t.name,
        category: t.category,
        logo: t.logo,
        order: t.order,
      })),
      whyWorkWithMe: about.whyWorkWithMe as unknown as Array<Record<string, unknown>>,
      workProcess: about.workProcess as unknown as Array<Record<string, unknown>>,
      personalInterests: about.personalInterests as unknown as Array<Record<string, unknown>>,
      socialLinks: about.socialLinks as unknown as Array<Record<string, unknown>>,
      faqs: about.faqs as unknown as Array<Record<string, unknown>>,
      experiences: resumeProfile?.experiences.map((e) => ({
        id: e.id,
        jobTitle: e.jobTitle,
        company: e.company,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        current: e.current,
        responsibilities: e.responsibilities as unknown as string[],
      })) ?? [],
      education: resumeProfile?.education.map((e) => ({
        id: e.id,
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
        startDate: e.startDate,
        endDate: e.endDate,
        grade: e.grade,
      })) ?? [],
      certifications: resumeProfile?.certifications.map((c) => ({
        id: c.id,
        name: c.name,
        organization: c.organization,
        issueDate: c.issueDate,
        credentialUrl: c.credentialUrl,
      })) ?? [],
    };
  } catch (error) {
    console.error("Failed to load about page data:", error);
    return null;
  }
}
