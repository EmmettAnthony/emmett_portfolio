import { describe, it, expect } from "vitest";
import {
  createSubscriberSchema,
  updateSubscriberSchema,
  bulkImportSchema,
  subscriberFilterSchema,
  newsletterSignupSchema,
  updatePreferencesSchema,
  unsubscribeSchema,
  createCampaignSchema,
  updateCampaignSchema,
  sendTestEmailSchema,
  createTemplateSchema,
  updateTemplateSchema,
  createAutomationSchema,
  updateAutomationSchema,
  createAutomationStepSchema,
  updateAutomationStepSchema,
  popupPageConfigSchema,
  updateNewsletterSettingsSchema,
  updatePopupConfigSchema,
  createSegmentSchema,
  updateSegmentSchema,
  createTagSchema,
  updateTagSchema,
  analyticsFilterSchema,
} from "../validations/newsletter";

describe("createSubscriberSchema", () => {
  it("parses valid subscriber data", () => {
    const data = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    };
    const result = createSubscriberSchema.parse(data);
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.gdprConsent).toBe(false);
  });

  it("rejects missing firstName", () => {
    const result = createSubscriberSchema.safeParse({
      lastName: "Doe",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createSubscriberSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createSubscriberSchema.parse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      company: "Acme",
      country: "US",
      tags: "developer",
      source: "web",
      gdprConsent: true,
      notes: "Some notes",
    });
    expect(result.phone).toBe("+1234567890");
    expect(result.company).toBe("Acme");
    expect(result.country).toBe("US");
    expect(result.tags).toBe("developer");
    expect(result.source).toBe("web");
    expect(result.gdprConsent).toBe(true);
    expect(result.notes).toBe("Some notes");
  });

  it("applies default for gdprConsent", () => {
    const result = createSubscriberSchema.parse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    });
    expect(result.gdprConsent).toBe(false);
  });

  it("rejects firstName exceeding max length", () => {
    const result = createSubscriberSchema.safeParse({
      firstName: "J".repeat(101),
      lastName: "Doe",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty firstName", () => {
    const result = createSubscriberSchema.safeParse({
      firstName: "",
      lastName: "Doe",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateSubscriberSchema", () => {
  it("parses empty object", () => {
    const result = updateSubscriberSchema.parse({});
    expect(result).toEqual({
      gdprConsent: false,
    });
  });

  it("parses partial data", () => {
    const result = updateSubscriberSchema.parse({
      firstName: "Jane",
      status: "ACTIVE",
    });
    expect(result.firstName).toBe("Jane");
    expect(result.status).toBe("ACTIVE");
  });

  it("rejects invalid status", () => {
    const result = updateSubscriberSchema.safeParse({
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("accepts timezone", () => {
    const result = updateSubscriberSchema.parse({
      timezone: "America/New_York",
    });
    expect(result.timezone).toBe("America/New_York");
  });
});

describe("bulkImportSchema", () => {
  it("parses valid bulk import", () => {
    const result = bulkImportSchema.parse({
      subscribers: [
        { firstName: "John", lastName: "Doe", email: "john@example.com" },
      ],
    });
    expect(result.subscribers).toHaveLength(1);
    expect(result.overwriteExisting).toBe(false);
  });

  it("rejects empty subscribers array", () => {
    const result = bulkImportSchema.safeParse({
      subscribers: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many subscribers", () => {
    const subscribers = Array.from({ length: 1001 }, (_, i) => ({
      firstName: `Name${i}`,
      lastName: "Doe",
      email: `test${i}@example.com`,
    }));
    const result = bulkImportSchema.safeParse({ subscribers });
    expect(result.success).toBe(false);
  });

  it("applies default for overwriteExisting", () => {
    const result = bulkImportSchema.parse({
      subscribers: [
        { firstName: "John", lastName: "Doe", email: "john@example.com" },
      ],
    });
    expect(result.overwriteExisting).toBe(false);
  });
});

describe("subscriberFilterSchema", () => {
  it("parses with defaults", () => {
    const result = subscriberFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("parses with all fields", () => {
    const result = subscriberFilterSchema.parse({
      search: "john",
      status: "ACTIVE",
      source: "web",
      country: "US",
      tag: "developer",
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
      page: 2,
      limit: 50,
    });
    expect(result.search).toBe("john");
    expect(result.status).toBe("ACTIVE");
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it("rejects invalid status", () => {
    const result = subscriberFilterSchema.safeParse({
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative page", () => {
    const result = subscriberFilterSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects limit over 100", () => {
    const result = subscriberFilterSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});

describe("newsletterSignupSchema", () => {
  it("parses valid signup", () => {
    const result = newsletterSignupSchema.parse({
      email: "john@example.com",
      gdprConsent: true,
    });
    expect(result.email).toBe("john@example.com");
    expect(result.gdprConsent).toBe(true);
  });

  it("rejects missing gdprConsent", () => {
    const result = newsletterSignupSchema.safeParse({
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects false gdprConsent", () => {
    const result = newsletterSignupSchema.safeParse({
      email: "john@example.com",
      gdprConsent: false,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional name and source", () => {
    const result = newsletterSignupSchema.parse({
      name: "John",
      email: "john@example.com",
      gdprConsent: true,
      source: "blog",
    });
    expect(result.name).toBe("John");
    expect(result.source).toBe("blog");
  });

  it("rejects name over 200 chars", () => {
    const result = newsletterSignupSchema.safeParse({
      name: "J".repeat(201),
      email: "john@example.com",
      gdprConsent: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePreferencesSchema", () => {
  it("parses empty object", () => {
    const result = updatePreferencesSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses all fields", () => {
    const result = updatePreferencesSchema.parse({
      topics: "tech,design",
      emailFrequency: "weekly",
      receivePromotions: true,
      receiveNewsletters: false,
      receiveBlogUpdates: true,
    });
    expect(result.topics).toBe("tech,design");
    expect(result.emailFrequency).toBe("weekly");
    expect(result.receivePromotions).toBe(true);
  });

  it("rejects invalid emailFrequency", () => {
    const result = updatePreferencesSchema.safeParse({
      emailFrequency: "yearly",
    });
    expect(result.success).toBe(false);
  });
});

describe("unsubscribeSchema", () => {
  it("parses with just email", () => {
    const result = unsubscribeSchema.parse({ email: "john@example.com" });
    expect(result.email).toBe("john@example.com");
  });

  it("parses with all fields", () => {
    const result = unsubscribeSchema.parse({
      email: "john@example.com",
      reason: "Too many emails",
      detail: "Receiving too many promotional emails",
      campaignId: "camp_123",
    });
    expect(result.reason).toBe("Too many emails");
    expect(result.detail).toBe("Receiving too many promotional emails");
    expect(result.campaignId).toBe("camp_123");
  });

  it("rejects invalid email", () => {
    const result = unsubscribeSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects reason over 500 chars", () => {
    const result = unsubscribeSchema.safeParse({
      email: "john@example.com",
      reason: "R".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("createCampaignSchema", () => {
  it("parses valid campaign", () => {
    const result = createCampaignSchema.parse({
      name: "Test Campaign",
      subject: "Hello World",
    });
    expect(result.name).toBe("Test Campaign");
    expect(result.subject).toBe("Hello World");
    expect(result.content).toBe("");
    expect(result.abTestEnabled).toBe(false);
    expect(result.timezoneOptimize).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createCampaignSchema.safeParse({
      subject: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing subject", () => {
    const result = createCampaignSchema.safeParse({
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("parses with optional fields", () => {
    const result = createCampaignSchema.parse({
      name: "Test",
      subject: "Hello",
      previewText: "Preview",
      senderName: "John",
      senderEmail: "john@example.com",
      content: "<html/>",
      templateId: "tpl_1",
      segmentId: "seg_1",
      scheduledAt: "2024-01-01T00:00:00Z",
      testEmails: "john@test.com",
      abTestEnabled: true,
      abTestVariantA: "A",
      abTestVariantB: "B",
      timezoneOptimize: true,
    });
    expect(result.senderEmail).toBe("john@example.com");
    expect(result.abTestEnabled).toBe(true);
  });

  it("rejects invalid recurringDayOfWeek", () => {
    const result = createCampaignSchema.safeParse({
      name: "Test",
      subject: "Hello",
      recurringDayOfWeek: 7,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid recurringDayOfMonth", () => {
    const result = createCampaignSchema.safeParse({
      name: "Test",
      subject: "Hello",
      recurringDayOfMonth: 32,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCampaignSchema", () => {
  it("parses empty object", () => {
    const result = updateCampaignSchema.parse({});
    expect(result).toEqual({
      abTestEnabled: false,
      content: "",
      timezoneOptimize: false,
    });
  });

  it("parses partial update", () => {
    const result = updateCampaignSchema.parse({ name: "New Name" });
    expect(result.name).toBe("New Name");
  });
});

describe("sendTestEmailSchema", () => {
  it("parses valid request", () => {
    const result = sendTestEmailSchema.parse({
      campaignId: "camp_1",
      testEmails: ["john@example.com", "jane@example.com"],
    });
    expect(result.campaignId).toBe("camp_1");
    expect(result.testEmails).toHaveLength(2);
  });

  it("rejects empty campaignId", () => {
    const result = sendTestEmailSchema.safeParse({
      campaignId: "",
      testEmails: ["john@example.com"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty testEmails", () => {
    const result = sendTestEmailSchema.safeParse({
      campaignId: "camp_1",
      testEmails: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many test emails", () => {
    const result = sendTestEmailSchema.safeParse({
      campaignId: "camp_1",
      testEmails: Array(11).fill("test@example.com"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email in testEmails", () => {
    const result = sendTestEmailSchema.safeParse({
      campaignId: "camp_1",
      testEmails: ["not-email"],
    });
    expect(result.success).toBe(false);
  });
});

describe("createTemplateSchema", () => {
  it("parses valid template", () => {
    const result = createTemplateSchema.parse({
      name: "Template 1",
    });
    expect(result.name).toBe("Template 1");
    expect(result.content).toBe("");
  });

  it("rejects empty name", () => {
    const result = createTemplateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = createTemplateSchema.parse({
      name: "Template",
      description: "A template",
      content: "<html/>",
      category: "announcement",
      thumbnail: "https://example.com/image.png",
    });
    expect(result.category).toBe("announcement");
    expect(result.thumbnail).toBe("https://example.com/image.png");
  });

  it("rejects invalid category", () => {
    const result = createTemplateSchema.safeParse({
      name: "Test",
      category: "invalid_cat",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateTemplateSchema", () => {
  it("parses empty object", () => {
    const result = updateTemplateSchema.parse({});
    expect(result).toEqual({
      content: "",
    });
  });
});

describe("createAutomationSchema", () => {
  it("parses valid automation", () => {
    const result = createAutomationSchema.parse({
      name: "Welcome Series",
      triggerType: "welcome_series",
    });
    expect(result.name).toBe("Welcome Series");
    expect(result.triggerType).toBe("welcome_series");
  });

  it("rejects missing triggerType", () => {
    const result = createAutomationSchema.safeParse({
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid triggerType", () => {
    const result = createAutomationSchema.safeParse({
      name: "Test",
      triggerType: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createAutomationSchema.parse({
      name: "Test",
      triggerType: "custom",
      description: "Desc",
      triggerConfig: { key: "value" },
      campaignId: "camp_1",
    });
    expect(result.description).toBe("Desc");
    expect(result.campaignId).toBe("camp_1");
  });
});

describe("updateAutomationSchema", () => {
  it("parses empty object", () => {
    const result = updateAutomationSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with status", () => {
    const result = updateAutomationSchema.parse({ status: "PAUSED" });
    expect(result.status).toBe("PAUSED");
  });

  it("rejects invalid status", () => {
    const result = updateAutomationSchema.safeParse({
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("createAutomationStepSchema", () => {
  it("parses valid step", () => {
    const result = createAutomationStepSchema.parse({
      automationId: "auto_1",
      stepOrder: 1,
      name: "Step 1",
    });
    expect(result.automationId).toBe("auto_1");
    expect(result.stepOrder).toBe(1);
    expect(result.name).toBe("Step 1");
    expect(result.delayDays).toBe(0);
    expect(result.delayHours).toBe(0);
  });

  it("rejects empty automationId", () => {
    const result = createAutomationStepSchema.safeParse({
      automationId: "",
      stepOrder: 0,
      name: "Step",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative stepOrder", () => {
    const result = createAutomationStepSchema.safeParse({
      automationId: "auto_1",
      stepOrder: -1,
      name: "Step",
    });
    expect(result.success).toBe(false);
  });

  it("rejects delayHours over 23", () => {
    const result = createAutomationStepSchema.safeParse({
      automationId: "auto_1",
      stepOrder: 0,
      name: "Step",
      delayHours: 24,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateAutomationStepSchema", () => {
  it("parses empty object", () => {
    const result = updateAutomationStepSchema.parse({});
    expect(result).toEqual({
      delayDays: 0,
      delayHours: 0,
    });
  });
});

describe("popupPageConfigSchema", () => {
  it("parses valid config", () => {
    const result = popupPageConfigSchema.parse({
      "/": true,
      "/portfolio": false,
    });
    expect(result["/"]).toBe(true);
    expect(result["/portfolio"]).toBe(false);
  });

  it("rejects non-boolean values", () => {
    const result = popupPageConfigSchema.safeParse({
      "/": "yes",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateNewsletterSettingsSchema", () => {
  it("parses empty object", () => {
    const result = updateNewsletterSettingsSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses all fields", () => {
    const result = updateNewsletterSettingsSchema.parse({
      defaultSenderName: "John",
      defaultSenderEmail: "john@example.com",
      replyToEmail: "reply@example.com",
      dailySendLimit: 500,
      weeklySendLimit: 3000,
      monthlySendLimit: 12000,
      doubleOptIn: true,
      trackOpens: true,
      trackClicks: false,
      gdprEnabled: true,
      unsubscribeFooter: "Click here",
      footerHtml: "<p>Footer</p>",
    });
    expect(result.defaultSenderName).toBe("John");
    expect(result.dailySendLimit).toBe(500);
    expect(result.doubleOptIn).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = updateNewsletterSettingsSchema.safeParse({
      defaultSenderEmail: "bad",
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePopupConfigSchema", () => {
  it("parses empty object", () => {
    const result = updatePopupConfigSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with popupConfig", () => {
    const result = updatePopupConfigSchema.parse({
      popupConfig: {
        enabled: true,
        perPage: { "/": true },
        defaultEnabled: false,
      },
    });
    expect(result.popupConfig?.enabled).toBe(true);
    expect(result.popupConfig?.perPage?.["/"]).toBe(true);
  });

  it("rejects non-boolean in perPage", () => {
    const result = updatePopupConfigSchema.safeParse({
      popupConfig: {
        perPage: { "/": "string" },
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("createSegmentSchema", () => {
  it("parses valid segment", () => {
    const result = createSegmentSchema.parse({
      name: "Developers",
      slug: "developers",
    });
    expect(result.name).toBe("Developers");
    expect(result.slug).toBe("developers");
    expect(result.isDynamic).toBe(true);
    expect(result.tagIds).toEqual([]);
  });

  it("rejects empty name", () => {
    const result = createSegmentSchema.safeParse({
      name: "",
      slug: "developers",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = createSegmentSchema.safeParse({
      name: "Test",
      slug: "INVALID SLUG",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    const result = createSegmentSchema.safeParse({
      name: "Test",
      slug: "UpperCase",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateSegmentSchema", () => {
  it("parses empty object", () => {
    const result = updateSegmentSchema.parse({});
    expect(result).toEqual({
      isDynamic: true,
      tagIds: [],
    });
  });
});

describe("createTagSchema", () => {
  it("parses valid tag", () => {
    const result = createTagSchema.parse({
      name: "Tech",
      slug: "tech",
    });
    expect(result.name).toBe("Tech");
    expect(result.slug).toBe("tech");
    expect(result.color).toBe("#3b82f6");
  });

  it("rejects empty name", () => {
    const result = createTagSchema.safeParse({
      name: "",
      slug: "tech",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = createTagSchema.safeParse({
      name: "Test",
      slug: "BAD SLUG",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    const result = createTagSchema.safeParse({
      name: "Test",
      slug: "test",
      color: "blue",
    });
    expect(result.success).toBe(false);
  });

  it("accepts custom color", () => {
    const result = createTagSchema.parse({
      name: "Test",
      slug: "test",
      color: "#ff0000",
    });
    expect(result.color).toBe("#ff0000");
  });
});

describe("updateTagSchema", () => {
  it("parses empty object", () => {
    const result = updateTagSchema.parse({});
    expect(result).toEqual({
      color: "#3b82f6",
    });
  });
});

describe("analyticsFilterSchema", () => {
  it("parses empty object", () => {
    const result = analyticsFilterSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with all fields", () => {
    const result = analyticsFilterSchema.parse({
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
      campaignId: "camp_1",
    });
    expect(result.dateFrom).toBe("2024-01-01");
    expect(result.dateTo).toBe("2024-12-31");
    expect(result.campaignId).toBe("camp_1");
  });
});
