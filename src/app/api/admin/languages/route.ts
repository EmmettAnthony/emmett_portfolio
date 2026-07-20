import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { languageSchema, languageUpdateSchema } from "@/lib/validations/locale";

export async function GET() {
  try {
    const languages = await prisma.siteLanguage.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ languages });
  } catch (error) {
    console.error("Error fetching languages:", error);
    return NextResponse.json(
      { error: "Failed to fetch languages" },
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
    const parsed = languageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.siteLanguage.findUnique({
      where: { code: parsed.data.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A language with this code already exists" },
        { status: 409 }
      );
    }

    // If setting as default, unset any existing default
    if (parsed.data.isDefault) {
      await prisma.siteLanguage.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const language = await prisma.siteLanguage.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        nameEn: parsed.data.nameEn,
        nativeName: parsed.data.nativeName,
        direction: parsed.data.direction,
        flagEmoji: parsed.data.flagEmoji || null,
        flagImage: parsed.data.flagImage || null,
        isEnabled: parsed.data.isEnabled ?? true,
        isDefault: parsed.data.isDefault ?? false,
        fallbackLocale: parsed.data.fallbackLocale || null,
        order: parsed.data.order ?? 0,
      },
    });

    return NextResponse.json({ language }, { status: 201 });
  } catch (error) {
    console.error("Error creating language:", error);
    return NextResponse.json(
      { error: "Failed to create language" },
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
        { error: "Language ID is required" },
        { status: 400 }
      );
    }

    const parsed = languageUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // If setting as default, unset any existing default
    if (parsed.data.isDefault) {
      await prisma.siteLanguage.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const language = await prisma.siteLanguage.update({
      where: { id },
      data: {
        ...parsed.data,
        flagEmoji: parsed.data.flagEmoji || null,
        flagImage: parsed.data.flagImage || null,
        fallbackLocale: parsed.data.fallbackLocale || null,
      },
    });

    return NextResponse.json({ language });
  } catch (error) {
    console.error("Error updating language:", error);
    return NextResponse.json(
      { error: "Failed to update language" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const token = await getToken({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- getToken accepts various request types
      req: request as any,
      secret: process.env.AUTH_SECRET,
    });
    if (!token || token.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Language ID is required" },
        { status: 400 }
      );
    }

    const language = await prisma.siteLanguage.findUnique({ where: { id } });
    if (!language) {
      return NextResponse.json(
        { error: "Language not found" },
        { status: 404 }
      );
    }

    if (language.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default language" },
        { status: 400 }
      );
    }

    await prisma.siteLanguage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting language:", error);
    return NextResponse.json(
      { error: "Failed to delete language" },
      { status: 500 }
    );
  }
}
