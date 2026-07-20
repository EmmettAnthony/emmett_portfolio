import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { getPrisma } from "@/lib/db";
import { testimonialSchema } from "@/lib/validations/testimonial";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const featured = searchParams.get("featured");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const prisma = getPrisma();
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (featured !== null) where.featured = featured === "true";

    const orderBy: Record<string, string> = {};
    const allowedSorts = ["createdAt", "name", "rating", "order", "status", "updatedAt"];
    const field = allowedSorts.includes(sortBy) ? sortBy : "createdAt";
    orderBy[field] = sortOrder === "asc" ? "asc" : "desc";

    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({ where, orderBy, skip, take: limit }),
      prisma.testimonial.count({ where }),
    ]);

    return NextResponse.json({
      testimonials,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = testimonialSchema.parse(body);
    const prisma = getPrisma();
    const maxOrder = await prisma.testimonial.aggregate({ _max: { order: true } });

    const testimonial = await prisma.testimonial.create({
      data: {
        ...parsed,
        order: parsed.order || (maxOrder._max.order ?? 0) + 1,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Validation failed", details: (error as { issues: unknown[] }).issues }, { status: 400 });
    }
    console.error("Failed to create testimonial:", error);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    const prisma = getPrisma();

    if (action === "duplicate") {
      const originals = await prisma.testimonial.findMany({ where: { id: { in: ids } } });
      const created = [];
      for (const orig of originals) {
        const dup = await prisma.testimonial.create({
          data: {
            name: `${orig.name} (Copy)`,
            jobTitle: orig.jobTitle,
            company: orig.company,
            companyWebsite: orig.companyWebsite,
            email: orig.email,
            photo: orig.photo,
            companyLogo: orig.companyLogo,
            title: orig.title,
            content: orig.content,
            rating: orig.rating,
            projectName: orig.projectName,
            projectCategory: orig.projectCategory,
            category: orig.category,
            status: "PENDING_REVIEW",
            featured: false,
            displayOnHomepage: false,
            archived: false,
            order: orig.order,
            metaTitle: orig.metaTitle,
            metaDescription: orig.metaDescription,
            ogImage: orig.ogImage,
            submittedAt: new Date(),
          },
        });
        created.push(dup);
      }
      return NextResponse.json({ testimonials: created });
    }

    const data: Record<string, unknown> = {};
    switch (action) {
      case "approve": data.status = "APPROVED"; break;
      case "reject": data.status = "REJECTED"; break;
      case "feature": data.featured = true; break;
      case "unfeature": data.featured = false; break;
      case "archive": data.archived = true; break;
      case "restore": data.archived = false; break;
      case "delete":
        await prisma.testimonial.deleteMany({ where: { id: { in: ids } } });
        return NextResponse.json({ success: true });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.testimonial.updateMany({ where: { id: { in: ids } }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to bulk update:", error);
    return NextResponse.json({ error: "Failed to bulk update" }, { status: 500 });
  }
}
