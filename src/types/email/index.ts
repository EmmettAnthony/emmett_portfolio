export type EmailProvider = "brevo" | "resend" | "smtp";
export type ContactStatus = "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED" | "PENDING";
export type SyncStatus = "PENDING" | "SYNCED" | "FAILED";
export type SyncAction =
  | "contact_create"
  | "contact_update"
  | "contact_delete"
  | "list_create"
  | "campaign_send"
  | "template_sync"
  | "webhook_received";
export type CampaignStatusType =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "ARCHIVED"
  | "FAILED"
  | "CANCELLED";

export interface EmailSettings {
  id: string;
  apiKey: string | null;
  smtpServer: string;
  smtpPort: number;
  smtpLogin: string | null;
  smtpPassword: string | null;
  senderName: string;
  senderEmail: string | null;
  replyToEmail: string | null;
  trackingEnabled: boolean;
  doubleOptIn: boolean;
  defaultListId: string | null;
  dailySendLimit: number;
  weeklySendLimit: number;
  monthlySendLimit: number;
  webhookSecret: string | null;
  lastSyncAt: string | null;
  updatedAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  description: string | null;
  brevoId: number | null;
  folderId: number | null;
  isDefault: boolean;
  isPublic: boolean;
  isArchived: boolean;
  subscriberCount: number;
  source: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number };
}

export interface ContactListMember {
  id: string;
  listId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  tags: string | null;
  source: string | null;
  status: ContactStatus;
  metadata: Record<string, unknown> | null;
  brevoContactId: number | null;
  brevoSyncStatus: SyncStatus;
  brevoSyncError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrevoSyncLog {
  id: string;
  action: SyncAction;
  entityType: string | null;
  entityId: string | null;
  brevoId: string | null;
  status: "SUCCESS" | "FAILED" | "PENDING";
  request: Record<string, unknown> | null;
  response: Record<string, unknown> | null;
  error: string | null;
  duration: number | null;
  createdAt: string;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  sent: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
}

export interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalContacts: number;
  transactionalEmailsSent: number;
  totalCampaigns: number;
  emailsSent: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  spamRate: number;
  totalUnsubscribes: number;
  recentActivity: ActivityItem[];
  campaignPerformance: CampaignPerformance[];
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityName: string;
  timestamp: string;
  status?: string;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  softBounce: number;
  hardBounce: number;
  spam: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  spamRate: number;
  unsubscribeRate: number;
  deliveredRate: number;
}

export interface AnalyticsData {
  dateRange: {
    start: string;
    end: string;
  };
  aggregated: CampaignStats;
  dailyStats: {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    spam: number;
    unsubscribed: number;
  }[];
  campaignPerformance: {
    id: string;
    name: string;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }[];
  subscriberGrowth: {
    date: string;
    newSubscribers: number;
    unsubscribes: number;
  }[];
  topCountries: { country: string; count: number }[];
  topSources: { source: string; count: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatusType;
  content: string;
  brevoCampaignId: number | null;
  scheduledAt: string | null;
  sentAt: string | null;
  stats: CampaignStats | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  category: string | null;
  thumbnail: string | null;
  isBuiltIn: boolean;
  brevoTemplateId: number | null;
  createdAt: string;
  updatedAt: string;
}
