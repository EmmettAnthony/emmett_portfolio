export type SubscriberStatus = "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED" | "PENDING_VERIFICATION";
export type CampaignStatus = "DRAFT" | "REVIEW" | "APPROVED" | "SCHEDULED" | "SENDING" | "AWAITING_WINNER" | "SENT" | "PAUSED" | "CANCELLED" | "FAILED";
export type AutomationTrigger = "welcome_series" | "blog_notification" | "lead_nurturing" | "re_engagement" | "tag_added" | "custom";
export type AutomationStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type EmailEventType = "sent" | "opened" | "clicked" | "bounced" | "unsubscribed" | "complained";
export type EmailLogStatus = "queued" | "sent" | "delivered" | "bounced" | "failed" | "opened" | "clicked";
export type EmailFrequency = "instant" | "daily" | "weekly" | "monthly";
export type TemplateCategory = "company_newsletter" | "product_update" | "blog_digest" | "announcement" | "promotion" | "event" | "custom";
export type SubscriberSource = "footer" | "blog_sidebar" | "contact_page" | "popup" | "exit_intent" | "manual_import";

export interface Subscriber {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  tags: string | null;
  source: string | null;
  status: SubscriberStatus;
  verificationToken: string | null;
  verifiedAt: string | null;
  gdprConsent: boolean;
  subscribedAt: string;
  lastOpenedAt: string | null;
  lastClickedAt: string | null;
  timezone: string | null;
  notes: string | null;
  engagementScore: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  preferences?: SubscriberPreference | null;
  unsubscribeReason?: UnsubscribeReason | null;
}

export interface SubscriberPreference {
  id: string;
  subscriberId: string;
  topics: string | null;
  emailFrequency: EmailFrequency;
  preferredSendHour: number;
  receivePromotions: boolean;
  receiveNewsletters: boolean;
  receiveBlogUpdates: boolean;
  updatedAt: string;
}

export interface UnsubscribeReason {
  id: string;
  subscriberId: string;
  reason: string | null;
  detail: string | null;
  unsubscribedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  createdAt: string;
}

export interface Segment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  criteria: SegmentCriteria | null;
  isDynamic: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface SegmentCriteria {
  countries?: string[];
  tags?: string[];
  sources?: string[];
  status?: SubscriberStatus[];
  activityLevel?: "active" | "inactive" | "new";
  lastOpenedDays?: number;
  lastClickedDays?: number;
  subscribedAfter?: string;
  subscribedBefore?: string;
  customField?: Record<string, unknown>;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  previewText: string | null;
  senderName: string | null;
  senderEmail: string | null;
  content: string;
  status: CampaignStatus;
  submittedForReviewAt: string | null;
  approvedAt: string | null;
  reviewNotes: string | null;
  templateId: string | null;
  segmentId: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  totalRecipients: number;
  testEmails: string | null;
  abTestEnabled: boolean;
  abTestVariantA: string | null;
  abTestVariantB: string | null;
  abTestTestPercent: number;
  abTestWinner: string | null;
  abTestWinnerDeclaredAt: string | null;
  isPublic: boolean;
  recurringFrequency: string | null;
  recurringDayOfWeek: number | null;
  recurringDayOfMonth: number | null;
  recurringNextRunAt: string | null;
  recurringEndsAt: string | null;
  recurringCount: number;
  recurringMaxCount: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  template?: Template | null;
  segment?: Segment | null;
  events?: CampaignEvent[];
  emailLogs?: EmailLog[];
}

export interface CampaignEvent {
  id: string;
  campaignId: string;
  subscriberId: string | null;
  email: string;
  eventType: EmailEventType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  campaignId: string | null;
  subscriberId: string | null;
  email: string;
  subject: string | null;
  status: EmailLogStatus;
  error: string | null;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  opensCount: number;
  clicksCount: number;
  resendId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  content: string;
  category: string | null;
  thumbnail: string | null;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string | null;
  triggerType: AutomationTrigger;
  triggerConfig: Record<string, unknown> | null;
  status: AutomationStatus;
  campaignId: string | null;
  createdAt: string;
  updatedAt: string;
  steps: AutomationStep[];
}

export interface AutomationStep {
  id: string;
  automationId: string;
  stepOrder: number;
  name: string;
  subject: string | null;
  content: string | null;
  delayDays: number;
  delayHours: number;
  condition: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSettings {
  id: string;
  defaultSenderName: string;
  defaultSenderEmail: string | null;
  replyToEmail: string | null;
  dailySendLimit: number;
  weeklySendLimit: number;
  monthlySendLimit: number;
  doubleOptIn: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  gdprEnabled: boolean;
  signupFormConfig: Record<string, unknown> | null;
  unsubscribeFooter: string | null;
  footerHtml: string | null;
  updatedAt: string;
}  export interface PopupAnalyticsData {
  totalShown: number;
  totalDismissed: number;
  totalConverted: number;
  conversionRate: number;
  dismissRate: number;
  byTrigger: { trigger: string; count: number }[];
  byPage: { page: string; count: number }[];
  dailyData: { date: string; shown: number; dismissed: number; converted: number }[];
  todayShown: number;
  todayDismissed: number;
  todayConverted: number;
}

  export interface NewsletterAnalytics {
  totalSubscribers: number;
  activeSubscribers: number;
  newSubscribersThisMonth: number;
  unsubscribedThisMonth: number;
  bouncedThisMonth: number;
  totalCampaigns: number;
  activeCampaigns: number;
  sentCampaigns: number;
  overallOpenRate: number;
  overallClickRate: number;
  overallBounceRate: number;
  overallUnsubscribeRate: number;
  growthData: { date: string; count: number }[];
  campaignPerformance: {
    id: string;
    name: string;
    sent: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
  }[];
  dailyEventCounts: { date: string; opens: number; clicks: number }[];
  subscribersBySource: { source: string; count: number }[];
  subscribersByCountry: { country: string; count: number }[];
  subscribersByStatus: { status: string; count: number }[];
}

export interface CustomField {
  id: string;
  name: string;
  slug: string;
  fieldType: string;
  required: boolean;
  options: string | null;
  placeholder: string | null;
  defaultValue: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldValue {
  id: string;
  customFieldId: string;
  subscriberId: string;
  value: string | null;
}

export interface Notification {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string;
  secret: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlocklistEntry {
  id: string;
  email: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

// Block types for the email editor
export type EmailBlockType = "text" | "image" | "button" | "divider" | "spacer" | "columns" | "social" | "header" | "footer" | "cta";

export interface EmailBlock {
  id: string;
  type: EmailBlockType;
  content: Record<string, unknown>;
  styles?: Record<string, unknown>;
}
