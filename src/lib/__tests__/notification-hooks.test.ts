import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateNotification = vi.hoisted(() => vi.fn());

vi.mock("@/lib/notifications", () => ({
  createNotification: mockCreateNotification,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CRM notifications", () => {
  it("notifyLeadCreated calls createNotification with correct params", async () => {
    const { notifyLeadCreated } = await import("../integrations/notification-hooks");
    mockCreateNotification.mockResolvedValue({ success: true });

    const result = await notifyLeadCreated("John Doe", "Acme Corp", "/leads/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "New lead: John Doe",
      message: "From Acme Corp",
      link: "/leads/1",
      category: "CRM",
      key: expect.stringContaining("crm.lead.created-"),
    });
    expect(result).toEqual({ success: true });
  });

  it("notifyLeadCreated uses default message when company is null", async () => {
    const { notifyLeadCreated } = await import("../integrations/notification-hooks");
    await notifyLeadCreated("Jane", null, "/leads/2");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: "New lead created" })
    );
  });

  it("notifyLeadStatusChanged calls with correct params", async () => {
    const { notifyLeadStatusChanged } = await import("../integrations/notification-hooks");
    await notifyLeadStatusChanged("John", "NEW", "CONTACTED", "/leads/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Lead status changed: John",
      message: "NEW → CONTACTED",
      link: "/leads/1",
      category: "CRM",
      key: expect.any(String),
    });
  });

  it("notifyClientCreated calls with correct params", async () => {
    const { notifyClientCreated } = await import("../integrations/notification-hooks");
    await notifyClientCreated("Acme Corp", "/clients/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "New client: Acme Corp",
      message: "A new client has been created",
      link: "/clients/1",
      category: "CRM",
      key: expect.any(String),
    });
  });

  it("notifyDealWon calls with correct params", async () => {
    const { notifyDealWon } = await import("../integrations/notification-hooks");
    await notifyDealWon("Big Deal", 50000, "/deals/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Deal won: Big Deal",
      message: "Value: $50,000",
      link: "/deals/1",
      category: "CRM",
      key: expect.any(String),
    });
  });

  it("notifyDealWon formats value with locale", async () => {
    const { notifyDealWon } = await import("../integrations/notification-hooks");
    await notifyDealWon("Small Deal", 1500, "/deals/2");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Value: $1,500" })
    );
  });

  it("notifyDealLost calls with correct params", async () => {
    const { notifyDealLost } = await import("../integrations/notification-hooks");
    await notifyDealLost("Lost Deal", "/deals/3");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Deal lost: Lost Deal",
      message: "A deal has been marked as lost",
      link: "/deals/3",
      category: "CRM",
      key: expect.any(String),
    });
  });

  it("notifyProposalApproved calls with correct params", async () => {
    const { notifyProposalApproved } = await import("../integrations/notification-hooks");
    await notifyProposalApproved("Alice", "Website Proposal", "/proposals/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Proposal approved: Website Proposal",
      message: "Alice approved the proposal",
      link: "/proposals/1",
      category: "CRM",
      key: expect.any(String),
    });
  });
});

describe("Contact form notifications", () => {
  it("notifyContactSubmission calls with correct params", async () => {
    const { notifyContactSubmission } = await import("../integrations/notification-hooks");
    await notifyContactSubmission("John", "john@test.com", "/contacts/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "New contact submission from John",
      message: "john@test.com",
      link: "/contacts/1",
      category: "CONTACT",
      key: expect.any(String),
    });
  });

  it("notifyQuoteRequest calls with company when provided", async () => {
    const { notifyQuoteRequest } = await import("../integrations/notification-hooks");
    await notifyQuoteRequest("Bob", "Bob Corp", "/quotes/1");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Bob Corp" })
    );
  });

  it("notifyQuoteRequest uses default message when company is null", async () => {
    const { notifyQuoteRequest } = await import("../integrations/notification-hooks");
    await notifyQuoteRequest("Bob", null, "/quotes/1");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: "New quote request received" })
    );
  });

  it("notifyServiceInquiry calls with correct params", async () => {
    const { notifyServiceInquiry } = await import("../integrations/notification-hooks");
    await notifyServiceInquiry("Charlie", "Web Development", "/inquiries/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Service inquiry: Web Development",
      message: "From Charlie",
      link: "/inquiries/1",
      category: "CONTACT",
      key: expect.any(String),
    });
  });
});

describe("Calendar notifications", () => {
  it("notifyAppointmentBooked calls with correct params", async () => {
    const { notifyAppointmentBooked } = await import("../integrations/notification-hooks");
    const date = new Date("2026-07-20T14:00:00Z");
    await notifyAppointmentBooked("John", date, "/appointments/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Appointment booked: John",
      message: `Scheduled for ${date.toLocaleDateString()}`,
      link: "/appointments/1",
      category: "CALENDAR",
      key: expect.any(String),
    });
  });

  it("notifyAppointmentCancelled calls with correct params", async () => {
    const { notifyAppointmentCancelled } = await import("../integrations/notification-hooks");
    await notifyAppointmentCancelled("John", "/appointments/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Appointment cancelled: John",
      message: "An appointment has been cancelled",
      link: "/appointments/1",
      category: "CALENDAR",
      key: expect.any(String),
    });
  });

  it("notifyAppointmentReminder calls with correct params", async () => {
    const { notifyAppointmentReminder } = await import("../integrations/notification-hooks");
    const date = new Date("2026-07-21T10:00:00Z");
    await notifyAppointmentReminder("Jane", date, "/appointments/2");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Appointment reminder: Jane",
      message: `Tomorrow at ${date.toLocaleTimeString()}`,
      link: "/appointments/2",
      category: "CALENDAR",
      key: expect.any(String),
    });
  });

  it("notifyMeetingStartingSoon calls with correct params", async () => {
    const { notifyMeetingStartingSoon } = await import("../integrations/notification-hooks");
    await notifyMeetingStartingSoon("Project Review", "/meetings/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Meeting starting soon: Project Review",
      message: "Your meeting starts in 5 minutes",
      link: "/meetings/1",
      category: "CALENDAR",
      key: expect.any(String),
    });
  });
});

describe("Portfolio notifications", () => {
  it("notifyProjectPublished calls with correct params", async () => {
    const { notifyProjectPublished } = await import("../integrations/notification-hooks");
    await notifyProjectPublished("My Portfolio", "/projects/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Project published: My Portfolio",
      message: "Your portfolio project is now live",
      link: "/projects/1",
      category: "PORTFOLIO",
      key: expect.any(String),
    });
  });

  it("notifyProjectUpdated calls with correct params", async () => {
    const { notifyProjectUpdated } = await import("../integrations/notification-hooks");
    await notifyProjectUpdated("Portfolio v2", "/projects/2");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Project updated: Portfolio v2",
      message: "Changes have been saved",
      link: "/projects/2",
      category: "PORTFOLIO",
      key: expect.any(String),
    });
  });

  it("notifyPortfolioInquiry calls with correct params", async () => {
    const { notifyPortfolioInquiry } = await import("../integrations/notification-hooks");
    await notifyPortfolioInquiry("Alice", "E-commerce Site", "/inquiries/2");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Portfolio inquiry from Alice",
      message: "Regarding E-commerce Site",
      link: "/inquiries/2",
      category: "PORTFOLIO",
      key: expect.any(String),
    });
  });
});

describe("Newsletter notifications", () => {
  it("notifyNewSubscriber calls with correct params", async () => {
    const { notifyNewSubscriber } = await import("../integrations/notification-hooks");
    await notifyNewSubscriber("user@test.com", "/subscribers/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "New subscriber: user@test.com",
      message: "Someone new joined your newsletter",
      link: "/subscribers/1",
      category: "NEWSLETTER",
      key: expect.any(String),
    });
  });

  it("notifyCampaignSent calls with correct params including metadata", async () => {
    const { notifyCampaignSent } = await import("../integrations/notification-hooks");
    await notifyCampaignSent("Summer Sale", 150, "/campaigns/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Campaign sent: Summer Sale",
      message: "Sent to 150 subscribers",
      link: "/campaigns/1",
      category: "NEWSLETTER",
      key: expect.any(String),
    });
  });

  it("notifyCampaignCompleted calls with correct params", async () => {
    const { notifyCampaignCompleted } = await import("../integrations/notification-hooks");
    await notifyCampaignCompleted("Spring Newsletter", "/campaigns/2");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Campaign completed: Spring Newsletter",
      message: "All emails have been delivered",
      link: "/campaigns/2",
      category: "NEWSLETTER",
      key: expect.any(String),
    });
  });

  it("notifyUnsubscribe calls with correct params", async () => {
    const { notifyUnsubscribe } = await import("../integrations/notification-hooks");
    await notifyUnsubscribe("user@test.com", "/unsubscribes/1");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Unsubscribe request: user@test.com",
      message: "A subscriber has unsubscribed",
      link: "/unsubscribes/1",
      category: "NEWSLETTER",
      key: expect.any(String),
    });
  });
});

describe("Resume notifications", () => {
  it("notifyResumeDownloaded calls with correct params", async () => {
    const { notifyResumeDownloaded } = await import("../integrations/notification-hooks");
    await notifyResumeDownloaded("modern", "/resume/downloads");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Resume downloaded (modern)",
      message: "Someone downloaded your resume",
      link: "/resume/downloads",
      category: "RESUME",
      key: expect.any(String),
    });
  });

  it("notifyResumeViewed calls with correct params", async () => {
    const { notifyResumeViewed } = await import("../integrations/notification-hooks");
    await notifyResumeViewed("/resume/views");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Resume viewed",
      message: "Someone viewed your resume",
      link: "/resume/views",
      category: "RESUME",
      key: expect.any(String),
    });
  });
});

describe("Testimonial notifications", () => {
  it("notifyNewTestimonial calls with correct params", async () => {
    const { notifyNewTestimonial } = await import("../integrations/notification-hooks");
    await notifyNewTestimonial("John Doe", "/testimonials/review");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "New testimonial from John Doe",
      message: "A new testimonial has been submitted for review",
      link: "/testimonials/review",
      category: "TESTIMONIAL",
      key: expect.any(String),
    });
  });

  it("notifyTestimonialApproved calls with correct params", async () => {
    const { notifyTestimonialApproved } = await import("../integrations/notification-hooks");
    await notifyTestimonialApproved("Jane Smith", "/testimonials");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Testimonial approved: Jane Smith",
      message: "The testimonial is now live on your site",
      link: "/testimonials",
      category: "TESTIMONIAL",
      key: expect.any(String),
    });
  });
});

describe("System notifications", () => {
  it("notifyUserLogin calls with correct params (no link)", async () => {
    const { notifyUserLogin } = await import("../integrations/notification-hooks");
    await notifyUserLogin("admin@test.com");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "User login: admin@test.com",
      message: "A user logged into the dashboard",
      link: undefined,
      category: "SYSTEM",
      key: expect.any(String),
    });
  });

  it("notifySecurityAlert calls with correct params and link", async () => {
    const { notifySecurityAlert } = await import("../integrations/notification-hooks");
    await notifySecurityAlert("Suspicious login attempt", "/security/log");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Security alert",
      message: "Suspicious login attempt",
      link: "/security/log",
      category: "SYSTEM",
      key: expect.any(String),
    });
  });

  it("notifySecurityAlert works without link", async () => {
    const { notifySecurityAlert } = await import("../integrations/notification-hooks");
    await notifySecurityAlert("Alert");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Security alert",
      message: "Alert",
      link: undefined,
      category: "SYSTEM",
      key: expect.any(String),
    });
  });

  it("notifyBackupCompleted calls with correct params", async () => {
    const { notifyBackupCompleted } = await import("../integrations/notification-hooks");
    await notifyBackupCompleted("Backup completed successfully");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Backup completed",
      message: "Backup completed successfully",
      link: undefined,
      category: "SYSTEM",
      key: expect.any(String),
    });
  });

  it("notifyStorageWarning calls with correct params including metadata", async () => {
    const { notifyStorageWarning } = await import("../integrations/notification-hooks");
    await notifyStorageWarning(85);

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "Storage warning: 85% used",
      message: "Your storage is running low",
      link: undefined,
      category: "SYSTEM",
      key: expect.any(String),
    });
  });

  it("notifySystemError calls with correct params and link", async () => {
    const { notifySystemError } = await import("../integrations/notification-hooks");
    await notifySystemError("Database connection timeout", "/logs");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "System error",
      message: "Database connection timeout",
      link: "/logs",
      category: "SYSTEM",
      key: expect.any(String),
    });
  });

  it("notifySystemError works without link", async () => {
    const { notifySystemError } = await import("../integrations/notification-hooks");
    await notifySystemError("Error");

    expect(mockCreateNotification).toHaveBeenCalledWith({
      title: "System error",
      message: "Error",
      link: undefined,
      category: "SYSTEM",
      key: expect.any(String),
    });
  });
});
