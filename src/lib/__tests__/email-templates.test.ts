// ──────────────────────────────────────────────────────────────────────────────
// Email Template Unit Tests
// ──────────────────────────────────────────────────────────────────────────────
// Tests all template generation functions directly (no mocks needed — these
// are pure functions that return { subject, html } or just html strings).
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";

// ═════════════════════════════════════════════════════════════════════════════
// src/lib/email/templates.ts — Appointment Templates
// ═════════════════════════════════════════════════════════════════════════════

describe("appointmentConfirmationTemplate", () => {
  it("returns subject 'Consultation Booking Confirmed'", async () => {
    const { appointmentConfirmationTemplate } = await import("@/lib/email/templates");
    const result = appointmentConfirmationTemplate({
      name: "Alice Smith",
      date: "2026-08-15",
      time: "10:00",
      duration: 30,
    });
    expect(result.subject).toBe("Consultation Booking Confirmed");
    expect(result.html).toContain("Alice Smith");
    expect(result.html).toContain("30 minutes");
    expect(result.html).toContain("Booking Confirmed!");
  });

  it("includes optional meetingType when provided", async () => {
    const { appointmentConfirmationTemplate } = await import("@/lib/email/templates");
    const result = appointmentConfirmationTemplate({
      name: "Bob Jones",
      date: "2026-08-20",
      duration: 60,
      meetingType: "Strategy Session",
    });
    expect(result.html).toContain("Strategy Session");
    expect(result.html).toContain("60 minutes");
  });

  it("includes optional message when provided", async () => {
    const { appointmentConfirmationTemplate } = await import("@/lib/email/templates");
    const result = appointmentConfirmationTemplate({
      name: "Charlie",
      date: new Date("2026-09-01"),
      duration: 45,
      message: "I need help with a project",
    });
    expect(result.html).toContain("I need help with a project");
    expect(result.html).toContain("Your Message");
  });

  it("includes optional timezone when provided", async () => {
    const { appointmentConfirmationTemplate } = await import("@/lib/email/templates");
    const result = appointmentConfirmationTemplate({
      name: "Diana",
      date: "2026-08-15",
      duration: 30,
      timezone: "America/New_York",
    });
    expect(result.html).toContain("America/New_York");
  });

  it("includes optional location when provided", async () => {
    const { appointmentConfirmationTemplate } = await import("@/lib/email/templates");
    const result = appointmentConfirmationTemplate({
      name: "Eve",
      date: "2026-08-15",
      duration: 30,
      location: "Google Meet",
    });
    expect(result.html).toContain("Google Meet");
  });

  it("handles null optional fields gracefully", async () => {
    const { appointmentConfirmationTemplate } = await import("@/lib/email/templates");
    const result = appointmentConfirmationTemplate({
      name: "Frank",
      date: "2026-08-15",
      duration: 30,
      meetingType: null,
      message: null,
      location: null,
      timezone: null,
    });
    expect(result.subject).toBe("Consultation Booking Confirmed");
    expect(result.html).not.toContain("Meeting Type");
    expect(result.html).not.toContain("Your Message");
    // Date and duration should still be present
    expect(result.html).toContain("Frank");
    expect(result.html).toContain("30 minutes");
  });

  it("renders date without time when time is null", async () => {
    const { appointmentConfirmationTemplate } = await import("@/lib/email/templates");
    const result = appointmentConfirmationTemplate({
      name: "Grace",
      date: "2026-08-15",
      time: null,
      duration: 30,
    });
    // Should render the date without a time portion — no "at" time suffix
    expect(result.html).toContain("August 15, 2026");
    expect(result.html).not.toContain("null");
  });

  it("renders date without time when time is empty string", async () => {
    const { appointmentConfirmationTemplate } = await import("@/lib/email/templates");
    const result = appointmentConfirmationTemplate({
      name: "Hank",
      date: "2026-08-15",
      time: "",
      duration: 30,
    });
    // Empty string is falsy — formatDate should not add time
    expect(result.html).toContain("August 15, 2026");
    expect(result.html).not.toContain("12:00 AM");
  });
});

describe("appointmentReminderTemplate", () => {
  it("returns subject 'Reminder: Your consultation is tomorrow'", async () => {
    const { appointmentReminderTemplate } = await import("@/lib/email/templates");
    const result = appointmentReminderTemplate({
      name: "Alice Smith",
      date: "2026-08-15",
      time: "10:00",
      duration: 30,
    });
    expect(result.subject).toBe("Reminder: Your consultation is tomorrow");
    expect(result.html).toContain("Alice Smith");
    expect(result.html).toContain("Upcoming Meeting Reminder");
  });

  it("includes preparation tips section", async () => {
    const { appointmentReminderTemplate } = await import("@/lib/email/templates");
    const result = appointmentReminderTemplate({
      name: "Bob",
      date: new Date("2026-08-20"),
      duration: 45,
    });
    expect(result.html).toContain("Preparation Tips");
    expect(result.html).toContain("project details");
    expect(result.html).toContain("internet connection");
  });

  it("renders date without time when time is null", async () => {
    const { appointmentReminderTemplate } = await import("@/lib/email/templates");
    const result = appointmentReminderTemplate({
      name: "Carol",
      date: "2026-08-20",
      time: null,
      duration: 30,
    });
    expect(result.html).toContain("Carol");
    expect(result.html).not.toContain("null");
  });

  it("omits meeting type section when meetingType is null", async () => {
    const { appointmentReminderTemplate } = await import("@/lib/email/templates");
    const result = appointmentReminderTemplate({
      name: "Diana",
      date: "2026-08-20",
      duration: 30,
      meetingType: null,
      location: null,
      timezone: null,
    });
    expect(result.html).not.toContain("Meeting Type");
    expect(result.html).not.toContain("Location");
    expect(result.html).not.toContain("Timezone");
    expect(result.html).toContain("Diana");
  });

  it("omits location section when location is null", async () => {
    const { appointmentReminderTemplate } = await import("@/lib/email/templates");
    const result = appointmentReminderTemplate({
      name: "Eve",
      date: "2026-08-20",
      duration: 30,
      location: null,
    });
    expect(result.html).not.toContain("Location");
  });

  it("omits timezone section when timezone is null", async () => {
    const { appointmentReminderTemplate } = await import("@/lib/email/templates");
    const result = appointmentReminderTemplate({
      name: "Frank",
      date: "2026-08-20",
      duration: 30,
      timezone: null,
    });
    expect(result.html).not.toContain("Timezone");
  });
});

describe("appointmentRescheduledTemplate", () => {
  it("returns subject 'Appointment Rescheduled'", async () => {
    const { appointmentRescheduledTemplate } = await import("@/lib/email/templates");
    const result = appointmentRescheduledTemplate({
      name: "Alice Smith",
      oldDate: "2026-08-15",
      oldTime: "10:00",
      newDate: "2026-08-20",
      newTime: "14:00",
      duration: 30,
    });
    expect(result.subject).toBe("Appointment Rescheduled");
    expect(result.html).toContain("Alice Smith");
    expect(result.html).toContain("Appointment Rescheduled");
  });

  it("shows old and new dates in side-by-side layout", async () => {
    const { appointmentRescheduledTemplate } = await import("@/lib/email/templates");
    const result = appointmentRescheduledTemplate({
      name: "Bob",
      oldDate: new Date("2026-08-15"),
      newDate: new Date("2026-08-20"),
      duration: 60,
    });
    expect(result.html).toContain("Previously");
    expect(result.html).toContain("New Date");
    expect(result.html).toContain("60 minutes");
  });

  it("includes optional reason when provided", async () => {
    const { appointmentRescheduledTemplate } = await import("@/lib/email/templates");
    const result = appointmentRescheduledTemplate({
      name: "Charlie",
      oldDate: "2026-08-15",
      newDate: "2026-08-20",
      duration: 30,
      reason: "Schedule conflict",
    });
    expect(result.html).toContain("Reason");
    expect(result.html).toContain("Schedule conflict");
  });

  it("handles null optional fields", async () => {
    const { appointmentRescheduledTemplate } = await import("@/lib/email/templates");
    const result = appointmentRescheduledTemplate({
      name: "Diana",
      oldDate: "2026-08-15",
      newDate: "2026-08-20",
      duration: 30,
      reason: null,
      meetingType: null,
    });
    expect(result.subject).toBe("Appointment Rescheduled");
    expect(result.html).not.toContain("Reason"); // reason block omitted
  });

  it("renders dates without time when oldTime and newTime are null", async () => {
    const { appointmentRescheduledTemplate } = await import("@/lib/email/templates");
    const result = appointmentRescheduledTemplate({
      name: "Eve",
      oldDate: "2026-08-15",
      oldTime: null,
      newDate: "2026-08-20",
      newTime: null,
      duration: 30,
    });
    // Date-only format (no "at" time portion)
    expect(result.html).toContain("Previously");
    expect(result.html).toContain("New Date");
    expect(result.html).not.toContain("null");
  });

  it("renders dates without time when oldTime and newTime are empty strings", async () => {
    const { appointmentRescheduledTemplate } = await import("@/lib/email/templates");
    const result = appointmentRescheduledTemplate({
      name: "Frank",
      oldDate: "2026-08-15",
      oldTime: "",
      newDate: "2026-08-20",
      newTime: "",
      duration: 30,
    });
    expect(result.html).toContain("Previously");
    expect(result.html).toContain("New Date");
    expect(result.html).not.toContain("12:00 AM");
  });
});

describe("appointmentCancelledTemplate", () => {
  it("returns subject 'Appointment Cancelled'", async () => {
    const { appointmentCancelledTemplate } = await import("@/lib/email/templates");
    const result = appointmentCancelledTemplate({
      name: "Alice Smith",
      date: "2026-08-15",
      time: "10:00",
    });
    expect(result.subject).toBe("Appointment Cancelled");
    expect(result.html).toContain("Alice Smith");
    expect(result.html).toContain("Appointment Cancelled");
  });

  it("includes optional reason when provided", async () => {
    const { appointmentCancelledTemplate } = await import("@/lib/email/templates");
    const result = appointmentCancelledTemplate({
      name: "Bob",
      date: new Date("2026-08-15"),
      reason: "Emergency came up",
    });
    expect(result.html).toContain("Emergency came up");
    expect(result.html).toContain("Reason");
  });

  it("includes reschedule CTA button", async () => {
    const { appointmentCancelledTemplate } = await import("@/lib/email/templates");
    const result = appointmentCancelledTemplate({
      name: "Charlie",
      date: "2026-08-15",
    });
    expect(result.html).toContain("Book a New Consultation");
    expect(result.html).toContain("reschedule");
  });

  it("handles null optional fields", async () => {
    const { appointmentCancelledTemplate } = await import("@/lib/email/templates");
    const result = appointmentCancelledTemplate({
      name: "Diana",
      date: "2026-08-15",
      reason: null,
      meetingType: null,
      time: null,
    });
    expect(result.subject).toBe("Appointment Cancelled");
    expect(result.html).not.toContain("Reason:"); // reason block omitted
  });

  it("renders date without time when time is empty string", async () => {
    const { appointmentCancelledTemplate } = await import("@/lib/email/templates");
    const result = appointmentCancelledTemplate({
      name: "Eve",
      date: "2026-08-15",
      time: "",
    });
    // Should render date-only, no time portion
    expect(result.html).toContain("August 15, 2026");
    expect(result.html).toContain("cancelled");
    expect(result.html).not.toContain("12:00 AM");
  });
});

describe("customReminderTemplate", () => {
  it("returns subject prefixed with 'Reminder:'", async () => {
    const { customReminderTemplate } = await import("@/lib/email/templates");
    const result = await customReminderTemplate({
      title: "Project Review",
      remindAt: new Date("2026-08-15T10:00:00Z"),
    });
    expect(result.subject).toBe("Reminder: Project Review");
    expect(result.html).toContain("Project Review");
    expect(result.html).toContain("Reminder");
  });

  it("includes optional description and relatedType", async () => {
    const { customReminderTemplate } = await import("@/lib/email/templates");
    const result = await customReminderTemplate({
      title: "Team Standup",
      description: "Weekly sync with the dev team",
      remindAt: "2026-08-20T09:00:00Z",
      relatedType: "MEETING",
    });
    expect(result.html).toContain("Weekly sync with the dev team");
    expect(result.html).toContain("MEETING");
  });

  it("handles null optional fields", async () => {
    const { customReminderTemplate } = await import("@/lib/email/templates");
    const result = await customReminderTemplate({
      title: "Reminder Test",
      remindAt: new Date("2026-08-15"),
      description: null,
      relatedType: null,
    });
    expect(result.subject).toBe("Reminder: Reminder Test");
    // Should still render the title and date
    expect(result.html).toContain("Reminder Test");
    expect(result.html).toContain("2026");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// src/lib/email-templates.ts — Booking & Contact Templates
// ═════════════════════════════════════════════════════════════════════════════

describe("escapeHtml", () => {
  it("escapes special characters", async () => {
    const { escapeHtml } = await import("@/lib/utils/string-guards");
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml('"')).toBe("&quot;");
  });

  it("escapes all special characters in a single string", async () => {
    const { escapeHtml } = await import("@/lib/utils/string-guards");
    expect(escapeHtml('<script>alert("xss & test")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss &amp; test&quot;)&lt;/script&gt;"
    );
  });

  it("returns empty string for empty input", async () => {
    const { escapeHtml } = await import("@/lib/utils/string-guards");
    expect(escapeHtml("")).toBe("");
  });
});

describe("ownerBookingNotification", () => {
  it("includes header with visitor name", async () => {
    const { ownerBookingNotification } = await import("@/lib/email-templates");
    const result = ownerBookingNotification({
      name: "Alice Smith",
      email: "alice@example.com",
      preferredDate: "2026-08-15",
      preferredTime: "10:00",
    });
    expect(result).toContain("New Consultation Booking");
    expect(result).toContain("Alice Smith");
    expect(result).toContain("alice@example.com");
  });

  it("includes optional fields when provided", async () => {
    const { ownerBookingNotification } = await import("@/lib/email-templates");
    const result = ownerBookingNotification({
      name: "Bob Jones",
      email: "bob@test.com",
      phone: "+1-555-0123",
      company: "Acme Corp",
      website: "https://acme.com",
      country: "US",
      budget: "$5,000 - $10,000",
      timeline: "1-3 months",
      preferredContactMethod: "email",
      projectType: "Web Application",
      preferredDate: "2026-08-20",
      preferredTime: "14:00",
      message: "I need a new website",
    });
    expect(result).toContain("+1-555-0123");
    expect(result).toContain("Acme Corp");
    expect(result).toContain("$5,000 - $10,000");
    expect(result).toContain("I need a new website");
  });

  it("handles null optional fields", async () => {
    const { ownerBookingNotification } = await import("@/lib/email-templates");
    const result = ownerBookingNotification({
      name: "Charlie",
      email: "charlie@test.com",
      preferredDate: "2026-08-15",
      phone: null,
      company: null,
      website: null,
      country: null,
      budget: null,
      timeline: null,
      preferredContactMethod: null,
      message: null,
    });
    // Name and email should still be present
    expect(result).toContain("Charlie");
    expect(result).toContain("charlie@test.com");
    // Optional fields should not appear in the output
    expect(result).not.toContain("Phone");
    expect(result).not.toContain("Company");
    expect(result).not.toContain("Budget");
  });

  it("formats time correctly", async () => {
    const { ownerBookingNotification } = await import("@/lib/email-templates");
    const result = ownerBookingNotification({
      name: "Diana",
      email: "diana@test.com",
      preferredDate: "2026-08-15",
      preferredTime: "14:30",
    });
    expect(result).toContain("2:30 PM");
  });

  it("omits time row when preferredTime is null", async () => {
    const { ownerBookingNotification } = await import("@/lib/email-templates");
    const result = ownerBookingNotification({
      name: "Eve",
      email: "eve@test.com",
      preferredDate: "2026-08-15",
      preferredTime: null,
    });
    // Time row is filtered out by detailTable when value is null
    expect(result).not.toContain("12:00 AM");
  });

  it("omits time row when preferredTime is empty string", async () => {
    const { ownerBookingNotification } = await import("@/lib/email-templates");
    const result = ownerBookingNotification({
      name: "Frank",
      email: "frank@test.com",
      preferredDate: "2026-08-15",
      preferredTime: "",
    });
    // Empty string is falsy — formatTime returns "" and safeVal returns null
    expect(result).not.toContain("12:00 AM");
  });
});

describe("clientConfirmation", () => {
  it("includes thank you message and portfolio link", async () => {
    const { clientConfirmation } = await import("@/lib/email-templates");
    const result = clientConfirmation({
      name: "Alice Smith",
      preferredDate: "2026-08-15",
      preferredTime: "10:00",
      siteUrl: "https://emmettanthony.dev",
    });
    expect(result).toContain("Booking Request Received");
    expect(result).toContain("Alice Smith");
    expect(result).toContain("View My Portfolio");
    expect(result).toContain("https://emmettanthony.dev");
  });

  it("includes meeting type when provided", async () => {
    const { clientConfirmation } = await import("@/lib/email-templates");
    const result = clientConfirmation({
      name: "Bob",
      preferredDate: "2026-08-20",
      siteUrl: "https://example.com",
      meetingType: "Strategy Session",
    });
    expect(result).toContain("Strategy Session");
  });

  it("handles null optional fields", async () => {
    const { clientConfirmation } = await import("@/lib/email-templates");
    const result = clientConfirmation({
      name: "Charlie",
      preferredDate: "2026-08-15",
      siteUrl: "https://example.com",
      preferredTime: null,
      meetingType: null,
    });
    expect(result).toContain("Charlie");
    expect(result).not.toContain("null");
  });

  it("renders date without time when preferredTime is empty string", async () => {
    const { clientConfirmation } = await import("@/lib/email-templates");
    const result = clientConfirmation({
      name: "Diana",
      preferredDate: "2026-08-15",
      siteUrl: "https://example.com",
      preferredTime: "",
    });
    // Date without time portion
    expect(result).toContain("August 15, 2026");
    expect(result).not.toContain("12:00 AM");
  });
});

describe("reminderEmail", () => {
  it("includes reminder header and date", async () => {
    const { reminderEmail } = await import("@/lib/email-templates");
    const result = reminderEmail({
      name: "Alice Smith",
      date: new Date("2026-08-15"),
      time: "10:00",
      duration: 30,
      siteUrl: "https://emmettanthony.dev",
    });
    expect(result).toContain("Reminder: Your Consultation is Tomorrow");
    expect(result).toContain("Alice Smith");
    expect(result).toContain("30 minutes");
  });

  it("includes what to expect section", async () => {
    const { reminderEmail } = await import("@/lib/email-templates");
    const result = reminderEmail({
      name: "Bob",
      date: new Date("2026-08-20"),
      siteUrl: "https://example.com",
    });
    expect(result).toContain("What to Expect");
    expect(result).toContain("project goals");
  });

  it("handles null optional fields", async () => {
    const { reminderEmail } = await import("@/lib/email-templates");
    const result = reminderEmail({
      name: "Charlie",
      date: new Date("2026-08-15"),
      siteUrl: "https://example.com",
      time: null,
      duration: null,
    });
    expect(result).toContain("Charlie");
    expect(result).not.toContain("Duration"); // duration block omitted
  });

  it("omits time section when time is empty string", async () => {
    const { reminderEmail } = await import("@/lib/email-templates");
    const result = reminderEmail({
      name: "Diana",
      date: new Date("2026-08-15"),
      siteUrl: "https://example.com",
      time: "",
      duration: 30,
    });
    // formatTime("") returns "" which is falsy, so time section is omitted
    expect(result).not.toContain("12:00 AM");
    expect(result).toContain("Duration"); // duration still present
  });
});

describe("contactNotification", () => {
  it("includes contact form submission header", async () => {
    const { contactNotification } = await import("@/lib/email-templates");
    const result = contactNotification({
      name: "Alice Smith",
      email: "alice@example.com",
      subject: "Project Inquiry",
      message: "I'd like to discuss a new project.",
    });
    expect(result).toContain("New Contact Form Submission");
    expect(result).toContain("Alice Smith");
    expect(result).toContain("alice@example.com");
    expect(result).toContain("Project Inquiry");
    expect(result).toContain("I'd like to discuss a new project.");
  });

  it("includes optional phone and company when provided", async () => {
    const { contactNotification } = await import("@/lib/email-templates");
    const result = contactNotification({
      name: "Bob Jones",
      email: "bob@test.com",
      phone: "+1-555-0123",
      company: "Acme Corp",
      subject: "Question",
      message: "Do you do mobile apps?",
    });
    expect(result).toContain("+1-555-0123");
    expect(result).toContain("Acme Corp");
  });

  it("handles null optional fields", async () => {
    const { contactNotification } = await import("@/lib/email-templates");
    const result = contactNotification({
      name: "Charlie",
      email: "charlie@test.com",
      subject: "Hi",
      message: "Hello",
      phone: null,
      company: null,
    });
    expect(result).toContain("Charlie");
    expect(result).toContain("charlie@test.com");
    expect(result).not.toContain("Phone");
    expect(result).not.toContain("Company");
  });

  it("omits phone and company rows when values are empty strings", async () => {
    const { contactNotification } = await import("@/lib/email-templates");
    const result = contactNotification({
      name: "Diana",
      email: "diana@test.com",
      subject: "Question",
      message: "Testing",
      phone: "",
      company: "",
    });
    // safeVal("") returns null — filtered out by detailTable
    expect(result).not.toContain("Phone");
    expect(result).not.toContain("Company");
    expect(result).toContain("Diana");
    expect(result).toContain("diana@test.com");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// src/lib/email/reply-notification-template.ts
// ═════════════════════════════════════════════════════════════════════════════

describe("adminReplyTemplate", () => {
  it("returns subject with admin name", async () => {
    const { adminReplyTemplate } = await import("@/lib/email/reply-notification-template");
    const result = await adminReplyTemplate({
      visitorName: "Alice Smith",
      message: "Thanks for your help!",
      adminName: "Emmett",
      conversationId: "conv-123",
    });
    expect(result.subject).toContain("Emmett");
    expect(result.subject).toContain("replied");
    expect(result.html).toContain("Alice Smith");
    expect(result.html).toContain("Thanks for your help!");
  });

  it("escapes HTML in the message", async () => {
    const { adminReplyTemplate } = await import("@/lib/email/reply-notification-template");
    const result = await adminReplyTemplate({
      visitorName: "Bob",
      message: "<script>alert('xss')</script>",
      adminName: "Admin",
      conversationId: "conv-456",
    });
    // HTML tags should be escaped
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// src/lib/email/escalation-template.ts
// ═════════════════════════════════════════════════════════════════════════════

describe("escalationTranscriptTemplate", () => {
  const sampleMessages = [
    { role: "user", content: "I need help with my website", createdAt: new Date("2026-08-15T10:00:00Z") },
    { role: "assistant", content: "I'd be happy to help!", createdAt: new Date("2026-08-15T10:00:05Z") },
    { role: "user", content: "Can I speak to a human?", createdAt: new Date("2026-08-15T10:01:00Z") },
  ];

  it("returns subject with visitor name", async () => {
    const { escalationTranscriptTemplate } = await import("@/lib/email/escalation-template");
    const result = await escalationTranscriptTemplate({
      conversationId: "conv-123",
      visitorName: "Alice Smith",
      visitorEmail: "alice@example.com",
      messageCount: 3,
      messages: sampleMessages,
      source: "chat_widget",
      language: "en",
    });
    expect(result.subject).toContain("Alice Smith");
    expect(result.subject).toContain("Chat Escalated");
    expect(result.html).toContain("Human Assistance Requested");
    expect(result.html).toContain("alice@example.com");
    expect(result.html).toContain("3 messages");
  });

  it("uses fallback for null visitor name", async () => {
    const { escalationTranscriptTemplate } = await import("@/lib/email/escalation-template");
    const result = await escalationTranscriptTemplate({
      conversationId: "conv-456",
      visitorName: null,
      visitorEmail: null,
      messageCount: 1,
      messages: [{ role: "user", content: "Help", createdAt: new Date() }],
      source: "chat_widget",
      language: "fr",
    });
    expect(result.subject).toContain("a visitor");
    expect(result.subject).not.toContain("null");
  });

  it("includes dashboard link and conversation transcript", async () => {
    const { escalationTranscriptTemplate } = await import("@/lib/email/escalation-template");
    const result = await escalationTranscriptTemplate({
      conversationId: "conv-789",
      visitorName: "Bob",
      messageCount: 2,
      messages: sampleMessages.slice(0, 2),
      source: "website",
      language: "en",
    });
    expect(result.html).toContain("/dashboard/chatbot/conversations/conv-789");
    expect(result.html).toContain("I need help with my website");
    expect(result.html).toContain("I'd be happy to help");
    expect(result.html).toContain("Visitor");
    expect(result.html).toContain("Assistant");
  });
});
