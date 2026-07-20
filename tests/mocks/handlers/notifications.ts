import { http, HttpResponse } from "msw";

export const notificationHandlers = [
  http.get("/api/notifications", ({ request }) => {
    const url = new URL(request.url);
    const unread = url.searchParams.get("unread") === "true";
    return HttpResponse.json({
      data: [
        {
          id: "notif-1",
          title: "New lead captured",
          message: "John Doe from Acme Corp submitted a contact form",
          read: !unread,
          category: "CRM",
          priority: "HIGH",
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
    });
  }),

  http.get("/api/notifications/unread-count", () => {
    return HttpResponse.json({ count: 5 });
  }),

  http.put("/api/notifications/:id/read", ({ params }) => {
    return HttpResponse.json({ id: params.id, read: true });
  }),

  http.put("/api/notifications/read-all", () => {
    return HttpResponse.json({ message: "All notifications marked as read" });
  }),

  http.delete("/api/notifications/:id", ({ params }) => {
    return HttpResponse.json({ message: `Notification ${params.id} deleted` });
  }),
];
