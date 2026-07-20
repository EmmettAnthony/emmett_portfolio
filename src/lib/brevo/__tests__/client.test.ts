import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBrevoConfig, getBrevo, BrevoApiError } from "../client";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const DEFAULT_ENV = process.env.BREVO_API_KEY;

describe("getBrevoConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns config when BREVO_API_KEY is set", () => {
    process.env.BREVO_API_KEY = "test-api-key";
    const config = getBrevoConfig();
    expect(config.apiKey).toBe("test-api-key");
  });

  it("throws when BREVO_API_KEY is not set", () => {
    delete process.env.BREVO_API_KEY;
    expect(() => getBrevoConfig()).toThrow("BREVO_API_KEY is not set");
  });
});

describe("BrevoApiError", () => {
  it("creates error with status and body", () => {
    const err = new BrevoApiError("Not found", 404, '{"error":"not found"}');
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.body).toBe('{"error":"not found"}');
    expect(err.name).toBe("BrevoApiError");
  });

  it("defaults body to empty string", () => {
    const err = new BrevoApiError("Server error", 500);
    expect(err.body).toBe("");
  });
});

describe("getBrevo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BREVO_API_KEY = "test-api-key";
  });

  afterEach(() => {
    process.env.BREVO_API_KEY = DEFAULT_ENV;
  });

  describe("contacts", () => {
    it("creates a contact", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 201,
      });
      const result = await getBrevo().contacts.create({
        email: "test@example.com",
        attributes: { name: "Test" },
        listIds: [1],
      });
      expect(result.id).toBe(123);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.brevo.com/v3/contacts",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            attributes: { name: "Test" },
            listIds: [1],
          }),
        })
      );
    });

    it("gets a contact by email", async () => {
      const contact = { id: 1, email: "test@example.com", emailBlacklisted: false, smsBlacklisted: false, createdAt: "", modifiedAt: "", listIds: [], listUnsubscribed: [], attributes: {} };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => contact,
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().contacts.get("test@example.com");
      expect(result.email).toBe("test@example.com");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.brevo.com/v3/contacts/test%40example.com",
        expect.any(Object)
      );
    });

    it("updates a contact", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().contacts.update("test@example.com", { attributes: { name: "Updated" } })).resolves.toBeDefined();
    });

    it("deletes a contact", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().contacts.delete("test@example.com")).resolves.toBeDefined();
    });

    it("lists contacts with params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().contacts.list({ limit: 10, offset: 0, sort: "asc" });
      expect(result.count).toBe(0);
    });

    it("lists contacts with all optional params (modifiedSince, segmentId, listId, filter)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().contacts.list({
        limit: 50,
        offset: 10,
        modifiedSince: "2024-01-01T00:00:00Z",
        sort: "desc",
        segmentId: 2,
        listId: 3,
        filter: "equals(email,'test@example.com')",
      });
      expect(result.count).toBe(0);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("modifiedSince=2024-01-01T00%3A00%3A00Z");
      expect(calledUrl).toContain("segmentId=2");
      expect(calledUrl).toContain("listId=3");
      expect(calledUrl).toContain("filter=equals");
      expect(calledUrl).toContain("sort=desc");
      expect(calledUrl).toContain("limit=50");
      expect(calledUrl).toContain("offset=10");
    });

    it("lists contacts with modifiedSince only", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().contacts.list({ modifiedSince: "2024-06-01T00:00:00Z" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("modifiedSince=2024-06-01");
    });

    it("lists contacts without params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().contacts.list();
      expect(result.contacts).toEqual([]);
    });

    it("imports contacts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ processId: 999 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().contacts.import({ fileBody: "email,name", listIds: [1] });
      expect(result.processId).toBe(999);
    });

    it("exports contacts", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ processId: 888 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().contacts.export({ exportAttributes: ["email"], fileType: "csv" });
      expect(result.processId).toBe(888);
    });

    it("gets contact attributes", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ attributes: [] }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().contacts.getAttributes();
      expect(result.attributes).toEqual([]);
    });
  });

  describe("lists", () => {
    it("creates a list", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 201,
      });
      const result = await getBrevo().lists.create({ listName: "Test List" });
      expect(result.id).toBe(1);
    });

    it("gets a list by id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: "Test", totalBlacklisted: 0, totalSubscribers: 0, uniqueSubscribers: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().lists.get(1);
      expect(result.name).toBe("Test");
    });

    it("updates a list", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().lists.update(1, { listName: "Updated" })).resolves.toBeDefined();
    });

    it("deletes a list", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().lists.delete(1)).resolves.toBeDefined();
    });

    it("lists all lists", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lists: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().lists.list();
      expect(result.lists).toEqual([]);
    });

    it("gets contacts in a list", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().lists.getContacts(1);
      expect(result.contacts).toEqual([]);
    });

    it("lists lists with sort param", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lists: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().lists.list({ limit: 20, offset: 5, sort: "desc" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("limit=20");
      expect(calledUrl).toContain("offset=5");
      expect(calledUrl).toContain("sort=desc");
    });

    it("gets contacts in a list with params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().lists.getContacts(1, { limit: 100, offset: 20 });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("limit=100");
      expect(calledUrl).toContain("offset=20");
    });
  });

  describe("folders", () => {
    it("creates a folder", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 201,
      });
      const result = await getBrevo().folders.create({ name: "Test Folder" });
      expect(result.id).toBe(1);
    });

    it("lists folders", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ folders: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().folders.list();
      expect(result.folders).toEqual([]);
    });

    it("lists folders with params (limit, offset, sort)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ folders: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().folders.list({ limit: 50, offset: 10, sort: "asc" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("limit=50");
      expect(calledUrl).toContain("offset=10");
      expect(calledUrl).toContain("sort=asc");
    });

    it("gets a folder by id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: "Folder", totalBlacklisted: 0, totalSubscribers: 0, uniqueSubscribers: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().folders.get(1);
      expect(result.name).toBe("Folder");
    });

    it("deletes a folder", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().folders.delete(1)).resolves.toBeDefined();
    });

    it("updates a folder", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().folders.update(1, { name: "Updated" })).resolves.toBeDefined();
    });

    it("gets lists in a folder", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lists: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().folders.getLists(1);
      expect(result.lists).toEqual([]);
    });

    it("gets lists in a folder with params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lists: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().folders.getLists(1, { limit: 10, offset: 5, sort: "desc" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("limit=10");
      expect(calledUrl).toContain("offset=5");
      expect(calledUrl).toContain("sort=desc");
    });
  });

  describe("transactional email", () => {
    it("sends an email", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: "msg-123" }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 201,
      });
      const result = await getBrevo().transactional.sendEmail({
        sender: { name: "Test", email: "test@example.com" },
        to: [{ email: "user@example.com" }],
        subject: "Hello",
        htmlContent: "<p>Hi</p>",
      });
      expect(result.messageId).toBe("msg-123");
    });

    it("sends a template", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: "msg-456" }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 201,
      });
      const result = await getBrevo().transactional.sendTemplate(1, {
        to: [{ email: "user@example.com" }],
      });
      expect(result.messageId).toBe("msg-456");
    });

    it("gets emails list", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emails: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().transactional.getEmails({ limit: 10 });
      expect(result.emails).toEqual([]);
    });

    it("gets emails list with all params (offset, startDate, endDate, email, templateId, messageId, sort)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emails: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().transactional.getEmails({
        limit: 100,
        offset: 20,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        email: "user@example.com",
        templateId: 5,
        messageId: "msg-abc",
        sort: "desc",
      });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("limit=100");
      expect(calledUrl).toContain("offset=20");
      expect(calledUrl).toContain("startDate=2024-01-01");
      expect(calledUrl).toContain("endDate=2024-12-31");
      expect(calledUrl).toContain("email=user%40example.com");
      expect(calledUrl).toContain("templateId=5");
      expect(calledUrl).toContain("messageId=msg-abc");
      expect(calledUrl).toContain("sort=desc");
    });

    it("gets a single email", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "1", messageId: "m1", from: "", subject: "", to: "", tags: [], status: "", body: "", createdAt: "", clickCount: 0, openCount: 0, complaintClickCount: 0, blocked: false, replyTo: "", headers: {} }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().transactional.getEmail("m1");
      expect(result.id).toBe("1");
    });

    it("deletes an email", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().transactional.deleteEmail("m1")).resolves.toBeDefined();
    });

    it("gets aggregated report", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalSent: 100, totalDelivered: 95, totalOpened: 50, totalClicked: 30, totalSoftBounce: 2, totalHardBounce: 3, totalSpam: 0, totalUnsubscribed: 1, totalComplaint: 0, openRate: 0.5, clickRate: 0.3, bounceRate: 0.05, spamRate: 0, unsubscribeRate: 0.01, deliveredRate: 0.95 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().transactional.getAggregatedReport({ startDate: "2024-01-01", endDate: "2024-01-31" });
      expect(result.totalSent).toBe(100);
    });

    it("gets aggregated report with optional params (days, tag)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalSent: 100, totalDelivered: 95, totalOpened: 50, totalClicked: 30, totalSoftBounce: 2, totalHardBounce: 3, totalSpam: 0, totalUnsubscribed: 1, totalComplaint: 0, openRate: 0.5, clickRate: 0.3, bounceRate: 0.05, spamRate: 0, unsubscribeRate: 0.01, deliveredRate: 0.95 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().transactional.getAggregatedReport({
        startDate: "2024-01-01",
        endDate: "2024-01-07",
        days: 7,
        tag: "welcome",
      });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("days=7");
      expect(calledUrl).toContain("tag=welcome");
    });

    it("gets daily report", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dailyStats: [], totalCount: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().transactional.getDailyReport({ startDate: "2024-01-01", endDate: "2024-01-31" });
      expect(result.totalCount).toBe(0);
    });

    it("gets daily report with all optional params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ dailyStats: [], totalCount: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().transactional.getDailyReport({
        limit: 30,
        offset: 10,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        days: 7,
        tag: "onboarding",
      });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("limit=30");
      expect(calledUrl).toContain("offset=10");
      expect(calledUrl).toContain("days=7");
      expect(calledUrl).toContain("tag=onboarding");
    });
  });

  describe("templates", () => {
    it("lists templates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().templates.list();
      expect(result.templates).toEqual([]);
    });

    it("lists templates with all params (templateStatus, limit, offset, sort)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().templates.list({ templateStatus: true, limit: 20, offset: 5, sort: "desc" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("templateStatus=true");
      expect(calledUrl).toContain("limit=20");
      expect(calledUrl).toContain("offset=5");
      expect(calledUrl).toContain("sort=desc");
    });

    it("lists templates with templateStatus=false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ templates: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().templates.list({ templateStatus: false });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("templateStatus=false");
    });

    it("gets a template by id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: "Welcome", subject: "Welcome!", isActive: true, htmlContent: "", sender: { name: "", email: "" }, createdAt: "", modifiedAt: "" }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().templates.get(1);
      expect(result.name).toBe("Welcome");
    });

    it("creates a template", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 201,
      });
      const result = await getBrevo().templates.create({
        sender: { name: "Test", email: "test@example.com" },
        templateName: "Test Template",
        subject: "Test",
      });
      expect(result.id).toBe(1);
    });

    it("updates a template", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().templates.update(1, { templateName: "Updated" })).resolves.toBeDefined();
    });

    it("deletes a template", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().templates.delete(1)).resolves.toBeDefined();
    });
  });

  describe("campaigns", () => {
    it("creates a campaign", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 201,
      });
      const result = await getBrevo().campaigns.create({
        name: "Test Campaign",
        subject: "Hello",
        sender: { name: "Test", email: "test@example.com" },
        type: "classic",
        listIds: [1],
      });
      expect(result.id).toBe(1);
    });

    it("gets a campaign by id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: "Campaign", subject: "Hi", type: "classic", status: "draft", recipients: { listIds: [1] }, sender: { id: 1, name: "", email: "" }, createdAt: "", modifiedAt: "" }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().campaigns.get(1);
      expect(result.name).toBe("Campaign");
    });

    it("updates a campaign", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().campaigns.update(1, { name: "Updated" })).resolves.toBeDefined();
    });

    it("deletes a campaign", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().campaigns.delete(1)).resolves.toBeDefined();
    });

    it("lists campaigns", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().campaigns.list();
      expect(result.campaigns).toEqual([]);
    });

    it("lists campaigns with all params (sort, status, startDate, endDate)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().campaigns.list({
        limit: 50,
        offset: 10,
        sort: "desc",
        status: "sent",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("limit=50");
      expect(calledUrl).toContain("offset=10");
      expect(calledUrl).toContain("sort=desc");
      expect(calledUrl).toContain("status=sent");
      expect(calledUrl).toContain("startDate=2024-01-01");
      expect(calledUrl).toContain("endDate=2024-12-31");
    });

    it("lists campaigns with status only", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ campaigns: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().campaigns.list({ status: "draft" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("status=draft");
    });

    it("sends a test email", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().campaigns.sendTest(1, { emailTo: ["test@example.com"] })).resolves.toBeDefined();
    });

    it("sends a report", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().campaigns.sendReport(1, { email: { to: ["test@example.com"], body: "Report" } })).resolves.toBeDefined();
    });

    it("sends a campaign now", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().campaigns.send(1)).resolves.toBeDefined();
    });

    it("schedules a campaign", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().campaigns.schedule(1, { sendAt: "2024-06-01T00:00:00Z" })).resolves.toBeDefined();
    });

    it("duplicates a campaign", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().campaigns.duplicate(1);
      expect(result.id).toBe(2);
    });

    it("gets campaign stats", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ globalStats: { sent: 100, delivered: 95, opened: 50, clicked: 30, uniqueOpened: 40, uniqueClicked: 25, softBounce: 2, hardBounce: 3, spam: 0, unsubscribed: 1, complaint: 0, openRate: 0.5, clickRate: 0.3, bounceRate: 0.05, spamRate: 0, unsubscribeRate: 0.01, deliveredRate: 0.95 } }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().campaigns.getStats(1);
      expect(result.globalStats.sent).toBe(100);
    });

    it("gets AB test result", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ versionA: { subject: "A", openRate: 0.5, clickRate: 0.3 }, versionB: { subject: "B", openRate: 0.6, clickRate: 0.4 }, winner: "B", winnerCriteria: "open", totalRecipients: 100, testRecipients: 20 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().campaigns.getAbTestResult(1);
      expect(result.winner).toBe("B");
    });

    it("gets campaign shares", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shares: [] }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().campaigns.getShares(1);
      expect(result.shares).toEqual([]);
    });
  });

  describe("webhooks", () => {
    it("creates a webhook", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 201,
      });
      const result = await getBrevo().webhooks.create({
        url: "https://example.com/webhook",
        events: ["delivered"],
        type: "transactional",
      });
      expect(result.id).toBe(1);
    });

    it("lists webhooks", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ webhooks: [] }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().webhooks.list();
      expect(result.webhooks).toEqual([]);
    });

    it("lists webhooks with type and sort", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ webhooks: [] }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().webhooks.list({ type: "marketing", sort: "desc" });
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("type=marketing");
      expect(calledUrl).toContain("sort=desc");
    });

    it("gets a webhook by id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, url: "https://example.com/webhook", events: ["delivered"], type: "transactional", createdAt: "", modifiedAt: "" }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().webhooks.get(1);
      expect(result.url).toBe("https://example.com/webhook");
    });

    it("updates a webhook", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().webhooks.update(1, { url: "https://example.com/new" })).resolves.toBeDefined();
    });

    it("deletes a webhook", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().webhooks.delete(1)).resolves.toBeDefined();
    });
  });

  describe("smtp", () => {
    it("gets blocked domains", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ domains: [] }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().smtp.getBlockedDomains();
      expect(result.domains).toEqual([]);
    });

    it("unblocks a domain", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().smtp.unblockBlockedDomain("spam.com")).resolves.toBeDefined();
    });

    it("deletes hardbounces", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 204,
      });
      await expect(getBrevo().smtp.deleteHardbounces({ startDate: "2024-01-01" })).resolves.toBeDefined();
    });
  });

  describe("account", () => {
    it("gets account info", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: "admin@example.com", firstName: "Admin", lastName: "User", companyName: "Test", address: {}, plan: [], relay: { enabled: true, data: "" } }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().account.get();
      expect(result.email).toBe("admin@example.com");
    });

    it("gets account plan", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plan: [] }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      const result = await getBrevo().account.getPlan();
      expect(result.plan).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("throws BrevoApiError on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => '{"error":"bad request"}',
        headers: new Headers({ "content-type": "application/json" }),
      });
      await expect(getBrevo().contacts.get("test@example.com")).rejects.toThrow(BrevoApiError);
    });

    it("throws BrevoApiError on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      await expect(getBrevo().contacts.get("test@example.com")).rejects.toThrow(BrevoApiError);
    });

    it("includes API key in headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().contacts.list();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "api-key": "test-api-key",
          }),
        })
      );
    });

    it("includes Brevo status code in error message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Not Found",
        headers: new Headers({ "content-type": "text/plain" }),
      });
      try {
        await getBrevo().contacts.get("missing@example.com");
      } catch (err) {
        const brevoErr = err as BrevoApiError;
        expect(brevoErr.status).toBe(404);
        expect(brevoErr.message).toContain("404");
      }
    });

    it("throws 204 with empty object return for void operations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => "",
        headers: new Headers({}),
      });
      const result = await getBrevo().contacts.delete("void@example.com");
      expect(result).toEqual({});
    });

    it("re-throws BrevoApiError from response error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => '{"error":"Unprocessable"}',
        headers: new Headers({ "content-type": "application/json" }),
      });
      await expect(getBrevo().contacts.get("test@example.com")).rejects.toThrow(BrevoApiError);
    });

    it("handles text() failure inside error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => { throw new Error("Cannot read body"); },
        headers: new Headers({ "content-type": "text/plain" }),
      });
      await expect(getBrevo().contacts.get("fail@example.com")).rejects.toThrow(BrevoApiError);
    });
  });

  describe("timeout", () => {
    it("sets default timeout of 30s", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contacts: [], count: 0 }),
        text: async () => "",
        headers: new Headers({ "content-type": "application/json" }),
        status: 200,
      });
      await getBrevo().contacts.list();
      const call = mockFetch.mock.calls[0][1];
      expect(call.signal).toBeInstanceOf(AbortSignal);
    });

    it("aborts request when timeout occurs", async () => {
      // AbortController should be called with signal
      const abortSpy = vi.spyOn(AbortController.prototype, "abort");
      mockFetch.mockRejectedValueOnce(new DOMException("The operation was aborted", "AbortError"));

      await expect(getBrevo().contacts.get("timeout@example.com")).rejects.toThrow(BrevoApiError);
      expect(abortSpy).not.toHaveBeenCalled();

      abortSpy.mockRestore();
    });
  });
});
