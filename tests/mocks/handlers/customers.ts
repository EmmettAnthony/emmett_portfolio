import { http, HttpResponse } from "msw";

const mockCustomers = new Map<string, Record<string, unknown>>();

export const customerHandlers = [
  http.get("/api/customers", ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    let customers = Array.from(mockCustomers.values());
    if (search) {
      customers = customers.filter(
        (c) =>
          (c.name as string)?.toLowerCase().includes(search) ||
          (c.email as string)?.toLowerCase().includes(search),
      );
    }
    return HttpResponse.json({ data: customers, total: customers.length });
  }),

  http.get("/api/customers/:id", ({ params }) => {
    const customer = mockCustomers.get(params.id as string);
    if (!customer) {
      return HttpResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return HttpResponse.json(customer);
  }),

  http.post("/api/customers", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.name || !body.email) {
      return HttpResponse.json({ error: "Name and email required" }, { status: 400 });
    }
    const id = `cust-${Date.now()}`;
    const customer = { id, ...body, createdAt: new Date().toISOString() };
    mockCustomers.set(id, customer);
    return HttpResponse.json(customer, { status: 201 });
  }),

  http.put("/api/customers/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const existing = mockCustomers.get(params.id as string);
    if (!existing) {
      return HttpResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
    mockCustomers.set(params.id as string, updated);
    return HttpResponse.json(updated);
  }),

  http.delete("/api/customers/:id", ({ params }) => {
    if (!mockCustomers.has(params.id as string)) {
      return HttpResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    mockCustomers.delete(params.id as string);
    return HttpResponse.json({ message: "Customer deleted" });
  }),
];
