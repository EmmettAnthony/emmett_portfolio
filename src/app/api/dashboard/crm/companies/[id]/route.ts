import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/../auth";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const company = await prisma.crmCompany.findUnique({
      where: { id },
      include: { clients: true, deals: true },
    });
    if (!company) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(company);
  } catch (error) {
    console.error("CRM company GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const company = await prisma.crmCompany.update({ where: { id }, data: body });
    return NextResponse.json(company);
  } catch (error) {
    console.error("CRM company PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.crmCompany.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CRM company DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
