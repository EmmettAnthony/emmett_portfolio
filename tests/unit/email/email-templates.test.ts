import { describe, it, expect } from "vitest";

interface EmailTemplate {
  subject: string;
  body: string;
  variables: string[];
}

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  currency: string;
}

interface PasswordResetData {
  userName: string;
  resetLink: string;
  expiresIn: string;
}

function buildInvoiceEmail(data: InvoiceData): EmailTemplate {
  return {
    subject: `Invoice ${data.invoiceNumber} from Emmett Portfolio`,
    body: `
      <h1>Hi ${data.customerName},</h1>
      <p>Your invoice ${data.invoiceNumber} for ${data.currency} ${data.amount.toFixed(2)} is attached.</p>
      <p>Due date: ${data.dueDate}</p>
      <p><a href="{{payment_link}}">Pay Now</a></p>
    `.trim(),
    variables: ["customerName", "invoiceNumber", "amount", "dueDate", "payment_link"],
  };
}

function buildPasswordResetEmail(data: PasswordResetData): EmailTemplate {
  return {
    subject: "Reset your Emmett Portfolio password",
    body: `
      <h1>Hi ${data.userName},</h1>
      <p>We received a request to reset your password.</p>
      <p><a href="${data.resetLink}">Reset Password</a></p>
      <p>This link expires in ${data.expiresIn}.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `.trim(),
    variables: ["userName", "resetLink", "expiresIn"],
  };
}

function buildWelcomeEmail(userName: string): EmailTemplate {
  return {
    subject: "Welcome to Emmett Portfolio!",
    body: `
      <h1>Welcome, ${userName}!</h1>
      <p>We're excited to have you on board.</p>
      <p><a href="{{getting_started_link}}">Get Started</a></p>
    `.trim(),
    variables: ["userName", "getting_started_link"],
  };
}

function buildReceiptEmail(
  customerName: string,
  invoiceNumber: string,
  amount: number,
  paymentMethod: string,
): EmailTemplate {
  return {
    subject: `Receipt for ${invoiceNumber}`,
    body: `
      <h1>Receipt</h1>
      <p>Hi ${customerName},</p>
      <p>Thank you for your payment of $${amount.toFixed(2)} via ${paymentMethod}.</p>
      <p>Invoice: ${invoiceNumber}</p>
    `.trim(),
    variables: ["customerName", "invoiceNumber", "amount", "paymentMethod"],
  };
}

function buildBookingConfirmationEmail(
  name: string,
  meetingType: string,
  date: string,
  time: string,
  timezone: string,
): EmailTemplate {
  return {
    subject: `Booking Confirmed: ${meetingType}`,
    body: `
      <h1>Hi ${name},</h1>
      <p>Your ${meetingType} is confirmed.</p>
      <p>Date: ${date} at ${time} ${timezone}</p>
      <p><a href="{{meeting_link}}">Join Meeting</a></p>
    `.trim(),
    variables: ["name", "meetingType", "date", "time", "timezone", "meeting_link"],
  };
}

function validateEmailVariables(template: EmailTemplate, data: Record<string, string>): string[] {
  const missing: string[] = [];
  for (const variable of template.variables) {
    if (!(variable in data)) {
      missing.push(variable);
    }
  }
  return missing;
}

function renderTemplate(template: EmailTemplate, data: Record<string, string>): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    body = body.replace(regex, value);
  }

  return { subject, body };
}

describe("Email Templates", () => {
  describe("buildInvoiceEmail", () => {
    it("generates invoice email with correct subject", () => {
      const email = buildInvoiceEmail({
        invoiceNumber: "INV-001",
        customerName: "John Doe",
        amount: 1500.00,
        dueDate: "2024-06-15",
        currency: "USD",
      });
      expect(email.subject).toContain("INV-001");
    });

    it("includes payment link variable", () => {
      const email = buildInvoiceEmail({
        invoiceNumber: "INV-001",
        customerName: "John Doe",
        amount: 500,
        dueDate: "2024-06-15",
        currency: "USD",
      });
      expect(email.variables).toContain("payment_link");
    });
  });

  describe("buildPasswordResetEmail", () => {
    it("includes reset link in body", () => {
      const email = buildPasswordResetEmail({
        userName: "John",
        resetLink: "https://invoicehub.com/reset?token=abc",
        expiresIn: "1 hour",
      });
      expect(email.body).toContain("https://invoicehub.com/reset?token=abc");
    });

    it("includes expiration info", () => {
      const email = buildPasswordResetEmail({
        userName: "John",
        resetLink: "https://invoicehub.com/reset?token=abc",
        expiresIn: "30 minutes",
      });
      expect(email.body).toContain("30 minutes");
    });
  });

  describe("buildWelcomeEmail", () => {
    it("personalizes welcome email", () => {
      const email = buildWelcomeEmail("Jane");
      expect(email.subject).toBe("Welcome to Emmett Portfolio!");
      expect(email.body).toContain("Jane");
    });

    it("includes getting started link variable", () => {
      const email = buildWelcomeEmail("Jane");
      expect(email.variables).toContain("getting_started_link");
    });
  });

  describe("buildReceiptEmail", () => {
    it("includes payment details", () => {
      const email = buildReceiptEmail("John", "INV-001", 500, "Credit Card");
      expect(email.body).toContain("500.00");
      expect(email.body).toContain("Credit Card");
      expect(email.body).toContain("INV-001");
    });
  });

  describe("buildBookingConfirmationEmail", () => {
    it("includes meeting details", () => {
      const email = buildBookingConfirmationEmail("John", "Consultation", "2024-07-01", "14:00", "EST");
      expect(email.subject).toContain("Consultation");
      expect(email.body).toContain("2024-07-01");
      expect(email.body).toContain("14:00");
      expect(email.body).toContain("EST");
    });
  });

  describe("validateEmailVariables", () => {
    it("returns empty array when all variables provided", () => {
      const template = buildWelcomeEmail("John");
      const missing = validateEmailVariables(template, {
        userName: "John",
        getting_started_link: "https://invoicehub.com/get-started",
      });
      expect(missing).toEqual([]);
    });

    it("returns missing variables", () => {
      const template = buildPasswordResetEmail({
        userName: "John",
        resetLink: "https://example.com",
        expiresIn: "1h",
      });
      const missing = validateEmailVariables(template, { userName: "John" });
      expect(missing).toContain("resetLink");
      expect(missing).toContain("expiresIn");
    });
  });

  describe("renderTemplate", () => {
    it("replaces variables in body", () => {
      const template = buildWelcomeEmail("{{userName}}");
      const rendered = renderTemplate(template, {
        userName: "Alice",
        getting_started_link: "https://invoicehub.com/start",
      });
      expect(rendered.body).toContain("Alice");
      expect(rendered.body).toContain("https://invoicehub.com/start");
      expect(rendered.body).not.toContain("{{userName}}");
    });
  });
});
