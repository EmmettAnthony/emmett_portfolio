import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { captureError } from "@/lib/sentry";
import {
  createTaskSchema
} from "@/lib/validations/calendar";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    const prisma = getPrisma();
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.calendarTask.findMany({
        where,
        orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.calendarTask.count({ where }),
    ]);

    return NextResponse.json({ tasks, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    captureError(error, "Failed to fetch tasks");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const prisma = getPrisma();

    const task = await prisma.calendarTask.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        status: data.status,
        progress: data.progress,
        category: data.category,
        tags: data.tags,
        order: data.order,
        color: data.color,
      },
    });

    // Create a calendar event for the task if it has a due date
    if (data.dueDate) {
      await prisma.calendarEvent.create({
        data: {
          title: `Task: ${data.title}`,
          description: data.description,
          startDate: new Date(data.dueDate),
          allDay: true,
          eventType: "TASK",
          status: "SCHEDULED",
          color: data.color || "#8b5cf6",
          taskId: task.id,
        },
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    captureError(error, "Failed to create task");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
