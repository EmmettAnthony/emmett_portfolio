// ─── Activity Severity ─────────────────────────────────────────────────────
export type ActivitySeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export const ACTIVITY_SEVERITIES: ActivitySeverity[] = [
  "INFO",
  "WARNING",
  "ERROR",
  "CRITICAL",
];

export const SEVERITY_LABELS: Record<ActivitySeverity, string> = {
  INFO: "Info",
  WARNING: "Warning",
  ERROR: "Error",
  CRITICAL: "Critical",
};

// ─── Activity Modules ─────────────────────────────────────────────────────
export type ActivityModule =
  | "auth"
  | "crm"
  | "contact"
  | "portfolio"
  | "blog"
  | "newsletter"
  | "calendar"
  | "payment"
  | "file"
  | "user"
  | "system"
  | "resume"
  | "testimonial"
  | "services"
  | "settings";

export const ACTIVITY_MODULES: ActivityModule[] = [
  "auth",
  "crm",
  "contact",
  "portfolio",
  "blog",
  "newsletter",
  "calendar",
  "payment",
  "file",
  "user",
  "system",
  "resume",
  "testimonial",
  "services",
  "settings",
];

export const MODULE_LABELS: Record<ActivityModule, string> = {
  auth: "Authentication",
  crm: "CRM",
  contact: "Contact",
  portfolio: "Portfolio",
  blog: "Blog",
  newsletter: "Newsletter",
  calendar: "Calendar",
  payment: "Payments",
  file: "Files",
  user: "Users",
  system: "System",
  resume: "Resume",
  testimonial: "Testimonials",
  services: "Services",
  settings: "Settings",
};

// ─── Activity Actions ─────────────────────────────────────────────────────
export type ActivityAction =
  | "login"
  | "logout"
  | "failed_login"
  | "password_change"
  | "password_reset"
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "archive"
  | "restore"
  | "send"
  | "download"
  | "upload"
  | "view"
  | "approve"
  | "reject"
  | "cancel"
  | "complete"
  | "settings_change"
  | "export"
  | "import";

export const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  failed_login: "Failed Login",
  password_change: "Password Change",
  password_reset: "Password Reset",
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  publish: "Published",
  archive: "Archived",
  restore: "Restored",
  send: "Sent",
  download: "Downloaded",
  upload: "Uploaded",
  view: "Viewed",
  approve: "Approved",
  reject: "Rejected",
  cancel: "Cancelled",
  complete: "Completed",
  settings_change: "Settings Changed",
  export: "Exported",
  import: "Imported",
};

// ─── Security Event Types ────────────────────────────────────────────────
export type SecurityEventType =
  | "failed_login"
  | "suspicious_activity"
  | "permission_violation"
  | "api_abuse"
  | "rate_limit"
  | "mfa_failure"
  | "session_expired"
  | "password_breach";

export const SECURITY_EVENT_LABELS: Record<SecurityEventType, string> = {
  failed_login: "Failed Login Attempt",
  suspicious_activity: "Suspicious Activity",
  permission_violation: "Permission Violation",
  api_abuse: "API Abuse",
  rate_limit: "Rate Limit Violation",
  mfa_failure: "MFA Failure",
  session_expired: "Session Expired",
  password_breach: "Password Breach",
};

// ─── Main Interfaces ──────────────────────────────────────────────────────
export interface ActivityLogData {
  id: string;
  userId: string | null;
  user?: { name: string | null; email: string | null } | null;
  action: string;
  module: string;
  entity: string | null;
  entityId: string | null;
  description: string;
  severity: ActivitySeverity;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  country: string | null;
  createdAt: string;
}

export interface AuditTrailData {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  field: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  userId: string | null;
  description: string | null;
  createdAt: string;
}

export interface SecurityEventData {
  id: string;
  eventType: string;
  description: string;
  severity: ActivitySeverity;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export interface UserSessionData {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  country: string | null;
  isActive: boolean;
  lastActiveAt: string;
  expiresAt: string | null;
  createdAt: string;
  endedAt: string | null;
}

// ─── API Response Types ───────────────────────────────────────────────────
export interface ActivityLogsResponse {
  logs: ActivityLogData[];
  total: number;
  page: number;
  pages: number;
}

export interface AuditTrailResponse {
  trails: AuditTrailData[];
  total: number;
}

export interface SecurityEventsResponse {
  events: SecurityEventData[];
  total: number;
  page: number;
  pages: number;
  unresolvedCount: number;
}

export interface ActivityAnalytics {
  totalActivities: number;
  todayActivities: number;
  failedActions: number;
  securityEvents: number;
  uniqueUsers: number;
  byModule: { module: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byAction: { action: string; count: number }[];
  byCountry: { country: string; count: number }[];
  dailyCounts: { date: string; count: number }[];
  topUsers: { userId: string; name: string; email: string; count: number }[];
  recentTrend: { value: number; positive: boolean };
  loginActivity: { date: string; success: number; failed: number }[];
  securityIncidents: { date: string; count: number }[];
}
