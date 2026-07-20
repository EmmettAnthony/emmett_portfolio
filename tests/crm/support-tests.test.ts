import { describe, it, expect } from "vitest";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TicketInput {
  subject: string;
  message: string;
  priority?: TicketPriority;
  category?: string;
  customerEmail: string;
  customerName: string;
  attachmentUrls?: string[];
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  customerEmail: string;
  customerName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReplyInput {
  ticketId: string;
  message: string;
  authorId: string;
  isInternal?: boolean;
}

function calculatePriority(subject: string, message: string): TicketPriority {
  const urgentKeywords = ["urgent", "critical", "emergency", "down", "outage", "security", "breach"];
  const highKeywords = ["error", "broken", "not working", "failed", "bug", "crash"];

  const combined = `${subject} ${message}`.toLowerCase();

  if (urgentKeywords.some((k) => combined.includes(k))) return "URGENT";
  if (highKeywords.some((k) => combined.includes(k))) return "HIGH";
  return "MEDIUM";
}

function generateTicketNumber(): string {
  return `SUP-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

function autoAssignTicket(ticket: Ticket, availableAgents: string[]): string | null {
  if (ticket.priority === "URGENT") {
    return availableAgents[0] ?? null;
  }
  return null;
}

function calculateSLA(ticket: Ticket): { responseBy: Date; resolutionBy: Date } {
  const now = new Date();
  const slaMinutes: Record<TicketPriority, { response: number; resolution: number }> = {
    URGENT: { response: 30, resolution: 240 },
    HIGH: { response: 120, resolution: 480 },
    MEDIUM: { response: 480, resolution: 2880 },
    LOW: { response: 1440, resolution: 10080 },
  };

  const sla = slaMinutes[ticket.priority];
  return {
    responseBy: new Date(now.getTime() + sla.response * 60000),
    resolutionBy: new Date(now.getTime() + sla.resolution * 60000),
  };
}

const AUTO_REPLIES: Record<string, string> = {
  password: "If you need help resetting your password, please visit the login page and click 'Forgot Password'.",
  invoice: "For billing or invoice inquiries, please check your account dashboard or contact billing@invoicehub.com.",
  login: "If you are having trouble logging in, try clearing your browser cache or resetting your password.",
};

function generateAutoReply(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [keyword, reply] of Object.entries(AUTO_REPLIES)) {
    if (lower.includes(keyword)) return reply;
  }
  return null;
}

describe("Support Tests", () => {
  describe("calculatePriority", () => {
    it("detects urgent priority", () => {
      expect(calculatePriority("System is down!", "Critical outage affecting all users")).toBe("URGENT");
    });

    it("detects high priority", () => {
      expect(calculatePriority("Login error", "I get an error when trying to log in")).toBe("HIGH");
    });

    it("defaults to MEDIUM", () => {
      expect(calculatePriority("Question", "How do I update my profile?")).toBe("MEDIUM");
    });
  });

  describe("generateTicketNumber", () => {
    it("generates valid ticket number format", () => {
      const num = generateTicketNumber();
      expect(num).toMatch(/^SUP-\d{4}$/);
    });
  });

  describe("autoAssignTicket", () => {
    it("assigns urgent tickets to first available agent", () => {
      const ticket: Ticket = {
        id: "1", ticketNumber: "SUP-0001", subject: "Urgent", status: "OPEN", priority: "URGENT",
        category: null, customerEmail: "a@b.com", customerName: "A", createdAt: new Date(), updatedAt: new Date(),
      };
      expect(autoAssignTicket(ticket, ["agent-1", "agent-2"])).toBe("agent-1");
    });

    it("returns null for non-urgent tickets", () => {
      const ticket: Ticket = {
        id: "2", ticketNumber: "SUP-0002", subject: "Question", status: "OPEN", priority: "LOW",
        category: null, customerEmail: "a@b.com", customerName: "A", createdAt: new Date(), updatedAt: new Date(),
      };
      expect(autoAssignTicket(ticket, ["agent-1"])).toBeNull();
    });
  });

  describe("calculateSLA", () => {
    it("calculates urgent SLA (30m response, 4h resolution)", () => {
      const ticket: Ticket = {
        id: "1", ticketNumber: "SUP-0001", subject: "Urgent", status: "OPEN", priority: "URGENT",
        category: null, customerEmail: "a@b.com", customerName: "A", createdAt: new Date(), updatedAt: new Date(),
      };
      const sla = calculateSLA(ticket);
      expect(sla.responseBy.getTime() - Date.now()).toBeLessThan(31 * 60000);
      expect(sla.resolutionBy.getTime() - Date.now()).toBeLessThan(241 * 60000);
    });

    it("calculates low priority SLA (24h response, 7d resolution)", () => {
      const ticket: Ticket = {
        id: "2", ticketNumber: "SUP-0002", subject: "Question", status: "OPEN", priority: "LOW",
        category: null, customerEmail: "a@b.com", customerName: "A", createdAt: new Date(), updatedAt: new Date(),
      };
      const sla = calculateSLA(ticket);
      expect(sla.responseBy.getTime() - Date.now()).toBeGreaterThan(1435 * 60000);
    });
  });

  describe("generateAutoReply", () => {
    it("returns password reset help for password-related queries", () => {
      const reply = generateAutoReply("I forgot my password and cannot login");
      expect(reply).toContain("Forgot Password");
    });

    it("returns billing help for invoice queries", () => {
      const reply = generateAutoReply("I have a question about my invoice");
      expect(reply).toContain("billing@invoicehub.com");
    });

    it("returns null for unknown topics", () => {
      expect(generateAutoReply("What is your return policy?")).toBeNull();
    });
  });
});
