import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";

export const dynamic = "force-dynamic";

const STAGES = ["NEW_LEAD", "DISCOVERY", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const stageData = await Promise.all(
      STAGES.map(async (stage) => {
        const deals = await prisma.crmDeal.findMany({
          where: { stage },
          orderBy: { updatedAt: "desc" },
          include: { lead: true, client: true, company: true },
        });

        const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

        return {
          stage,
          count: deals.length,
          totalValue,
          deals,
        };
      })
    );

    const totalPipelineValue = stageData.reduce((sum, s) => sum + s.totalValue, 0);
    const totalDeals = stageData.reduce((sum, s) => sum + s.count, 0);

    return NextResponse.json({
      stages: stageData,
      totalPipelineValue,
      totalDeals,
    });
  } catch (error) {
    console.error("CRM pipeline GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
