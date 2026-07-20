import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { logResumeActivity } from "@/lib/resume-activity";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const version = await prisma.resumeVersion.findUnique({ where: { id } });
    if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

     
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deeply nested JSON version data
    const data = version.data as any;

    await prisma.resumeProfile.update({
      where: { id: version.resumeId },
      data: {
        fullName: data.profile.fullName,
        professionalTitle: data.profile.professionalTitle,
        photo: data.profile.photo,
        location: data.profile.location,
        yearsOfExperience: data.profile.yearsOfExperience,
        summary: data.profile.summary,
        summaryTitle: data.profile.summaryTitle,
        specializations: data.profile.specializations,
        socialLinks: data.profile.socialLinks,
        email: data.profile.email,
        phone: data.profile.phone,
        website: data.profile.website,
        template: data.profile.template,
        visibility: data.profile.visibility,
      },
    });

    await prisma.experience.deleteMany({ where: { resumeId: version.resumeId } });
    if (data.experiences?.length) {
      await prisma.experience.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type
        data: data.experiences.map((e: any) => ({
          resumeId: version.resumeId,
          jobTitle: e.jobTitle,
          company: e.company,
          employmentType: e.employmentType,
          location: e.location,
          startDate: new Date(e.startDate),
          endDate: e.endDate ? new Date(e.endDate) : null,
          current: e.current,
          responsibilities: e.responsibilities,
          achievements: e.achievements,
          technologies: e.technologies,
          order: e.order,
        })),
      });
    }

    await prisma.education.deleteMany({ where: { resumeId: version.resumeId } });
    if (data.education?.length) {
      await prisma.education.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type
        data: data.education.map((e: any) => ({
          resumeId: version.resumeId,
          institution: e.institution,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
          startDate: new Date(e.startDate),
          endDate: e.endDate ? new Date(e.endDate) : null,
          grade: e.grade,
          description: e.description,
          order: e.order,
        })),
      });
    }

    await prisma.skill.deleteMany({ where: { resumeId: version.resumeId } });
    if (data.skills?.length) {
      await prisma.skill.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type
        data: data.skills.map((s: any) => ({
          resumeId: version.resumeId,
          name: s.name,
          category: s.category,
          proficiency: s.proficiency,
          yearsOfExperience: s.yearsOfExperience,
          order: s.order,
        })),
      });
    }

    await prisma.certification.deleteMany({ where: { resumeId: version.resumeId } });
    if (data.certifications?.length) {
      await prisma.certification.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type
        data: data.certifications.map((c: any) => ({
          resumeId: version.resumeId,
          name: c.name,
          organization: c.organization,
          issueDate: new Date(c.issueDate),
          expiryDate: c.expiryDate ? new Date(c.expiryDate) : null,
          credentialId: c.credentialId,
          credentialUrl: c.credentialUrl,
          certificateFile: c.certificateFile,
          order: c.order,
        })),
      });
    }

    await prisma.award.deleteMany({ where: { resumeId: version.resumeId } });
    if (data.awards?.length) {
      await prisma.award.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type
        data: data.awards.map((a: any) => ({
          resumeId: version.resumeId,
          title: a.title,
          organization: a.organization,
          date: a.date ? new Date(a.date) : null,
          description: a.description,
          order: a.order,
        })),
      });
    }

    await prisma.language.deleteMany({ where: { resumeId: version.resumeId } });
    if (data.languages?.length) {
      await prisma.language.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type
        data: data.languages.map((l: any) => ({
          resumeId: version.resumeId,
          language: l.language,
          proficiency: l.proficiency,
          order: l.order,
        })),
      });
    }

    await prisma.reference.deleteMany({ where: { resumeId: version.resumeId } });
    if (data.references?.length) {
      await prisma.reference.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type
        data: data.references.map((r: any) => ({
          resumeId: version.resumeId,
          name: r.name,
          position: r.position,
          organization: r.organization,
          email: r.email,
          phone: r.phone,
          isPublic: r.isPublic,
          order: r.order,
        })),
      });
    }

    await logResumeActivity("restore", "resume_version", `Restored to version from ${version.createdAt.toISOString().split("T")[0]}`, id);

    return NextResponse.json({ success: true, message: "Resume restored to version" });
  } catch (error) {
    console.error("Failed to restore version:", error);
    return NextResponse.json({ error: "Failed to restore version" }, { status: 500 });
  }
}
