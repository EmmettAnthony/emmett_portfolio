import { describe, it, expect } from "vitest";
import {
  CrmLeadStatus,
  CrmDealStage,
  CrmActivityType,
  CrmTaskPriority,
  CrmTaskStatus,
  CrmProposalStatus,
  CrmContractStatus,
  CrmInvoiceStatus,
  CrmCommunicationType,
  CrmCommunicationDirection,
  CrmAutomationTrigger,
  CrmAutomationAction,
  crmLeadCreateSchema,
  crmLeadUpdateSchema,
  crmClientCreateSchema,
  crmClientUpdateSchema,
  crmCompanyCreateSchema,
  crmCompanyUpdateSchema,
  crmDealCreateSchema,
  crmDealUpdateSchema,
  crmActivityCreateSchema,
  crmActivityUpdateSchema,
  crmTaskCreateSchema,
  crmTaskUpdateSchema,
  crmProposalCreateSchema,
  crmProposalUpdateSchema,
  crmContractCreateSchema,
  crmContractUpdateSchema,
  crmInvoiceCreateSchema,
  crmInvoiceUpdateSchema,
  crmCommunicationCreateSchema,
  crmCommunicationUpdateSchema,
  crmAutomationCreateSchema,
  crmAutomationUpdateSchema,
} from "../validations/crm";

describe("CRM Constants", () => {
  it("CrmLeadStatus has correct values", () => {
    expect(CrmLeadStatus).toEqual({
      NEW: "NEW",
      CONTACTED: "CONTACTED",
      QUALIFIED: "QUALIFIED",
      PROPOSAL_SENT: "PROPOSAL_SENT",
      NEGOTIATION: "NEGOTIATION",
      WON: "WON",
      LOST: "LOST",
    });
  });

  it("CrmDealStage has correct values", () => {
    expect(CrmDealStage).toEqual({
      NEW_LEAD: "NEW_LEAD",
      DISCOVERY: "DISCOVERY",
      QUALIFIED: "QUALIFIED",
      PROPOSAL_SENT: "PROPOSAL_SENT",
      NEGOTIATION: "NEGOTIATION",
      WON: "WON",
      LOST: "LOST",
    });
  });

  it("CrmActivityType has correct values", () => {
    expect(CrmActivityType).toEqual({
      CALL: "CALL",
      EMAIL: "EMAIL",
      MEETING: "MEETING",
      NOTE: "NOTE",
      TASK: "TASK",
      FOLLOW_UP: "FOLLOW_UP",
    });
  });

  it("CrmTaskPriority has correct values", () => {
    expect(CrmTaskPriority).toEqual({
      LOW: "LOW",
      MEDIUM: "MEDIUM",
      HIGH: "HIGH",
      URGENT: "URGENT",
    });
  });

  it("CrmTaskStatus has correct values", () => {
    expect(CrmTaskStatus).toEqual({
      PENDING: "PENDING",
      IN_PROGRESS: "IN_PROGRESS",
      COMPLETED: "COMPLETED",
      CANCELLED: "CANCELLED",
    });
  });

  it("CrmProposalStatus has correct values", () => {
    expect(CrmProposalStatus).toEqual({
      DRAFT: "DRAFT",
      SENT: "SENT",
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
    });
  });

  it("CrmContractStatus has correct values", () => {
    expect(CrmContractStatus).toEqual({
      DRAFT: "DRAFT",
      ACTIVE: "ACTIVE",
      EXPIRED: "EXPIRED",
      TERMINATED: "TERMINATED",
    });
  });

  it("CrmInvoiceStatus has correct values", () => {
    expect(CrmInvoiceStatus).toEqual({
      DRAFT: "DRAFT",
      SENT: "SENT",
      PAID: "PAID",
      OVERDUE: "OVERDUE",
      CANCELLED: "CANCELLED",
    });
  });

  it("CrmCommunicationType has correct values", () => {
    expect(CrmCommunicationType).toEqual({
      EMAIL: "EMAIL",
      NOTE: "NOTE",
      MEETING: "MEETING",
      WHATSAPP: "WHATSAPP",
      INTERNAL: "INTERNAL",
    });
  });

  it("CrmCommunicationDirection has correct values", () => {
    expect(CrmCommunicationDirection).toEqual({
      INBOUND: "INBOUND",
      OUTBOUND: "OUTBOUND",
      INTERNAL: "INTERNAL",
    });
  });

  it("CrmAutomationTrigger has correct values", () => {
    expect(CrmAutomationTrigger).toEqual({
      NEW_LEAD: "NEW_LEAD",
      PROPOSAL_SENT: "PROPOSAL_SENT",
      DEAL_WON: "DEAL_WON",
    });
  });

  it("CrmAutomationAction has correct values", () => {
    expect(CrmAutomationAction).toEqual({
      SEND_EMAIL: "SEND_EMAIL",
      CREATE_TASK: "CREATE_TASK",
      CONVERT_LEAD: "CONVERT_LEAD",
      CREATE_PROJECT: "CREATE_PROJECT",
    });
  });
});

describe("crmLeadCreateSchema", () => {
  it("parses valid lead", () => {
    const result = crmLeadCreateSchema.parse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      source: "website",
    });
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.source).toBe("website");
    expect(result.status).toBe("NEW");
    expect(result.leadScore).toBe(0);
    expect(result.tags).toEqual([]);
  });

  it("rejects missing firstName", () => {
    const result = crmLeadCreateSchema.safeParse({
      lastName: "Doe",
      email: "john@example.com",
      source: "web",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = crmLeadCreateSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "bad",
      source: "web",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing source", () => {
    const result = crmLeadCreateSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects leadScore above 100", () => {
    const result = crmLeadCreateSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      source: "web",
      leadScore: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = crmLeadCreateSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      source: "web",
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = crmLeadCreateSchema.parse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      company: "Acme",
      position: "CEO",
      country: "US",
      website: "https://acme.com",
      source: "website",
      tags: ["enterprise"],
      leadScore: 50,
      status: "QUALIFIED",
      notes: "Some notes",
      assignedTo: "user_1",
    });
    expect(result.phone).toBe("+1234567890");
    expect(result.company).toBe("Acme");
    expect(result.website).toBe("https://acme.com");
    expect(result.tags).toEqual(["enterprise"]);
    expect(result.leadScore).toBe(50);
    expect(result.status).toBe("QUALIFIED");
    expect(result.assignedTo).toBe("user_1");
  });

  it("accepts empty string for website", () => {
    const result = crmLeadCreateSchema.parse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      source: "web",
      website: "",
    });
    expect(result.website).toBe("");
  });

  it("rejects invalid URL for website", () => {
    const result = crmLeadCreateSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      source: "web",
      website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("crmLeadUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmLeadUpdateSchema.parse({});
    expect(result).toEqual({
      leadScore: 0,
      status: "NEW",
      tags: [],
    });
  });
});

describe("crmClientCreateSchema", () => {
  it("parses valid client", () => {
    const result = crmClientCreateSchema.parse({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    });
    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Doe");
    expect(result.email).toBe("jane@example.com");
    expect(result.healthScore).toBe(50);
  });

  it("rejects missing firstName", () => {
    const result = crmClientCreateSchema.safeParse({
      lastName: "Doe",
      email: "jane@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = crmClientCreateSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      email: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("rejects healthScore above 100", () => {
    const result = crmClientCreateSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      healthScore: 101,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = crmClientCreateSchema.parse({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "+1234567890",
      position: "CTO",
      companyId: "comp_1",
      industry: "Tech",
      website: "https://example.com",
      healthScore: 80,
      notes: "VIP client",
    });
    expect(result.position).toBe("CTO");
    expect(result.industry).toBe("Tech");
    expect(result.healthScore).toBe(80);
  });
});

describe("crmClientUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmClientUpdateSchema.parse({});
    expect(result).toEqual({
      healthScore: 50,
    });
  });
});

describe("crmCompanyCreateSchema", () => {
  it("parses valid company", () => {
    const result = crmCompanyCreateSchema.parse({
      name: "Acme Corp",
    });
    expect(result.name).toBe("Acme Corp");
  });

  it("rejects empty name", () => {
    const result = crmCompanyCreateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects companySize below 1", () => {
    const result = crmCompanyCreateSchema.safeParse({
      name: "Acme",
      companySize: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative annualRevenue", () => {
    const result = crmCompanyCreateSchema.safeParse({
      name: "Acme",
      annualRevenue: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = crmCompanyCreateSchema.parse({
      name: "Acme Corp",
      industry: "Technology",
      website: "https://acme.com",
      address: "123 Main St",
      companySize: 100,
      annualRevenue: 1000000,
      notes: "Growing company",
    });
    expect(result.industry).toBe("Technology");
    expect(result.website).toBe("https://acme.com");
    expect(result.companySize).toBe(100);
    expect(result.annualRevenue).toBe(1000000);
  });
});

describe("crmCompanyUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmCompanyUpdateSchema.parse({});
    expect(result).toEqual({});
  });
});

describe("crmDealCreateSchema", () => {
  it("parses valid deal", () => {
    const result = crmDealCreateSchema.parse({
      name: "Big Deal",
      value: 50000,
    });
    expect(result.name).toBe("Big Deal");
    expect(result.value).toBe(50000);
    expect(result.probability).toBe(0);
    expect(result.stage).toBe("NEW_LEAD");
  });

  it("rejects empty name", () => {
    const result = crmDealCreateSchema.safeParse({ value: 50000 });
    expect(result.success).toBe(false);
  });

  it("rejects negative value", () => {
    const result = crmDealCreateSchema.safeParse({
      name: "Deal",
      value: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects probability above 100", () => {
    const result = crmDealCreateSchema.safeParse({
      name: "Deal",
      value: 1000,
      probability: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid stage", () => {
    const result = crmDealCreateSchema.safeParse({
      name: "Deal",
      value: 1000,
      stage: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = crmDealCreateSchema.parse({
      name: "Deal",
      value: 10000,
      probability: 50,
      expectedCloseDate: "2024-12-31",
      stage: "NEGOTIATION",
      lostReason: "Price too high",
      notes: "Follow up needed",
      leadId: "lead_1",
      clientId: "client_1",
      companyId: "comp_1",
    });
    expect(result.probability).toBe(50);
    expect(result.stage).toBe("NEGOTIATION");
    expect(result.leadId).toBe("lead_1");
    expect(result.clientId).toBe("client_1");
  });
});

describe("crmDealUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmDealUpdateSchema.parse({});
    expect(result).toEqual({
      probability: 0,
      stage: "NEW_LEAD",
    });
  });
});

describe("crmActivityCreateSchema", () => {
  it("parses valid activity", () => {
    const result = crmActivityCreateSchema.parse({
      type: "CALL",
      subject: "Discovery call",
      date: "2024-01-15",
    });
    expect(result.type).toBe("CALL");
    expect(result.subject).toBe("Discovery call");
    expect(result.date).toBe("2024-01-15");
    expect(result.completed).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = crmActivityCreateSchema.safeParse({
      type: "INVALID",
      subject: "Call",
      date: "2024-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = crmActivityCreateSchema.safeParse({
      type: "CALL",
      subject: "",
      date: "2024-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty date", () => {
    const result = crmActivityCreateSchema.safeParse({
      type: "CALL",
      subject: "Call",
      date: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative duration", () => {
    const result = crmActivityCreateSchema.safeParse({
      type: "CALL",
      subject: "Call",
      date: "2024-01-15",
      duration: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = crmActivityCreateSchema.parse({
      type: "EMAIL",
      subject: "Follow up",
      description: "Sent proposal",
      date: "2024-01-15",
      duration: 30,
      completed: true,
      leadId: "lead_1",
      clientId: "client_1",
      dealId: "deal_1",
      assignedTo: "user_1",
    });
    expect(result.type).toBe("EMAIL");
    expect(result.duration).toBe(30);
    expect(result.completed).toBe(true);
    expect(result.leadId).toBe("lead_1");
    expect(result.assignedTo).toBe("user_1");
  });
});

describe("crmActivityUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmActivityUpdateSchema.parse({});
    expect(result).toEqual({
      completed: false,
    });
  });
});

describe("crmTaskCreateSchema", () => {
  it("parses valid task", () => {
    const result = crmTaskCreateSchema.parse({
      title: "Send proposal",
    });
    expect(result.title).toBe("Send proposal");
    expect(result.priority).toBe("MEDIUM");
    expect(result.status).toBe("PENDING");
  });

  it("rejects empty title", () => {
    const result = crmTaskCreateSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = crmTaskCreateSchema.safeParse({
      title: "Task",
      priority: "TOP",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = crmTaskCreateSchema.safeParse({
      title: "Task",
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = crmTaskCreateSchema.parse({
      title: "Task",
      description: "Description",
      dueDate: "2024-01-20",
      priority: "HIGH",
      status: "IN_PROGRESS",
      leadId: "lead_1",
      clientId: "client_1",
      dealId: "deal_1",
      assignedTo: "user_1",
    });
    expect(result.title).toBe("Task");
    expect(result.description).toBe("Description");
    expect(result.priority).toBe("HIGH");
    expect(result.status).toBe("IN_PROGRESS");
  });
});

describe("crmTaskUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmTaskUpdateSchema.parse({});
    expect(result).toEqual({
      priority: "MEDIUM",
      status: "PENDING",
    });
  });
});

describe("crmProposalCreateSchema", () => {
  it("parses valid proposal", () => {
    const result = crmProposalCreateSchema.parse({
      title: "Web Dev Proposal",
      clientId: "client_1",
      total: 5000,
    });
    expect(result.title).toBe("Web Dev Proposal");
    expect(result.clientId).toBe("client_1");
    expect(result.total).toBe(5000);
    expect(result.services).toEqual([]);
    expect(result.pricing).toEqual({});
    expect(result.status).toBe("DRAFT");
  });

  it("rejects empty title", () => {
    const result = crmProposalCreateSchema.safeParse({
      title: "",
      clientId: "client_1",
      total: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty clientId", () => {
    const result = crmProposalCreateSchema.safeParse({
      title: "Proposal",
      clientId: "",
      total: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative total", () => {
    const result = crmProposalCreateSchema.safeParse({
      title: "Proposal",
      clientId: "client_1",
      total: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = crmProposalCreateSchema.safeParse({
      title: "Proposal",
      clientId: "client_1",
      total: 1000,
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("crmProposalUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmProposalUpdateSchema.parse({});
    expect(result).toEqual({
      pricing: {},
      services: [],
      status: "DRAFT",
    });
  });
});

describe("crmContractCreateSchema", () => {
  it("parses valid contract", () => {
    const result = crmContractCreateSchema.parse({
      contractName: "Maintenance Contract",
      clientId: "client_1",
      startDate: "2024-01-01",
      value: 10000,
    });
    expect(result.contractName).toBe("Maintenance Contract");
    expect(result.clientId).toBe("client_1");
    expect(result.startDate).toBe("2024-01-01");
    expect(result.value).toBe(10000);
    expect(result.status).toBe("DRAFT");
  });

  it("rejects empty contractName", () => {
    const result = crmContractCreateSchema.safeParse({
      contractName: "",
      clientId: "client_1",
      startDate: "2024-01-01",
      value: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty clientId", () => {
    const result = crmContractCreateSchema.safeParse({
      contractName: "Contract",
      clientId: "",
      startDate: "2024-01-01",
      value: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative value", () => {
    const result = crmContractCreateSchema.safeParse({
      contractName: "Contract",
      clientId: "client_1",
      startDate: "2024-01-01",
      value: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("crmContractUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmContractUpdateSchema.parse({});
    expect(result).toEqual({
      status: "DRAFT",
    });
  });
});

describe("crmInvoiceCreateSchema", () => {
  it("parses valid invoice", () => {
    const result = crmInvoiceCreateSchema.parse({
      clientId: "client_1",
      amount: 5000,
      dueDate: "2024-02-01",
    });
    expect(result.clientId).toBe("client_1");
    expect(result.amount).toBe(5000);
    expect(result.dueDate).toBe("2024-02-01");
    expect(result.status).toBe("DRAFT");
    expect(result.lineItems).toEqual([]);
  });

  it("rejects empty clientId", () => {
    const result = crmInvoiceCreateSchema.safeParse({
      clientId: "",
      amount: 1000,
      dueDate: "2024-02-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = crmInvoiceCreateSchema.safeParse({
      clientId: "client_1",
      amount: -1,
      dueDate: "2024-02-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty dueDate", () => {
    const result = crmInvoiceCreateSchema.safeParse({
      clientId: "client_1",
      amount: 1000,
      dueDate: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = crmInvoiceCreateSchema.safeParse({
      clientId: "client_1",
      amount: 1000,
      dueDate: "2024-02-01",
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("accepts line items", () => {
    const result = crmInvoiceCreateSchema.parse({
      clientId: "client_1",
      amount: 6000,
      dueDate: "2024-02-01",
      lineItems: [
        { description: "Web Dev", quantity: 1, rate: 5000, amount: 5000 },
        { description: "Hosting", quantity: 1, rate: 1000, amount: 1000 },
      ],
    });
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0].description).toBe("Web Dev");
  });

  it("rejects line item with empty description", () => {
    const result = crmInvoiceCreateSchema.safeParse({
      clientId: "client_1",
      amount: 1000,
      dueDate: "2024-02-01",
      lineItems: [{ description: "", quantity: 1, rate: 100, amount: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects line item with negative quantity", () => {
    const result = crmInvoiceCreateSchema.safeParse({
      clientId: "client_1",
      amount: 1000,
      dueDate: "2024-02-01",
      lineItems: [{ description: "Item", quantity: -1, rate: 100, amount: 100 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("crmInvoiceUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmInvoiceUpdateSchema.parse({});
    expect(result).toEqual({
      lineItems: [],
      status: "DRAFT",
    });
  });
});

describe("crmCommunicationCreateSchema", () => {
  it("parses valid communication", () => {
    const result = crmCommunicationCreateSchema.parse({
      type: "EMAIL",
      subject: "Hello",
      direction: "OUTBOUND",
      date: "2024-01-15",
    });
    expect(result.type).toBe("EMAIL");
    expect(result.subject).toBe("Hello");
    expect(result.direction).toBe("OUTBOUND");
    expect(result.date).toBe("2024-01-15");
  });

  it("rejects invalid type", () => {
    const result = crmCommunicationCreateSchema.safeParse({
      type: "INVALID",
      subject: "Test",
      direction: "OUTBOUND",
      date: "2024-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = crmCommunicationCreateSchema.safeParse({
      type: "EMAIL",
      subject: "",
      direction: "OUTBOUND",
      date: "2024-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid direction", () => {
    const result = crmCommunicationCreateSchema.safeParse({
      type: "EMAIL",
      subject: "Test",
      direction: "INVALID",
      date: "2024-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty date", () => {
    const result = crmCommunicationCreateSchema.safeParse({
      type: "EMAIL",
      subject: "Test",
      direction: "OUTBOUND",
      date: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("crmCommunicationUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmCommunicationUpdateSchema.parse({});
    expect(result).toEqual({});
  });
});

describe("crmAutomationCreateSchema", () => {
  it("parses valid automation", () => {
    const result = crmAutomationCreateSchema.parse({
      trigger: "NEW_LEAD",
      action: "SEND_EMAIL",
    });
    expect(result.trigger).toBe("NEW_LEAD");
    expect(result.action).toBe("SEND_EMAIL");
    expect(result.config).toEqual({});
    expect(result.enabled).toBe(true);
  });

  it("rejects invalid trigger", () => {
    const result = crmAutomationCreateSchema.safeParse({
      trigger: "INVALID",
      action: "SEND_EMAIL",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid action", () => {
    const result = crmAutomationCreateSchema.safeParse({
      trigger: "NEW_LEAD",
      action: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("crmAutomationUpdateSchema", () => {
  it("parses empty object", () => {
    const result = crmAutomationUpdateSchema.parse({});
    expect(result).toEqual({
      config: {},
      enabled: true,
    });
  });
});
