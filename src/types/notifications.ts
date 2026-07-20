// ─── Notification Categories ───────────────────────────────────────────────
export type NotificationCategory =
  | "CRM"
  | "CONTACT"
  | "CALENDAR"
  | "PORTFOLIO"
  | "NEWSLETTER"
  | "RESUME"
  | "TESTIMONIAL"
  | "SUPPORT"
  | "SYSTEM";

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "CRM",
  "CONTACT",
  "CALENDAR",
  "PORTFOLIO",
  "NEWSLETTER",
  "RESUME",
  "TESTIMONIAL",
  "SUPPORT",
  "SYSTEM",
];

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  CRM: "CRM",
  CONTACT: "Contact",
  CALENDAR: "Calendar",
  PORTFOLIO: "Portfolio",
  NEWSLETTER: "Newsletter",
  RESUME: "Resume",
  TESTIMONIAL: "Testimonials",
  SUPPORT: "Support",
  SYSTEM: "System",
};

// ─── Notification Types (info, success, warning, error) ────────────────────
export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export const NOTIFICATION_TYPES: NotificationType[] = [
  "INFO",
  "SUCCESS",
  "WARNING",
  "ERROR",
];

export const TYPE_LABELS: Record<NotificationType, string> = {
  INFO: "Info",
  SUCCESS: "Success",
  WARNING: "Warning",
  ERROR: "Error",
};

// ─── Priority Levels ───────────────────────────────────────────────────────
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const NOTIFICATION_PRIORITIES: NotificationPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

// ─── Delivery Channels ─────────────────────────────────────────────────────
export type DeliveryChannel =
  | "IN_APP"
  | "EMAIL"
  | "PUSH"
  | "SMS"
  | "WHATSAPP";

export const DELIVERY_CHANNELS: DeliveryChannel[] = [
  "IN_APP",
  "EMAIL",
  "PUSH",
  "SMS",
  "WHATSAPP",
];

export const CHANNEL_LABELS: Record<DeliveryChannel, string> = {
  IN_APP: "In-App",
  EMAIL: "Email",
  PUSH: "Push",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
};

// ─── Notification Event Keys (for type safety) ──────────────────────────────

export const CRM_EVENTS = {
  LEAD_CREATED: "crm.lead.created",
  LEAD_STATUS_CHANGED: "crm.lead.status_changed",
  CLIENT_CREATED: "crm.client.created",
  DEAL_WON: "crm.deal.won",
  DEAL_LOST: "crm.deal.lost",
  PROPOSAL_APPROVED: "crm.proposal.approved",
  PAYMENT_FAILED: "crm.payment.failed",
  INVOICE_PAID: "crm.invoice.paid",
} as const;

export const CONTACT_EVENTS = {
  NEW_SUBMISSION: "contact.submission.new",
  QUOTE_REQUEST: "contact.quote_request",
  SERVICE_INQUIRY: "contact.service_inquiry",
} as const;

export const CALENDAR_EVENTS = {
  APPOINTMENT_BOOKED: "calendar.appointment.booked",
  APPOINTMENT_CANCELLED: "calendar.appointment.cancelled",
  APPOINTMENT_RESCHEDULED: "calendar.appointment.rescheduled",
  APPOINTMENT_REMINDER: "calendar.appointment.reminder",
  MEETING_STARTING_SOON: "calendar.meeting.starting_soon",
  MEETING_COMPLETED: "calendar.meeting.completed",
} as const;

export const PORTFOLIO_EVENTS = {
  PROJECT_PUBLISHED: "portfolio.project.published",
  PROJECT_UPDATED: "portfolio.project.updated",
  INQUIRY_RECEIVED: "portfolio.inquiry.received",
} as const;

export const NEWSLETTER_EVENTS = {
  NEW_SUBSCRIBER: "newsletter.subscriber.new",
  CAMPAIGN_SENT: "newsletter.campaign.sent",
  CAMPAIGN_COMPLETED: "newsletter.campaign.completed",
  UNSUBSCRIBE_REQUEST: "newsletter.unsubscribe.request",
} as const;

export const RESUME_EVENTS = {
  DOWNLOADED: "resume.downloaded",
  VIEWED: "resume.viewed",
} as const;

export const TESTIMONIAL_EVENTS = {
  NEW_SUBMITTED: "testimonial.new.submitted",
  APPROVED: "testimonial.approved",
} as const;

export const SYSTEM_EVENTS = {
  USER_LOGIN: "system.user.login",
  SECURITY_ALERT: "system.security.alert",
  BACKUP_COMPLETED: "system.backup.completed",
  STORAGE_WARNING: "system.storage.warning",
  SYSTEM_ERROR: "system.error",
} as const;

export const SUPPORT_EVENTS = {
  TICKET_CREATED: "support.ticket.created",
  TICKET_REPLIED: "support.ticket.replied",
  TICKET_ASSIGNED: "support.ticket.assigned",
  TICKET_STATUS_CHANGED: "support.ticket.status_changed",
  TICKET_CLOSED: "support.ticket.closed",
  TICKET_ESCALATED: "support.ticket.escalated",
  KB_ARTICLE_PUBLISHED: "support.kb.published",
} as const;

export type NotificationEventKey =
  | (typeof CRM_EVENTS)[keyof typeof CRM_EVENTS]
  | (typeof CONTACT_EVENTS)[keyof typeof CONTACT_EVENTS]
  | (typeof CALENDAR_EVENTS)[keyof typeof CALENDAR_EVENTS]
  | (typeof PORTFOLIO_EVENTS)[keyof typeof PORTFOLIO_EVENTS]
  | (typeof NEWSLETTER_EVENTS)[keyof typeof NEWSLETTER_EVENTS]
  | (typeof RESUME_EVENTS)[keyof typeof RESUME_EVENTS]
  | (typeof TESTIMONIAL_EVENTS)[keyof typeof TESTIMONIAL_EVENTS]
  | (typeof SYSTEM_EVENTS)[keyof typeof SYSTEM_EVENTS]
  | (typeof SUPPORT_EVENTS)[keyof typeof SUPPORT_EVENTS];

// ─── Event -> Category mapping ─────────────────────────────────────────────
export const EVENT_CATEGORY_MAP: Record<string, NotificationCategory> = {
  "crm.lead.created": "CRM",
  "crm.lead.status_changed": "CRM",
  "crm.client.created": "CRM",
  "crm.deal.won": "CRM",
  "crm.deal.lost": "CRM",
  "crm.proposal.approved": "CRM",
  "crm.payment.failed": "CRM",
  "crm.invoice.paid": "CRM",
  "contact.submission.new": "CONTACT",
  "contact.quote_request": "CONTACT",
  "contact.service_inquiry": "CONTACT",
  "calendar.appointment.booked": "CALENDAR",
  "calendar.appointment.cancelled": "CALENDAR",
  "calendar.appointment.rescheduled": "CALENDAR",
  "calendar.appointment.reminder": "CALENDAR",
  "calendar.meeting.starting_soon": "CALENDAR",
  "calendar.meeting.completed": "CALENDAR",
  "portfolio.project.published": "PORTFOLIO",
  "portfolio.project.updated": "PORTFOLIO",
  "portfolio.inquiry.received": "PORTFOLIO",
  "newsletter.subscriber.new": "NEWSLETTER",
  "newsletter.campaign.sent": "NEWSLETTER",
  "newsletter.campaign.completed": "NEWSLETTER",
  "newsletter.unsubscribe.request": "NEWSLETTER",
  "resume.downloaded": "RESUME",
  "resume.viewed": "RESUME",
  "testimonial.new.submitted": "TESTIMONIAL",
  "testimonial.approved": "TESTIMONIAL",
  "system.user.login": "SYSTEM",
  "system.security.alert": "SYSTEM",
  "system.backup.completed": "SYSTEM",
  "system.storage.warning": "SYSTEM",
  "system.error": "SYSTEM",
  "support.ticket.created": "SUPPORT",
  "support.ticket.replied": "SUPPORT",
  "support.ticket.assigned": "SUPPORT",
  "support.ticket.status_changed": "SUPPORT",
  "support.ticket.closed": "SUPPORT",
  "support.ticket.escalated": "SUPPORT",
  "support.kb.published": "SUPPORT",
};

export const EVENT_PRIORITY_MAP: Record<string, NotificationPriority> = {
  "crm.lead.created": "MEDIUM",
  "crm.lead.status_changed": "MEDIUM",
  "crm.client.created": "HIGH",
  "crm.deal.won": "HIGH",
  "crm.deal.lost": "HIGH",
  "crm.proposal.approved": "HIGH",
  "crm.payment.failed": "HIGH",
  "crm.invoice.paid": "HIGH",
  "contact.submission.new": "MEDIUM",
  "contact.quote_request": "MEDIUM",
  "contact.service_inquiry": "MEDIUM",
  "calendar.appointment.booked": "MEDIUM",
  "calendar.appointment.cancelled": "LOW",
  "calendar.appointment.rescheduled": "MEDIUM",
  "calendar.appointment.reminder": "HIGH",
  "calendar.meeting.starting_soon": "CRITICAL",
  "calendar.meeting.completed": "LOW",
  "portfolio.project.published": "MEDIUM",
  "portfolio.project.updated": "LOW",
  "portfolio.inquiry.received": "MEDIUM",
  "newsletter.subscriber.new": "LOW",
  "newsletter.campaign.sent": "MEDIUM",
  "newsletter.campaign.completed": "LOW",
  "newsletter.unsubscribe.request": "LOW",
  "resume.downloaded": "LOW",
  "resume.viewed": "LOW",
  "testimonial.new.submitted": "MEDIUM",
  "testimonial.approved": "LOW",
  "system.user.login": "LOW",
  "system.security.alert": "CRITICAL",
  "system.backup.completed": "LOW",
  "system.storage.warning": "HIGH",
  "system.error": "CRITICAL",
  "support.ticket.created": "MEDIUM",
  "support.ticket.replied": "MEDIUM",
  "support.ticket.assigned": "HIGH",
  "support.ticket.status_changed": "MEDIUM",
  "support.ticket.closed": "LOW",
  "support.ticket.escalated": "HIGH",
  "support.kb.published": "LOW",
};

export const EVENT_TYPE_MAP: Record<string, NotificationType> = {
  "crm.lead.created": "INFO",
  "crm.lead.status_changed": "INFO",
  "crm.client.created": "SUCCESS",
  "crm.deal.won": "SUCCESS",
  "crm.deal.lost": "ERROR",
  "crm.proposal.approved": "SUCCESS",
  "crm.payment.failed": "ERROR",
  "crm.invoice.paid": "SUCCESS",
  "contact.submission.new": "INFO",
  "contact.quote_request": "INFO",
  "contact.service_inquiry": "INFO",
  "calendar.appointment.booked": "INFO",
  "calendar.appointment.cancelled": "WARNING",
  "calendar.appointment.rescheduled": "WARNING",
  "calendar.appointment.reminder": "INFO",
  "calendar.meeting.starting_soon": "WARNING",
  "calendar.meeting.completed": "INFO",
  "portfolio.project.published": "SUCCESS",
  "portfolio.project.updated": "INFO",
  "portfolio.inquiry.received": "INFO",
  "newsletter.subscriber.new": "INFO",
  "newsletter.campaign.sent": "SUCCESS",
  "newsletter.campaign.completed": "SUCCESS",
  "newsletter.unsubscribe.request": "WARNING",
  "resume.downloaded": "INFO",
  "resume.viewed": "INFO",
  "testimonial.new.submitted": "INFO",
  "testimonial.approved": "SUCCESS",
  "system.user.login": "INFO",
  "system.security.alert": "ERROR",
  "system.backup.completed": "SUCCESS",
  "system.storage.warning": "WARNING",
  "system.error": "ERROR",
  "support.ticket.created": "INFO",
  "support.ticket.replied": "INFO",
  "support.ticket.assigned": "INFO",
  "support.ticket.status_changed": "INFO",
  "support.ticket.closed": "INFO",
  "support.ticket.escalated": "WARNING",
  "support.kb.published": "SUCCESS",
};

// ─── Main Notification Interface ───────────────────────────────────────────
export interface NotificationData {
  id: string;
  userId: string | null;
  category: NotificationCategory;
  priority: NotificationPriority;
  notifType: NotificationType;
  key: string | null;
  title: string;
  message: string | null;
  link: string | null;
  image: string | null;
  read: boolean;
  archived: boolean;
  pinned: boolean;
  snoozedUntil: string | null;
  acknowledged: boolean;
  actionLabel: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  expiresAt: string | null;
}

export interface NotificationPreferenceData {
  id: string;
  userId: string;
  categoryChannels: Record<NotificationCategory, DeliveryChannel[]>;
  emailDigest: "instant" | "daily" | "weekly" | "never";
  pushEnabled: boolean;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  snoozeUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplateData {
  id: string;
  name: string;
  label: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  notifType: NotificationType;
  title: string;
  message: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  pushTitle: string | null;
  pushBody: string | null;
  variables: string[];
  channels: DeliveryChannel[];
  actionLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLogData {
  id: string;
  notificationId: string;
  channel: DeliveryChannel;
  status: "queued" | "sent" | "delivered" | "failed" | "opened" | "clicked";
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── API Response Types ────────────────────────────────────────────────────
export interface NotificationsResponse {
  notifications: NotificationData[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
}

export interface NotificationAnalytics {
  totalSent: number;
  totalRead: number;
  readRate: number;
  totalDelivered: number;
  deliverySuccessRate: number;
  byCategory: { category: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byChannel: { channel: string; sent: number; delivered: number; failed: number }[];
  dailyCounts: { date: string; sent: number; read: number }[];
  recentTrend: { value: number; positive: boolean };
}
