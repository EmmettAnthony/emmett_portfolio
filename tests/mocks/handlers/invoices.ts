import { http, HttpResponse } from "msw";

const mockInvoices = new Map<string, Record<string, unknown>>();

export const invoiceHandlers = [
  http.get("/api/invoices", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") ?? "10");
    const invoices = Array.from(mockInvoices.values());
    const paginated = invoices.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({
      data: paginated,
      total: invoices.length,
      page,
      pageSize,
      totalPages: Math.ceil(invoices.length / pageSize),
    });
  }),

  http.get("/api/invoices/:id", ({ params }) => {
    const invoice = mockInvoices.get(params.id as string);
    if (!invoice) {
      return HttpResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return HttpResponse.json(invoice);
  }),

  http.post("/api/invoices", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.customerId || !body.items) {
      return HttpResponse.json({ error: "Customer ID and items required" }, { status: 400 });
    }
    const id = `inv-${Date.now()}`;
    const invoice = { id, ...body, invoiceNumber: `INV-${1000 + mockInvoices.size + 1}`, createdAt: new Date().toISOString() };
    mockInvoices.set(id, invoice);
    return HttpResponse.json(invoice, { status: 201 });
  }),

  http.put("/api/invoices/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const existing = mockInvoices.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    mockInvoices.set(params.id as string, updated);
    return HttpResponse.json(updated);
  }),

  http.delete("/api/invoices/:id", ({ params }) => {
    if (!mockInvoices.has(params.id as string)) {
      return HttpResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    mockInvoices.delete(params.id as string);
    return HttpResponse.json({ message: "Invoice deleted" });
  }),

  http.post("/api/invoices/:id/send", ({ params }) => {
    const invoice = mockInvoices.get(params.id as string);
    if (!invoice) {
      return HttpResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return HttpResponse.json({ message: "Invoice sent", status: "SENT" });
  }),

  http.post("/api/invoices/:id/refund", ({ params }) => {
    const invoice = mockInvoices.get(params.id as string);
    if (!invoice) {
      return HttpResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return HttpResponse.json({ message: "Invoice refunded", status: "REFUNDED" });
  }),
];
