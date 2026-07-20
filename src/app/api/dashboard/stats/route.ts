import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prisma = getPrisma();
    const [leads, contacts, projects, portfolio, blogPosts, subscribers, activeCampaigns] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.findMany({ select: { status: true } }),
      prisma.project.count(),
      prisma.portfolioProject.count(),
      prisma.blogPost.count(),
      prisma.subscriber.count({ where: { status: "ACTIVE" } }),
      prisma.campaign.count({ where: { status: "SENT" } }),
    ]);

    const newLeads = contacts.filter((c) => c.status === "NEW").length;
    const wonLeads = contacts.filter((c) => c.status === "WON").length;

    return NextResponse.json({
      totalLeads: leads,
      newLeads,
      conversionRate: leads > 0 ? Math.round((wonLeads / leads) * 100) : 0,
      activeProjects: projects,
      portfolioProjects: portfolio,
      blogPosts: blogPosts,
      newsletterSubscribers: subscribers,
      sentCampaigns: activeCampaigns,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({
      totalLeads: 0, newLeads: 0, conversionRate: 0,
      activeProjects: 0, portfolioProjects: 0, blogPosts: 0,
      newsletterSubscribers: 0, sentCampaigns: 0,
    });
  }
}
