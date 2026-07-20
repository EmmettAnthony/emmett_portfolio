import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./notification-service", () => ({
  sendNotification: vi.fn(),
}));

import { sendNotification } from "./notification-service";

const mockResult = { notificationId: "notif-mock-1", channels: [{ channel: "IN_APP" as const, status: "delivered" as const }] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(sendNotification).mockResolvedValue(mockResult);
});

// ─── CRM ────────────────────────────────────────────────────────────────────

describe("notifyCrmLeadCreated", () => {
  it("sends correct event", async () => {
    const { notifyCrmLeadCreated } = await import("./event-handlers");
    await notifyCrmLeadCreated("Alice", "alice@test.com", "website");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "crm.lead.created", source: "crm" }));
  });

  it("uses custom link when provided", async () => {
    const { notifyCrmLeadCreated } = await import("./event-handlers");
    await notifyCrmLeadCreated("Bob", "bob@test.com", "referral", "/custom/link");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ link: "/custom/link" }));
  });
});

describe("notifyCrmLeadStatusChanged", () => {
  it("sends correct event", async () => {
    const { notifyCrmLeadStatusChanged } = await import("./event-handlers");
    await notifyCrmLeadStatusChanged("Alice", "new", "contacted");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "crm.lead.status_changed" }));
  });
});

describe("notifyCrmDealWon", () => {
  it("sends correct event", async () => {
    const { notifyCrmDealWon } = await import("./event-handlers");
    await notifyCrmDealWon("Big Deal", 50000, "Acme Corp");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "crm.deal.won" }));
  });
});

describe("notifyCrmDealLost", () => {
  it("sends correct event", async () => {
    const { notifyCrmDealLost } = await import("./event-handlers");
    await notifyCrmDealLost("Big Deal", 50000, "Budget");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "crm.deal.lost" }));
  });
});

describe("notifyCrmProposalApproved", () => {
  it("sends correct event", async () => {
    const { notifyCrmProposalApproved } = await import("./event-handlers");
    await notifyCrmProposalApproved("Website Redesign", "Acme Corp");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "crm.proposal.approved" }));
  });
});

// ─── CONTACT ─────────────────────────────────────────────────────────────────

describe("notifyNewContactSubmission", () => {
  it("sends correct event", async () => {
    const { notifyNewContactSubmission } = await import("./event-handlers");
    await notifyNewContactSubmission("Alice", "alice@test.com", "Website");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "contact.submission.new" }));
  });
});

describe("notifyServiceInquiry", () => {
  it("sends correct event", async () => {
    const { notifyServiceInquiry } = await import("./event-handlers");
    await notifyServiceInquiry("Bob", "bob@test.com", "Consulting");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "contact.service_inquiry" }));
  });
});

// ─── CALENDAR ────────────────────────────────────────────────────────────────

describe("notifyAppointmentBooked", () => {
  it("sends correct event", async () => {
    const { notifyAppointmentBooked } = await import("./event-handlers");
    await notifyAppointmentBooked("Alice", "alice@test.com", "2025-06-01", "Consultation");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "calendar.appointment.booked" }));
  });
});

describe("notifyAppointmentCancelled", () => {
  it("sends correct event", async () => {
    const { notifyAppointmentCancelled } = await import("./event-handlers");
    await notifyAppointmentCancelled("Alice", "2025-06-01", "Sick");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "calendar.appointment.cancelled" }));
  });
});

describe("notifyAppointmentReminder", () => {
  it("sends correct event", async () => {
    const { notifyAppointmentReminder } = await import("./event-handlers");
    await notifyAppointmentReminder("Alice", "2025-06-01", "10:00");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "calendar.appointment.reminder" }));
  });
});

describe("notifyMeetingCompleted", () => {
  it("sends correct event with LOW priority", async () => {
    const { notifyMeetingCompleted } = await import("./event-handlers");
    await notifyMeetingCompleted("Alice Smith", "Consultation");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "calendar.meeting.completed", priorityOverride: "LOW" }));
  });
});

describe("notifyMeetingStartingSoon", () => {
  it("sends correct event with CRITICAL priority", async () => {
    const { notifyMeetingStartingSoon } = await import("./event-handlers");
    await notifyMeetingStartingSoon("Alice", "Consultation");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ priorityOverride: "CRITICAL" }));
  });
});

// ─── PORTFOLIO ───────────────────────────────────────────────────────────────

describe("notifyProjectPublished", () => {
  it("sends correct event", async () => {
    const { notifyProjectPublished } = await import("./event-handlers");
    await notifyProjectPublished("My Project");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "portfolio.project.published", source: "portfolio" }));
  });
});

describe("notifyProjectUpdated", () => {
  it("sends correct event", async () => {
    const { notifyProjectUpdated } = await import("./event-handlers");
    await notifyProjectUpdated("My Project");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "portfolio.project.updated" }));
  });
});

describe("notifyPortfolioInquiry", () => {
  it("sends correct event", async () => {
    const { notifyPortfolioInquiry } = await import("./event-handlers");
    await notifyPortfolioInquiry("Alice", "alice@test.com", "Portfolio Site");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "portfolio.inquiry.received" }));
  });
});

// ─── NEWSLETTER ──────────────────────────────────────────────────────────────

describe("notifyNewSubscriber", () => {
  it("sends correct event", async () => {
    const { notifyNewSubscriber } = await import("./event-handlers");
    await notifyNewSubscriber("Alice", "alice@test.com", "website");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "newsletter.subscriber.new" }));
  });
});

describe("notifyCampaignSent", () => {
  it("sends correct event", async () => {
    const { notifyCampaignSent } = await import("./event-handlers");
    await notifyCampaignSent("Summer Promo", 500);
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "newsletter.campaign.sent" }));
  });
});

describe("notifyCampaignCompleted", () => {
  it("sends correct event", async () => {
    const { notifyCampaignCompleted } = await import("./event-handlers");
    await notifyCampaignCompleted("Summer Promo");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "newsletter.campaign.completed" }));
  });
});

describe("notifyUnsubscribeRequest", () => {
  it("sends correct event", async () => {
    const { notifyUnsubscribeRequest } = await import("./event-handlers");
    await notifyUnsubscribeRequest("alice@test.com", "Too many emails");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "newsletter.unsubscribe.request" }));
  });

  it("handles missing reason", async () => {
    const { notifyUnsubscribeRequest } = await import("./event-handlers");
    await notifyUnsubscribeRequest("alice@test.com");
    expect(sendNotification).toHaveBeenCalled();
  });
});

// ─── RESUME ──────────────────────────────────────────────────────────────────

describe("notifyResumeDownloaded", () => {
  it("sends correct event", async () => {
    const { notifyResumeDownloaded } = await import("./event-handlers");
    await notifyResumeDownloaded("Alice", "developer");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "resume.downloaded" }));
  });
});

describe("notifyResumeViewed", () => {
  it("sends correct event", async () => {
    const { notifyResumeViewed } = await import("./event-handlers");
    await notifyResumeViewed("Alice");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "resume.viewed" }));
  });
});

// ─── TESTIMONIAL ─────────────────────────────────────────────────────────────

describe("notifyNewTestimonial", () => {
  it("sends correct event", async () => {
    const { notifyNewTestimonial } = await import("./event-handlers");
    await notifyNewTestimonial("Alice", 5);
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "testimonial.new.submitted" }));
  });
});

describe("notifyTestimonialApproved", () => {
  it("sends correct event", async () => {
    const { notifyTestimonialApproved } = await import("./event-handlers");
    await notifyTestimonialApproved("Alice");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "testimonial.approved" }));
  });
});

// ─── SYSTEM / SECURITY ───────────────────────────────────────────────────────

describe("notifyUserLogin", () => {
  it("sends correct event", async () => {
    const { notifyUserLogin } = await import("./event-handlers");
    await notifyUserLogin("Alice", "1.2.3.4");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "system.user.login" }));
  });
});

describe("notifySecurityAlert", () => {
  it("sends correct event", async () => {
    const { notifySecurityAlert } = await import("./event-handlers");
    await notifySecurityAlert("Breach", "Multiple attempts");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "system.security.alert", priorityOverride: "CRITICAL" }));
  });
});

describe("notifySystemError", () => {
  it("sends correct event", async () => {
    const { notifySystemError } = await import("./event-handlers");
    await notifySystemError("Something broke", "api");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "system.error" }));
  });
});

describe("notifyBackupCompleted", () => {
  it("sends correct event", async () => {
    const { notifyBackupCompleted } = await import("./event-handlers");
    await notifyBackupCompleted("full", "1GB");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "system.backup.completed" }));
  });
});

describe("notifyStorageWarning", () => {
  it("sends correct event", async () => {
    const { notifyStorageWarning } = await import("./event-handlers");
    await notifyStorageWarning("80GB", "100GB", 80);
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "system.storage.warning" }));
  });
});

// ─── PAYMENT / INVOICE ───────────────────────────────────────────────────────

describe("notifyPaymentFailed", () => {
  it("sends correct event", async () => {
    const { notifyPaymentFailed } = await import("./event-handlers");
    await notifyPaymentFailed(1500, "Acme Corp", "INV-001", "Card declined");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "crm.payment.failed", source: "crm" }));
  });

  it("uses custom link when provided", async () => {
    const { notifyPaymentFailed } = await import("./event-handlers");
    await notifyPaymentFailed(100, "Client", "INV-002", "Insufficient funds", "/custom/link");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ link: "/custom/link" }));
  });
});

describe("notifyInvoicePaid", () => {
  it("sends correct event", async () => {
    const { notifyInvoicePaid } = await import("./event-handlers");
    await notifyInvoicePaid("INV-001", "Acme Corp", 3000, "2025-06-15");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "crm.invoice.paid", source: "crm" }));
  });

  it("uses custom link when provided", async () => {
    const { notifyInvoicePaid } = await import("./event-handlers");
    await notifyInvoicePaid("INV-001", "Acme Corp", 3000, "2025-06-15", "/custom/link");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ link: "/custom/link" }));
  });
});

describe("notifyPaymentReceived", () => {
  it("sends correct event", async () => {
    const { notifyPaymentReceived } = await import("./event-handlers");
    await notifyPaymentReceived(5000, "Acme Corp", "INV-001");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ categoryOverride: "CRM", priorityOverride: "HIGH" }));
  });
});

describe("notifyInvoiceOverdue", () => {
  it("sends correct event", async () => {
    const { notifyInvoiceOverdue } = await import("./event-handlers");
    await notifyInvoiceOverdue("INV-001", "Acme Corp", 5000, "2025-06-01");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ priorityOverride: "HIGH" }));
  });
});

// ─── CHATBOT ─────────────────────────────────────────────────────────────────

describe("notifyChatStarted", () => {
  it("sends correct event", async () => {
    const { notifyChatStarted } = await import("./event-handlers");
    await notifyChatStarted("Alice", "conv-1");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ source: "chatbot" }));
  });
});

describe("notifyChatEscalated", () => {
  it("sends correct event", async () => {
    const { notifyChatEscalated } = await import("./event-handlers");
    await notifyChatEscalated("Alice", "conv-1");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ priorityOverride: "HIGH" }));
  });
});

// ─── AUTH ────────────────────────────────────────────────────────────────────

describe("notifyFailedLogin", () => {
  it("sends correct event", async () => {
    const { notifyFailedLogin } = await import("./event-handlers");
    await notifyFailedLogin("alice@test.com", "1.2.3.4", 3);
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "system.security.alert" }));
  });
});

describe("notifyPasswordChanged", () => {
  it("sends correct event", async () => {
    const { notifyPasswordChanged } = await import("./event-handlers");
    await notifyPasswordChanged("Alice");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ eventKey: "system.user.login", priorityOverride: "HIGH" }));
  });
});

// ─── FILE / MEDIA ────────────────────────────────────────────────────────────

describe("notifyFileUploaded", () => {
  it("sends correct event", async () => {
    const { notifyFileUploaded } = await import("./event-handlers");
    await notifyFileUploaded("report.pdf", "5MB", "Alice");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ categoryOverride: "SYSTEM", source: "system" }));
  });
});

describe("notifyIntegrationConnected", () => {
  it("sends correct event", async () => {
    const { notifyIntegrationConnected } = await import("./event-handlers");
    await notifyIntegrationConnected("Slack", "Slack Inc.");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ categoryOverride: "SYSTEM", source: "system" }));
  });
});

// ─── SUPPORT ─────────────────────────────────────────────────────────────────

describe("notifySupportTicketEscalated", () => {
  it("sends correct event", async () => {
    const { notifySupportTicketEscalated } = await import("./event-handlers");
    await notifySupportTicketEscalated("TKT-001", "Urgent issue");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ categoryOverride: "SUPPORT" }));
  });
});

describe("notifySupportBulkAction", () => {
  it("sends correct event", async () => {
    const { notifySupportBulkAction } = await import("./event-handlers");
    await notifySupportBulkAction({ userId: "user-1", ticketIds: ["t1", "t2"], action: "close" });
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ categoryOverride: "SUPPORT" }));
  });
});

describe("notifySupportSlaBreach", () => {
  it("sends correct event", async () => {
    const { notifySupportSlaBreach } = await import("./event-handlers");
    await notifySupportSlaBreach({ id: "ticket-1", ticketNumber: "TKT-001", subject: "Urgent" });
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ categoryOverride: "SUPPORT", priorityOverride: "HIGH" }));
  });
});

// ─── BLOG ────────────────────────────────────────────────────────────────────

describe("notifyBlogComment", () => {
  it("sends correct event", async () => {
    const { notifyBlogComment } = await import("./event-handlers");
    await notifyBlogComment("My Post", "Alice");
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ source: "blog" }));
  });
});
