import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getBrevo } from "@/lib/brevo/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ subscribers: [], total: 0, page: 1, limit: 20, totalPages: 0 }, { status: 200 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const format = searchParams.get("format");

    // CSV export
    if (format === "csv") {
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { email: { contains: search, mode: "insensitive" as const } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ];
      }
      if (status) where.status = status;

      const subscribers = await prisma.subscriber.findMany({
        where: where as Record<string, unknown>,
        orderBy: { createdAt: "desc" },
        take: 50000,
        include: { preferences: true },
      });

      const headers = "Email,First Name,Last Name,Country,Status,Source,Tags,Consent,Subscribed";
      const rows = subscribers.map((s: { email: string; firstName?: string | null; lastName?: string | null; country?: string | null; status?: string | null; source?: string | null; tags?: string | null; gdprConsent?: boolean | null; subscribedAt?: Date | null }) =>
        [
          s.email,
          s.firstName || "",
          s.lastName || "",
          s.country || "",
          s.status || "",
          s.source || "",
          s.tags || "",
          s.gdprConsent ? "Yes" : "No",
          s.subscribedAt?.toISOString() || "",
        ].join(",")
      );

      const csv = [headers, ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="subscribers-export-${Date.now()}.csv"`,
        },
      });
    }

    // Regular paginated list
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" as const } },
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (status) where.status = status;

    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where: where as Record<string, unknown>,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          preferences: true,
          unsubscribeReason: true,
        },
      }),
      prisma.subscriber.count({ where: where as Record<string, unknown> }),
    ]);

    return NextResponse.json({
      subscribers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json({ subscribers: [], total: 0, page: 1, limit: 20, totalPages: 0 }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { action } = data;

    // Bulk unsubscribe — syncs to Brevo
    if (action === "bulk-unsubscribe") {
      const { ids } = data;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing subscriber IDs" }, { status: 400 });
      }

      // Fetch subscribers + their contact list members for Brevo sync
      const subscribers = await prisma.subscriber.findMany({
        where: { id: { in: ids } },
        select: { id: true, email: true },
      });

      // Update subscriber status in DB
      await prisma.subscriber.updateMany({
        where: { id: { in: ids } },
        data: { status: "UNSUBSCRIBED" },
      });

      // Sync to Brevo — find contact list members with Brevo-linked lists
      const emails = subscribers.map((s) => s.email);
      const members = await prisma.contactListMember.findMany({
        where: { email: { in: emails }, status: { not: "UNSUBSCRIBED" } },
        include: { list: { select: { brevoId: true } } },
      });

      // Update contact list members to UNSUBSCRIBED
      await prisma.contactListMember.updateMany({
        where: { email: { in: emails } },
        data: { status: "UNSUBSCRIBED" },
      });

      // Batch Brevo unlink calls (fire-and-forget with Promise.allSettled)
      const uniqueBrevoListIds = new Set<number>();
      for (const m of members) {
        if (m.list?.brevoId) uniqueBrevoListIds.add(m.list.brevoId);
      }

      if (uniqueBrevoListIds.size > 0) {
        try {
          const brevo = getBrevo();
          const CHUNK = 50;
          for (let i = 0; i < emails.length; i += CHUNK) {
            const emailChunk = emails.slice(i, i + CHUNK);
            await Promise.allSettled(
              emailChunk.map((email) => {
                const memberBrevoLists = members
                  .filter((m) => m.email === email && m.list?.brevoId)
                  .map((m) => m.list!.brevoId!);
                if (memberBrevoLists.length === 0) return Promise.resolve();
                return brevo.contacts.update(email, {
                  unlinkListIds: memberBrevoLists,
                });
              })
            );
          }
        } catch {
          // Brevo sync is optional
        }
      }

      await logActivity({
        action: "bulk_unsubscribe",
        module: "newsletter",
        description: `Bulk unsubscribed ${subscribers.length} subscribers (synced to Brevo)`,
        entity: "Subscriber",
        userId: session.user.id,
        severity: "WARNING",
        metadata: { count: subscribers.length, brevoUnlinked: uniqueBrevoListIds.size },
      });

      return NextResponse.json({ success: true, unsubscribed: subscribers.length });
    }

    // Bulk delete
    if (action === "bulk-delete") {
      const { ids } = data;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing subscriber IDs" }, { status: 400 });
      }

      const result = await prisma.subscriber.deleteMany({
        where: { id: { in: ids } },
      });

      await logActivity({
        action: "bulk_delete",
        module: "newsletter",
        description: `Bulk deleted ${result.count} subscribers`,
        entity: "Subscriber",
        userId: session.user.id,
        severity: "WARNING",
        metadata: { count: result.count },
      });

      return NextResponse.json({ success: true, deleted: result.count });
    }

    // Bulk status update
    if (action === "bulk-status") {
      const { ids, status } = data;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing subscriber IDs" }, { status: 400 });
      }
      if (!["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING_VERIFICATION"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const result = await prisma.subscriber.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });

      await logActivity({
        action: "bulk_status_update",
        module: "newsletter",
        description: `Updated ${result.count} subscribers to status "${status}"`,
        entity: "Subscriber",
        userId: session.user.id,
        severity: "INFO",
        metadata: { count: result.count, newStatus: status },
      });

      return NextResponse.json({ success: true, updated: result.count });
    }

    // CSV import
    if (action === "import-csv") {
      const { csvData, updateExisting } = data;
      if (!csvData) {
        return NextResponse.json({ error: "Missing csvData" }, { status: 400 });
      }

      // Parse CSV
      const lines = csvData.trim().split("\n");
      const rawHeaders = lines[0].split(",").map((h: string) => h.trim().toLowerCase().replace(/\s+/g, ""));
      const emailIdx = rawHeaders.indexOf("email");
      if (emailIdx === -1) return NextResponse.json({ error: "CSV must have an Email column" }, { status: 400 });

      const firstNameIdx = rawHeaders.findIndex((h: string) => h === "firstname" || h === "first_name" || h === "first name");
      const lastNameIdx = rawHeaders.findIndex((h: string) => h === "lastname" || h === "last_name" || h === "last name");
      const countryIdx = rawHeaders.indexOf("country");

      // Email regex
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // === Step 1: Parse + validate all rows first ===
      interface ParsedRow {
        email: string;
        firstName: string | null;
        lastName: string | null;
        country: string | null;
      }

      const validRows: { email: string; row: ParsedRow; lineNum: number }[] = [];
      const validationErrors: string[] = [];
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c: string) => c.trim());
        const email = cols[emailIdx]?.toLowerCase();
        if (!email) continue;

        if (!EMAIL_REGEX.test(email)) {
          validationErrors.push(`Row ${i + 1}: "${cols[emailIdx]}" is not a valid email`);
          skipped++;
          continue;
        }

        validRows.push({
          email,
          row: {
            email,
            firstName: firstNameIdx !== -1 ? cols[firstNameIdx] || email.split("@")[0] : email.split("@")[0],
            lastName: lastNameIdx !== -1 ? cols[lastNameIdx] || "" : "",
            country: countryIdx !== -1 ? cols[countryIdx] : null,
          },
          lineNum: i + 1,
        });
      }

      // === Step 2: Pre-fetch all existing subscribers in ONE query ===
      const existingSubscribers = await prisma.subscriber.findMany({
        where: { email: { in: validRows.map((r) => r.email) } },
        select: { email: true, id: true, firstName: true, lastName: true, country: true },
      });
      const existingMap = new Map(existingSubscribers.map((s) => [s.email.toLowerCase(), s]));

      // === Step 3: Separate into creates and updates ===
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type
      const toCreate: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma update type
      const toUpdate: { id: string; data: any }[] = [];
      const errors: string[] = [];

      for (const { email, row } of validRows) {
        const existing = existingMap.get(email);
        if (existing) {
          if (updateExisting) {
            toUpdate.push({
              id: existing.id,
              data: {
                firstName: row.firstName || existing.firstName,
                lastName: row.lastName || existing.lastName,
                country: row.country || existing.country,
                status: "ACTIVE",
              },
            });
          }
        } else {
          toCreate.push({
            ...row,
            source: "csv_import",
            status: "ACTIVE",
            subscribedAt: new Date(),
            gdprConsent: false,
          });
        }
      }

      // === Step 4: Execute in batched $transaction ===
      const CHUNK_SIZE = 1000;

      await prisma.$transaction(async (tx) => {
        // Batch creates using createMany (single query per chunk)
        if (toCreate.length > 0) {
          for (let i = 0; i < toCreate.length; i += CHUNK_SIZE) {
            const chunk = toCreate.slice(i, i + CHUNK_SIZE);
            await tx.subscriber.createMany({ data: chunk, skipDuplicates: true });
          }
        }

        // Batch updates — run in parallel within the transaction
        if (toUpdate.length > 0) {
          const UPDATE_CHUNK = 200;
          for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
            const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);
            await Promise.all(
              chunk.map((u) =>
                tx.subscriber.update({
                  where: { id: u.id },
                  data: u.data,
                })
              )
            );
          }
        }
      });

      // Build CSV for Brevo sync — sync all valid rows to Brevo
      let brevoSynced = false;
      try {
        const brevo = getBrevo();
        if (validRows.length > 0) {
          const brevoHeaders = "EMAIL,FIRSTNAME,LASTNAME,COUNTRY";
          const brevoRows = validRows.map((r) =>
            [
              r.email,
              r.row.firstName || "",
              r.row.lastName || "",
              r.row.country || "",
            ].join(",")
          );

          const brevoCsv = [brevoHeaders, ...brevoRows].join("\n");
          await brevo.contacts.import({
            fileBody: brevoCsv,
            updateExistingContacts: updateExisting,
          });
          brevoSynced = true;
        }
      } catch {
        // Brevo sync is optional
      }

      // Build result with validation report
      const result: Record<string, unknown> = {
        success: true,
        imported: toCreate.length,
        updated: toUpdate.length,
        skipped,
        totalRows: lines.length - 1,
        brevoSynced,
      };

      if (validationErrors.length > 0) {
        result.validationErrors = validationErrors.slice(0, 25);
        result.totalValidationErrors = validationErrors.length;
      }

      if (errors.length > 0) {
        result.errors = errors.slice(0, 10);
        result.totalErrors = errors.length;
      }

      await logActivity({
        action: "import",
        module: "newsletter",
        description: `CSV imported ${toCreate.length} subscribers, updated ${toUpdate.length}, skipped ${skipped}, ${errors.length} error(s)`,
        entity: "Subscriber",
        userId: session.user.id,
        severity: errors.length > 0 ? "WARNING" : "INFO",
        metadata: {
          imported: toCreate.length,
          updated: toUpdate.length,
          skipped,
          totalRows: lines.length - 1,
          totalValidationErrors: validationErrors.length,
          totalErrors: errors.length,
          brevoSynced,
        },
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process subscribers action:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.subscriber.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete subscriber:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
