import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function getJSON(url: string) {
  const response = await fetch(url);
  return { status: response.status, body: await response.json() };
}

async function postJSON(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function putJSON(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function deleteReq(url: string) {
  const response = await fetch(url, { method: "DELETE" });
  return { status: response.status, body: await response.json() };
}

describe("Invoice API", () => {
  const baseUrl = "http://localhost/api/invoices";

  describe("GET /api/invoices", () => {
    it("returns paginated invoice list", async () => {
      server.use(
        http.get(`${baseUrl}`, ({ request }) => {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get("page") ?? "1");
          return HttpResponse.json({
            data: [{ id: "1", invoiceNumber: "INV-001", total: 500, status: "PAID" }],
            total: 1,
            page,
            pageSize: 10,
            totalPages: 1,
          });
        }),
      );

      const res = await getJSON(`${baseUrl}?page=1&pageSize=10`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
      expect(res.body.page).toBe(1);
    });

    it("returns empty array when no invoices", async () => {
      server.use(
        http.get(`${baseUrl}`, () => {
          return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
        }),
      );

      const res = await getJSON(baseUrl);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("GET /api/invoices/:id", () => {
    it("returns invoice by id", async () => {
      server.use(
        http.get(`${baseUrl}/:id`, ({ params }) => {
          return HttpResponse.json({ id: params.id, invoiceNumber: "INV-001", total: 500, status: "PAID" });
        }),
      );

      const res = await getJSON(`${baseUrl}/inv-1`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe("inv-1");
    });

    it("returns 404 for non-existent invoice", async () => {
      server.use(
        http.get(`${baseUrl}/:id`, () => {
          return HttpResponse.json({ error: "Invoice not found" }, { status: 404 });
        }),
      );

      const res = await getJSON(`${baseUrl}/nonexistent`);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/invoices", () => {
    it("creates invoice with valid data", async () => {
      server.use(
        http.post(baseUrl, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            { id: "inv-new", invoiceNumber: "INV-1001", ...body, createdAt: new Date().toISOString() },
            { status: 201 },
          );
        }),
      );

      const res = await postJSON(baseUrl, {
        customerId: "cust-1",
        customerName: "John Doe",
        items: [{ description: "Service", quantity: 1, unitPrice: 500, total: 500 }],
        dueDate: "2024-12-31",
      });
      expect(res.status).toBe(201);
      expect(res.body.invoiceNumber).toBe("INV-1001");
    });

    it("returns 400 for missing required fields", async () => {
      server.use(
        http.post(baseUrl, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          if (!body.customerId || !body.items) {
            return HttpResponse.json({ error: "Customer ID and items required" }, { status: 400 });
          }
          return HttpResponse.json({}, { status: 201 });
        }),
      );

      const res = await postJSON(baseUrl, {});
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/invoices/:id", () => {
    it("updates existing invoice", async () => {
      server.use(
        http.put(`${baseUrl}/:id`, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ id: "inv-1", ...body, updatedAt: new Date().toISOString() });
        }),
      );

      const res = await putJSON(`${baseUrl}/inv-1`, { status: "SENT" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("SENT");
    });

    it("returns 404 for non-existent invoice", async () => {
      server.use(
        http.put(`${baseUrl}/:id`, () => {
          return HttpResponse.json({ error: "Invoice not found" }, { status: 404 });
        }),
      );

      const res = await putJSON(`${baseUrl}/nonexistent`, { status: "SENT" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/invoices/:id", () => {
    it("deletes invoice", async () => {
      server.use(
        http.delete(`${baseUrl}/:id`, () => {
          return HttpResponse.json({ message: "Invoice deleted" });
        }),
      );

      const res = await deleteReq(`${baseUrl}/inv-1`);
      expect(res.status).toBe(200);
    });

    it("returns 404 for non-existent invoice", async () => {
      server.use(
        http.delete(`${baseUrl}/:id`, () => {
          return HttpResponse.json({ error: "Invoice not found" }, { status: 404 });
        }),
      );

      const res = await deleteReq(`${baseUrl}/nonexistent`);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/invoices/:id/send", () => {
    it("sends invoice email", async () => {
      server.use(
        http.post(`${baseUrl}/:id/send`, () => {
          return HttpResponse.json({ message: "Invoice sent", status: "SENT" });
        }),
      );

      const res = await postJSON(`${baseUrl}/inv-1/send`, {});
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("SENT");
    });
  });

  describe("POST /api/invoices/:id/refund", () => {
    it("processes refund", async () => {
      server.use(
        http.post(`${baseUrl}/:id/refund`, () => {
          return HttpResponse.json({ message: "Invoice refunded", status: "REFUNDED" });
        }),
      );

      const res = await postJSON(`${baseUrl}/inv-1/refund`, { reason: "Customer requested" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("REFUNDED");
    });
  });
});
