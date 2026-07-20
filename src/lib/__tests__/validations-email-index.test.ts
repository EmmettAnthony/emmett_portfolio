import { describe, it, expect } from "vitest";

describe("createContactListSchema", () => {
  it("parses valid create contact list data", async () => {
    const { createContactListSchema } = await import("../validations/email/index");
    const result = createContactListSchema.parse({
      name: "My List",
      description: "A test list",
      source: "import",
      color: "#ff0000",
      isPublic: true,
    });
    expect(result.name).toBe("My List");
    expect(result.description).toBe("A test list");
    expect(result.source).toBe("import");
    expect(result.color).toBe("#ff0000");
    expect(result.isPublic).toBe(true);
  });

  it("applies default isPublic=true", async () => {
    const { createContactListSchema } = await import("../validations/email/index");
    const result = createContactListSchema.parse({ name: "Defaulted" });
    expect(result.isPublic).toBe(true);
  });

  it("rejects empty name", async () => {
    const { createContactListSchema } = await import("../validations/email/index");
    const result = createContactListSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 chars", async () => {
    const { createContactListSchema } = await import("../validations/email/index");
    const result = createContactListSchema.safeParse({ name: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex color", async () => {
    const { createContactListSchema } = await import("../validations/email/index");
    const result = createContactListSchema.safeParse({ name: "List", color: "red" });
    expect(result.success).toBe(false);
  });

  it("accepts null color", async () => {
    const { createContactListSchema } = await import("../validations/email/index");
    const result = createContactListSchema.parse({ name: "List", color: null });
    expect(result.color).toBeNull();
  });

  it("accepts folderId as number", async () => {
    const { createContactListSchema } = await import("../validations/email/index");
    const result = createContactListSchema.parse({ name: "List", folderId: 5 });
    expect(result.folderId).toBe(5);
  });

  it("rejects description over 500 chars", async () => {
    const { createContactListSchema } = await import("../validations/email/index");
    const result = createContactListSchema.safeParse({ name: "List", description: "x".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("updateContactListSchema", () => {
  it("accepts partial update with only isArchived", async () => {
    const { updateContactListSchema } = await import("../validations/email/index");
    const result = updateContactListSchema.parse({ isArchived: true });
    expect(result.isArchived).toBe(true);
  });

  it("accepts empty update", async () => {
    const { updateContactListSchema } = await import("../validations/email/index");
    const result = updateContactListSchema.parse({});
    expect(result).toBeDefined();
  });

  it("accepts isDefault flag", async () => {
    const { updateContactListSchema } = await import("../validations/email/index");
    const result = updateContactListSchema.parse({ isDefault: true });
    expect(result.isDefault).toBe(true);
  });

  it("validates fields when provided", async () => {
    const { updateContactListSchema } = await import("../validations/email/index");
    const result = updateContactListSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("createContactMemberSchema", () => {
  it("parses valid member with all fields", async () => {
    const { createContactMemberSchema } = await import("../validations/email/index");
    const result = createContactMemberSchema.parse({
      listId: "list-1",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      company: "Acme",
      phone: "+1234567890",
      website: "https://example.com",
      country: "US",
      tags: "lead,prospect",
      source: "web",
    });
    expect(result.email).toBe("john@example.com");
    expect(result.firstName).toBe("John");
    expect(result.listId).toBe("list-1");
  });

  it("rejects invalid email", async () => {
    const { createContactMemberSchema } = await import("../validations/email/index");
    const result = createContactMemberSchema.safeParse({ listId: "l1", email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects empty listId", async () => {
    const { createContactMemberSchema } = await import("../validations/email/index");
    const result = createContactMemberSchema.safeParse({ listId: "", email: "a@b.com" });
    expect(result.success).toBe(false);
  });

  it("accepts metadata as record", async () => {
    const { createContactMemberSchema } = await import("../validations/email/index");
    const result = createContactMemberSchema.parse({ listId: "l1", email: "a@b.com", metadata: { source: "web" } });
    expect(result.metadata).toEqual({ source: "web" });
  });

  it("rejects firstName over 100 chars", async () => {
    const { createContactMemberSchema } = await import("../validations/email/index");
    const result = createContactMemberSchema.safeParse({ listId: "l1", email: "a@b.com", firstName: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields as null", async () => {
    const { createContactMemberSchema } = await import("../validations/email/index");
    const result = createContactMemberSchema.parse({ listId: "l1", email: "a@b.com", company: null });
    expect(result.company).toBeNull();
  });

  it("rejects website over 500 chars", async () => {
    const { createContactMemberSchema } = await import("../validations/email/index");
    const result = createContactMemberSchema.safeParse({ listId: "l1", email: "a@b.com", website: "http://x.com/" + "x".repeat(491) });
    expect(result.success).toBe(false);
  });
});

describe("bulkCreateContactSchema", () => {
  it("parses valid bulk create", async () => {
    const { bulkCreateContactSchema } = await import("../validations/email/index");
    const result = bulkCreateContactSchema.parse({
      listId: "list-1",
      contacts: [{ email: "a@b.com", firstName: "A" }, { email: "b@c.com" }],
      updateExisting: true,
    });
    expect(result.contacts).toHaveLength(2);
    expect(result.updateExisting).toBe(true);
  });

  it("applies default updateExisting=false", async () => {
    const { bulkCreateContactSchema } = await import("../validations/email/index");
    const result = bulkCreateContactSchema.parse({ listId: "l1", contacts: [{ email: "a@b.com" }] });
    expect(result.updateExisting).toBe(false);
  });

  it("rejects empty contacts array", async () => {
    const { bulkCreateContactSchema } = await import("../validations/email/index");
    const result = bulkCreateContactSchema.safeParse({ listId: "l1", contacts: [] });
    expect(result.success).toBe(false);
  });

  it("rejects contacts over 1000", async () => {
    const { bulkCreateContactSchema } = await import("../validations/email/index");
    const result = bulkCreateContactSchema.safeParse({ listId: "l1", contacts: Array.from({ length: 1001 }, (_, i) => ({ email: `a${i}@b.com` })) });
    expect(result.success).toBe(false);
  });

  it("accepts notifyUrl", async () => {
    const { bulkCreateContactSchema } = await import("../validations/email/index");
    const result = bulkCreateContactSchema.parse({ listId: "l1", contacts: [{ email: "a@b.com" }], notifyUrl: "https://hook.example.com" });
    expect(result.notifyUrl).toBe("https://hook.example.com");
  });

  it("rejects invalid notifyUrl", async () => {
    const { bulkCreateContactSchema } = await import("../validations/email/index");
    const result = bulkCreateContactSchema.safeParse({ listId: "l1", contacts: [{ email: "a@b.com" }], notifyUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("updateContactMemberSchema", () => {
  it("accepts partial update with status", async () => {
    const { updateContactMemberSchema } = await import("../validations/email/index");
    const result = updateContactMemberSchema.parse({ status: "UNSUBSCRIBED" });
    expect(result.status).toBe("UNSUBSCRIBED");
  });

  it("accepts empty update", async () => {
    const { updateContactMemberSchema } = await import("../validations/email/index");
    const result = updateContactMemberSchema.parse({});
    expect(result).toBeDefined();
  });

  it("rejects invalid status", async () => {
    const { updateContactMemberSchema } = await import("../validations/email/index");
    const result = updateContactMemberSchema.safeParse({ status: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("accepts email update", async () => {
    const { updateContactMemberSchema } = await import("../validations/email/index");
    const result = updateContactMemberSchema.parse({ email: "new@example.com" });
    expect(result.email).toBe("new@example.com");
  });

  it("rejects invalid email", async () => {
    const { updateContactMemberSchema } = await import("../validations/email/index");
    const result = updateContactMemberSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("importCsvSchema", () => {
  it("parses valid CSV import", async () => {
    const { importCsvSchema } = await import("../validations/email/index");
    const result = importCsvSchema.parse({ listId: "l1", csvData: "name,email\nJohn,john@test.com" });
    expect(result.listId).toBe("l1");
    expect(result.csvData).toBe("name,email\nJohn,john@test.com");
  });

  it("applies default updateExisting=false", async () => {
    const { importCsvSchema } = await import("../validations/email/index");
    const result = importCsvSchema.parse({ listId: "l1", csvData: "data" });
    expect(result.updateExisting).toBe(false);
  });

  it("rejects empty csvData", async () => {
    const { importCsvSchema } = await import("../validations/email/index");
    const result = importCsvSchema.safeParse({ listId: "l1", csvData: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty listId", async () => {
    const { importCsvSchema } = await import("../validations/email/index");
    const result = importCsvSchema.safeParse({ listId: "", csvData: "data" });
    expect(result.success).toBe(false);
  });
});

describe("sendTransactionalEmailSchema", () => {
  it("parses valid transactional email", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.parse({
      to: [{ email: "user@example.com", name: "User" }],
      subject: "Welcome",
      htmlContent: "<p>Hi</p>",
      textContent: "Hi",
    });
    expect(result.to).toHaveLength(1);
    expect(result.subject).toBe("Welcome");
    expect(result.htmlContent).toBe("<p>Hi</p>");
  });

  it("rejects empty recipients", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.safeParse({ to: [], subject: "S" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid recipient email", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.safeParse({ to: [{ email: "bad" }], subject: "S" });
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.safeParse({ to: [{ email: "a@b.com" }], subject: "" });
    expect(result.success).toBe(false);
  });

  it("rejects subject over 998 chars", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.safeParse({ to: [{ email: "a@b.com" }], subject: "x".repeat(999) });
    expect(result.success).toBe(false);
  });

  it("accepts tags array", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.parse({ to: [{ email: "a@b.com" }], subject: "S", tags: ["tag1", "tag2"] });
    expect(result.tags).toEqual(["tag1", "tag2"]);
  });

  it("rejects tags over 50", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.safeParse({ to: [{ email: "a@b.com" }], subject: "S", tags: Array.from({ length: 51 }, (_, i) => `t${i}`) });
    expect(result.success).toBe(false);
  });

  it("rejects tag over 100 chars", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.safeParse({ to: [{ email: "a@b.com" }], subject: "S", tags: ["x".repeat(101)] });
    expect(result.success).toBe(false);
  });

  it("accepts replyTo object", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.parse({ to: [{ email: "a@b.com" }], subject: "S", replyTo: { email: "reply@b.com", name: "Support" } });
    expect(result.replyTo?.email).toBe("reply@b.com");
  });

  it("accepts scheduledAt datetime", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.parse({ to: [{ email: "a@b.com" }], subject: "S", scheduledAt: "2026-07-17T12:00:00Z" });
    expect(result.scheduledAt).toBe("2026-07-17T12:00:00Z");
  });

  it("rejects invalid scheduledAt", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.safeParse({ to: [{ email: "a@b.com" }], subject: "S", scheduledAt: "invalid-date" });
    expect(result.success).toBe(false);
  });

  it("accepts templateId", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.parse({ to: [{ email: "a@b.com" }], subject: "S", templateId: 123 });
    expect(result.templateId).toBe(123);
  });

  it("accepts params as record", async () => {
    const { sendTransactionalEmailSchema } = await import("../validations/email/index");
    const result = sendTransactionalEmailSchema.parse({ to: [{ email: "a@b.com" }], subject: "S", params: { name: "John" } });
    expect(result.params).toEqual({ name: "John" });
  });
});

describe("sendBulkTransactionalSchema", () => {
  it("parses valid bulk send", async () => {
    const { sendBulkTransactionalSchema } = await import("../validations/email/index");
    const result = sendBulkTransactionalSchema.parse({
      messages: [
        { to: [{ email: "a@b.com" }], subject: "S1" },
        { to: [{ email: "b@c.com" }], subject: "S2" },
      ],
    });
    expect(result.messages).toHaveLength(2);
  });

  it("rejects empty messages", async () => {
    const { sendBulkTransactionalSchema } = await import("../validations/email/index");
    const result = sendBulkTransactionalSchema.safeParse({ messages: [] });
    expect(result.success).toBe(false);
  });

  it("rejects over 500 messages", async () => {
    const { sendBulkTransactionalSchema } = await import("../validations/email/index");
    const result = sendBulkTransactionalSchema.safeParse({ messages: Array.from({ length: 501 }, (_, i) => ({ to: [{ email: `a${i}@b.com` }], subject: `S${i}` })) });
    expect(result.success).toBe(false);
  });
});

describe("createEmailCampaignSchema", () => {
  it("parses valid campaign", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.parse({
      name: "Summer Sale",
      subject: "Big Sale!",
      senderName: "Marketing",
      senderEmail: "marketing@example.com",
      listIds: ["list-1"],
      htmlContent: "<p>Sale!</p>",
    });
    expect(result.name).toBe("Summer Sale");
    expect(result.listIds).toEqual(["list-1"]);
  });

  it("applies default htmlContent empty string", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.parse({ name: "C", subject: "S", listIds: ["l1"] });
    expect(result.htmlContent).toBe("");
  });

  it("rejects empty name", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.safeParse({ name: "", subject: "S", listIds: ["l1"] });
    expect(result.success).toBe(false);
  });

  it("rejects empty listIds", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.safeParse({ name: "C", subject: "S", listIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.safeParse({ name: "C", subject: "", listIds: ["l1"] });
    expect(result.success).toBe(false);
  });

  it("accepts abTesting configuration", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.parse({
      name: "A/B Test",
      subject: "Test",
      listIds: ["l1"],
      abTesting: { versionA: "A content", versionB: "B content", duration: 24, winnerCriteria: "open" },
    });
    expect(result.abTesting?.winnerCriteria).toBe("open");
    expect(result.abTesting?.duration).toBe(24);
  });

  it("rejects abTesting with invalid winnerCriteria", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.safeParse({
      name: "A/B Test", subject: "Test", listIds: ["l1"],
      abTesting: { versionA: "A", versionB: "B", duration: 24, winnerCriteria: "invalid" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects abTesting with duration 0", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.safeParse({
      name: "A/B Test", subject: "Test", listIds: ["l1"],
      abTesting: { versionA: "A", versionB: "B", duration: 0, winnerCriteria: "click" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects abTesting duration over 168", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.safeParse({
      name: "A/B Test", subject: "Test", listIds: ["l1"],
      abTesting: { versionA: "A", versionB: "B", duration: 169, winnerCriteria: "click" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts segmentIds", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.parse({ name: "C", subject: "S", listIds: ["l1"], segmentIds: ["seg1"] });
    expect(result.segmentIds).toEqual(["seg1"]);
  });

  it("accepts scheduledAt datetime", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.parse({ name: "C", subject: "S", listIds: ["l1"], scheduledAt: "2026-08-01T00:00:00Z" });
    expect(result.scheduledAt).toBe("2026-08-01T00:00:00Z");
  });

  it("rejects invalid senderEmail", async () => {
    const { createEmailCampaignSchema } = await import("../validations/email/index");
    const result = createEmailCampaignSchema.safeParse({ name: "C", subject: "S", listIds: ["l1"], senderEmail: "bad" });
    expect(result.success).toBe(false);
  });
});

describe("updateEmailCampaignSchema", () => {
  it("accepts partial update", async () => {
    const { updateEmailCampaignSchema } = await import("../validations/email/index");
    const result = updateEmailCampaignSchema.parse({ name: "Updated" });
    expect(result.name).toBe("Updated");
  });

  it("accepts empty update", async () => {
    const { updateEmailCampaignSchema } = await import("../validations/email/index");
    const result = updateEmailCampaignSchema.parse({});
    expect(result).toBeDefined();
  });

  it("validates fields when provided", async () => {
    const { updateEmailCampaignSchema } = await import("../validations/email/index");
    const result = updateEmailCampaignSchema.safeParse({ name: "", subject: "S", listIds: ["l1"] });
    expect(result.success).toBe(false);
  });
});

describe("sendTestEmailSchema", () => {
  it("parses valid test email request", async () => {
    const { sendTestEmailSchema } = await import("../validations/email/index");
    const result = sendTestEmailSchema.parse({ campaignId: "camp-1", emails: ["test@example.com"] });
    expect(result.campaignId).toBe("camp-1");
    expect(result.emails).toEqual(["test@example.com"]);
  });

  it("rejects empty campaignId", async () => {
    const { sendTestEmailSchema } = await import("../validations/email/index");
    const result = sendTestEmailSchema.safeParse({ campaignId: "", emails: ["a@b.com"] });
    expect(result.success).toBe(false);
  });

  it("rejects empty emails array", async () => {
    const { sendTestEmailSchema } = await import("../validations/email/index");
    const result = sendTestEmailSchema.safeParse({ campaignId: "c1", emails: [] });
    expect(result.success).toBe(false);
  });

  it("rejects over 10 emails", async () => {
    const { sendTestEmailSchema } = await import("../validations/email/index");
    const result = sendTestEmailSchema.safeParse({ campaignId: "c1", emails: Array.from({ length: 11 }, (_, i) => `a${i}@b.com`) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email in array", async () => {
    const { sendTestEmailSchema } = await import("../validations/email/index");
    const result = sendTestEmailSchema.safeParse({ campaignId: "c1", emails: ["bad"] });
    expect(result.success).toBe(false);
  });
});

describe("scheduleCampaignSchema", () => {
  it("parses valid schedule request", async () => {
    const { scheduleCampaignSchema } = await import("../validations/email/index");
    const result = scheduleCampaignSchema.parse({ campaignId: "camp-1", sendAt: "2026-07-20T10:00:00Z" });
    expect(result.campaignId).toBe("camp-1");
    expect(result.sendAt).toBe("2026-07-20T10:00:00Z");
  });

  it("rejects empty campaignId", async () => {
    const { scheduleCampaignSchema } = await import("../validations/email/index");
    const result = scheduleCampaignSchema.safeParse({ campaignId: "", sendAt: "2026-07-20T10:00:00Z" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime", async () => {
    const { scheduleCampaignSchema } = await import("../validations/email/index");
    const result = scheduleCampaignSchema.safeParse({ campaignId: "c1", sendAt: "not-a-date" });
    expect(result.success).toBe(false);
  });
});

describe("updateEmailSettingsSchema", () => {
  it("parses valid email settings", async () => {
    const { updateEmailSettingsSchema } = await import("../validations/email/index");
    const result = updateEmailSettingsSchema.parse({
      smtpServer: "smtp.example.com",
      smtpPort: 587,
      smtpLogin: "user",
      smtpPassword: "pass",
      senderName: "Sender",
      senderEmail: "sender@example.com",
      trackingEnabled: true,
      doubleOptIn: false,
      dailySendLimit: 1000,
    });
    expect(result.smtpServer).toBe("smtp.example.com");
    expect(result.smtpPort).toBe(587);
    expect(result.dailySendLimit).toBe(1000);
  });

  it("accepts empty settings", async () => {
    const { updateEmailSettingsSchema } = await import("../validations/email/index");
    const result = updateEmailSettingsSchema.parse({});
    expect(result).toBeDefined();
  });

  it("rejects invalid senderEmail", async () => {
    const { updateEmailSettingsSchema } = await import("../validations/email/index");
    const result = updateEmailSettingsSchema.safeParse({ senderEmail: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects smtpPort 0", async () => {
    const { updateEmailSettingsSchema } = await import("../validations/email/index");
    const result = updateEmailSettingsSchema.safeParse({ smtpPort: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative dailySendLimit", async () => {
    const { updateEmailSettingsSchema } = await import("../validations/email/index");
    const result = updateEmailSettingsSchema.safeParse({ dailySendLimit: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid replyToEmail", async () => {
    const { updateEmailSettingsSchema } = await import("../validations/email/index");
    const result = updateEmailSettingsSchema.safeParse({ replyToEmail: "bad" });
    expect(result.success).toBe(false);
  });

  it("accepts nullable fields", async () => {
    const { updateEmailSettingsSchema } = await import("../validations/email/index");
    const result = updateEmailSettingsSchema.parse({ apiKey: null, smtpLogin: null });
    expect(result.apiKey).toBeNull();
    expect(result.smtpLogin).toBeNull();
  });
});

describe("contactFilterSchema", () => {
  it("parses with defaults", async () => {
    const { contactFilterSchema } = await import("../validations/email/index");
    const result = contactFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("parses with string number values", async () => {
    const { contactFilterSchema } = await import("../validations/email/index");
    const result = contactFilterSchema.parse({ page: "2", limit: "50" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it("rejects page 0", async () => {
    const { contactFilterSchema } = await import("../validations/email/index");
    const result = contactFilterSchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects limit over 100", async () => {
    const { contactFilterSchema } = await import("../validations/email/index");
    const result = contactFilterSchema.safeParse({ limit: "101" });
    expect(result.success).toBe(false);
  });

  it("accepts optional filter fields", async () => {
    const { contactFilterSchema } = await import("../validations/email/index");
    const result = contactFilterSchema.parse({ search: "john", status: "ACTIVE", listId: "l1", source: "web", country: "US" });
    expect(result.search).toBe("john");
    expect(result.status).toBe("ACTIVE");
  });

  it("rejects invalid status", async () => {
    const { contactFilterSchema } = await import("../validations/email/index");
    const result = contactFilterSchema.safeParse({ status: "INVALID" });
    expect(result.success).toBe(false);
  });
});

describe("analyticsFilterSchema", () => {
  it("parses with all fields", async () => {
    const { analyticsFilterSchema } = await import("../validations/email/index");
    const result = analyticsFilterSchema.parse({ dateFrom: "2026-01-01", dateTo: "2026-07-17", campaignId: "camp-1" });
    expect(result.dateFrom).toBe("2026-01-01");
    expect(result.dateTo).toBe("2026-07-17");
    expect(result.campaignId).toBe("camp-1");
  });

  it("accepts empty object", async () => {
    const { analyticsFilterSchema } = await import("../validations/email/index");
    const result = analyticsFilterSchema.parse({});
    expect(result).toBeDefined();
  });
});

describe("newsletterSignupSchema", () => {
  it("parses valid signup with consent", async () => {
    const { newsletterSignupSchema } = await import("../validations/email/index");
    const result = newsletterSignupSchema.parse({
      email: "user@example.com",
      firstName: "Jane",
      lastName: "Doe",
      consent: true,
    });
    expect(result.email).toBe("user@example.com");
    expect(result.consent).toBe(true);
    expect(result.source).toBe("newsletter_form");
  });

  it("applies default source", async () => {
    const { newsletterSignupSchema } = await import("../validations/email/index");
    const result = newsletterSignupSchema.parse({ email: "a@b.com", consent: true });
    expect(result.source).toBe("newsletter_form");
  });

  it("rejects false consent", async () => {
    const { newsletterSignupSchema } = await import("../validations/email/index");
    const result = newsletterSignupSchema.safeParse({ email: "a@b.com", consent: false });
    expect(result.success).toBe(false);
  });

  it("rejects missing consent", async () => {
    const { newsletterSignupSchema } = await import("../validations/email/index");
    const result = newsletterSignupSchema.safeParse({ email: "a@b.com" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", async () => {
    const { newsletterSignupSchema } = await import("../validations/email/index");
    const result = newsletterSignupSchema.safeParse({ email: "bad", consent: true });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", async () => {
    const { newsletterSignupSchema } = await import("../validations/email/index");
    const result = newsletterSignupSchema.parse({ email: "a@b.com", consent: true, country: "US", interests: "tech", listId: "l1" });
    expect(result.country).toBe("US");
    expect(result.interests).toBe("tech");
    expect(result.listId).toBe("l1");
  });

  it("rejects firstName over 100 chars", async () => {
    const { newsletterSignupSchema } = await import("../validations/email/index");
    const result = newsletterSignupSchema.safeParse({ email: "a@b.com", consent: true, firstName: "x".repeat(101) });
    expect(result.success).toBe(false);
  });
});
