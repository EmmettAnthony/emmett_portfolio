import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(name: string): Promise<string> {
  let slug = slugify(name);
  if (!slug) slug = "project";
  const existing = await prisma.project.findUnique({ where: { slug } });
  if (!existing) return slug;
  for (let i = 0; i < 10; i++) {
    const candidate = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const found = await prisma.project.findUnique({ where: { slug: candidate } });
    if (!found) return candidate;
  }
  return `${slug}-${Date.now()}`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const includeClient = searchParams.get("include") === "client";
    const clientId = searchParams.get("clientId");

    const projects = await prisma.project.findMany({
      where: clientId ? { clientId } : undefined,
      include: includeClient ? { client: true } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, budget, deadline, status, priority, clientId, tags } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const slug = await generateUniqueSlug(name);

    const project = await prisma.project.create({
      data: {
        name,
        slug,
        description,
        budget: budget !== undefined ? parseFloat(budget) : null,
        deadline: deadline ? new Date(deadline) : null,
        status: status || "PLANNING",
        priority: priority || "MEDIUM",
        clientId: clientId || null,
        tags: tags || null,
      },
      include: { client: true },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
