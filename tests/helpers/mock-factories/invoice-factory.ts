import { faker } from "@faker-js/faker";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED" | "PARTIALLY_PAID";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  total: number;
}

export interface MockInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string | null;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  dueDate: Date;
  issuedDate: Date;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function buildMockLineItem(overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem {
  const quantity = overrides.quantity ?? faker.number.int({ min: 1, max: 10 });
  const unitPrice = overrides.unitPrice ?? faker.number.float({ min: 10, max: 500, fractionDigits: 2 });
  const discount = overrides.discount ?? 0;
  const taxRate = overrides.taxRate ?? 0;
  const subtotal = quantity * unitPrice;
  const discountAmount = subtotal * (discount / 100);
  const taxableAmount = subtotal - discountAmount;
  const total = taxableAmount + taxableAmount * (taxRate / 100);

  return {
    description: faker.commerce.productName(),
    quantity,
    unitPrice,
    taxRate,
    discount,
    total: Math.round(total * 100) / 100,
    ...overrides,
  };
}

export function buildMockInvoice(overrides: Partial<MockInvoice> = {}): MockInvoice {
  const items = overrides.items ?? [buildMockLineItem()];
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (item.discount / 100),
    0,
  );
  const taxTotal = items.reduce(
    (sum, item) => {
      const afterDiscount = item.quantity * item.unitPrice * (1 - item.discount / 100);
      return sum + afterDiscount * (item.taxRate / 100);
    },
    0,
  );
  const total = subtotal - discountTotal + taxTotal;
  const amountPaid = overrides.amountPaid ?? 0;
  const status: InvoiceStatus = overrides.status ?? (amountPaid >= total ? "PAID" : amountPaid > 0 ? "PARTIALLY_PAID" : "DRAFT");

  return {
    id: faker.string.uuid(),
    invoiceNumber: `INV-${faker.number.int({ min: 1000, max: 9999 })}`,
    customerId: faker.string.uuid(),
    customerName: faker.person.fullName(),
    customerEmail: faker.internet.email(),
    customerCompany: faker.company.name(),
    status,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
    amountPaid: Math.round(amountPaid * 100) / 100,
    balanceDue: Math.round((total - amountPaid) * 100) / 100,
    currency: "USD",
    dueDate: faker.date.future(),
    issuedDate: faker.date.past(),
    paidAt: status === "PAID" ? new Date() : null,
    notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
    createdAt: faker.date.past(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildPaidInvoice(overrides: Partial<MockInvoice> = {}): MockInvoice {
  const base = buildMockInvoice(overrides);
  return { ...base, status: "PAID", amountPaid: base.total, balanceDue: 0, paidAt: new Date() };
}

export function buildOverdueInvoice(overrides: Partial<MockInvoice> = {}): MockInvoice {
  return buildMockInvoice({
    status: "OVERDUE",
    dueDate: faker.date.past(),
    ...overrides,
  });
}

export function buildInvoiceList(count: number, overrides?: Partial<MockInvoice>): MockInvoice[] {
  return Array.from({ length: count }, () => buildMockInvoice(overrides));
}
