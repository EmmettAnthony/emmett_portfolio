import { http, HttpResponse } from "msw";

export const bookingHandlers = [
  http.get("/api/booking/slots", ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    return HttpResponse.json({
      date,
      slots: [
        { time: "09:00", available: true },
        { time: "10:00", available: true },
        { time: "11:00", available: false },
        { time: "14:00", available: true },
        { time: "15:00", available: true },
      ],
    });
  }),

  http.get("/api/booking/meeting-types", () => {
    return HttpResponse.json({
      data: [
        { id: "mt-1", name: "Discovery Call", duration: 30, price: 0 },
        { id: "mt-2", name: "Consultation", duration: 60, price: 150 },
        { id: "mt-3", name: "Project Review", duration: 45, price: 0 },
      ],
    });
  }),

  http.post("/api/booking", async ({ request }) => {
    const body = (await request.json()) as { name?: string; email?: string };
    if (!body.name || !body.email) {
      return HttpResponse.json({ error: "Name and email required" }, { status: 400 });
    }
    return HttpResponse.json({ id: `booking-${Date.now()}`, status: "PENDING", ...body }, { status: 201 });
  }),

  http.put("/api/booking/:id/cancel", ({ params }) => {
    return HttpResponse.json({ id: params.id, status: "CANCELLED" });
  }),
];
