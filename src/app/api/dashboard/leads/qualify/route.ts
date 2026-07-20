import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";

function calculateLeadScore(data: {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  projectType: string;
  budget: string;
  timeline: string;
  projectDetails: string;
  projectGoals: string;
}): number {
  let score = 0;
  if (data.fullName.trim()) score += 10;
  if (data.email.trim()) score += 15;
  if (data.phone.trim()) score += 10;
  if (data.company.trim()) score += 10;
  if (data.projectType && data.projectType !== "other") score += 15;
  else if (data.projectType) score += 5;
  if (data.budget && data.budget !== "not_sure") score += 15;
  if (data.timeline && data.timeline !== "not_sure") score += 10;
  if (data.projectDetails.trim().length >= 20) score += 10;
  if (data.projectGoals.trim().length >= 20) score += 10;
  const filledCount = [data.fullName, data.email, data.phone, data.company, data.projectType, data.budget, data.timeline, data.projectDetails, data.projectGoals].filter(Boolean).length;
  if (filledCount >= 7) score += 10;
  return Math.min(score, 100);
}

function calculatePriority(score: number): string {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      fullName, email, phone, company,
      projectType, budget, timeline,
      hasExistingWebsite, existingWebsiteUrl,
      projectDetails, projectGoals,
      preferredContactMethod, referralSource,
    } = body;

    if (!fullName?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    if (!projectType) {
      return NextResponse.json({ error: "Project type is required" }, { status: 400 });
    }
    if (!projectDetails?.trim() || projectDetails.trim().length < 10) {
      return NextResponse.json({ error: "Project description must be at least 10 characters" }, { status: 400 });
    }

    const leadScore = calculateLeadScore(body);
    const priority = calculatePriority(leadScore);

    const contact = await prisma.contact.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        projectType,
        budget: budget || null,
        timeline: timeline || null,
        projectDetails: projectDetails.trim(),
        projectGoals: projectGoals?.trim() || null,
        hasExistingWebsite: hasExistingWebsite === "yes" ? true : hasExistingWebsite === "no" ? false : null,
        existingWebsiteUrl: existingWebsiteUrl?.trim() || null,
        preferredContactMethod: preferredContactMethod || null,
        referralSource: referralSource || null,
        leadScore,
        status: "NEW",
        notes: `Qualified via multi-step wizard (${priority} priority, score: ${leadScore}/100)`,
        tags: ["wizard-qualified", priority.toLowerCase()].join(","),
      },
    });

    return NextResponse.json({ contact, leadScore, priority }, { status: 201 });
  } catch (error) {
    console.error("Failed to qualify lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
