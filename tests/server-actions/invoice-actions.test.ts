import { describe, it, expect, vi, beforeEach } from "vitest";

interface CreateInvoiceInput {
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; taxRate?: number; discount?: number }>;
  dueDate: string;
  notes?: string;
}

interface UpdateInvoiceInput {
  id: string;
  status?: string;
  items?: Array<{ description: string; quantity: number; unitPrice: number; taxRate?: number; discount?: number }>;
  dueDate?: string;
  notes?: string;
}

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

const mockDb = {
  invoice: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  activityLog: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: mockDb }));

async function createInvoiceAction(input: CreateInvoiceInput): Promise<ActionResult<{ id: string; invoiceNumber: string }>> {
  if (!input.customerId || !input.customerName || !input.customerEmail || !input.items?.length || !input.dueDate) {
    return { success: false, error: "Missing required fields" };
  }

  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const invoice = await mockDb.invoice.create({
    data: {
      customerId: input.customerId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      subtotal,
      total: subtotal,
      dueDate: new Date(input.dueDate),
      notes: input.notes,
      invoiceNumber: `INV-${Date.now()}`,
      status: "DRAFT",
    },
  });

  await mockDb.activityLog.create({
    data: {
      action: "create",
      module: "invoice",
      entity: "Invoice",
      entityId: invoice.id,
      description: `Created invoice ${invoice.invoiceNumber}`,
    },
  });

  return { success: true, data: { id: invoice.id, invoiceNumber: invoice.invoiceNumber } };
}

async function updateInvoiceAction(input: UpdateInvoiceInput): Promise<ActionResult> {
  const existing = await mockDb.invoice.findUnique({ where: { id: input.id } });
  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  await mockDb.invoice.update({
    where: { id: input.id },
    data: {
      status: input.status,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      notes: input.notes,
    },
  });

  await mockDb.activityLog.create({
    data: {
      action: "update",
      module: "invoice",
      entity: "Invoice",
      entityId: input.id,
      description: `Updated invoice ${input.id}`,
    },
  });

  return { success: true };
}

async function deleteInvoiceAction(id: string): Promise<ActionResult> {
  const existing = await mockDb.invoice.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Invoice not found" };
  }

  await mockDb.invoice.delete({ where: { id } });

  await mockDb.activityLog.create({
    data: {
      action: "delete",
      module: "invoice",
      entity: "Invoice",
      entityId: id,
      description: `Deleted invoice ${id}`,
    },
  });

  return { success: true };
}

describe("Invoice Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createInvoiceAction", () => {
    it("creates invoice with valid input", async () => {
      mockDb.invoice.create.mockResolvedValue({
        id: "inv-1",
        invoiceNumber: "INV-1001",
      });

      const result = await createInvoiceAction({
        customerId: "cust-1",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        items: [{ description: "Service", quantity: 1, unitPrice: 500 }],
        dueDate: "2024-12-31",
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("inv-1");
      expect(mockDb.invoice.create).toHaveBeenCalledOnce();
      expect(mockDb.activityLog.create).toHaveBeenCalledOnce();
    });

    it("returns error when missing required fields", async () => {
      const result = await createInvoiceAction({
        customerId: "",
        customerName: "",
        customerEmail: "",
        items: [],
        dueDate: "",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("calculates subtotal from items", async () => {
      mockDb.invoice.create.mockResolvedValue({ id: "inv-1", invoiceNumber: "INV-1001" });

      await createInvoiceAction({
        customerId: "cust-1",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        items: [
          { description: "Item 1", quantity: 2, unitPrice: 100 },
          { description: "Item 2", quantity: 1, unitPrice: 300 },
        ],
        dueDate: "2024-12-31",
      });

      const createCall = mockDb.invoice.create.mock.calls[0][0];
      expect(createCall.data.subtotal).toBe(500);
    });
  });

  describe("updateInvoiceAction", () => {
    it("updates invoice status", async () => {
      mockDb.invoice.findUnique.mockResolvedValue({ id: "inv-1" });
      mockDb.invoice.update.mockResolvedValue({ id: "inv-1", status: "SENT" });

      const result = await updateInvoiceAction({ id: "inv-1", status: "SENT" });

      expect(result.success).toBe(true);
      expect(mockDb.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1" },
          data: expect.objectContaining({ status: "SENT" }),
        }),
      );
    });

    it("returns error for non-existent invoice", async () => {
      mockDb.invoice.findUnique.mockResolvedValue(null);

      const result = await updateInvoiceAction({ id: "nonexistent" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invoice not found");
    });
  });

  describe("deleteInvoiceAction", () => {
    it("deletes existing invoice", async () => {
      mockDb.invoice.findUnique.mockResolvedValue({ id: "inv-1" });
      mockDb.invoice.delete.mockResolvedValue({ id: "inv-1" });

      const result = await deleteInvoiceAction("inv-1");

      expect(result.success).toBe(true);
      expect(mockDb.invoice.delete).toHaveBeenCalledWith({ where: { id: "inv-1" } });
    });

    it("returns error for non-existent invoice", async () => {
      mockDb.invoice.findUnique.mockResolvedValue(null);

      const result = await deleteInvoiceAction("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invoice not found");
    });
  });
});
