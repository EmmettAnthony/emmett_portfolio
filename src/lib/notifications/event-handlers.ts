// ──────────────────────────────────────────────────────────────────────────────
// Notification Event Handlers
// ──────────────────────────────────────────────────────────────────────────────
// Provides helper functions that each module calls to fire notifications.
// Each handler creates the notification, logs delivery, and returns results.
// ──────────────────────────────────────────────────────────────────────────────

import { sendNotification } from "./notification-service";
import type { SendNotificationResult } from "./notification-service";

// ═══════════════════════════════════════════════════════════════════════════
// CRM EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyCrmLeadCreated(
  leadName: string,
  leadEmail: string,
  source: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "crm.lead.created",
    title: `New CRM Lead: ${leadName}`,
    message: `From ${leadEmail} via ${source}`,
    link: link || "/dashboard/crm/leads",
    key: `crm-lead-${leadEmail}-${Date.now()}`,
    source: "crm",
  });
}

export async function notifyCrmLeadStatusChanged(
  leadName: string,
  oldStatus: string,
  newStatus: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "crm.lead.status_changed",
    title: `Lead Status Updated: ${leadName}`,
    message: `Changed from ${oldStatus} to ${newStatus}`,
    link: link || "/dashboard/crm/leads",
    key: `crm-status-${Date.now()}`,
    source: "crm",
  });
}

export async function notifyCrmDealWon(
  dealName: string,
  value: number,
  clientName: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "crm.deal.won",
    title: `🎉 Deal Won: ${dealName}`,
    message: `${clientName} — $${value.toLocaleString()}`,
    link: link || "/dashboard/crm/deals",
    key: `crm-deal-won-${Date.now()}`,
    source: "crm",
  });
}

export async function notifyCrmDealLost(
  dealName: string,
  value: number,
  reason: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "crm.deal.lost",
    title: `Deal Lost: ${dealName}`,
    message: `$${value.toLocaleString()} — Reason: ${reason}`,
    link: link || "/dashboard/crm/deals",
    key: `crm-deal-lost-${Date.now()}`,
    source: "crm",
  });
}

export async function notifyCrmProposalApproved(
  proposalTitle: string,
  clientName: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "crm.proposal.approved",
    title: `Proposal Approved: ${proposalTitle}`,
    message: `Approved by ${clientName}`,
    link: link || "/dashboard/crm/proposals",
    key: `crm-proposal-approved-${Date.now()}`,
    source: "crm",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT FORM EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyNewContactSubmission(
  name: string,
  email: string,
  projectType: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "contact.submission.new",
    title: `New Contact Form: ${name}`,
    message: `${email} — ${projectType}`,
    link: link || "/dashboard/contact/submissions",
    key: `contact-submission-${email}-${Date.now()}`,
    source: "contact",
  });
}

export async function notifyServiceInquiry(
  name: string,
  email: string,
  serviceName: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "contact.service_inquiry",
    title: `New Service Inquiry: ${name}`,
    message: `${email} interested in ${serviceName}`,
    link: link || "/dashboard/services/inquiries",
    key: `service-inquiry-${email}-${Date.now()}`,
    source: "contact",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR / BOOKING EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyAppointmentBooked(
  name: string,
  email: string,
  date: string,
  meetingType: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "calendar.appointment.booked",
    title: `New Booking: ${name}`,
    message: `${meetingType} on ${date} — ${email}`,
    link: link || "/dashboard/calendar/appointments",
    key: `booking-${email}-${Date.now()}`,
    source: "calendar",
  });
}

export async function notifyAppointmentRescheduled(
  name: string,
  email: string,
  oldDate: string,
  newDate: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "calendar.appointment.rescheduled",
    title: `Booking Rescheduled: ${name}`,
    message: `${email} — moved from ${oldDate} to ${newDate}`,
    link: link || "/dashboard/calendar/appointments",
    key: `booking-rescheduled-${email}-${Date.now()}`,
    source: "calendar",
  });
}

export async function notifyAppointmentCancelled(
  name: string,
  date: string,
  reason: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "calendar.appointment.cancelled",
    title: `Booking Cancelled: ${name}`,
    message: `${date} — Reason: ${reason}`,
    link: link || "/dashboard/calendar/appointments",
    key: `booking-cancelled-${Date.now()}`,
    source: "calendar",
  });
}

export async function notifyMeetingCompleted(
  name: string,
  meetingType: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "calendar.meeting.completed",
    title: `Meeting Completed: ${name}`,
    message: `${meetingType} has ended`,
    link: link || "/dashboard/calendar/appointments",
    key: `meeting-completed-${Date.now()}`,
    source: "calendar",
    priorityOverride: "LOW",
  });
}

export async function notifyAppointmentReminder(
  name: string,
  date: string,
  time: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "calendar.appointment.reminder",
    title: `⏰ Meeting Reminder: ${name}`,
    message: `${date} at ${time}`,
    link: link || "/dashboard/calendar/appointments",
    key: `reminder-${Date.now()}`,
    source: "calendar",
  });
}

export async function notifyMeetingStartingSoon(
  name: string,
  meetingType: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "calendar.meeting.starting_soon",
    title: `🔔 Meeting Starting Soon: ${name}`,
    message: `${meetingType} is starting in 5 minutes`,
    link: link || "/dashboard/calendar",
    key: `meeting-soon-${Date.now()}`,
    source: "calendar",
    priorityOverride: "CRITICAL",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PORTFOLIO EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyProjectPublished(
  projectTitle: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "portfolio.project.published",
    title: `Portfolio Published: ${projectTitle}`,
    message: "A new project has been published to your portfolio",
    link: link || "/dashboard/portfolio",
    key: `project-published-${Date.now()}`,
    source: "portfolio",
  });
}

export async function notifyProjectUpdated(
  projectTitle: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "portfolio.project.updated",
    title: `Project Updated: ${projectTitle}`,
    message: "Project details have been modified",
    link: link || "/dashboard/portfolio",
    key: `project-updated-${Date.now()}`,
    source: "portfolio",
  });
}

export async function notifyPortfolioInquiry(
  name: string,
  email: string,
  projectTitle: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "portfolio.inquiry.received",
    title: `Portfolio Inquiry: ${name}`,
    message: `${email} inquired about "${projectTitle}"`,
    link: link || "/dashboard/contact/submissions",
    key: `portfolio-inquiry-${Date.now()}`,
    source: "portfolio",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWSLETTER EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyNewSubscriber(
  name: string,
  email: string,
  source: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "newsletter.subscriber.new",
    title: `New Subscriber: ${name}`,
    message: `${email} subscribed via ${source}`,
    link: "/dashboard/newsletter/subscribers",
    key: `subscriber-${email}`,
    source: "newsletter",
  });
}

export async function notifyCampaignSent(
  campaignName: string,
  recipientCount: number
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "newsletter.campaign.sent",
    title: `Campaign Sent: ${campaignName}`,
    message: `Delivered to ${recipientCount} subscribers`,
    link: "/dashboard/newsletter/campaigns",
    key: `campaign-sent-${Date.now()}`,
    source: "newsletter",
  });
}

export async function notifyCampaignCompleted(
  campaignName: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "newsletter.campaign.completed",
    title: `Campaign Complete: ${campaignName}`,
    message: "All emails have been delivered",
    link: "/dashboard/newsletter/campaigns",
    key: `campaign-complete-${Date.now()}`,
    source: "newsletter",
  });
}

export async function notifyUnsubscribeRequest(
  email: string,
  reason?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "newsletter.unsubscribe.request",
    title: "Subscriber Unsubscribed",
    message: `${email}${reason ? ` — Reason: ${reason}` : ""}`,
    link: "/dashboard/newsletter/subscribers",
    key: `unsubscribe-${email}`,
    source: "newsletter",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// RESUME EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyResumeDownloaded(
  visitorName: string | null,
  template: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "resume.downloaded",
    title: "Resume Downloaded",
    message: `${visitorName || "Someone"} downloaded your resume (${template})`,
    link: "/dashboard/resume/downloads",
    key: `resume-download-${Date.now()}`,
    source: "resume",
  });
}

export async function notifyResumeViewed(
  visitorName: string | null
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "resume.viewed",
    title: "Resume Viewed",
    message: `${visitorName || "Someone"} viewed your resume`,
    link: "/dashboard/resume",
    key: `resume-view-${Date.now()}`,
    source: "resume",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTIMONIAL EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyNewTestimonial(
  name: string,
  rating: number,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "testimonial.new.submitted",
    title: `New Testimonial from ${name}`,
    message: `Rating: ${rating}/5`,
    link: link || "/dashboard/testimonials",
    key: `testimonial-${Date.now()}`,
    source: "testimonial",
  });
}

export async function notifyTestimonialApproved(
  name: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "testimonial.approved",
    title: `Testimonial Approved: ${name}`,
    message: "The testimonial is now live on your site",
    link: "/dashboard/testimonials",
    key: `testimonial-approved-${Date.now()}`,
    source: "testimonial",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM / SECURITY EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyUserLogin(
  userName: string,
  ipAddress: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "system.user.login",
    title: `User Login: ${userName}`,
    message: `IP: ${ipAddress}`,
    link: "/dashboard/activity/security",
    key: `login-${Date.now()}`,
    source: "system",
  });
}

export async function notifySecurityAlert(
  alertType: string,
  description: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "system.security.alert",
    title: `🚨 Security Alert: ${alertType}`,
    message: description,
    link: link || "/dashboard/activity/security",
    key: `security-${Date.now()}`,
    source: "system",
    priorityOverride: "CRITICAL",
    typeOverride: "ERROR",
  });
}

export async function notifySystemError(
  errorMessage: string,
  module: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "system.error",
    title: `System Error: ${module}`,
    message: errorMessage,
    link: "/dashboard/activity/logs",
    key: `error-${Date.now()}`,
    source: "system",
    priorityOverride: "CRITICAL",
    typeOverride: "ERROR",
  });
}

export async function notifyBackupCompleted(
  backupType: string,
  size: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "system.backup.completed",
    title: "Backup Complete",
    message: `${backupType} backup (${size}) completed successfully`,
    link: "/dashboard/settings",
    key: `backup-${Date.now()}`,
    source: "system",
  });
}

export async function notifyStorageWarning(
  used: string,
  total: string,
  percentage: number
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "system.storage.warning",
    title: "⚠️ Storage Warning",
    message: `${used} of ${total} used (${percentage}%)`,
    link: "/dashboard/settings",
    key: `storage-${Date.now()}`,
    source: "system",
    priorityOverride: "HIGH",
    typeOverride: "WARNING",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT / INVOICE EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyPaymentFailed(
  amount: number,
  clientName: string,
  invoiceNumber: string,
  reason: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "crm.payment.failed",
    title: `❌ Payment Failed: $${amount.toLocaleString()}`,
    message: `${clientName} — Invoice ${invoiceNumber} — ${reason}`,
    link: link || "/dashboard/crm/invoices",
    key: `payment-failed-${Date.now()}`,
    source: "crm",
    priorityOverride: "HIGH",
    typeOverride: "ERROR",
  });
}

export async function notifyInvoicePaid(
  invoiceNumber: string,
  clientName: string,
  amount: number,
  paidDate: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "crm.invoice.paid",
    title: `✅ Invoice Paid: ${invoiceNumber}`,
    message: `${clientName} — $${amount.toLocaleString()} (paid ${paidDate})`,
    link: link || "/dashboard/crm/invoices",
    key: `invoice-paid-${Date.now()}`,
    source: "crm",
    typeOverride: "SUCCESS",
  });
}

export async function notifyPaymentReceived(
  amount: number,
  clientName: string,
  invoiceNumber: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "crm.deal.won", // reuse won deal mapping
    title: `💰 Payment Received: $${amount.toLocaleString()}`,
    message: `From ${clientName} — Invoice ${invoiceNumber}`,
    link: "/dashboard/crm/invoices",
    key: `payment-${Date.now()}`,
    source: "crm",
    categoryOverride: "CRM",
    priorityOverride: "HIGH",
    typeOverride: "SUCCESS",
  });
}

export async function notifyInvoiceOverdue(
  invoiceNumber: string,
  clientName: string,
  amount: number,
  dueDate: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "crm.proposal.approved", // reuse mapping
    title: `⚠️ Invoice Overdue: ${invoiceNumber}`,
    message: `${clientName} — $${amount.toLocaleString()} (due ${dueDate})`,
    link: "/dashboard/crm/invoices",
    key: `invoice-overdue-${Date.now()}`,
    source: "crm",
    categoryOverride: "CRM",
    priorityOverride: "HIGH",
    typeOverride: "WARNING",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CHATBOT EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyChatStarted(
  visitorName: string | null,
  conversationId: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "contact.submission.new", // reuse
    title: `💬 Chat Started: ${visitorName || "Anonymous Visitor"}`,
    message: "A new chat conversation has begun",
    link: `/dashboard/chatbot/conversations/${conversationId}`,
    key: `chat-started-${conversationId}`,
    source: "chatbot",
    categoryOverride: "CONTACT",
  });
}

export async function notifyChatEscalated(
  visitorName: string | null,
  conversationId: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "contact.submission.new",
    title: `🚨 Chat Escalated: ${visitorName || "a visitor"} needs help`,
    message: "A visitor has requested to speak with a human agent",
    link: `/dashboard/chatbot/conversations/${conversationId}`,
    key: `chat-escalation-${conversationId}`,
    source: "chatbot",
    categoryOverride: "CONTACT",
    priorityOverride: "HIGH",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyFailedLogin(
  email: string,
  ipAddress: string,
  attempts: number
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "system.security.alert",
    title: "Failed Login Attempt",
    message: `${email} — IP: ${ipAddress} (${attempts} attempts)`,
    link: "/dashboard/activity/security",
    key: `failed-login-${Date.now()}`,
    source: "system",
    priorityOverride: "HIGH",
    typeOverride: "WARNING",
  });
}

export async function notifyPasswordChanged(
  userName: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "system.user.login",
    title: `Password Changed: ${userName}`,
    message: "Account password was updated",
    link: "/dashboard/settings",
    key: `password-change-${Date.now()}`,
    source: "system",
    priorityOverride: "HIGH",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE / MEDIA EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifyFileUploaded(
  fileName: string,
  fileSize: string,
  uploadedBy: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "portfolio.project.updated", // reuse
    title: `File Uploaded: ${fileName}`,
    message: `${fileSize} — by ${uploadedBy}`,
    link: "/dashboard/media",
    key: `file-upload-${Date.now()}`,
    source: "system",
    categoryOverride: "SYSTEM",
  });
}

export async function notifyIntegrationConnected(
  integrationName: string,
  provider: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "system.backup.completed", // reuse
    title: `Integration Connected: ${integrationName}`,
    message: `Successfully connected to ${provider}`,
    link: "/dashboard/settings",
    key: `integration-${Date.now()}`,
    source: "system",
    categoryOverride: "SYSTEM",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOG EVENTS
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORT EVENTS
// ═══════════════════════════════════════════════════════════════════════════

export async function notifySupportTicketEscalated(
  ticketNumber: string,
  subject: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "support.ticket.escalated",
    title: `Ticket Escalated: ${ticketNumber}`,
    message: `"${subject}" has been escalated`,
    link: link || "/dashboard/support/tickets",
    source: "support",
    categoryOverride: "SUPPORT" as const,
    priorityOverride: "HIGH" as const,
  });
}

export async function notifySupportBulkAction(data: { userId?: string; ticketIds: string[]; action: string; value?: string }) {
  return sendNotification({
    eventKey: "support.ticket.bulk_action",
    title: `Bulk ${data.action} performed`,
    message: `${data.ticketIds.length} tickets updated (${data.action}${data.value ? ": " + data.value : ""})`,
    link: "/dashboard/support/tickets",
    source: "support",
    categoryOverride: "SUPPORT" as const,
  });
}

export async function notifySupportSlaBreach(ticket: { id: string; ticketNumber: string; subject: string }) {
  return sendNotification({
    eventKey: "support.sla.breach",
    title: `SLA Breach: ${ticket.ticketNumber}`,
    message: `SLA breached for "${ticket.subject}"`,
    link: `/dashboard/support/tickets/${ticket.id}`,
    source: "support",
    categoryOverride: "SUPPORT" as const,
    priorityOverride: "HIGH" as const,
  });
}

export async function notifyBlogComment(
  postTitle: string,
  commenterName: string,
  link?: string
): Promise<SendNotificationResult> {
  return sendNotification({
    eventKey: "portfolio.project.published", // reuse
    title: `New Comment on "${postTitle}"`,
    message: `By ${commenterName}`,
    link: link || "/dashboard/blog",
    key: `blog-comment-${Date.now()}`,
    source: "blog",
    categoryOverride: "NEWSLETTER",
  });
}
