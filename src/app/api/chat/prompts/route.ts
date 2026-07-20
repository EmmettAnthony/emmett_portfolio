import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { promptTemplateSchema, promptTemplateUpdateSchema } from "@/lib/validations/chatbot";
import { auth } from "@/../auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const enabled = searchParams.get("enabled");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (enabled !== null) where.enabled = enabled === "true";

    const templates = await prisma.promptTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to fetch prompt templates:", error);
    return NextResponse.json({ error: "Failed to fetch prompt templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = promptTemplateSchema.parse(body);

    const existing = await prisma.promptTemplate.findUnique({ where: { name: parsed.name } });
    if (existing) {
      return NextResponse.json({ error: "A template with this name already exists" }, { status: 409 });
    }

    const template = await prisma.promptTemplate.create({ data: parsed });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Failed to create prompt template:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create prompt template" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const body = await request.json();
    const parsed = promptTemplateUpdateSchema.parse(body);

    const existing = await prisma.promptTemplate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Prompt template not found" }, { status: 404 });

    if (parsed.name && parsed.name !== existing.name) {
      const nameExists = await prisma.promptTemplate.findUnique({ where: { name: parsed.name } });
      if (nameExists) return NextResponse.json({ error: "A template with this name already exists" }, { status: 409 });
    }

    const template = await prisma.promptTemplate.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.label !== undefined && { label: parsed.label }),
        ...(parsed.description !== undefined && { description: parsed.description }),
        ...(parsed.prompt !== undefined && { prompt: parsed.prompt }),
        ...(parsed.category !== undefined && { category: parsed.category }),
        ...(parsed.variables !== undefined && { variables: parsed.variables }),
        ...(parsed.isSystem !== undefined && { isSystem: parsed.isSystem }),
        ...(parsed.enabled !== undefined && { enabled: parsed.enabled }),
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Failed to update prompt template:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update prompt template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await prisma.promptTemplate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Prompt template not found" }, { status: 404 });

    if (existing.isSystem) {
      return NextResponse.json({ error: "System templates cannot be deleted" }, { status: 403 });
    }

    await prisma.promptTemplate.delete({ where: { id } });

    return NextResponse.json({ message: "Prompt template deleted successfully" });
  } catch (error) {
    console.error("Failed to delete prompt template:", error);
    return NextResponse.json({ error: "Failed to delete prompt template" }, { status: 500 });
  }
}
