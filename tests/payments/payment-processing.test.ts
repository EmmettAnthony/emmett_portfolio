import { describe, it, expect, vi } from "vitest";

type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
type PaymentMethod = "CREDIT_CARD" | "DEBIT_CARD" | "BANK_TRANSFER" | "PAYPAL" | "STRIPE" | "WIRE_TRANSFER";

interface PaymentInput {
  invoiceId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customerEmail: string;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: PaymentStatus;
  error?: string;
  amountCharged?: number;
  processingFee?: number;
}

interface RefundInput {
  transactionId: string;
  amount: number;
  reason: string;
}

function processPayment(input: PaymentInput): PaymentResult {
  if (!input.invoiceId) return { success: false, status: "FAILED", error: "Invoice ID required" };
  if (input.amount <= 0) return { success: false, status: "FAILED", error: "Amount must be positive" };
  if (!input.customerEmail) return { success: false, status: "FAILED", error: "Customer email required" };

  const processingFee = input.amount * 0.029 + 0.30;
  const amountCharged = input.amount + processingFee;

  return {
    success: true,
    transactionId: `txn_${Date.now()}`,
    status: "COMPLETED",
    amountCharged: Math.round(amountCharged * 100) / 100,
    processingFee: Math.round(processingFee * 100) / 100,
  };
}

function processRefund(input: RefundInput): PaymentResult {
  if (!input.transactionId) return { success: false, status: "FAILED", error: "Transaction ID required" };
  if (input.amount <= 0) return { success: false, status: "FAILED", error: "Refund amount must be positive" };

  return {
    success: true,
    transactionId: `ref_${Date.now()}`,
    status: "REFUNDED",
    amountCharged: input.amount,
  };
}

function validatePaymentWebhook(payload: Record<string, unknown>, signature: string): boolean {
  if (!payload || !signature) return false;
  if (!payload.event || !payload.data) return false;
  if (typeof signature !== "string" || signature.length < 10) return false;
  return true;
}

function checkForDuplicatePayment(processedIds: Set<string>, invoiceId: string): boolean {
  if (processedIds.has(invoiceId)) return true;
  processedIds.add(invoiceId);
  return false;
}

function calculatePartialPaymentStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return "PENDING";
  if (paidAmount >= totalAmount) return "COMPLETED";
  return "PARTIALLY_REFUNDED";
}

describe("Payment Processing", () => {
  const validPayment: PaymentInput = {
    invoiceId: "inv-1",
    amount: 500.00,
    currency: "USD",
    method: "STRIPE",
    customerEmail: "customer@example.com",
  };

  describe("processPayment", () => {
    it("processes valid payment", () => {
      const result = processPayment(validPayment);
      expect(result.success).toBe(true);
      expect(result.status).toBe("COMPLETED");
      expect(result.transactionId).toMatch(/^txn_/);
    });

    it("calculates processing fee correctly", () => {
      const result = processPayment(validPayment);
      expect(result.processingFee).toBeCloseTo(14.80, 1);
      expect(result.amountCharged).toBeCloseTo(514.80, 1);
    });

    it("rejects zero amount", () => {
      const result = processPayment({ ...validPayment, amount: 0 });
      expect(result.success).toBe(false);
      expect(result.error).toContain("positive");
    });

    it("rejects missing invoice ID", () => {
      const result = processPayment({ ...validPayment, invoiceId: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing customer email", () => {
      const result = processPayment({ ...validPayment, customerEmail: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("processRefund", () => {
    it("processes valid refund", () => {
      const result = processRefund({ transactionId: "txn_123", amount: 100, reason: "Customer request" });
      expect(result.success).toBe(true);
      expect(result.status).toBe("REFUNDED");
    });

    it("rejects missing transaction ID", () => {
      const result = processRefund({ transactionId: "", amount: 100, reason: "Test" });
      expect(result.success).toBe(false);
    });

    it("rejects negative amount", () => {
      const result = processRefund({ transactionId: "txn_123", amount: -50, reason: "Test" });
      expect(result.success).toBe(false);
    });
  });

  describe("validatePaymentWebhook", () => {
    it("validates legitimate webhook", () => {
      const valid = validatePaymentWebhook(
        { event: "payment.completed", data: { id: "txn_123" } },
        "valid_signature_long_enough",
      );
      expect(valid).toBe(true);
    });

    it("rejects empty payload", () => {
      expect(validatePaymentWebhook({}, "signature")).toBe(false);
    });

    it("rejects short signature", () => {
      expect(validatePaymentWebhook(
        { event: "payment.completed", data: {} },
        "short",
      )).toBe(false);
    });
  });

  describe("checkForDuplicatePayment", () => {
    it("detects duplicate payment", () => {
      const processed = new Set<string>();
      checkForDuplicatePayment(processed, "inv-1");
      expect(checkForDuplicatePayment(processed, "inv-1")).toBe(true);
    });

    it("allows first payment", () => {
      const processed = new Set<string>();
      expect(checkForDuplicatePayment(processed, "inv-1")).toBe(false);
    });
  });

  describe("calculatePartialPaymentStatus", () => {
    it("returns COMPLETED when fully paid", () => {
      expect(calculatePartialPaymentStatus(500, 500)).toBe("COMPLETED");
    });

    it("returns PARTIALLY_REFUNDED when partially paid", () => {
      expect(calculatePartialPaymentStatus(500, 200)).toBe("PARTIALLY_REFUNDED");
    });

    it("returns PENDING when nothing paid", () => {
      expect(calculatePartialPaymentStatus(500, 0)).toBe("PENDING");
    });
  });
});
