import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const templates = await prisma.emailTemplate.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { name, label, subject, htmlBody, variables } = body;
  if (!name || !subject || !htmlBody) {
    return NextResponse.json({ error: "Name, subject, and htmlBody are required" }, { status: 400 });
  }
  const template = await prisma.emailTemplate.upsert({
    where: { name },
    update: { label, subject, htmlBody, variables: variables || "[]" },
    create: { name, label: label || name, subject, htmlBody, variables: variables || "[]" },
  });
  return NextResponse.json({ template });
}
