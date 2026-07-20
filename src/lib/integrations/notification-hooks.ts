import { createNotification } from "@/lib/notifications";

function createEventNotification(params: {
  eventKey: string;
  title: string;
  message?: string;
  link?: string;
  source: string;
  metadata?: Record<string, unknown>;
}) {
  return createNotification({
    title: params.title,
    message: params.message,
    link: params.link,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category: params.source.toUpperCase() as any,
    key: `${params.eventKey}-${Date.now()}`,
  });
}
import {
  CRM_EVENTS,
  CONTACT_EVENTS,
  CALENDAR_EVENTS,
  PORTFOLIO_EVENTS,
  NEWSLETTER_EVENTS,
  RESUME_EVENTS,
  TESTIMONIAL_EVENTS,
  SYSTEM_EVENTS,
} from "@/types/notifications";

// ─── CRM Notifications ────────────────────────────────────────────────────

export async function notifyLeadCreated(leadName: string, company: string | null, link: string) {
  return createEventNotification({
    eventKey: CRM_EVENTS.LEAD_CREATED,
    title: `New lead: ${leadName}`,
    message: company ? `From ${company}` : "New lead created",
    link,
    source: "crm",
  });
}

export async function notifyLeadStatusChanged(leadName: string, oldStatus: string, newStatus: string, link: string) {
  return createEventNotification({
    eventKey: CRM_EVENTS.LEAD_STATUS_CHANGED,
    title: `Lead status changed: ${leadName}`,
    message: `${oldStatus} → ${newStatus}`,
    link,
    source: "crm",
  });
}

export async function notifyClientCreated(clientName: string, link: string) {
  return createEventNotification({
    eventKey: CRM_EVENTS.CLIENT_CREATED,
    title: `New client: ${clientName}`,
    message: "A new client has been created",
    link,
    source: "crm",
  });
}

export async function notifyDealWon(dealName: string, value: number, link: string) {
  return createEventNotification({
    eventKey: CRM_EVENTS.DEAL_WON,
    title: `Deal won: ${dealName}`,
    message: `Value: $${value.toLocaleString()}`,
    link,
    source: "crm",
    metadata: { dealValue: value },
  });
}

export async function notifyDealLost(dealName: string, link: string) {
  return createEventNotification({
    eventKey: CRM_EVENTS.DEAL_LOST,
    title: `Deal lost: ${dealName}`,
    message: "A deal has been marked as lost",
    link,
    source: "crm",
  });
}

export async function notifyProposalApproved(clientName: string, proposalTitle: string, link: string) {
  return createEventNotification({
    eventKey: CRM_EVENTS.PROPOSAL_APPROVED,
    title: `Proposal approved: ${proposalTitle}`,
    message: `${clientName} approved the proposal`,
    link,
    source: "crm",
  });
}

// ─── Contact Form Notifications ───────────────────────────────────────────

export async function notifyContactSubmission(name: string, email: string, link: string) {
  return createEventNotification({
    eventKey: CONTACT_EVENTS.NEW_SUBMISSION,
    title: `New contact submission from ${name}`,
    message: email,
    link,
    source: "contact",
    metadata: { submitterEmail: email },
  });
}

export async function notifyQuoteRequest(name: string, company: string | null, link: string) {
  return createEventNotification({
    eventKey: CONTACT_EVENTS.QUOTE_REQUEST,
    title: `Quote request from ${name}`,
    message: company || "New quote request received",
    link,
    source: "contact",
  });
}

export async function notifyServiceInquiry(name: string, serviceName: string, link: string) {
  return createEventNotification({
    eventKey: CONTACT_EVENTS.SERVICE_INQUIRY,
    title: `Service inquiry: ${serviceName}`,
    message: `From ${name}`,
    link,
    source: "contact",
  });
}

// ─── Calendar Notifications ───────────────────────────────────────────────

export async function notifyAppointmentBooked(name: string, date: Date, link: string) {
  return createEventNotification({
    eventKey: CALENDAR_EVENTS.APPOINTMENT_BOOKED,
    title: `Appointment booked: ${name}`,
    message: `Scheduled for ${date.toLocaleDateString()}`,
    link,
    source: "calendar",
    metadata: { appointmentDate: date.toISOString() },
  });
}

export async function notifyAppointmentCancelled(name: string, link: string) {
  return createEventNotification({
    eventKey: CALENDAR_EVENTS.APPOINTMENT_CANCELLED,
    title: `Appointment cancelled: ${name}`,
    message: "An appointment has been cancelled",
    link,
    source: "calendar",
  });
}

export async function notifyAppointmentReminder(name: string, date: Date, link: string) {
  return createEventNotification({
    eventKey: CALENDAR_EVENTS.APPOINTMENT_REMINDER,
    title: `Appointment reminder: ${name}`,
    message: `Tomorrow at ${date.toLocaleTimeString()}`,
    link,
    source: "calendar",
  });
}

export async function notifyMeetingStartingSoon(title: string, link: string) {
  return createEventNotification({
    eventKey: CALENDAR_EVENTS.MEETING_STARTING_SOON,
    title: `Meeting starting soon: ${title}`,
    message: "Your meeting starts in 5 minutes",
    link,
    source: "calendar",
  });
}

// ─── Portfolio Notifications ──────────────────────────────────────────────

export async function notifyProjectPublished(projectName: string, link: string) {
  return createEventNotification({
    eventKey: PORTFOLIO_EVENTS.PROJECT_PUBLISHED,
    title: `Project published: ${projectName}`,
    message: "Your portfolio project is now live",
    link,
    source: "portfolio",
  });
}

export async function notifyProjectUpdated(projectName: string, link: string) {
  return createEventNotification({
    eventKey: PORTFOLIO_EVENTS.PROJECT_UPDATED,
    title: `Project updated: ${projectName}`,
    message: "Changes have been saved",
    link,
    source: "portfolio",
  });
}

export async function notifyPortfolioInquiry(name: string, projectName: string, link: string) {
  return createEventNotification({
    eventKey: PORTFOLIO_EVENTS.INQUIRY_RECEIVED,
    title: `Portfolio inquiry from ${name}`,
    message: `Regarding ${projectName}`,
    link,
    source: "portfolio",
  });
}

// ─── Newsletter Notifications ─────────────────────────────────────────────

export async function notifyNewSubscriber(email: string, link: string) {
  return createEventNotification({
    eventKey: NEWSLETTER_EVENTS.NEW_SUBSCRIBER,
    title: `New subscriber: ${email}`,
    message: "Someone new joined your newsletter",
    link,
    source: "newsletter",
  });
}

export async function notifyCampaignSent(campaignName: string, recipientCount: number, link: string) {
  return createEventNotification({
    eventKey: NEWSLETTER_EVENTS.CAMPAIGN_SENT,
    title: `Campaign sent: ${campaignName}`,
    message: `Sent to ${recipientCount} subscribers`,
    link,
    source: "newsletter",
    metadata: { recipientCount },
  });
}

export async function notifyCampaignCompleted(campaignName: string, link: string) {
  return createEventNotification({
    eventKey: NEWSLETTER_EVENTS.CAMPAIGN_COMPLETED,
    title: `Campaign completed: ${campaignName}`,
    message: "All emails have been delivered",
    link,
    source: "newsletter",
  });
}

export async function notifyUnsubscribe(email: string, link: string) {
  return createEventNotification({
    eventKey: NEWSLETTER_EVENTS.UNSUBSCRIBE_REQUEST,
    title: `Unsubscribe request: ${email}`,
    message: "A subscriber has unsubscribed",
    link,
    source: "newsletter",
  });
}

// ─── Resume Notifications ─────────────────────────────────────────────────

export async function notifyResumeDownloaded(template: string, link: string) {
  return createEventNotification({
    eventKey: RESUME_EVENTS.DOWNLOADED,
    title: `Resume downloaded (${template})`,
    message: "Someone downloaded your resume",
    link,
    source: "resume",
  });
}

export async function notifyResumeViewed(link: string) {
  return createEventNotification({
    eventKey: RESUME_EVENTS.VIEWED,
    title: "Resume viewed",
    message: "Someone viewed your resume",
    link,
    source: "resume",
  });
}

// ─── Testimonial Notifications ────────────────────────────────────────────

export async function notifyNewTestimonial(name: string, link: string) {
  return createEventNotification({
    eventKey: TESTIMONIAL_EVENTS.NEW_SUBMITTED,
    title: `New testimonial from ${name}`,
    message: "A new testimonial has been submitted for review",
    link,
    source: "testimonial",
  });
}

export async function notifyTestimonialApproved(name: string, link: string) {
  return createEventNotification({
    eventKey: TESTIMONIAL_EVENTS.APPROVED,
    title: `Testimonial approved: ${name}`,
    message: "The testimonial is now live on your site",
    link,
    source: "testimonial",
  });
}

// ─── System Notifications ─────────────────────────────────────────────────

export async function notifyUserLogin(email: string) {
  return createEventNotification({
    eventKey: SYSTEM_EVENTS.USER_LOGIN,
    title: `User login: ${email}`,
    message: "A user logged into the dashboard",
    source: "system",
  });
}

export async function notifySecurityAlert(detail: string, link?: string) {
  return createEventNotification({
    eventKey: SYSTEM_EVENTS.SECURITY_ALERT,
    title: "Security alert",
    message: detail,
    link,
    source: "system",
  });
}

export async function notifyBackupCompleted(detail: string) {
  return createEventNotification({
    eventKey: SYSTEM_EVENTS.BACKUP_COMPLETED,
    title: "Backup completed",
    message: detail,
    source: "system",
  });
}

export async function notifyStorageWarning(usagePercent: number) {
  return createEventNotification({
    eventKey: SYSTEM_EVENTS.STORAGE_WARNING,
    title: `Storage warning: ${usagePercent}% used`,
    message: "Your storage is running low",
    source: "system",
    metadata: { usagePercent },
  });
}

export async function notifySystemError(errorMessage: string, link?: string) {
  return createEventNotification({
    eventKey: SYSTEM_EVENTS.SYSTEM_ERROR,
    title: "System error",
    message: errorMessage,
    link,
    source: "system",
  });
}
