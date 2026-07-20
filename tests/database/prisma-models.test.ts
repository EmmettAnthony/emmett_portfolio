import { describe, it, expect, vi, beforeEach } from "vitest";

interface ModelField {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  isId?: boolean;
  relations?: { model: string; field: string }[];
}

interface ModelSchema {
  name: string;
  tableName: string;
  fields: ModelField[];
  indexes: string[];
  enums?: string[];
}

function validateModelSchema(model: ModelSchema): string[] {
  const errors: string[] = [];

  if (!model.name) errors.push("Model must have a name");
  if (!model.tableName) errors.push("Model must have a table name");
  if (!model.fields.length) errors.push("Model must have at least one field");

  const hasId = model.fields.some((f) => f.isId);
  if (!hasId) errors.push("Model must have an @id field");

  for (const field of model.fields) {
    if (field.unique && field.required === false) {
      errors.push(`Unique field ${field.name} should be required`);
    }
    if (field.required && field.type === "String" && field.name !== "id") {
    }
  }

  return errors;
}

function getCascadingRelations(model: ModelSchema): { field: string; target: string }[] {
  return model.fields
    .filter((f) => f.relations?.length)
    .map((f) => ({
      field: f.name,
      target: f.relations![0].model,
    }));
}

describe("Prisma Model Validation", () => {
  describe("Invoice Model", () => {
    const invoiceModel: ModelSchema = {
      name: "Invoice",
      tableName: "invoices",
      fields: [
        { name: "id", type: "String", required: true, isId: true },
        { name: "invoiceNumber", type: "String", required: true, unique: true },
        { name: "customerId", type: "String", required: true },
        { name: "customerName", type: "String", required: true },
        { name: "customerEmail", type: "String", required: true },
        { name: "subtotal", type: "Float", required: true },
        { name: "taxTotal", type: "Float", required: false },
        { name: "discountTotal", type: "Float", required: false },
        { name: "total", type: "Float", required: true },
        { name: "amountPaid", type: "Float", required: false },
        { name: "balanceDue", type: "Float", required: false },
        { name: "currency", type: "String", required: false },
        { name: "status", type: "String", required: false },
        { name: "dueDate", type: "DateTime", required: true },
        { name: "issuedDate", type: "DateTime", required: false },
        { name: "paidAt", type: "DateTime", required: false },
        { name: "notes", type: "String", required: false },
        { name: "createdAt", type: "DateTime", required: true },
        { name: "updatedAt", type: "DateTime", required: true },
      ],
      indexes: ["customerId", "status", "dueDate", "createdAt"],
    };

    it("has valid schema", () => {
      const errors = validateModelSchema(invoiceModel);
      expect(errors).toHaveLength(0);
    });

    it("has required core fields", () => {
      const requiredFields = ["id", "invoiceNumber", "customerId", "customerName", "subtotal", "total", "dueDate"];
      for (const field of requiredFields) {
        expect(invoiceModel.fields.find((f) => f.name === field)?.required).toBe(true);
      }
    });

    it("has unique invoice number", () => {
      const invNumField = invoiceModel.fields.find((f) => f.name === "invoiceNumber");
      expect(invNumField?.unique).toBe(true);
    });

    it("has timestamps", () => {
      expect(invoiceModel.fields.find((f) => f.name === "createdAt")).toBeDefined();
      expect(invoiceModel.fields.find((f) => f.name === "updatedAt")).toBeDefined();
    });
  });

  describe("Customer Model", () => {
    const customerModel: ModelSchema = {
      name: "Customer",
      tableName: "customers",
      fields: [
        { name: "id", type: "String", required: true, isId: true },
        { name: "name", type: "String", required: true },
        { name: "email", type: "String", required: true, unique: true },
        { name: "phone", type: "String", required: false },
        { name: "company", type: "String", required: false },
        { name: "status", type: "String", required: false },
        { name: "notes", type: "String", required: false },
        { name: "createdAt", type: "DateTime", required: true },
        { name: "updatedAt", type: "DateTime", required: true },
      ],
      indexes: ["email", "status"],
    };

    it("has valid schema", () => {
      const errors = validateModelSchema(customerModel);
      expect(errors).toHaveLength(0);
    });

    it("has unique email", () => {
      const emailField = customerModel.fields.find((f) => f.name === "email");
      expect(emailField?.unique).toBe(true);
    });

    it("has status field", () => {
      expect(customerModel.fields.find((f) => f.name === "status")).toBeDefined();
    });
  });

  describe("Payment Model", () => {
    const paymentModel: ModelSchema = {
      name: "Payment",
      tableName: "payments",
      fields: [
        { name: "id", type: "String", required: true, isId: true },
        { name: "invoiceId", type: "String", required: true },
        { name: "amount", type: "Float", required: true },
        { name: "currency", type: "String", required: true },
        { name: "method", type: "String", required: true },
        { name: "status", type: "String", required: true },
        { name: "transactionId", type: "String", required: false },
        { name: "refundId", type: "String", required: false },
        { name: "paidAt", type: "DateTime", required: true },
        { name: "createdAt", type: "DateTime", required: true },
        { name: "updatedAt", type: "DateTime", required: true },
      ],
      indexes: ["invoiceId", "transactionId", "status"],
    };

    it("has valid schema", () => {
      const errors = validateModelSchema(paymentModel);
      expect(errors).toHaveLength(0);
    });

    it("tracks payment status", () => {
      expect(paymentModel.fields.find((f) => f.name === "status")?.required).toBe(true);
    });
  });

  describe("Model Schema Validation", () => {
    it("rejects model without id", () => {
      const invalid: ModelSchema = {
        name: "Bad",
        tableName: "bad",
        fields: [{ name: "data", type: "String", required: true }],
        indexes: [],
      };
      expect(validateModelSchema(invalid)).toContain("Model must have an @id field");
    });

    it("rejects model without fields", () => {
      const invalid: ModelSchema = {
        name: "Empty",
        tableName: "empty",
        fields: [],
        indexes: [],
      };
      const errors = validateModelSchema(invalid);
      expect(errors.some((e) => e.includes("at least one field"))).toBe(true);
    });
  });
});
