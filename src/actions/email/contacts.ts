"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function sanitizeJsonValue<T>(val: T | null | undefined): Prisma.InputJsonValue | undefined {
  return val === null || val === undefined ? undefined : val as unknown as Prisma.InputJsonValue;
}
import { getBrevo } from "@/lib/brevo/client";
import {
  createContactListSchema,
  updateContactListSchema,
  createContactMemberSchema,
  updateContactMemberSchema,
  bulkCreateContactSchema,
  importCsvSchema,
} from "@/lib/validations/email";
import { autoLogCreate, autoLogUpdate, autoLogDelete } from "@/lib/activity-logger";

// ─── Contact Lists ───────────────────────────────────────────────────────

export async function getContactLists() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.contactList.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true } } },
  });
}

export async function getContactList(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.contactList.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });
}

export async function createContactListAction(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = createContactListSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  let brevoList;
  try {
    const brevo = getBrevo();
    brevoList = await brevo.lists.create({
      listName: parsed.data.name,
      folderId: parsed.data.folderId || undefined,
    });
  } catch {
    // Brevo sync is optional
  }

  const list = await prisma.contactList.create({
    data: {
      ...parsed.data,
      brevoId: brevoList?.id || null,
      folderId: parsed.data.folderId || null,
    },
  });

  await autoLogCreate("email", "ContactList", list.id, `Created contact list: ${list.name}`, session.user.id);

  revalidatePath("/dashboard/email/lists");
  return list;
}

export async function updateContactListAction(id: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = updateContactListSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const list = await prisma.contactList.update({
    where: { id },
    data: parsed.data,
  });

  if (list.brevoId && parsed.data.name) {
    try {
      const brevo = getBrevo();
      await brevo.lists.update(list.brevoId, { listName: parsed.data.name });
    } catch {
      // Brevo sync is optional
    }
  }

  await autoLogUpdate("email", "ContactList", id, `Updated contact list: ${list.name}`, session.user.id);

  revalidatePath("/dashboard/email/lists");
  return list;
}

export async function deleteContactListAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const list = await prisma.contactList.findUnique({ where: { id } });
  if (!list) throw new Error("Contact list not found");

  await prisma.contactList.update({
    where: { id },
    data: { isArchived: true },
  });

  if (list.brevoId) {
    try {
      const brevo = getBrevo();
      await brevo.lists.delete(list.brevoId);
    } catch {
      // Brevo sync is optional
    }
  }

  await autoLogDelete("email", "ContactList", id, `Deleted contact list: ${list.name}`, session.user.id);

  revalidatePath("/dashboard/email/lists");
  return { success: true };
}

// ─── Contact List Members ────────────────────────────────────────────────

export async function getContactListMembers(
  listId: string,
  params?: { search?: string; status?: string; page?: number; limit?: number }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { listId };
  if (params?.search) {
    where.OR = [
      { email: { contains: params.search, mode: "insensitive" } },
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { company: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params?.status) where.status = params.status;

  const [members, total] = await Promise.all([
    prisma.contactListMember.findMany({
      where: where as Prisma.ContactListMemberFindManyArgs["where"],
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.contactListMember.count({ where: where as Prisma.ContactListMemberCountArgs["where"] }),
  ]);

  return {
    members,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createContactMemberAction(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = createContactMemberSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const existing = await prisma.contactListMember.findUnique({
    where: { listId_email: { listId: parsed.data.listId, email: parsed.data.email } },
  });
  if (existing) throw new Error("Contact already exists in this list");

  const member = await prisma.contactListMember.create({
    data: {
      ...parsed.data,
      metadata: sanitizeJsonValue(parsed.data.metadata),
    },
  });

  // Sync to Brevo
  try {
    const brevo = getBrevo();
    const list = await prisma.contactList.findUnique({ where: { id: parsed.data.listId } });
    if (list?.brevoId) {
      const attributes: Record<string, unknown> = {};
      if (parsed.data.firstName) attributes.FIRSTNAME = parsed.data.firstName;
      if (parsed.data.lastName) attributes.LASTNAME = parsed.data.lastName;
      if (parsed.data.company) attributes.COMPANY = parsed.data.company;
      if (parsed.data.phone) attributes.PHONE = parsed.data.phone;
      if (parsed.data.country) attributes.COUNTRY = parsed.data.country;
      if (parsed.data.website) attributes.WEBSITE = parsed.data.website;

      const brevoContact = await brevo.contacts.create({
        email: parsed.data.email,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        listIds: [list.brevoId],
        updateEnabled: true,
      });

      await prisma.contactListMember.update({
        where: { id: member.id },
        data: { brevoContactId: brevoContact.id, brevoSyncStatus: "SYNCED" },
      });

      await prisma.brevoSyncLog.create({
        data: {
          action: "contact_create",
          entityType: "contact",
          entityId: member.id,
          brevoId: String(brevoContact.id),
          status: "SUCCESS",
        },
      });
    }
  } catch (err) {
    await prisma.contactListMember.update({
      where: { id: member.id },
      data: {
        brevoSyncStatus: "FAILED",
        brevoSyncError: err instanceof Error ? err.message : "Unknown error",
      },
    });
  }

  await autoLogCreate("email", "ContactListMember", member.id, `Added contact ${member.email} to list`, session.user.id);

  revalidatePath("/dashboard/email/contacts");
  revalidatePath("/dashboard/email/lists");
  return member;
}

export async function updateContactMemberAction(id: string, data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = updateContactMemberSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const member = await prisma.contactListMember.update({
    where: { id },
    data: {
      ...parsed.data,
      brevoSyncStatus: "PENDING",
      metadata: sanitizeJsonValue(parsed.data.metadata),
    },
  });

  // Sync to Brevo
  try {
    const brevo = getBrevo();
    if (member.brevoContactId) {
      const attributes: Record<string, unknown> = {};
      if (parsed.data.firstName !== undefined) attributes.FIRSTNAME = parsed.data.firstName;
      if (parsed.data.lastName !== undefined) attributes.LASTNAME = parsed.data.lastName;
      if (parsed.data.company !== undefined) attributes.COMPANY = parsed.data.company;
      if (parsed.data.country !== undefined) attributes.COUNTRY = parsed.data.country;
      if (parsed.data.phone !== undefined) attributes.PHONE = parsed.data.phone;

      if (Object.keys(attributes).length > 0) {
        await brevo.contacts.update(member.email, { attributes });
      }
    }

    await prisma.contactListMember.update({
      where: { id },
      data: { brevoSyncStatus: "SYNCED", brevoSyncError: null },
    });
  } catch (err) {
    await prisma.contactListMember.update({
      where: { id },
      data: {
        brevoSyncStatus: "FAILED",
        brevoSyncError: err instanceof Error ? err.message : "Unknown error",
      },
    });
  }

  await autoLogUpdate("email", "ContactListMember", id, `Updated contact ${member.email}`, session.user.id);

  revalidatePath("/dashboard/email/contacts");
  return member;
}

export async function deleteContactMemberAction(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const member = await prisma.contactListMember.findUnique({ where: { id } });
  if (!member) throw new Error("Contact not found");

  await prisma.contactListMember.delete({ where: { id } });

  try {
    const brevo = getBrevo();
    await brevo.contacts.delete(member.email);
  } catch {
    // Brevo sync is optional
  }

  await autoLogDelete("email", "ContactListMember", id, `Removed contact ${member.email}`, session.user.id);

  revalidatePath("/dashboard/email/contacts");
  revalidatePath("/dashboard/email/lists");
  return { success: true };
}

export async function bulkCreateContactsAction(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = bulkCreateContactSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const results = [];
  for (const contact of parsed.data.contacts) {
    try {
      const existing = await prisma.contactListMember.findUnique({
        where: { listId_email: { listId: parsed.data.listId, email: contact.email } },
      });
      if (existing && !parsed.data.updateExisting) continue;

      const member = existing
        ? await prisma.contactListMember.update({
            where: { id: existing.id },
            data: { ...contact, metadata: sanitizeJsonValue(contact.metadata) },
          })
        : await prisma.contactListMember.create({
            data: { ...contact, listId: parsed.data.listId, metadata: sanitizeJsonValue(contact.metadata) },
          });

      results.push(member);
    } catch (err) {
      results.push({ email: contact.email, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  // Bulk sync to Brevo
  try {
    const brevo = getBrevo();
    const list = await prisma.contactList.findUnique({ where: { id: parsed.data.listId } });
    if (list?.brevoId) {
      await brevo.contacts.import({
        fileBody: buildCsvFromContacts(parsed.data.contacts),
        listIds: [list.brevoId],
        updateExistingContacts: parsed.data.updateExisting,
        notifyUrl: parsed.data.notifyUrl || undefined,
      });
    }
  } catch {
    // Brevo sync is optional
  }

  await autoLogCreate("email", "ContactListMember", parsed.data.listId, `Bulk imported ${results.length} contacts`, session.user.id);

  revalidatePath("/dashboard/email/contacts");
  revalidatePath("/dashboard/email/lists");
  return { count: results.length, results };
}

export async function exportContactsCsvAction(listId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const where = listId ? { listId } : {};
  const members = await prisma.contactListMember.findMany({
    where: where as Prisma.ContactListMemberFindManyArgs["where"],
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const csv = buildCsvFromMembers(members);
  return { csv, filename: `contacts-export-${Date.now()}.csv` };
}

export async function importContactsCsvAction(data: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = importCsvSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Validation failed: " + JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  // Parse CSV rows
  const rawContacts = parseCsvToContacts(parsed.data.csvData);

  // Validate email format for each contact
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validatedContacts: { email: string; firstName?: string; lastName?: string; company?: string }[] = [];
  const validationErrors: string[] = [];
  let skippedCount = 0;

  for (let i = 0; i < rawContacts.length; i++) {
    const contact = rawContacts[i];
    if (!EMAIL_REGEX.test(contact.email)) {
      validationErrors.push(`Row ${i + 2}: "${contact.email}" is not a valid email`);
      skippedCount++;
      continue;
    }
    validatedContacts.push(contact);
  }

  if (validatedContacts.length === 0) {
    return {
      count: 0,
      results: [],
      skipped: skippedCount,
      validationErrors: validationErrors.slice(0, 25),
      totalValidationErrors: validationErrors.length,
    };
  }

  const result = await bulkCreateContactsAction({
    listId: parsed.data.listId,
    contacts: validatedContacts,
    updateExisting: parsed.data.updateExisting,
  });

  return {
    ...result,
    skipped: skippedCount,
    validationErrors: validationErrors.slice(0, 25),
    totalValidationErrors: validationErrors.length,
  };
}

function buildCsvFromContacts(contacts: { email: string; firstName?: string | null; lastName?: string | null; company?: string | null }[]): string {
  const headers = "EMAIL,FIRSTNAME,LASTNAME,COMPANY";
  const rows = contacts.map((c) =>
    [c.email, c.firstName || "", c.lastName || "", c.company || ""].join(",")
  );
  return [headers, ...rows].join("\n");
}

function buildCsvFromMembers(members: { email: string; firstName?: string | null; lastName?: string | null; company?: string | null; phone?: string | null; country?: string | null; tags?: string | null }[]): string {
  const headers = "Email,First Name,Last Name,Company,Phone,Country,Tags";
  const rows = members.map((m) =>
    [m.email, m.firstName || "", m.lastName || "", m.company || "", m.phone || "", m.country || "", m.tags || ""].join(",")
  );
  return [headers, ...rows].join("\n");
}

function parseCsvToContacts(csv: string): { email: string; firstName?: string; lastName?: string; company?: string }[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const emailIdx = headers.indexOf("email");
  const firstNameIdx = headers.indexOf("firstname") !== -1 ? headers.indexOf("firstname") : headers.indexOf("first_name");
  const lastNameIdx = headers.indexOf("lastname") !== -1 ? headers.indexOf("lastname") : headers.indexOf("last_name");
  const companyIdx = headers.indexOf("company");

  if (emailIdx === -1) throw new Error("CSV must have an EMAIL column");

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      email: cols[emailIdx],
      ...(firstNameIdx !== -1 && { firstName: cols[firstNameIdx] }),
      ...(lastNameIdx !== -1 && { lastName: cols[lastNameIdx] }),
      ...(companyIdx !== -1 && { company: cols[companyIdx] }),
    };
  }).filter((c) => c.email);
}
