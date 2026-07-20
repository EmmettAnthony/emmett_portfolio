// Ticket statuses
export type SupportTicketStatus = "OPEN" | "PENDING" | "WAITING_ON_CLIENT" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "ARCHIVED";

// Priority levels
export type SupportPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";

// Categories  
export type SupportCategory = "GENERAL_INQUIRY" | "TECHNICAL_SUPPORT" | "WEBSITE_ISSUE" | "BILLING" | "PAYMENT" | "PROJECT_UPDATE" | "BUG_REPORT" | "FEATURE_REQUEST" | "CONSULTATION" | "PARTNERSHIP" | "OTHER";

// Sources
export type SupportSource = "web" | "email" | "chatbot" | "api" | "phone";

// Contact methods
export type PreferredContact = "email" | "phone" | "any";

// Knowledge base categories
export type KnowledgeCategory = "getting_started" | "troubleshooting" | "account" | "billing" | "features" | "integrations" | "other";

// FAQ Categories
export type FAQCategory = "general" | "billing" | "technical" | "account" | "support" | "other";

// Macro categories
export type MacroCategory = "welcome" | "password_reset" | "booking" | "payment" | "project_started" | "project_completed" | "general";

// Data interfaces
export interface SupportTicketData {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferredContact: string | null;
  source: string;
  tags: string | null;
  internalNotes: string | null;
  responseTime: number | null;
  resolutionTime: number | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  metadata: Record<string, unknown> | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  priorityId: string | null;
  priority: { id: string; name: string; slug: string; level: number; color: string | null } | null;
  statusId: string;
  status: { id: string; name: string; slug: string; color: string | null; isClosed: boolean };
  assignedToId: string | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
  contactId: string | null;
  clientId: string | null;
  replyCount?: number;
  attachmentCount?: number;
  rating: { rating: number; comment: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportReplyData {
  id: string;
  body: string;
  isInternal: boolean;
  isStaff: boolean;
  staffName: string | null;
  ticketId: string;
  authorId: string | null;
  author: { id: string; name: string | null; email: string } | null;
  attachments: SupportAttachmentData[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportAttachmentData {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  storageKey: string | null;
  ticketId: string;
  replyId: string | null;
  createdAt: string;
}

export interface SupportMacroData {
  id: string;
  title: string;
  slug: string;
  body: string;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportRatingData {
  id: string;
  rating: number;
  comment: string | null;
  ticketId: string;
  createdAt: string;
}

export interface SupportCategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
  ticketCount?: number;
  createdAt: string;
}

export interface SupportPriorityData {
  id: string;
  name: string;
  slug: string;
  level: number;
  color: string | null;
  slaHours: number | null;
  ticketCount?: number;
  createdAt: string;
}

export interface SupportStatusData {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  order: number;
  isClosed: boolean;
  isDefault: boolean;
  ticketCount?: number;
  createdAt: string;
}

export interface SupportAnalyticsData {
  openTickets: number;
  closedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionRate: number;
  byCategory: { category: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byStatus: { status: string; count: number }[];
  agentPerformance: { agentId: string; agentName: string; resolved: number; avgTime: number }[];
  dailyTrends: { date: string; created: number; resolved: number }[];
}

export interface SupportKnowledgeArticleData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  readingTime: number | null;
  tags: string | null;
  published: boolean;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportKnowledgeCategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
  articleCount?: number;
  createdAt: string;
}

export interface FAQData {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SUPPORT_STATUSES = {
  OPEN: "OPEN",
  PENDING: "PENDING",
  WAITING_ON_CLIENT: "WAITING_ON_CLIENT",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
  ARCHIVED: "ARCHIVED",
} as const;

export const SUPPORT_PRIORITIES = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
  CRITICAL: "CRITICAL",
} as const;

export const SUPPORT_CATEGORIES = [
  "GENERAL_INQUIRY",
  "TECHNICAL_SUPPORT",
  "WEBSITE_ISSUE",
  "BILLING",
  "PAYMENT",
  "PROJECT_UPDATE",
  "BUG_REPORT",
  "FEATURE_REQUEST",
  "CONSULTATION",
  "PARTNERSHIP",
  "OTHER",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  GENERAL_INQUIRY: "General Inquiry",
  TECHNICAL_SUPPORT: "Technical Support",
  WEBSITE_ISSUE: "Website Issue",
  BILLING: "Billing",
  PAYMENT: "Payment",
  PROJECT_UPDATE: "Project Update",
  BUG_REPORT: "Bug Report",
  FEATURE_REQUEST: "Feature Request",
  CONSULTATION: "Consultation",
  PARTNERSHIP: "Partnership",
  OTHER: "Other",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
  CRITICAL: "Critical",
};

export const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  PENDING: "Pending",
  WAITING_ON_CLIENT: "Waiting on Client",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};
