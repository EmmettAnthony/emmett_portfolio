// ──────────────────────────────────────────────────────────────────────────────
// Notification Service — Barrel Exports
// ──────────────────────────────────────────────────────────────────────────────

export {
  sendNotification,
  sendNotificationFromTemplate,
  markNotificationRead,
  getUnreadCount,
  interpolate,
} from "./notification-service";

export type {
  NotificationPayload,
  SendNotificationResult,
} from "./notification-service";

export {
  notifyCrmLeadCreated,
  notifyCrmLeadStatusChanged,
  notifyCrmDealWon,
  notifyCrmDealLost,
  notifyCrmProposalApproved,
  notifyNewContactSubmission,
  notifyServiceInquiry,
  notifyAppointmentBooked,
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  notifyAppointmentReminder,
  notifyMeetingCompleted,
  notifyMeetingStartingSoon,
  notifyProjectPublished,
  notifyProjectUpdated,
  notifyPortfolioInquiry,
  notifyNewSubscriber,
  notifyCampaignSent,
  notifyCampaignCompleted,
  notifyUnsubscribeRequest,
  notifyResumeDownloaded,
  notifyResumeViewed,
  notifyNewTestimonial,
  notifyTestimonialApproved,
  notifyUserLogin,
  notifySecurityAlert,
  notifySystemError,
  notifyBackupCompleted,
  notifyStorageWarning,
  notifyPaymentReceived,
  notifyPaymentFailed,
  notifyInvoicePaid,
  notifyInvoiceOverdue,
  notifyChatStarted,
  notifyChatEscalated,
  notifyFailedLogin,
  notifyPasswordChanged,
  notifyFileUploaded,
  notifyIntegrationConnected,
  notifyBlogComment,
  notifySupportTicketEscalated,
  notifySupportBulkAction,
  notifySupportSlaBreach,
} from "./event-handlers";
