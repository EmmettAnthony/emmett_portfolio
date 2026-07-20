import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    const headerRow = rows[0].map((h) => h.trim().toLowerCase());
    const colMap: Record<string, number> = {};
    headerRow.forEach((h, i) => {
      colMap[h] = i;
    });

    const requiredCols = ["email"];
    for (const col of requiredCols) {
      if (!(col in colMap)) {
        return NextResponse.json({ error: `Missing required column: ${col}` }, { status: 400 });
      }
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const email = (row[colMap["email"]] ?? "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        errors.push(`Row ${i + 1}: Invalid or missing email`);
        continue;
      }

      const existing = await prisma.subscriber.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const firstName = (row[colMap["first_name"]] ?? "").trim() || "Unknown";
      const lastName = (row[colMap["last_name"]] ?? "").trim() || "Unknown";
      const phone = (row[colMap["phone"]] ?? "").trim() || null;
      const company = (row[colMap["company"]] ?? "").trim() || null;
      const country = (row[colMap["country"]] ?? "").trim() || null;
      const tags = (row[colMap["tags"]] ?? "").trim() || null;
      const source = (row[colMap["source"]] ?? "").trim() || "manual_import";

      try {
        await prisma.subscriber.create({
          data: { firstName, lastName, email, phone, company, country, tags, source },
        });
        imported++;
      } catch {
        errors.push(`Row ${i + 1}: Failed to create subscriber for ${email}`);
      }
    }

    await logActivity({
      action: "import",
      module: "newsletter",
      description: `Imported ${imported} subscribers, skipped ${skipped}, errors ${errors.length}`,
      entity: "Subscriber",
      severity: "INFO",
    });

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error("Failed to import subscribers:", error);
    return NextResponse.json({ error: "Failed to import subscribers" }, { status: 500 });
  }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        currentRow.push(currentField);
        currentField = "";
        if (currentRow.some((f) => f !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        if (char === "\r") i++;
      } else if (char === "\r") {
        currentRow.push(currentField);
        currentField = "";
        if (currentRow.some((f) => f !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}
