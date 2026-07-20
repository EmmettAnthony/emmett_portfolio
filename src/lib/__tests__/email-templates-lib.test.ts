import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/utils/string-guards", () => ({
  escapeHtml: vi.fn((s: string) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")),
  safe: vi.fn((v: string | undefined | null) => v ? v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : null),
  safeVal: vi.fn((v: string | undefined | null) => v || null),
  formatTime: vi.fn((time: string | null | undefined) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  }),
}));

describe("email-templates", () => {
  describe("ownerBookingNotification", () => {
    it("includes all provided fields in output", async () => {
      const { ownerBookingNotification } = await import("../email-templates");
      const html = ownerBookingNotification({
        name: "John Doe",
        email: "john@example.com",
        phone: "+1-555-1234",
        company: "Acme Corp",
        website: "https://acme.com",
        country: "US",
        budget: "$5k-$10k",
        timeline: "1 month",
        preferredContactMethod: "email",
        preferredDate: "2025-07-01",
        preferredTime: "14:30",
        projectType: "Web Development",
        message: "I need a new website.",
      });
      expect(html).toContain("John Doe");
      expect(html).toContain("john@example.com");
      expect(html).toContain("+1-555-1234");
      expect(html).toContain("Acme Corp");
      expect(html).toContain("https://acme.com");
      expect(html).toContain("Web Development");
      expect(html).toContain("I need a new website.");
      expect(html).toContain("New Consultation Booking");
    });

    it("handles null optional fields", async () => {
      const { ownerBookingNotification } = await import("../email-templates");
      const html = ownerBookingNotification({
        name: "Jane",
        email: "jane@test.com",
        preferredDate: "2025-06-15",
      });
      expect(html).toContain("Jane");
      expect(html).toContain("jane@test.com");
      expect(html).not.toContain("Phone");
      expect(html).not.toContain("Company");
      expect(html).not.toContain("Message");
    });

    it("handles empty string optional fields", async () => {
      const { ownerBookingNotification } = await import("../email-templates");
      const html = ownerBookingNotification({
        name: "Bob",
        email: "bob@test.com",
        company: "",
        preferredDate: "2025-08-01",
        phone: "",
      });
      expect(html).toContain("Bob");
      expect(html).not.toContain("Phone");
      expect(html).not.toContain("Company");
    });

    it("escapes HTML in user-provided strings", async () => {
      const { ownerBookingNotification } = await import("../email-templates");
      const html = ownerBookingNotification({
        name: "<script>alert('xss')</script>",
        email: "test@test.com",
        preferredDate: "2025-01-01",
        message: "<b>bold</b> & more",
      });
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<b>bold</b>");
    });
  });

  describe("clientConfirmation", () => {
    it("includes booking details with meeting type and time", async () => {
      const { clientConfirmation } = await import("../email-templates");
      const html = clientConfirmation({
        name: "Alice",
        preferredDate: "2025-07-15",
        preferredTime: "10:00",
        meetingType: "Consultation Call",
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).toContain("Alice");
      expect(html).toContain("Consultation Call");
      expect(html).toContain("10:00 AM");
      expect(html).toContain("View My Portfolio");
      expect(html).toContain("Booking Request Received");
    });

    it("works without meeting type and time", async () => {
      const { clientConfirmation } = await import("../email-templates");
      const html = clientConfirmation({
        name: "Bob",
        preferredDate: "2025-08-01",
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).toContain("Bob");
    });

    it("escapes special chars in name and meeting type", async () => {
      const { clientConfirmation } = await import("../email-templates");
      const html = clientConfirmation({
        name: "<Malicious>",
        preferredDate: "2025-01-01",
        meetingType: "<a>link</a>",
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).not.toContain("<Malicious>");
      expect(html).not.toContain('<a href="evil">');
    });
  });

  describe("reminderEmail", () => {
    it("includes all fields when provided", async () => {
      const { reminderEmail } = await import("../email-templates");
      const html = reminderEmail({
        name: "Charlie",
        date: new Date("2025-07-20"),
        time: "15:00",
        duration: 60,
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).toContain("Charlie");
      expect(html).toContain("60 minutes");
      expect(html).toContain("Reminder");
      expect(html).toContain("reschedule");
    });

    it("works without time and duration", async () => {
      const { reminderEmail } = await import("../email-templates");
      const html = reminderEmail({
        name: "Diana",
        date: new Date("2025-08-10"),
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).toContain("Diana");
      expect(html).not.toContain("Duration:");
    });

    it("escapes HTML in name", async () => {
      const { reminderEmail } = await import("../email-templates");
      const html = reminderEmail({
        name: "<img src=x onerror=alert(1)>",
        date: new Date("2025-01-01"),
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).not.toContain("<img");
    });
  });

  describe("contactNotification", () => {
    it("includes all fields", async () => {
      const { contactNotification } = await import("../email-templates");
      const html = contactNotification({
        name: "Eve",
        email: "eve@test.com",
        phone: "+1-555-0000",
        company: "Startup Inc",
        subject: "Partnership Inquiry",
        message: "I'd like to discuss a partnership opportunity.",
      });
      expect(html).toContain("Eve");
      expect(html).toContain("eve@test.com");
      expect(html).toContain("+1-555-0000");
      expect(html).toContain("Startup Inc");
      expect(html).toContain("Partnership Inquiry");
      expect(html).toContain("partnership opportunity");
      expect(html).toContain("New Contact Form Submission");
    });

    it("handles null phone and company", async () => {
      const { contactNotification } = await import("../email-templates");
      const html = contactNotification({
        name: "Frank",
        email: "frank@test.com",
        subject: "Hello",
        message: "Just saying hi.",
      });
      expect(html).not.toContain("Phone");
      expect(html).not.toContain("Company");
    });

    it("escapes HTML in message and fields", async () => {
      const { contactNotification } = await import("../email-templates");
      const html = contactNotification({
        name: "<script>alert(1)</script>",
        email: "test@test.com",
        subject: "<b>Hi</b>",
        message: "<script>malicious</script>",
      });
      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<b>Hi</b>");
    });
  });

  describe("ticketConfirmation", () => {
    it("includes all ticket details", async () => {
      const { ticketConfirmation } = await import("../email-templates");
      const html = ticketConfirmation({
        fullName: "Grace",
        ticketNumber: "TKT-001",
        subject: "Login Issue",
        description: "Cannot log in to my account.",
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).toContain("Grace");
      expect(html).toContain("TKT-001");
      expect(html).toContain("Login Issue");
      expect(html).toContain("Cannot log in");
      expect(html).toContain("View Ticket");
      expect(html).toContain("Ticket Confirmed");
    });

    it("uses default base URL when siteUrl not provided", async () => {
      const { ticketConfirmation } = await import("../email-templates");
      const html = ticketConfirmation({
        fullName: "Heidi",
        ticketNumber: "TKT-002",
        subject: "Bug Report",
        description: "Found a bug.",
      });
      expect(html).toContain("/support/ticket/TKT-002");
    });

    it("escapes HTML in all fields", async () => {
      const { ticketConfirmation } = await import("../email-templates");
      const html = ticketConfirmation({
        fullName: "<script>xss</script>",
        ticketNumber: '<a href="evil">TKT-003</a>',
        subject: "<b>Important</b>",
        description: "<script>alert(1)</script>",
      });
      expect(html).not.toContain("<script>xss</script>");
      expect(html).not.toContain("<b>Important</b>");
    });
  });

  describe("ticketReplyNotification", () => {
    it("includes reply details", async () => {
      const { ticketReplyNotification } = await import("../email-templates");
      const html = ticketReplyNotification({
        visitorName: "Ivan",
        message: "Thank you for your help!",
        staffName: "Support Team",
        ticketNumber: "TKT-010",
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).toContain("Ivan");
      expect(html).toContain("Thank you for your help!");
      expect(html).toContain("Support Team");
      expect(html).toContain("TKT-010");
      expect(html).toContain("New Reply");
      expect(html).toContain("Reply to Ticket");
    });

    it("uses default base URL when siteUrl missing", async () => {
      const { ticketReplyNotification } = await import("../email-templates");
      const html = ticketReplyNotification({
        visitorName: "Judy",
        message: "Need help",
        staffName: "Staff",
        ticketNumber: "TKT-011",
      });
      expect(html).toContain("/support/ticket/TKT-011");
    });

    it("escapes HTML in message and name fields", async () => {
      const { ticketReplyNotification } = await import("../email-templates");
      const html = ticketReplyNotification({
        visitorName: "<script>v</script>",
        message: "<b>Bold</b> & more",
        staffName: "<i>Staff</i>",
        ticketNumber: "TKT-012",
      });
      expect(html).not.toContain("<script>v</script>");
      expect(html).not.toContain("<b>Bold</b>");
    });
  });

  describe("ticketStatusChanged", () => {
    it("shows old and new status", async () => {
      const { ticketStatusChanged } = await import("../email-templates");
      const html = ticketStatusChanged({
        fullName: "Mallory",
        ticketNumber: "TKT-020",
        oldStatus: "OPEN",
        newStatus: "IN_PROGRESS",
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).toContain("Mallory");
      expect(html).toContain("TKT-020");
      expect(html).toContain("OPEN");
      expect(html).toContain("IN_PROGRESS");
      expect(html).toContain("Status Update");
      expect(html).toContain("View Ticket");
    });

    it("uses default URL when siteUrl missing", async () => {
      const { ticketStatusChanged } = await import("../email-templates");
      const html = ticketStatusChanged({
        fullName: "Nina",
        ticketNumber: "TKT-021",
        oldStatus: "OPEN",
        newStatus: "CLOSED",
      });
      expect(html).toContain("/support/ticket/TKT-021");
    });

    it("escapes HTML", async () => {
      const { ticketStatusChanged } = await import("../email-templates");
      const html = ticketStatusChanged({
        fullName: "<div>nina</div>",
        ticketNumber: "TKT-022",
        oldStatus: "<b>OPEN</b>",
        newStatus: "<script>alert</script>",
      });
      expect(html).not.toContain("<div>nina</div>");
      expect(html).not.toContain("<b>OPEN</b>");
    });
  });

  describe("ticketClosedSurvey", () => {
    it("includes rating stars and ticket info", async () => {
      const { ticketClosedSurvey } = await import("../email-templates");
      const html = ticketClosedSurvey({
        fullName: "Oscar",
        ticketNumber: "TKT-030",
        ratingUrl: "https://emmettanthony.dev/support/rate",
        siteUrl: "https://emmettanthony.dev",
      });
      expect(html).toContain("Oscar");
      expect(html).toContain("TKT-030");
      expect(html).toContain("How did we do?");
      expect(html).toContain("rating=1");
      expect(html).toContain("rating=5");
      expect(html).toContain("★");
    });

    it("generates 5 star links", async () => {
      const { ticketClosedSurvey } = await import("../email-templates");
      const html = ticketClosedSurvey({
        fullName: "Trudy",
        ticketNumber: "TKT-031",
        ratingUrl: "https://feedback.com/rate",
      });
      for (let i = 1; i <= 5; i++) {
        expect(html).toContain(`rating=${i}`);
      }
    });

    it("escapes HTML in name", async () => {
      const { ticketClosedSurvey } = await import("../email-templates");
      const html = ticketClosedSurvey({
        fullName: "<script>alert('xss')</script>",
        ticketNumber: "TKT-032",
        ratingUrl: "https://example.com/rate",
      });
      expect(html).not.toContain("<script>");
    });
  });
});
