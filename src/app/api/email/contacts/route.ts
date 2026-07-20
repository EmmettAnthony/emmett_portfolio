import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getBrevo } from "@/lib/brevo/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ members: [], total: 0, page: 1, limit: 20, totalPages: 0 }, { status: 200 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const listId = searchParams.get("listId") || "";
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
          { company: { contains: search, mode: "insensitive" as const } },
        ];
      }
      if (status) where.status = status;
      if (listId) where.listId = listId;

      const members = await prisma.contactListMember.findMany({
        where: where as Record<string, unknown>,
        orderBy: { createdAt: "desc" },
        take: 50000,
      });

      const headers = "Email,First Name,Last Name,Company,Phone,Country,Tags,Status,Source,Created";
      const rows = members.map((m: { email: string; firstName?: string | null; lastName?: string | null; company?: string | null; phone?: string | null; country?: string | null; tags?: string | null; status?: string | null; source?: string | null; createdAt?: Date | null }) =>
        [
          m.email,
          m.firstName || "",
          m.lastName || "",
          m.company || "",
          m.phone || "",
          m.country || "",
          m.tags || "",
          m.status || "",
          m.source || "",
          m.createdAt?.toISOString() || "",
        ].join(",")
      );

      const csv = [headers, ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="contacts-export-${Date.now()}.csv"`,
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
        { company: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (status) where.status = status;
    if (listId) where.listId = listId;

    const [members, total] = await Promise.all([
      prisma.contactListMember.findMany({
        where: where as Record<string, unknown>,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactListMember.count({ where: where as Record<string, unknown> }),
    ]);

    return NextResponse.json({
      members,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    return NextResponse.json({ members: [], total: 0, page: 1, limit: 20, totalPages: 0 }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { action } = data;

    // Bulk delete
    if (action === "bulk-delete") {
      const { ids } = data;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Missing contact IDs" }, { status: 400 });
      }

      const result = await prisma.contactListMember.deleteMany({
        where: { id: { in: ids } },
      });

      await logActivity({
        action: "bulk_delete",
        module: "contact",
        description: `Bulk deleted ${result.count} contacts`,
        entity: "Contact",
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
        return NextResponse.json({ error: "Missing contact IDs" }, { status: 400 });
      }
      if (!["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const result = await prisma.contactListMember.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });

      await logActivity({
        action: "bulk_status_update",
        module: "contact",
        description: `Updated ${result.count} contacts to status "${status}"`,
        entity: "Contact",
        userId: session.user.id,
        severity: "INFO",
        metadata: { count: result.count, newStatus: status },
      });

      return NextResponse.json({ success: true, updated: result.count });
    }

    // Create single contact
    if (data.action === "create") {
      const { listId, email, firstName, lastName, company, phone, country } = data;
      if (!listId || !email) {
        return NextResponse.json({ error: "Missing listId or email" }, { status: 400 });
      }

      const existing = await prisma.contactListMember.findUnique({
        where: { listId_email: { listId, email: email.toLowerCase() } },
      });
      if (existing) {
        return NextResponse.json({ error: "Contact already exists in this list" }, { status: 409 });
      }

      const member = await prisma.contactListMember.create({
        data: {
          listId,
          email: email.toLowerCase(),
          firstName: firstName || null,
          lastName: lastName || null,
          company: company || null,
          phone: phone || null,
          country: country || null,
          status: "ACTIVE",
          source: "manual",
        },
      });

      // Sync to Brevo
      try {
        const brevo = getBrevo();
        const list = await prisma.contactList.findUnique({ where: { id: listId } });
        if (list?.brevoId) {
          const attributes: Record<string, unknown> = {};
          if (firstName) attributes.FIRSTNAME = firstName;
          if (lastName) attributes.LASTNAME = lastName;
          if (company) attributes.COMPANY = company;
          if (phone) attributes.PHONE = phone;
          if (country) attributes.COUNTRY = country;

          const brevoContact = await brevo.contacts.create({
            email: email.toLowerCase(),
            attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
            listIds: [list.brevoId],
            updateEnabled: true,
          });

          await prisma.contactListMember.update({
            where: { id: member.id },
            data: { brevoContactId: brevoContact.id, brevoSyncStatus: "SYNCED" },
          });
        }
      } catch {
        await prisma.contactListMember.update({
          where: { id: member.id },
          data: { brevoSyncStatus: "FAILED" },
        }).catch(() => {});
      }

      return NextResponse.json(member);
    }

    // CSV import
    if (data.action === "import-csv") {
      const { csvData, listId: targetListId, updateExisting } = data;
      if (!csvData || !targetListId) {
        return NextResponse.json({ error: "Missing csvData or listId" }, { status: 400 });
      }

      // Parse CSV
      const lines = csvData.trim().split("\n");
      const rawHeaders = lines[0].split(",").map((h: string) => h.trim().toLowerCase().replace(/\s+/g, ""));
      const emailIdx = rawHeaders.indexOf("email");
      if (emailIdx === -1) return NextResponse.json({ error: "CSV must have an Email column" }, { status: 400 });

      const firstNameIdx = rawHeaders.findIndex((h: string) => h === "firstname" || h === "first_name" || h === "first name");
      const lastNameIdx = rawHeaders.findIndex((h: string) => h === "lastname" || h === "last_name" || h === "last name");
      const companyIdx = rawHeaders.indexOf("company");
      const phoneIdx = rawHeaders.indexOf("phone");
      const countryIdx = rawHeaders.indexOf("country");

      // Email regex
      const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // === Step 1: Parse + validate all rows first ===
      interface ParsedRow {
        email: string;
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        phone: string | null;
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
            firstName: firstNameIdx !== -1 ? cols[firstNameIdx] || null : null,
            lastName: lastNameIdx !== -1 ? cols[lastNameIdx] || null : null,
            company: companyIdx !== -1 ? cols[companyIdx] || null : null,
            phone: phoneIdx !== -1 ? cols[phoneIdx] || null : null,
            country: countryIdx !== -1 ? cols[countryIdx] || null : null,
          },
          lineNum: i + 1,
        });
      }

      // === Step 2: Pre-fetch all existing members for this list in ONE query ===
      const existingMembers = await prisma.contactListMember.findMany({
        where: { listId: targetListId },
        select: { email: true, id: true, firstName: true, lastName: true, company: true, phone: true, country: true },
      });
      const existingMap = new Map(existingMembers.map((m) => [m.email.toLowerCase(), m]));

      // === Step 3: Separate into creates and updates ===
      const toCreate: Array<{
            email: string;
            firstName: string | null;
            lastName: string | null;
            company: string | null;
            phone: string | null;
            country: string | null;
            listId: string;
            source: string;
            status: string;
          }> = [];
      const toUpdate: { id: string; data: Partial<ParsedRow> }[] = [];
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
                company: row.company || existing.company,
                phone: row.phone || existing.phone,
                country: row.country || existing.country,
              },
            });
          }
        } else {
          toCreate.push({
            ...row,
            listId: targetListId,
            source: "csv_import",
            status: "ACTIVE",
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
            await tx.contactListMember.createMany({ data: chunk, skipDuplicates: true });
          }
        }

        // Batch updates — run in parallel within the transaction
        if (toUpdate.length > 0) {
          const UPDATE_CHUNK = 200;
          for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
            const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);
            await Promise.all(
              chunk.map((u) =>
                tx.contactListMember.update({
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
        const list = await prisma.contactList.findUnique({
          where: { id: targetListId },
          select: { brevoId: true },
        });

        if (list?.brevoId && validRows.length > 0) {
          // Build a Brevo-compatible CSV for batch import
          const brevoHeaders = "EMAIL,FIRSTNAME,LASTNAME,COMPANY,PHONE,COUNTRY";
          const brevoRows = validRows.map((r) =>
            [
              r.email,
              r.row.firstName || "",
              r.row.lastName || "",
              r.row.company || "",
              r.row.phone || "",
              r.row.country || "",
            ].join(",")
          );

          const brevoCsv = [brevoHeaders, ...brevoRows].join("\n");
          await brevo.contacts.import({
            fileBody: brevoCsv,
            listIds: [list.brevoId],
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
        module: "contact",
        description: `CSV imported ${toCreate.length} contacts, updated ${toUpdate.length}, skipped ${skipped}, ${errors.length} error(s)`,
        entity: "Contact",
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
    console.error("Failed to process contacts action:", error);
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

    await prisma.contactListMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete contact:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
