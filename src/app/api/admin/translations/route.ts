import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { translationSchema, bulkImportSchema } from "@/lib/validations/locale";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const languageId = searchParams.get("languageId");
    const search = searchParams.get("search");
    const missingOnly = searchParams.get("missingOnly") === "true";
    const includeLanguages = searchParams.get("includeLanguages") === "true";

    const where: Record<string, unknown> = {};

    if (groupId) where.groupId = groupId;
    if (languageId) where.languageId = languageId;
    if (search) {
      where.OR = [
        { key: { contains: search } },
        { value: { contains: search } },
      ];
    }
    if (missingOnly) where.value = null;

    const translations = await prisma.translation.findMany({
      where,
      include: includeLanguages ? { language: true, group: true } : undefined,
      orderBy: [{ groupId: "asc" }, { key: "asc" }],
    });

    // If language filter is set, also fetch all groups for the filter dropdown
    const groups = await prisma.translationGroup.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ translations, groups });
  } catch (error) {
    console.error("Error fetching translations:", error);
    return NextResponse.json(
      { error: "Failed to fetch translations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = await getToken({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- getToken accepts various request types
      req: request as any,
      secret: process.env.AUTH_SECRET,
    });
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = translationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.translation.findUnique({
      where: {
        groupId_key_languageId: {
          groupId: parsed.data.groupId,
          key: parsed.data.key,
          languageId: parsed.data.languageId,
        },
      },
    });

    if (existing) {
      // Update existing
      const translation = await prisma.translation.update({
        where: { id: existing.id },
        data: {
          value: parsed.data.value || null,
          pluralForm: parsed.data.pluralForm || null,
          context: parsed.data.context || null,
          needsReview: parsed.data.needsReview ?? false,
          isAutoTranslated: false,
        },
      });
      return NextResponse.json({ translation });
    }

    const translation = await prisma.translation.create({
      data: {
        groupId: parsed.data.groupId,
        key: parsed.data.key,
        value: parsed.data.value || null,
        languageId: parsed.data.languageId,
        pluralForm: parsed.data.pluralForm || null,
        context: parsed.data.context || null,
        needsReview: parsed.data.needsReview ?? false,
      },
    });

    return NextResponse.json({ translation }, { status: 201 });
  } catch (error) {
    console.error("Error creating translation:", error);
    return NextResponse.json(
      { error: "Failed to create translation" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const token = await getToken({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- getToken accepts various request types
      req: request as any,
      secret: process.env.AUTH_SECRET,
    });
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Translation ID is required" },
        { status: 400 }
      );
    }

    const translation = await prisma.translation.update({
      where: { id },
      data: {
        value: data.value !== undefined ? (data.value || null) : undefined,
        pluralForm: data.pluralForm !== undefined ? (data.pluralForm || null) : undefined,
        context: data.context !== undefined ? (data.context || null) : undefined,
        needsReview: data.needsReview !== undefined ? data.needsReview : undefined,
        isAutoTranslated: data.isAutoTranslated !== undefined ? data.isAutoTranslated : undefined,
      },
    });

    return NextResponse.json({ translation });
  } catch (error) {
    console.error("Error updating translation:", error);
    return NextResponse.json(
      { error: "Failed to update translation" },
      { status: 500 }
    );
  }
}

// Bulk import
export async function PUT(request: Request) {
  try {
    const token = await getToken({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- getToken accepts various request types
      req: request as any,
      secret: process.env.AUTH_SECRET,
    });
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bulkImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { languageId, groupId, overwrite, translations } = parsed.data;
    let created = 0;
    let updated = 0;

    for (const t of translations) {
      const existing = await prisma.translation.findUnique({
        where: {
          groupId_key_languageId: {
            groupId,
            key: t.key,
            languageId,
          },
        },
      });

      if (existing) {
        if (overwrite) {
          await prisma.translation.update({
            where: { id: existing.id },
            data: { value: t.value || null },
          });
          updated++;
        }
      } else {
        await prisma.translation.create({
          data: {
            groupId,
            key: t.key,
            value: t.value || null,
            languageId,
            pluralForm: t.pluralForm || null,
            context: t.context || null,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ created, updated });
  } catch (error) {
    console.error("Error bulk importing translations:", error);
    return NextResponse.json(
      { error: "Failed to import translations" },
      { status: 500 }
    );
  }
}
