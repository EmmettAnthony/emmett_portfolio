import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { PREBUILT_TEMPLATES } from "@/lib/email/templates/prebuilt";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let created = 0;
    let skipped = 0;

    for (const tmpl of PREBUILT_TEMPLATES) {
      const existing = await prisma.template.findFirst({
        where: { name: tmpl.name, isBuiltIn: true },
      });

      if (existing) {
        // Update existing pre-built template (in case content changed)
        await prisma.template.update({
          where: { id: existing.id },
          data: {
            content: tmpl.content,
            description: tmpl.description,
            category: tmpl.category,
            updatedAt: new Date(),
          },
        });
        skipped++;
      } else {
        await prisma.template.create({
          data: {
            name: tmpl.name,
            description: tmpl.description,
            category: tmpl.category,
            content: tmpl.content,
            isBuiltIn: true,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated: skipped,
      total: PREBUILT_TEMPLATES.length,
    });
  } catch (error) {
    console.error("Failed to seed templates:", error);
    return NextResponse.json({ error: "Failed to seed templates" }, { status: 500 });
  }
}
