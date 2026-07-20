import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const template = searchParams.get("template") || "modern";

    const resume = await prisma.resumeProfile.findFirst({
      where: { published: true },
      include: {
        experiences: { orderBy: { order: "asc" } },
        education: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
        awards: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "No published resume found" }, { status: 404 });
    }

    const { resumePDFTemplates } = await import("@/lib/resume-pdf");
    const TemplateComponent = resumePDFTemplates[template] || resumePDFTemplates.modern;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Template component type
    const document = React.createElement(TemplateComponent as React.ComponentType<any>, {
      resume: {
        fullName: resume.fullName,
        professionalTitle: resume.professionalTitle,
        location: resume.location,
        email: resume.email,
        phone: resume.phone,
        website: resume.website,
        summary: resume.summary,
        template: resume.template,
        visibility: resume.visibility as Record<string, boolean>,
      },
      experiences: resume.experiences,
      education: resume.education,
      skills: resume.skills,
      certifications: resume.certifications,
      awards: resume.awards,
      languages: resume.languages,
    });

    const pdfBuffer = await renderToBuffer(document);

    const sanitizedName = resume.fullName.replace(/\s+/g, "-");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${sanitizedName}-Resume-${template}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
