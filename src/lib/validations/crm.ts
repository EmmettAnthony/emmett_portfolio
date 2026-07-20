import { z } from "zod";

// ──────── ENUM CONSTANTS ────────

export const CrmLeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  QUALIFIED: "QUALIFIED",
  PROPOSAL_SENT: "PROPOSAL_SENT",
  NEGOTIATION: "NEGOTIATION",
  WON: "WON",
  LOST: "LOST",
} as const;

export const CrmDealStage = {
  NEW_LEAD: "NEW_LEAD",
  DISCOVERY: "DISCOVERY",
  QUALIFIED: "QUALIFIED",
  PROPOSAL_SENT: "PROPOSAL_SENT",
  NEGOTIATION: "NEGOTIATION",
  WON: "WON",
  LOST: "LOST",
} as const;

export const CrmActivityType = {
  CALL: "CALL",
  EMAIL: "EMAIL",
  MEETING: "MEETING",
  NOTE: "NOTE",
  TASK: "TASK",
  FOLLOW_UP: "FOLLOW_UP",
} as const;

export const CrmTaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export const CrmTaskStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const CrmProposalStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const CrmContractStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  TERMINATED: "TERMINATED",
} as const;

export const CrmInvoiceStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

export const CrmCommunicationType = {
  EMAIL: "EMAIL",
  NOTE: "NOTE",
  MEETING: "MEETING",
  WHATSAPP: "WHATSAPP",
  INTERNAL: "INTERNAL",
} as const;

export const CrmCommunicationDirection = {
  INBOUND: "INBOUND",
  OUTBOUND: "OUTBOUND",
  INTERNAL: "INTERNAL",
} as const;

export const CrmAutomationTrigger = {
  NEW_LEAD: "NEW_LEAD",
  PROPOSAL_SENT: "PROPOSAL_SENT",
  DEAL_WON: "DEAL_WON",
} as const;

export const CrmAutomationAction = {
  SEND_EMAIL: "SEND_EMAIL",
  CREATE_TASK: "CREATE_TASK",
  CONVERT_LEAD: "CONVERT_LEAD",
  CREATE_PROJECT: "CREATE_PROJECT",
} as const;

// ──────── ZOD ENUM SCHEMAS ────────

const leadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

const dealStageSchema = z.enum([
  "NEW_LEAD",
  "DISCOVERY",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

const activityTypeSchema = z.enum([
  "CALL",
  "EMAIL",
  "MEETING",
  "NOTE",
  "TASK",
  "FOLLOW_UP",
]);

const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const taskStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

const proposalStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "APPROVED",
  "REJECTED",
]);

const contractStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "EXPIRED",
  "TERMINATED",
]);

const invoiceStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);

const communicationTypeSchema = z.enum([
  "EMAIL",
  "NOTE",
  "MEETING",
  "WHATSAPP",
  "INTERNAL",
]);

const communicationDirectionSchema = z.enum([
  "INBOUND",
  "OUTBOUND",
  "INTERNAL",
]);

const automationTriggerSchema = z.enum([
  "NEW_LEAD",
  "PROPOSAL_SENT",
  "DEAL_WON",
]);

const automationActionSchema = z.enum([
  "SEND_EMAIL",
  "CREATE_TASK",
  "CONVERT_LEAD",
  "CREATE_PROJECT",
]);

// ──────── SHARED FIELD SCHEMAS ────────

const emailField = z.string().email("Invalid email address").max(320);
const optionalNameField = z.string().max(255).optional();
const optionalUrlField = z
  .string()
  .url("Invalid URL")
  .max(2048)
  .optional()
  .or(z.literal(""));
const phoneField = z
  .string()
  .max(50)
  .optional();
const dateStringField = z.string().optional();
const notesField = z.string().optional();
const idField = z.string().optional();
const jsonRecordField = z.record(z.string(), z.any());

// ──────── CRM LEAD ────────

export const crmLeadCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: emailField,
  phone: phoneField,
  company: optionalNameField,
  position: optionalNameField,
  country: optionalNameField,
  website: optionalUrlField,
  source: z.string().min(1, "Source is required").max(100),
  tags: z.array(z.string()).default([]),
  leadScore: z.number().int().min(0).max(100).default(0),
  status: leadStatusSchema.default("NEW"),
  notes: notesField,
  assignedTo: z.string().optional(),
});

export const crmLeadUpdateSchema = crmLeadCreateSchema.partial();

export type CrmLeadCreateInput = z.input<typeof crmLeadCreateSchema>;
export type CrmLeadUpdateInput = z.input<typeof crmLeadUpdateSchema>;

// ──────── CRM CLIENT ────────

export const crmClientCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: emailField,
  phone: phoneField,
  position: optionalNameField,
  companyId: z.string().optional(),
  industry: optionalNameField,
  website: optionalUrlField,
  healthScore: z.number().int().min(0).max(100).default(50),
  notes: notesField,
});

export const crmClientUpdateSchema = crmClientCreateSchema.partial();

export type CrmClientCreateInput = z.input<typeof crmClientCreateSchema>;
export type CrmClientUpdateInput = z.input<typeof crmClientUpdateSchema>;

// ──────── CRM COMPANY ────────

export const crmCompanyCreateSchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  industry: optionalNameField,
  website: optionalUrlField,
  address: z.string().max(500).optional(),
  companySize: z
    .number()
    .int()
    .min(1, "Company size must be at least 1")
    .optional(),
  annualRevenue: z.number().nonnegative("Revenue must be non-negative").optional(),
  notes: notesField,
});

export const crmCompanyUpdateSchema = crmCompanyCreateSchema.partial();

export type CrmCompanyCreateInput = z.input<typeof crmCompanyCreateSchema>;
export type CrmCompanyUpdateInput = z.input<typeof crmCompanyUpdateSchema>;

// ──────── CRM DEAL ────────

export const crmDealCreateSchema = z.object({
  name: z.string().min(1, "Deal name is required").max(255),
  value: z.number().nonnegative("Value must be non-negative"),
  probability: z.number().int().min(0).max(100).default(0),
  expectedCloseDate: dateStringField,
  stage: dealStageSchema.default("NEW_LEAD"),
  lostReason: z.string().max(500).optional(),
  notes: notesField,
  leadId: idField,
  clientId: idField,
  companyId: idField,
});

export const crmDealUpdateSchema = crmDealCreateSchema.partial();

export type CrmDealCreateInput = z.input<typeof crmDealCreateSchema>;
export type CrmDealUpdateInput = z.input<typeof crmDealUpdateSchema>;

// ──────── CRM ACTIVITY ────────

export const crmActivityCreateSchema = z.object({
  type: activityTypeSchema,
  subject: z.string().min(1, "Subject is required").max(255),
  description: z.string().max(2000).optional(),
  date: z.string().min(1, "Date is required"),
  duration: z.number().int().nonnegative("Duration must be non-negative").optional(),
  completed: z.boolean().default(false),
  leadId: idField,
  clientId: idField,
  dealId: idField,
  assignedTo: z.string().optional(),
});

export const crmActivityUpdateSchema = crmActivityCreateSchema.partial();

export type CrmActivityCreateInput = z.input<typeof crmActivityCreateSchema>;
export type CrmActivityUpdateInput = z.input<typeof crmActivityUpdateSchema>;

// ──────── CRM TASK ────────

export const crmTaskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(2000).optional(),
  dueDate: dateStringField,
  priority: taskPrioritySchema.default("MEDIUM"),
  status: taskStatusSchema.default("PENDING"),
  leadId: idField,
  clientId: idField,
  dealId: idField,
  assignedTo: z.string().optional(),
});

export const crmTaskUpdateSchema = crmTaskCreateSchema.partial();

export type CrmTaskCreateInput = z.input<typeof crmTaskCreateSchema>;
export type CrmTaskUpdateInput = z.input<typeof crmTaskUpdateSchema>;

// ──────── CRM PROPOSAL ────────

export const crmProposalCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  clientId: z.string().min(1, "Client is required"),
  services: z.array(z.string()).default([]),
  pricing: jsonRecordField.default({}),
  terms: z.string().max(5000).optional(),
  total: z.number().nonnegative("Total must be non-negative"),
  status: proposalStatusSchema.default("DRAFT"),
  pdfUrl: optionalUrlField,
  sentAt: dateStringField,
  approvedAt: dateStringField,
});

export const crmProposalUpdateSchema = crmProposalCreateSchema.partial();

export type CrmProposalCreateInput = z.input<typeof crmProposalCreateSchema>;
export type CrmProposalUpdateInput = z.input<typeof crmProposalUpdateSchema>;

// ──────── CRM CONTRACT ────────

export const crmContractCreateSchema = z.object({
  contractName: z.string().min(1, "Contract name is required").max(255),
  clientId: z.string().min(1, "Client is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: dateStringField,
  value: z.number().nonnegative("Value must be non-negative"),
  status: contractStatusSchema.default("DRAFT"),
  pdfUrl: optionalUrlField,
  notes: notesField,
});

export const crmContractUpdateSchema = crmContractCreateSchema.partial();

export type CrmContractCreateInput = z.input<typeof crmContractCreateSchema>;
export type CrmContractUpdateInput = z.input<typeof crmContractUpdateSchema>;

// ──────── CRM INVOICE ────────

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().nonnegative("Quantity must be non-negative"),
  rate: z.number().nonnegative("Rate must be non-negative"),
  amount: z.number().nonnegative("Amount must be non-negative"),
});

export const crmInvoiceCreateSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  amount: z.number().nonnegative("Amount must be non-negative"),
  dueDate: z.string().min(1, "Due date is required"),
  paidAt: dateStringField,
  status: invoiceStatusSchema.default("DRAFT"),
  pdfUrl: optionalUrlField,
  notes: notesField,
  lineItems: z.array(lineItemSchema).default([]),
});

export const crmInvoiceUpdateSchema = crmInvoiceCreateSchema.partial();

export type CrmInvoiceCreateInput = z.input<typeof crmInvoiceCreateSchema>;
export type CrmInvoiceUpdateInput = z.input<typeof crmInvoiceUpdateSchema>;

// ──────── CRM COMMUNICATION ────────

export const crmCommunicationCreateSchema = z.object({
  type: communicationTypeSchema,
  subject: z.string().min(1, "Subject is required").max(255),
  content: z.string().max(10000).optional(),
  direction: communicationDirectionSchema,
  date: z.string().min(1, "Date is required"),
  leadId: idField,
  clientId: idField,
});

export const crmCommunicationUpdateSchema = crmCommunicationCreateSchema.partial();

export type CrmCommunicationCreateInput = z.input<
  typeof crmCommunicationCreateSchema
>;
export type CrmCommunicationUpdateInput = z.input<
  typeof crmCommunicationUpdateSchema
>;

// ──────── CRM AUTOMATION ────────

export const crmAutomationCreateSchema = z.object({
  trigger: automationTriggerSchema,
  action: automationActionSchema,
  config: jsonRecordField.default({}),
  enabled: z.boolean().default(true),
});

export const crmAutomationUpdateSchema = crmAutomationCreateSchema.partial();

export type CrmAutomationCreateInput = z.input<typeof crmAutomationCreateSchema>;
export type CrmAutomationUpdateInput = z.input<typeof crmAutomationUpdateSchema>;
