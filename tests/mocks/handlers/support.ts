import { http, HttpResponse } from "msw";

export const supportHandlers = [
  http.get("/api/support/tickets", () => {
    return HttpResponse.json({
      data: [
        {
          id: "ticket-1",
          ticketNumber: "SUP-001",
          subject: "Cannot access dashboard",
          status: "OPEN",
          priority: "HIGH",
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
    });
  }),

  http.get("/api/support/tickets/:id", ({ params }) => {
    if (params.id === "not-found") {
      return HttpResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    return HttpResponse.json({
      id: params.id,
      ticketNumber: "SUP-001",
      subject: "Cannot access dashboard",
      status: "OPEN",
      priority: "HIGH",
      replies: [],
    });
  }),

  http.post("/api/support/tickets", async ({ request }) => {
    const body = (await request.json()) as { subject?: string; message?: string };
    if (!body.subject || !body.message) {
      return HttpResponse.json({ error: "Subject and message required" }, { status: 400 });
    }
    return HttpResponse.json({
      id: `ticket-${Date.now()}`,
      ticketNumber: `SUP-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`,
      status: "OPEN",
      ...body,
    }, { status: 201 });
  }),

  http.post("/api/support/tickets/:id/reply", async ({ params, request }) => {
    const body = (await request.json()) as { message?: string };
    if (!body.message) {
      return HttpResponse.json({ error: "Message required" }, { status: 400 });
    }
    return HttpResponse.json({ id: `reply-${Date.now()}`, ticketId: params.id, ...body, createdAt: new Date().toISOString() });
  }),

  http.put("/api/support/tickets/:id/status", async ({ params, request }) => {
    const body = (await request.json()) as { status?: string };
    if (!body.status) {
      return HttpResponse.json({ error: "Status required" }, { status: 400 });
    }
    return HttpResponse.json({ id: params.id, status: body.status });
  }),
];
