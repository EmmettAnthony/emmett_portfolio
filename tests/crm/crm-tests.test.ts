import { describe, it, expect } from "vitest";

interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  notes?: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  source: string;
  score: number;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "CONVERTED" | "LOST";
  notes: string | null;
  createdAt: Date;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";
  probability: number;
  expectedCloseDate: Date;
  leadId: string;
}

function calculateLeadScore(lead: LeadInput): number {
  let score = 0;
  if (lead.name) score += 10;
  if (lead.email) score += 20;
  if (lead.phone) score += 15;
  if (lead.company) score += 15;
  if (lead.source === "REFERRAL") score += 25;
  if (lead.source === "WEBSITE") score += 10;
  if (lead.notes && lead.notes.length > 20) score += 5;
  return score;
}

function getDealStage(probability: number): Deal["stage"] {
  if (probability >= 90) return "CLOSED_WON";
  if (probability >= 75) return "NEGOTIATION";
  if (probability >= 50) return "PROPOSAL";
  if (probability >= 25) return "QUALIFIED";
  return "LEAD";
}

function searchLeads(leads: Lead[], query: string): Lead[] {
  const lower = query.toLowerCase();
  return leads.filter(
    (l) =>
      l.name.toLowerCase().includes(lower) ||
      l.email.toLowerCase().includes(lower) ||
      (l.company && l.company.toLowerCase().includes(lower)),
  );
}

describe("CRM Tests", () => {
  describe("calculateLeadScore", () => {
    it("calculates score based on provided fields", () => {
      const lead: LeadInput = {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        company: "Acme Corp",
        source: "REFERRAL",
      };
      expect(calculateLeadScore(lead)).toBe(85);
    });

    it("awards higher score for referrals", () => {
      const referral = calculateLeadScore({
        name: "Jane", email: "j@example.com", source: "REFERRAL",
      });
      const website = calculateLeadScore({
        name: "Jane", email: "j@example.com", source: "WEBSITE",
      });
      expect(referral).toBeGreaterThan(website);
    });

    it("scores 0 for empty lead", () => {
      expect(calculateLeadScore({ name: "", email: "", source: "" })).toBe(0);
    });
  });

  describe("getDealStage", () => {
    it("returns CLOSED_WON for high probability", () => {
      expect(getDealStage(95)).toBe("CLOSED_WON");
    });

    it("returns NEGOTIATION for 75-89%", () => {
      expect(getDealStage(80)).toBe("NEGOTIATION");
    });

    it("returns PROPOSAL for 50-74%", () => {
      expect(getDealStage(60)).toBe("PROPOSAL");
    });

    it("returns QUALIFIED for 25-49%", () => {
      expect(getDealStage(30)).toBe("QUALIFIED");
    });

    it("returns LEAD for low probability", () => {
      expect(getDealStage(10)).toBe("LEAD");
    });
  });

  describe("searchLeads", () => {
    const leads: Lead[] = [
      { id: "1", name: "Alice Johnson", email: "alice@test.com", phone: null, company: "Tech Corp", source: "WEBSITE", score: 50, status: "NEW", notes: null, createdAt: new Date() },
      { id: "2", name: "Bob Smith", email: "bob@test.com", phone: "123", company: "Data Inc", source: "REFERRAL", score: 70, status: "CONTACTED", notes: null, createdAt: new Date() },
      { id: "3", name: "Charlie Brown", email: "charlie@test.com", phone: null, company: null, source: "WEBSITE", score: 30, status: "NEW", notes: null, createdAt: new Date() },
    ];

    it("finds by name", () => {
      expect(searchLeads(leads, "alice")).toHaveLength(1);
    });

    it("finds by email", () => {
      expect(searchLeads(leads, "bob@test.com")).toHaveLength(1);
    });

    it("finds by company", () => {
      expect(searchLeads(leads, "tech")).toHaveLength(1);
    });

    it("returns empty for no match", () => {
      expect(searchLeads(leads, "zxy")).toHaveLength(0);
    });

    it("is case insensitive", () => {
      expect(searchLeads(leads, "ALICE")).toHaveLength(1);
    });
  });
});
