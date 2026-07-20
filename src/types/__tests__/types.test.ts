// ──────────────────────────────────────────────────────────────────────────────
// Type-only file tests — validates constants, labels, maps, and event relations
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";

// ─── Activity Types ───────────────────────────────────────────────────────

describe("activity types", () => {
  it("exports all activity severities", async () => {
    const { ACTIVITY_SEVERITIES, SEVERITY_LABELS } = await import("../activity");
    expect(ACTIVITY_SEVERITIES).toEqual(["INFO", "WARNING", "ERROR", "CRITICAL"]);
    expect(ACTIVITY_SEVERITIES.every((s) => SEVERITY_LABELS[s])).toBe(true);
  });

  it("exports all activity modules with labels", async () => {
    const { ACTIVITY_MODULES, MODULE_LABELS } = await import("../activity");
    expect(ACTIVITY_MODULES.length).toBe(15);
    expect(ACTIVITY_MODULES.every((m) => MODULE_LABELS[m])).toBe(true);
  });

  it("has ACTION_LABELS for all standard actions", async () => {
    const { ACTION_LABELS } = await import("../activity");
    expect(ACTION_LABELS.login).toBe("Login");
    expect(ACTION_LABELS.create).toBe("Created");
    expect(ACTION_LABELS.upload).toBe("Uploaded");
  });

  it("has SECURITY_EVENT_LABELS for all events", async () => {
    const { SECURITY_EVENT_LABELS } = await import("../activity");
    expect(SECURITY_EVENT_LABELS.failed_login).toBe("Failed Login Attempt");
    expect(SECURITY_EVENT_LABELS.password_breach).toBe("Password Breach");
  });
});

// ─── Notification Types ──────────────────────────────────────────────────

describe("notification types", () => {
  it("exports all notification categories with labels", async () => {
    const { NOTIFICATION_CATEGORIES, CATEGORY_LABELS } = await import("../notifications");
    expect(NOTIFICATION_CATEGORIES).toContain("CRM");
    expect(NOTIFICATION_CATEGORIES).toContain("SYSTEM");
    expect(NOTIFICATION_CATEGORIES.length).toBe(9);
    expect(NOTIFICATION_CATEGORIES.every((c) => CATEGORY_LABELS[c])).toBe(true);
  });

  it("exports all notification types with labels", async () => {
    const { NOTIFICATION_TYPES, TYPE_LABELS } = await import("../notifications");
    expect(NOTIFICATION_TYPES).toEqual(["INFO", "SUCCESS", "WARNING", "ERROR"]);
    expect(NOTIFICATION_TYPES.every((t) => TYPE_LABELS[t])).toBe(true);
  });

  it("exports all priorities with labels", async () => {
    const { NOTIFICATION_PRIORITIES, PRIORITY_LABELS } = await import("../notifications");
    expect(NOTIFICATION_PRIORITIES).toEqual(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    expect(NOTIFICATION_PRIORITIES.every((p) => PRIORITY_LABELS[p])).toBe(true);
  });

  it("exports all delivery channels with labels", async () => {
    const { DELIVERY_CHANNELS, CHANNEL_LABELS } = await import("../notifications");
    expect(DELIVERY_CHANNELS).toContain("EMAIL");
    expect(DELIVERY_CHANNELS.length).toBe(5);
    expect(DELIVERY_CHANNELS.every((c) => CHANNEL_LABELS[c])).toBe(true);
  });

  it("has consistent event maps (same keys across category, priority, type maps)", async () => {
    const { EVENT_CATEGORY_MAP, EVENT_PRIORITY_MAP, EVENT_TYPE_MAP, CRM_EVENTS, CONTACT_EVENTS, CALENDAR_EVENTS } =
      await import("../notifications");

    const categoryKeys = Object.keys(EVENT_CATEGORY_MAP);
    const priorityKeys = Object.keys(EVENT_PRIORITY_MAP);
    const typeKeys = Object.keys(EVENT_TYPE_MAP);

    expect(categoryKeys.length).toBeGreaterThan(0);
    expect(priorityKeys.length).toBeGreaterThan(0);
    expect(typeKeys.length).toBeGreaterThan(0);

    // All maps should have the same keys
    expect(categoryKeys.sort()).toEqual(priorityKeys.sort());
    expect(priorityKeys.sort()).toEqual(typeKeys.sort());

    // All keys should be valid NotificationCategory values
    const { NOTIFICATION_CATEGORIES } = await import("../notifications");
    categoryKeys.forEach((key) => {
      expect(NOTIFICATION_CATEGORIES).toContain(EVENT_CATEGORY_MAP[key]);
    });
  });

  it("event constants have expected structure", async () => {
    const { CRM_EVENTS, CONTACT_EVENTS, CALENDAR_EVENTS } = await import("../notifications");
    expect(CRM_EVENTS.LEAD_CREATED).toBe("crm.lead.created");
    expect(CONTACT_EVENTS.NEW_SUBMISSION).toBe("contact.submission.new");
    expect(CALENDAR_EVENTS.APPOINTMENT_BOOKED).toBe("calendar.appointment.booked");
  });

  it("all event constants are included in EVENT_CATEGORY_MAP", async () => {
    const eventModules = await import("../notifications");
    const { EVENT_CATEGORY_MAP } = eventModules;

    const allEvents: string[] = [];
    for (const key of Object.keys(eventModules)) {
      const val = (eventModules as Record<string, unknown>)[key];
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        const values = Object.values(val as Record<string, string>);
        if (values.every((v) => typeof v === "string" && v.includes("."))) {
          allEvents.push(...(values as string[]));
        }
      }
    }

    allEvents.forEach((event) => {
      expect(EVENT_CATEGORY_MAP[event]).toBeDefined();
    });
  });
});

// ─── Support Types ────────────────────────────────────────────────────────

describe("support types", () => {
  it("exports status constants with labels", async () => {
    const { SUPPORT_STATUSES, STATUS_LABELS } = await import("../support");
    expect(SUPPORT_STATUSES.OPEN).toBe("OPEN");
    expect(SUPPORT_STATUSES.CLOSED).toBe("CLOSED");
    expect(Object.keys(SUPPORT_STATUSES).every((k) => STATUS_LABELS[k])).toBe(true);
  });

  it("exports priority constants with labels", async () => {
    const { SUPPORT_PRIORITIES, PRIORITY_LABELS } = await import("../support");
    expect(SUPPORT_PRIORITIES.LOW).toBe("LOW");
    expect(SUPPORT_PRIORITIES.CRITICAL).toBe("CRITICAL");
    expect(Object.keys(SUPPORT_PRIORITIES).every((k) => PRIORITY_LABELS[k])).toBe(true);
  });

  it("exports category labels for all categories", async () => {
    const { SUPPORT_CATEGORIES, CATEGORY_LABELS } = await import("../support");
    expect(SUPPORT_CATEGORIES.length).toBe(11);
    expect(SUPPORT_CATEGORIES.every((c) => CATEGORY_LABELS[c])).toBe(true);
  });
});

// ─── Chatbot Types ────────────────────────────────────────────────────────

describe("chatbot types", () => {
  it("exports AI provider list with labels", async () => {
    const { AI_PROVIDERS, AI_PROVIDER_LABELS } = await import("../chatbot");
    expect(AI_PROVIDERS).toContain("openai");
    expect(AI_PROVIDERS).toContain("anthropic");
    expect(AI_PROVIDERS.length).toBe(7);
    expect(AI_PROVIDERS.every((p) => AI_PROVIDER_LABELS[p])).toBe(true);
  });
});

// ─── Portfolio Types ──────────────────────────────────────────────────────

describe("portfolio types", () => {
  it("defines PortfolioProject with required fields", async () => {
    const mod = await import("../portfolio");
    const project: mod.PortfolioProject = {
      id: "1",
      title: "Test",
      slug: "test",
      shortDescription: null,
      fullDescription: null,
      projectSummary: null,
      clientName: null,
      clientIndustry: null,
      categoryId: null,
      category: null,
      technologies: [],
      featuredImage: null,
      thumbnailImage: null,
      galleryImages: [],
      videoDemo: null,
      projectLogo: null,
      startDate: null,
      completionDate: null,
      projectDuration: null,
      teamSize: null,
      status: "published",
      featured: false,
      published: true,
      order: 0,
      viewCount: 0,
      liveUrl: null,
      githubUrl: null,
      demoUrl: null,
      caseStudyUrl: null,
      metaTitle: null,
      metaDescription: null,
      ogImage: null,
      canonicalUrl: null,
      tags: [],
      awards: [],
      testimonialIds: [],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      caseStudy: null,
      metrics: [],
    };
    expect(project.title).toBe("Test");
    expect(project.slug).toBe("test");
    expect(project.technologies).toEqual([]);
    expect(project.metrics).toEqual([]);
  });

  it("defines PortfolioStats with number fields", async () => {
    const mod = await import("../portfolio");
    const stats: mod.PortfolioStats = {
      total: 10,
      published: 5,
      draft: 3,
      inProgress: 1,
      completed: 1,
      totalViews: 100,
      featured: 2,
    };
    expect(stats.total).toBe(10);
    expect(stats.published).toBe(5);
  });
});

// ─── Newsletter Types ─────────────────────────────────────────────────────

describe("newsletter types", () => {
  it("subscriber statuses cover all expected values", async () => {
    const mod = await import("../newsletter");
    type Status = mod.SubscriberStatus;
    const statuses: Status[] = ["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING_VERIFICATION"];
    expect(statuses.length).toBe(4);
  });

  it("campaign statuses cover all expected values", async () => {
    const mod = await import("../newsletter");
    type CStatus = mod.CampaignStatus;
    const statuses: CStatus[] = [
      "DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "SENDING",
      "AWAITING_WINNER", "SENT", "PAUSED", "CANCELLED", "FAILED",
    ];
    expect(statuses.length).toBe(10);
  });

  it("defines Subscriber with required fields", async () => {
    const mod = await import("../newsletter");
    const sub: mod.Subscriber = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: null,
      company: null,
      country: null,
      tags: null,
      source: null,
      status: "ACTIVE",
      verificationToken: null,
      verifiedAt: null,
      gdprConsent: true,
      subscribedAt: "2024-01-01",
      lastOpenedAt: null,
      lastClickedAt: null,
      timezone: null,
      notes: null,
      engagementScore: 0,
      metadata: null,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      preferences: null,
      unsubscribeReason: null,
    };
    expect(sub.email).toBe("john@example.com");
    expect(sub.gdprConsent).toBe(true);
  });
});

// ─── Email Types ──────────────────────────────────────────────────────────

describe("email types", () => {
  it("exports EmailProvider union values", async () => {
    const mod = await import("../email");
    type Provider = mod.EmailProvider;
    const providers: Provider[] = ["brevo", "resend", "smtp"];
    expect(providers.length).toBe(3);
  });

  it("export CampaignStatusType union values", async () => {
    const mod = await import("../email");
    type CStatus = mod.CampaignStatusType;
    const statuses: CStatus[] = ["DRAFT", "SCHEDULED", "SENDING", "SENT", "ARCHIVED", "FAILED", "CANCELLED"];
    expect(statuses.length).toBe(7);
  });

  it("defines EmailSettings with layout fields", async () => {
    const mod = await import("../email");
    const settings: mod.EmailSettings = {
      id: "1",
      apiKey: "key",
      smtpServer: "smtp.example.com",
      smtpPort: 587,
      smtpLogin: "user",
      smtpPassword: "pass",
      senderName: "Test",
      senderEmail: "test@example.com",
      replyToEmail: "reply@example.com",
      trackingEnabled: true,
      doubleOptIn: false,
      defaultListId: null,
      dailySendLimit: 300,
      weeklySendLimit: 2000,
      monthlySendLimit: 9000,
      webhookSecret: null,
      lastSyncAt: null,
      updatedAt: "2024-01-01",
    };
    expect(settings.smtpServer).toBe("smtp.example.com");
    expect(settings.smtpPort).toBe(587);
  });
});

// ─── Calendar Types ───────────────────────────────────────────────────────

describe("calendar types", () => {
  it("event types include all expected values", async () => {
    const mod = await import("../calendar");
    type ET = mod.EventType;
    const types: ET[] = ["MEETING", "CONSULTATION", "PROJECT_DEADLINE", "PERSONAL", "TASK", "REMINDER"];
    expect(types.length).toBe(6);
  });

  it("appointment statuses include all expected values", async () => {
    const mod = await import("../calendar");
    type AS = mod.AppointmentStatus;
    const statuses: AS[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED", "NO_SHOW"];
    expect(statuses.length).toBe(6);
  });

  it("defines CalendarEvent with required fields", async () => {
    const mod = await import("../calendar");
    const event: mod.CalendarEvent = {
      id: "1",
      title: "Test Event",
      description: null,
      startDate: "2024-01-01",
      endDate: null,
      startTime: null,
      endTime: null,
      allDay: false,
      location: null,
      link: null,
      color: "#3b82f6",
      eventType: "MEETING",
      status: "SCHEDULED",
      priority: "MEDIUM",
      notes: null,
      attachments: null,
      recurring: null,
      recurrenceId: null,
      appointmentId: null,
      meetingTypeId: null,
      taskId: null,
      reminderId: null,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };
    expect(event.title).toBe("Test Event");
    expect(event.eventType).toBe("MEETING");
    expect(event.color).toBe("#3b82f6");
  });
});

// ─── Services Types ───────────────────────────────────────────────────────

describe("services types", () => {
  it("InquiryStatus includes all expected values", async () => {
    const mod = await import("../services");
    type IS = mod.InquiryStatus;
    const statuses: IS[] = [
      "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT",
      "NEGOTIATION", "CONVERTED", "CLOSED", "LOST",
    ];
    expect(statuses.length).toBe(8);
  });

  it("defines Service with required fields", async () => {
    const mod = await import("../services");
    const service: mod.Service = {
      id: "1",
      title: "Web Development",
      slug: "web-development",
      shortDescription: null,
      fullDescription: null,
      categoryId: "cat-1",
      icon: null,
      featuredImage: null,
      galleryImages: [],
      features: [],
      benefits: [],
      technologies: [],
      deliverables: [],
      estimatedTimeline: null,
      startingPrice: null,
      featured: false,
      published: true,
      order: 0,
      metaTitle: null,
      metaDescription: null,
      ogImage: null,
      canonicalUrl: null,
      viewCount: 0,
      testimonialIds: [],
      tags: [],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };
    expect(service.title).toBe("Web Development");
    expect(service.slug).toBe("web-development");
  });
});

// ─── Locale Types ─────────────────────────────────────────────────────────

describe("locale types", () => {
  it("defines LanguageData with required fields", async () => {
    const mod = await import("../locale");
    const lang: mod.LanguageData = {
      id: "1",
      code: "en",
      name: "English",
      nameEn: "English",
      nativeName: "English",
      direction: "LTR",
      flagEmoji: null,
      flagImage: null,
      isEnabled: true,
      isDefault: true,
      fallbackLocale: null,
      order: 0,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };
    expect(lang.code).toBe("en");
    expect(lang.direction).toBe("LTR");
  });
});
