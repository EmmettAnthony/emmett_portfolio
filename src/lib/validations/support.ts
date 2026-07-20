import { z } from "zod";

const emailField = z.string().email("Invalid email address").max(320);
const nameField = z.string().min(1, "Name is required").max(255);

export const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(500),
  description: z.string().min(1, "Description is required").max(10000),
  fullName: nameField,
  email: emailField,
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  preferredContact: z.enum(["email", "phone", "any"]).optional().nullable(),
  source: z.string().default("web"),
  tags: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  priorityId: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    url: z.string(),
    storageKey: z.string().optional(),
  })).optional(),
});

export const replyToTicketSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  body: z.string().min(1, "Reply body is required").max(10000),
  isInternal: z.boolean().default(false),
  attachmentIds: z.array(z.string()).optional(),
});

export const updateTicketSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  subject: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(10000).optional(),
  statusId: z.string().optional(),
  priorityId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
});

export const rateTicketSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(1000).optional().nullable(),
});

export const searchTicketsSchema = z.object({
  search: z.string().optional(),
  statusId: z.string().optional(),
  priorityId: z.string().optional(),
  categoryId: z.string().optional(),
  assignedToId: z.string().optional(),
  email: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export type CreateTicketInput = z.input<typeof createTicketSchema>;
export type ReplyToTicketInput = z.input<typeof replyToTicketSchema>;
export type UpdateTicketInput = z.input<typeof updateTicketSchema>;
export type RateTicketInput = z.input<typeof rateTicketSchema>;
export type SearchTicketsInput = z.input<typeof searchTicketsSchema>;
