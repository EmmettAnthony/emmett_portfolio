import { http, HttpResponse } from "msw";

export const crmHandlers = [
  http.get("/api/crm/leads", () => {
    return HttpResponse.json({
      data: [
        {
          id: "lead-1",
          name: "Jane Smith",
          email: "jane@example.com",
          company: "Tech Corp",
          score: 85,
          status: "NEW",
          source: "WEBSITE",
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
    });
  }),

  http.post("/api/crm/leads", async ({ request }) => {
    const body = (await request.json()) as { name?: string; email?: string };
    if (!body.name || !body.email) {
      return HttpResponse.json({ error: "Name and email required" }, { status: 400 });
    }
    return HttpResponse.json({ id: `lead-${Date.now()}`, ...body, score: 0, status: "NEW" }, { status: 201 });
  }),

  http.get("/api/crm/deals", () => {
    return HttpResponse.json({
      data: [
        {
          id: "deal-1",
          title: "Website Redesign",
          value: 15000,
          stage: "NEGOTIATION",
          probability: 70,
          expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        },
      ],
      total: 1,
    });
  }),

  http.get("/api/crm/activities", () => {
    return HttpResponse.json({
      data: [
        {
          id: "act-1",
          type: "CALL",
          subject: "Follow-up call with Jane",
          done: false,
          dueDate: new Date().toISOString(),
        },
      ],
      total: 1,
    });
  }),
];
