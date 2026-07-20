// ─── Brevo API Types ─────────────────────────────────────────────────────

export interface BrevoContact {
  id: number;
  email: string;
  emailBlacklisted: boolean;
  smsBlacklisted: boolean;
  createdAt: string;
  modifiedAt: string;
  listIds: number[];
  listUnsubscribed: number[];
  attributes: Record<string, unknown>;
}

export interface BrevoContactAttribute {
  name: string;
  category: string;
  type: string;
  calculatedValue?: string;
  enumValues?: string[];
}

export interface BrevoList {
  id: number;
  name: string;
  totalBlacklisted: number;
  totalSubscribers: number;
  uniqueSubscribers: number;
  folderId?: number;
}

export interface BrevoFolder {
  id: number;
  name: string;
  totalBlacklisted: number;
  totalSubscribers: number;
  uniqueSubscribers: number;
}

export interface BrevoTransactionalEmail {
  id: string;
  messageId: string;
  from: string;
  subject: string;
  to: string;
  tags: string[];
  status: string;
  createdAt: string;
}

export interface BrevoTransactionalEmailDetail {
  id: string;
  messageId: string;
  from: string;
  subject: string;
  to: string;
  tags: string[];
  status: string;
  body: string;
  createdAt: string;
  clickCount: number;
  openCount: number;
  complaintClickCount: number;
  blocked: boolean;
  replyTo: string;
  headers: Record<string, string>;
}

export interface BrevoTemplate {
  id: number;
  name: string;
  subject: string;
  isActive: boolean;
  htmlContent: string;
  sender: { name: string; email: string };
  replyTo?: string;
  tag?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface BrevoCampaign {
  id: number;
  name: string;
  subject: string;
  type: string;
  status: string;
  scheduledAt?: string;
  sentDate?: string;
  recipients: { listIds: number[]; segmentIds?: number[]; exclusionListIds?: number[] };
  statistics?: BrevoCampaignStats;
  sender: { id: number; name: string; email: string };
  tag?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface BrevoCampaignStats {
  globalStats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    uniqueOpened: number;
    uniqueClicked: number;
    softBounce: number;
    hardBounce: number;
    spam: number;
    unsubscribed: number;
    complaint: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    spamRate: number;
    unsubscribeRate: number;
    deliveredRate: number;
  };
  statsByDomain?: Record<string, BrevoCampaignStats["globalStats"]>;
  statsByDevice?: Record<string, BrevoCampaignStats["globalStats"]>;
  statsByBrowser?: Record<string, BrevoCampaignStats["globalStats"]>;
}

export interface BrevoAbTestResult {
  versionA: { subject: string; openRate: number; clickRate: number };
  versionB: { subject: string; openRate: number; clickRate: number };
  winner: "A" | "B";
  winnerCriteria: string;
  totalRecipients: number;
  testRecipients: number;
}

export interface BrevoCampaignShare {
  id: number;
  campaignId: number;
  email: string;
  role: string;
  status: string;
}

export interface BrevoEmailReport {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalSoftBounce: number;
  totalHardBounce: number;
  totalSpam: number;
  totalUnsubscribed: number;
  totalComplaint: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  spamRate: number;
  unsubscribeRate: number;
  deliveredRate: number;
}

export interface BrevoDailyStats {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  softBounce: number;
  hardBounce: number;
  spam: number;
  unsubscribed: number;
  complaint: number;
}

export interface BrevoWebhook {
  id: number;
  url: string;
  description?: string;
  events: string[];
  type: string;
  createdAt: string;
  modifiedAt: string;
}

export interface BrevoSmtpSettings {
  enabled: boolean;
  maxPerDay: number;
  maxPerHour: number;
  maxPerMinute: number;
}

export interface BrevoAccount {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  address: Record<string, string>;
  plan: { type: string; credits: number; creditsType: string }[];
  relay: { enabled: boolean; data: string };
}
