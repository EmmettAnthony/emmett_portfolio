import { http, HttpResponse } from "msw";

export const emailHandlers = [
  http.post("/api/email/send", async ({ request }) => {
    const body = (await request.json()) as { to?: string; subject?: string; body?: string };
    if (!body.to || !body.subject) {
      return HttpResponse.json({ error: "Recipient and subject required" }, { status: 400 });
    }
    return HttpResponse.json({ messageId: `msg-${Date.now()}`, status: "queued" }, { status: 201 });
  }),

  http.post("/api/email/transactional", async ({ request }) => {
    const body = (await request.json()) as { template?: string; to?: string; data?: Record<string, unknown> };
    if (!body.template || !body.to) {
      return HttpResponse.json({ error: "Template and recipient required" }, { status: 400 });
    }
    return HttpResponse.json({ messageId: `tx-${Date.now()}`, status: "sent" });
  }),

  http.post("/api/email/newsletter/send", async ({ request }) => {
    const body = (await request.json()) as { campaignId?: string };
    if (!body.campaignId) {
      return HttpResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }
    return HttpResponse.json({ message: "Campaign queued for sending", totalRecipients: 150 });
  }),

  http.post("/api/email/brevo/sync", () => {
    return HttpResponse.json({ message: "Sync complete", synced: 42, failed: 0 });
  }),

  http.get("/api/email/analytics", () => {
    return HttpResponse.json({
      totalSent: 5000,
      openRate: 28.5,
      clickRate: 3.2,
      bounceRate: 1.1,
      unsubscribeRate: 0.3,
    });
  }),
];
