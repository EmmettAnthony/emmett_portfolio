"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/../auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import {
  createTicketSchema,
  replyToTicketSchema,
  updateTicketSchema,
  rateTicketSchema,
  searchTicketsSchema,
} from "@/lib/validations/support";
import { sendNotification } from "@/lib/notifications/notification-service";
import { logActivity } from "@/lib/activity";
import { runAutomationRules } from "@/lib/support/automation-engine";
import { getResend } from "@/lib/resend";
import {
  ticketConfirmation,
  ticketReplyNotification,
  ticketStatusChanged,
  ticketClosedSurvey,
} from "@/lib/email-templates";

function generateTicketNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = Array.from({ length: 5 }, () => chars[crypto.randomInt(chars.length)]).join("");
  return `SUP-${random}`;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session as { user: { id: string; name?: string | null; email?: string | null } };
}

async function getPriorityLevel(priorityId: string | null | undefined): Promise<string> {
  if (!priorityId) return "NORMAL";
  const priority = await prisma.supportPriority.findUnique({ where: { id: priorityId } });
  return priority?.slug?.toUpperCase() ?? "NORMAL";
}

export async function createTicketAction(data: unknown) {
  const session = await requireAdmin();

  const parsed = createTicketSchema.parse(data);

  const ticketNumber = generateTicketNumber();

  let status = await prisma.supportStatus.findFirst({ where: { isDefault: true } });
  if (!status) {
    status = await prisma.supportStatus.findFirst();
    if (!status) throw new Error("No support status found in the system");
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      subject: parsed.subject,
      description: parsed.description,
      fullName: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone ?? null,
      company: parsed.company ?? null,
      preferredContact: parsed.preferredContact ?? null,
      source: parsed.source ?? "web",
      tags: parsed.tags ?? null,
      internalNotes: parsed.internalNotes ?? null,
      metadata: (parsed.metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
      categoryId: parsed.categoryId ?? null,
      priorityId: parsed.priorityId ?? null,
      statusId: status.id,
    },
    include: {
      category: true,
      priority: true,
      status: true,
    },
  });

  runAutomationRules("ticket_created", ticket).catch(() => {});

  const priorityLevel = await getPriorityLevel(parsed.priorityId);

  // Auto-link to existing CRM contact/client
  try {
    const existingContact = await prisma.contact.findFirst({ where: { email: parsed.email } });
    if (existingContact) {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { contactId: existingContact.id },
      });
    }
  } catch { /* non-critical */ }

  try {
    const existingClient = await prisma.crmClient.findFirst({ where: { email: parsed.email } });
    if (existingClient) {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { clientId: existingClient.id },
      });
    }
  } catch { /* non-critical */ }

  await sendNotification({
    eventKey: "support.ticket.created",
    title: `New Support Ticket: ${ticket.ticketNumber}`,
    message: `${parsed.subject} — from ${parsed.fullName}`,
    link: `/dashboard/support/tickets/${ticket.id}`,
    source: "support",
    categoryOverride: "CONTACT" as const,
    priorityOverride:
      priorityLevel === "URGENT" || priorityLevel === "CRITICAL"
        ? ("HIGH" as const)
        : ("MEDIUM" as const),
  });

  if (parsed.attachments && parsed.attachments.length > 0) {
    await prisma.supportAttachment.createMany({
      data: parsed.attachments.map((a) => ({
        ticketId: ticket.id,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        url: a.url,
        storageKey: a.storageKey || null,
      })),
    });
  }

  await logActivity({
    action: "support_ticket_created",
    module: "crm",
    entity: "SupportTicket",
    entityId: ticket.id,
    description: `Support ticket ${ticket.ticketNumber} created: ${ticket.subject}`,
    severity: "INFO",
    userId: session?.user?.id,
  });

  try {
    const resend = getResend();
    const senderEmail = process.env.SENDER_EMAIL || "delivered@resend.dev";
    const html = ticketConfirmation({
      fullName: ticket.fullName,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
    });
    await resend.emails.send({
      from: `Support <${senderEmail}>`,
      to: ticket.email,
      subject: `[Ticket ${ticket.ticketNumber}] Confirmed: ${ticket.subject}`,
      html,
    });
  } catch (e) {
    console.error("Failed to send ticket confirmation email:", e);
  }

  revalidatePath("/dashboard/support/tickets");
  return { success: true, ticket };
}

export async function replyToTicketAction(data: unknown) {
  const session = await requireAdmin();

  const parsed = replyToTicketSchema.parse(data);

  const existingTicket = await prisma.supportTicket.findUnique({
    where: { id: parsed.ticketId },
    select: { id: true, statusId: true, assignedToId: true, ticketNumber: true, subject: true, email: true, fullName: true, createdAt: true, firstResponseAt: true },
  });
  if (!existingTicket) throw new Error("Ticket not found");

  const reply = await prisma.supportReply.create({
    data: {
      body: parsed.body,
      isInternal: parsed.isInternal,
      isStaff: true,
      staffName: session.user.name ?? session.user.email ?? "Staff",
      ticketId: parsed.ticketId,
      authorId: session.user.id as string,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  if (parsed.attachmentIds && parsed.attachmentIds.length > 0) {
    await prisma.supportAttachment.updateMany({
      where: { id: { in: parsed.attachmentIds }, ticketId: parsed.ticketId, replyId: null },
      data: { replyId: reply.id },
    });
  }

  const targetStatus = await prisma.supportStatus.findFirst({
    where: { slug: "WAITING_ON_CLIENT" },
  });
  if (targetStatus && existingTicket.statusId !== targetStatus.id) {
    await prisma.supportTicket.update({
      where: { id: parsed.ticketId },
      data: { statusId: targetStatus.id },
    });
  }

  if (!existingTicket.firstResponseAt) {
    const responseTimeMin = Math.round((Date.now() - existingTicket.createdAt.getTime()) / 60000);
    await prisma.supportTicket.update({
      where: { id: existingTicket.id },
      data: { firstResponseAt: new Date(), responseTime: responseTimeMin },
    });
  }

  if (!parsed.isInternal) {
    try {
      const resend = getResend();
      const senderEmail = process.env.SENDER_EMAIL || "delivered@resend.dev";
      const html = ticketReplyNotification({
        visitorName: existingTicket.fullName,
        message: parsed.body,
        staffName: reply.staffName ?? "Staff",
        ticketNumber: existingTicket.ticketNumber,
      });
      await resend.emails.send({
        from: `Support <${senderEmail}>`,
        to: existingTicket.email,
        subject: `[Ticket ${existingTicket.ticketNumber}] New Reply: ${existingTicket.subject}`,
        html,
      });
    } catch (e) {
      console.error("Failed to send reply notification email:", e);
    }
  }

  await sendNotification({
    eventKey: "support.ticket.replied",
    title: `Reply on Ticket ${existingTicket.ticketNumber}`,
    message: `Staff replied: ${existingTicket.subject}`,
    link: `/dashboard/support/tickets/${parsed.ticketId}`,
    source: "support",
    categoryOverride: "CONTACT" as const,
    priorityOverride: "MEDIUM" as const,
  });

  await logActivity({
    action: "support_ticket_replied",
    module: "crm",
    entity: "SupportTicket",
    entityId: parsed.ticketId,
    description: `Support ticket ${existingTicket.ticketNumber} replied`,
    severity: "INFO",
    userId: session?.user?.id,
  });

  revalidatePath(`/dashboard/support/tickets/${parsed.ticketId}`);
  return { success: true, reply };
}

export async function updateTicketAction(data: unknown) {
  const session = await requireAdmin();

  const parsed = updateTicketSchema.parse(data);

  const existing = await prisma.supportTicket.findUnique({
    where: { id: parsed.ticketId },
    select: { id: true, ticketNumber: true, statusId: true, subject: true, email: true, fullName: true },
  });
  if (!existing) throw new Error("Ticket not found");

  const updateData: Record<string, unknown> = {};
  if (parsed.subject !== undefined) updateData.subject = parsed.subject;
  if (parsed.description !== undefined) updateData.description = parsed.description;
  if (parsed.statusId !== undefined) updateData.statusId = parsed.statusId;
  if (parsed.priorityId !== undefined) updateData.priorityId = parsed.priorityId;
  if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId;
  if (parsed.assignedToId !== undefined) updateData.assignedToId = parsed.assignedToId;
  if (parsed.internalNotes !== undefined) updateData.internalNotes = parsed.internalNotes;
  if (parsed.tags !== undefined) updateData.tags = parsed.tags;

  if (parsed.statusId !== undefined && parsed.statusId !== existing.statusId) {
    const newStatus = await prisma.supportStatus.findUnique({
      where: { id: parsed.statusId },
    });
    if (newStatus?.isClosed) {
      updateData.closedAt = new Date();
    }
    if (newStatus?.slug === "RESOLVED") {
      updateData.resolvedAt = new Date();
    }
  }

  const ticket = await prisma.supportTicket.update({
    where: { id: parsed.ticketId },
    data: updateData,
    include: {
      category: true,
      priority: true,
      status: true,
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  const statusChanged = parsed.statusId !== undefined && parsed.statusId !== existing.statusId;
  if (statusChanged) {
    const newStatus = await prisma.supportStatus.findUnique({
      where: { id: parsed.statusId! },
    });
    await sendNotification({
      eventKey: "support.ticket.status_changed",
      title: `Ticket ${ticket.ticketNumber} Status Updated`,
      message: `Status changed to ${newStatus?.name ?? "Unknown"}: ${ticket.subject}`,
      link: `/dashboard/support/tickets/${ticket.id}`,
      source: "support",
      categoryOverride: "CONTACT" as const,
      priorityOverride: "MEDIUM" as const,
    });

    try {
      const resend = getResend();
      const senderEmail = process.env.SENDER_EMAIL || "delivered@resend.dev";
      const oldStatusName = existing.statusId
        ? (await prisma.supportStatus.findUnique({ where: { id: existing.statusId } }))?.name ?? "Unknown"
        : "Unknown";
      const html = ticketStatusChanged({
        fullName: existing.fullName,
        ticketNumber: existing.ticketNumber,
        oldStatus: oldStatusName,
        newStatus: newStatus?.name ?? "Unknown",
      });
      await resend.emails.send({
        from: `Support <${senderEmail}>`,
        to: existing.email,
        subject: `[Ticket ${existing.ticketNumber}] Status Updated: ${existing.subject}`,
        html,
      });
    } catch (e) {
      console.error("Failed to send status change email:", e);
    }
  }

  if (statusChanged) {
    await logActivity({
      action: "support_ticket_status_changed",
      module: "crm",
      entity: "SupportTicket",
      entityId: ticket.id,
      description: `Support ticket ${ticket.ticketNumber} status changed`,
      severity: "INFO",
      userId: session?.user?.id,
    });
  }

  revalidatePath(`/dashboard/support/tickets/${parsed.ticketId}`);
  return { success: true, ticket };
}

export async function getTicketAction(ticketId: string) {
  const session = await requireAdmin();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      category: true,
      priority: true,
      status: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          attachments: true,
        },
      },
      attachments: {
        where: { replyId: null },
      },
      ratings: true,
    },
  });

  if (!ticket) throw new Error("Ticket not found");

  await logActivity({
    action: "ticket_viewed",
    module: "support",
    description: `Ticket ${ticket.ticketNumber} viewed`,
    userId: session.user.id as string,
    entity: "SupportTicket",
    entityId: ticket.id,
    severity: "INFO",
  });

  return { ticket };
}

export async function getTicketByNumberAction(ticketNumber: string) {
  await requireAdmin();

  const ticket = await prisma.supportTicket.findUnique({
    where: { ticketNumber },
    include: {
      category: true,
      priority: true,
      status: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          attachments: true,
        },
      },
      attachments: {
        where: { replyId: null },
      },
      ratings: true,
    },
  });

  if (!ticket) throw new Error("Ticket not found");

  return { ticket };
}

export async function assignTicketAction(ticketId: string, userId: string) {
  const session = await requireAdmin();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, ticketNumber: true, subject: true },
  });
  if (!ticket) throw new Error("Ticket not found");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw new Error("User not found");

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { assignedToId: userId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  try {
    await sendNotification({
      userId,
      eventKey: "support.ticket.assigned",
      title: `Ticket Assigned: ${ticket.ticketNumber}`,
      message: `You have been assigned to ticket: ${ticket.subject}`,
      link: `/dashboard/support/tickets/${ticketId}`,
      source: "support",
      categoryOverride: "CONTACT" as const,
      priorityOverride: "MEDIUM" as const,
    });
  } catch {
    // Non-critical
  }

  await logActivity({
    action: "support_ticket_assigned",
    module: "crm",
    entity: "SupportTicket",
    entityId: ticketId,
    description: `Support ticket ${ticket.ticketNumber} assigned to ${user.name ?? user.email}`,
    severity: "INFO",
    userId: session?.user?.id,
  });

  revalidatePath(`/dashboard/support/tickets/${ticketId}`);
  return { success: true, ticket: updated };
}

export async function closeTicketAction(ticketId: string) {
  const session = await requireAdmin();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, ticketNumber: true, subject: true, statusId: true, resolvedAt: true, email: true, fullName: true, createdAt: true, priorityId: true, categoryId: true, description: true },
  });
  if (!ticket) throw new Error("Ticket not found");

  const closedStatus = await prisma.supportStatus.findFirst({
    where: { slug: "CLOSED" },
  });
  if (!closedStatus) throw new Error("Closed status not found");

  const now = new Date();
  const resolutionTime = Math.round((now.getTime() - ticket.createdAt.getTime()) / 60000);
  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      statusId: closedStatus.id,
      closedAt: now,
      resolvedAt: ticket.resolvedAt ?? now,
      resolutionTime,
    },
    include: {
      status: true,
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  runAutomationRules("ticket_closed", ticket).catch(() => {});

  try {
    await sendNotification({
      eventKey: "support.ticket.closed",
      title: `Ticket Closed: ${ticket.ticketNumber}`,
      message: `Ticket "${ticket.subject}" has been closed`,
      link: `/dashboard/support/tickets/${ticketId}`,
      source: "support",
      categoryOverride: "CONTACT" as const,
      priorityOverride: "LOW" as const,
    });
  } catch {
    // Non-critical
  }

  try {
    const resend = getResend();
    const senderEmail = process.env.SENDER_EMAIL || "delivered@resend.dev";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://emmettanthony.dev";
    const ratingUrl = `${baseUrl}/api/support/ratings?ticketId=${ticket.id}&token=${Buffer.from(ticket.ticketNumber).toString('base64')}`;
    const html = ticketClosedSurvey({
      fullName: ticket.fullName,
      ticketNumber: ticket.ticketNumber,
      ratingUrl,
    });
    await resend.emails.send({
      from: `Support <${senderEmail}>`,
      to: ticket.email,
      subject: `[Ticket ${ticket.ticketNumber}] Closed — We'd love your feedback`,
      html,
    });
  } catch (e) {
    console.error("Failed to send ticket closed survey email:", e);
  }

  await logActivity({
    action: "support_ticket_closed",
    module: "crm",
    entity: "SupportTicket",
    entityId: ticketId,
    description: `Support ticket ${ticket.ticketNumber} closed`,
    severity: "INFO",
    userId: session?.user?.id,
  });

  revalidatePath(`/dashboard/support/tickets/${ticketId}`);
  return { success: true, ticket: updated };
}

export async function rateTicketAction(data: unknown) {
  const parsed = rateTicketSchema.parse(data);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.ticketId },
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: { select: { isClosed: true, slug: true } },
    },
  });
  if (!ticket) throw new Error("Ticket not found");
  if (!ticket.status.isClosed && ticket.status.slug !== "RESOLVED") {
    throw new Error("Can only rate closed or resolved tickets");
  }

  const existingRating = await prisma.supportRating.findUnique({
    where: { ticketId: parsed.ticketId },
  });
  if (existingRating) throw new Error("Ticket already has a rating");

  const rating = await prisma.supportRating.create({
    data: {
      rating: parsed.rating,
      comment: parsed.comment ?? null,
      ticketId: parsed.ticketId,
    },
  });

  await logActivity({
    action: "support_ticket_rated",
    module: "crm",
    entity: "SupportRating",
    entityId: rating.id,
    description: `Support ticket ${ticket.ticketNumber} rated ${parsed.rating}/5`,
    severity: "INFO",
  });

  revalidatePath(`/dashboard/support/tickets/${parsed.ticketId}`);
  return { success: true, rating };
}

export async function searchTicketsAction(params: unknown) {
  await requireAdmin();

  const parsed = searchTicketsSchema.parse(params);

  const where: Prisma.SupportTicketWhereInput = {};

  if (parsed.search) {
    where.OR = [
      { ticketNumber: { contains: parsed.search, mode: "insensitive" } },
      { subject: { contains: parsed.search, mode: "insensitive" } },
      { description: { contains: parsed.search, mode: "insensitive" } },
      { fullName: { contains: parsed.search, mode: "insensitive" } },
      { email: { contains: parsed.search, mode: "insensitive" } },
    ];
  }

  if (parsed.statusId) where.statusId = parsed.statusId;
  if (parsed.priorityId) where.priorityId = parsed.priorityId;
  if (parsed.categoryId) where.categoryId = parsed.categoryId;
  if (parsed.assignedToId) where.assignedToId = parsed.assignedToId;
  if (parsed.email) where.email = { contains: parsed.email, mode: "insensitive" };

  const orderBy: Prisma.SupportTicketOrderByWithRelationInput =
    parsed.sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  const skip = (parsed.page - 1) * parsed.limit;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy,
      skip,
      take: parsed.limit,
      include: {
        category: true,
        priority: true,
        status: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { replies: true, attachments: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets,
    total,
    page: parsed.page,
    pages: Math.ceil(total / parsed.limit),
  };
}

export async function getMyTicketsAction(email: string) {
  const tickets = await prisma.supportTicket.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      priority: true,
      status: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      _count: { select: { replies: true, attachments: true } },
    },
  });

  return { tickets };
}

export async function getTicketStatsAction() {
  await requireAdmin();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalTickets,
    openTickets,
    closedToday,
    ratings,
    responseTimeAgg,
    ticketsLast30,
    agentData,
  ] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: { isClosed: false } } }),
    prisma.supportTicket.count({ where: { closedAt: { gte: todayStart } } }),
    prisma.supportRating.findMany({ select: { rating: true } }),
    prisma.supportTicket.aggregate({ _avg: { responseTime: true }, where: { responseTime: { not: null } } }),
    prisma.supportTicket.aggregate({ _avg: { resolutionTime: true }, where: { resolutionTime: { not: null } } }),
    prisma.supportTicket.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true, category: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.supportCategory.findMany({
      where: { isActive: true },
      select: { name: true, _count: { select: { tickets: true } } },
    }),
    prisma.user.findMany({
      where: { assignedTickets: { some: {} } },
      select: {
        name: true,
        _count: {
          select: {
            assignedTickets: true,
          },
        },
      },
    }),
  ]);

  const totalRatings = ratings.length;
  const positiveRatings = ratings.filter((r) => r.rating >= 4).length;
  const satisfactionRate = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 0;

  const closedTotal = await prisma.supportTicket.count({ where: { status: { isClosed: true } } });
  const resolutionRate = totalTickets > 0 ? Math.round((closedTotal / totalTickets) * 100) : 0;

  const avgResp = Math.round(responseTimeAgg._avg.responseTime ?? 0);
  const avgRespDisplay = avgResp < 60 ? `${avgResp}m` : `${Math.floor(avgResp / 60)}h ${avgResp % 60}m`;

  const dailyMap = new Map<string, number>();
  for (const t of ticketsLast30) {
    const day = t.createdAt.toISOString().split("T")[0];
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  }
  const ticketsByDay = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  const categoryCounts = new Map<string, number>();
  for (const t of ticketsLast30) {
    const name = t.category?.name || "Uncategorized";
    categoryCounts.set(name, (categoryCounts.get(name) || 0) + 1);
  }
  const ticketsByCategory = Array.from(categoryCounts.entries()).map(([name, count]) => ({ name, count }));

  return {
    stats: {
      totalTickets,
      openTickets,
      closedToday,
      avgResponseTime: avgRespDisplay,
      satisfactionRate,
      resolutionRate,
    },
    ticketsByDay,
    ticketsByCategory,
    agentPerformance: agentData.map((a) => ({
      name: a.name || "Unknown",
      resolved: 0,
      open: a._count.assignedTickets,
      avgResponseTime: avgRespDisplay,
    })),
  };
}
