import { describe, it, expect } from "vitest";
import {
  createTicketSchema,
  replyToTicketSchema,
  updateTicketSchema,
  rateTicketSchema,
  searchTicketsSchema,
} from "../validations/support";

describe("createTicketSchema", () => {
  it("parses valid ticket", () => {
    const result = createTicketSchema.parse({
      subject: "Help needed",
      description: "I need help with my account",
      fullName: "John Doe",
      email: "john@example.com",
    });
    expect(result.subject).toBe("Help needed");
    expect(result.description).toBe("I need help with my account");
    expect(result.fullName).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.source).toBe("web");
  });

  it("rejects empty subject", () => {
    const result = createTicketSchema.safeParse({
      subject: "",
      description: "Help",
      fullName: "John",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = createTicketSchema.safeParse({
      subject: "Help",
      description: "",
      fullName: "John",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty fullName", () => {
    const result = createTicketSchema.safeParse({
      subject: "Help",
      description: "Help",
      fullName: "",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createTicketSchema.safeParse({
      subject: "Help",
      description: "Help",
      fullName: "John",
      email: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = createTicketSchema.parse({
      subject: "Help",
      description: "Need assistance",
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      company: "Acme",
      preferredContact: "email",
      tags: "urgent",
      internalNotes: "Follow up",
      categoryId: "cat_1",
      priorityId: "pri_1",
      metadata: { source: "web" },
      attachments: [
        { fileName: "file.pdf", fileSize: 1024, mimeType: "application/pdf", url: "https://example.com/file.pdf", storageKey: "key_1" },
      ],
    });
    expect(result.phone).toBe("+1234567890");
    expect(result.preferredContact).toBe("email");
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].fileName).toBe("file.pdf");
  });

  it("rejects invalid preferredContact", () => {
    const result = createTicketSchema.safeParse({
      subject: "Help",
      description: "Help",
      fullName: "John",
      email: "john@example.com",
      preferredContact: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("replyToTicketSchema", () => {
  it("parses valid reply", () => {
    const result = replyToTicketSchema.parse({
      ticketId: "ticket_1",
      body: "Here is the solution",
    });
    expect(result.ticketId).toBe("ticket_1");
    expect(result.body).toBe("Here is the solution");
    expect(result.isInternal).toBe(false);
  });

  it("rejects empty ticketId", () => {
    const result = replyToTicketSchema.safeParse({
      ticketId: "",
      body: "Reply",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty body", () => {
    const result = replyToTicketSchema.safeParse({
      ticketId: "ticket_1",
      body: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts isInternal and attachmentIds", () => {
    const result = replyToTicketSchema.parse({
      ticketId: "ticket_1",
      body: "Internal note",
      isInternal: true,
      attachmentIds: ["att_1"],
    });
    expect(result.isInternal).toBe(true);
    expect(result.attachmentIds).toEqual(["att_1"]);
  });
});

describe("updateTicketSchema", () => {
  it("parses valid update", () => {
    const result = updateTicketSchema.parse({
      ticketId: "ticket_1",
    });
    expect(result.ticketId).toBe("ticket_1");
  });

  it("rejects empty ticketId", () => {
    const result = updateTicketSchema.safeParse({ ticketId: "" });
    expect(result.success).toBe(false);
  });

  it("accepts partial fields", () => {
    const result = updateTicketSchema.parse({
      ticketId: "ticket_1",
      subject: "Updated subject",
      statusId: "status_1",
    });
    expect(result.subject).toBe("Updated subject");
    expect(result.statusId).toBe("status_1");
  });

  it("rejects empty subject when provided", () => {
    const result = updateTicketSchema.safeParse({
      ticketId: "ticket_1",
      subject: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("rateTicketSchema", () => {
  it("parses valid rating", () => {
    const result = rateTicketSchema.parse({
      ticketId: "ticket_1",
      rating: 4,
    });
    expect(result.ticketId).toBe("ticket_1");
    expect(result.rating).toBe(4);
  });

  it("rejects empty ticketId", () => {
    const result = rateTicketSchema.safeParse({
      ticketId: "",
      rating: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating below 1", () => {
    const result = rateTicketSchema.safeParse({
      ticketId: "ticket_1",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = rateTicketSchema.safeParse({
      ticketId: "ticket_1",
      rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional comment", () => {
    const result = rateTicketSchema.parse({
      ticketId: "ticket_1",
      rating: 5,
      comment: "Great support!",
    });
    expect(result.comment).toBe("Great support!");
  });
});

describe("searchTicketsSchema", () => {
  it("parses with defaults", () => {
    const result = searchTicketsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sort).toBe("newest");
  });

  it("parses with all fields", () => {
    const result = searchTicketsSchema.parse({
      search: "bug",
      statusId: "status_1",
      priorityId: "pri_1",
      categoryId: "cat_1",
      assignedToId: "user_1",
      email: "john@example.com",
      page: 2,
      limit: 50,
      sort: "oldest",
    });
    expect(result.search).toBe("bug");
    expect(result.statusId).toBe("status_1");
    expect(result.sort).toBe("oldest");
  });

  it("rejects invalid sort", () => {
    const result = searchTicketsSchema.safeParse({ sort: "other" });
    expect(result.success).toBe(false);
  });

  it("rejects page below 1", () => {
    const result = searchTicketsSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit above 100", () => {
    const result = searchTicketsSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });

  it("rejects limit below 1", () => {
    const result = searchTicketsSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });
});
