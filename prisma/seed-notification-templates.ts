// ──────────────────────────────────────────────────────────────────────────────
// Seed: Notification Templates
// ──────────────────────────────────────────────────────────────────────────────
// Pre-populates the notification_templates table with templates for every
// event type across all modules. Run with: npx tsx prisma/seed-notification-templates.ts
// ──────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db";

const templates = [
  // ─── CRM ──────────────────────────────────────────────────────────────
  {
    name: "crm.lead.created",
    label: "New CRM Lead",
    category: "CRM",
    priority: "MEDIUM",
    notifType: "INFO",
    title: "New CRM Lead: {{name}}",
    message: "From {{email}} via {{source}}",
    emailSubject: "New Lead: {{name}} from {{company}}",
    emailBody: `
      <h2>New Lead Created</h2>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Company:</strong> {{company}}</p>
      <p><strong>Source:</strong> {{source}}</p>
      <p><a href="{{siteUrl}}/dashboard/crm/leads">View in Dashboard</a></p>
    `.trim(),
    variables: ["name", "email", "company", "source", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Lead",
  },
  {
    name: "crm.deal.won",
    label: "Deal Won",
    category: "CRM",
    priority: "HIGH",
    notifType: "SUCCESS",
    title: "🎉 Deal Won: {{dealName}}",
    message: "{{clientName}} — ${{value}}",
    emailSubject: "Deal Won: {{dealName}} — ${{value}}",
    emailBody: `
      <h2>🎉 Deal Won!</h2>
      <p><strong>Deal:</strong> {{dealName}}</p>
      <p><strong>Client:</strong> {{clientName}}</p>
      <p><strong>Value:</strong> \${{value}}</p>
      <p><a href="{{siteUrl}}/dashboard/crm/deals">View Deal</a></p>
    `.trim(),
    variables: ["dealName", "clientName", "value", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Deal",
  },
  {
    name: "crm.deal.lost",
    label: "Deal Lost",
    category: "CRM",
    priority: "HIGH",
    notifType: "ERROR",
    title: "Deal Lost: {{dealName}}",
    message: "${{value}} — Reason: {{reason}}",
    emailSubject: "Deal Lost: {{dealName}}",
    emailBody: `
      <h2>Deal Lost</h2>
      <p><strong>Deal:</strong> {{dealName}}</p>
      <p><strong>Value:</strong> \${{value}}</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p><a href="{{siteUrl}}/dashboard/crm/deals">View Details</a></p>
    `.trim(),
    variables: ["dealName", "value", "reason", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "Review",
  },
  {
    name: "crm.client.created",
    label: "New Client",
    category: "CRM",
    priority: "HIGH",
    notifType: "SUCCESS",
    title: "New Client: {{name}}",
    message: "{{company}} — {{email}}",
    emailSubject: "New Client: {{name}} from {{company}}",
    emailBody: `
      <h2>New Client Created</h2>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Company:</strong> {{company}}</p>
      <p><a href="{{siteUrl}}/dashboard/crm/clients">View Client</a></p>
    `.trim(),
    variables: ["name", "email", "company", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Client",
  },
  {
    name: "crm.payment.failed",
    label: "Payment Failed",
    category: "CRM",
    priority: "HIGH",
    notifType: "ERROR",
    title: "❌ Payment Failed: ${{amount}}",
    message: "{{clientName}} — Invoice {{invoiceNumber}} — {{reason}}",
    emailSubject: "❌ Payment Failed — Invoice {{invoiceNumber}}",
    emailBody: `
      <h2>Payment Failed</h2>
      <p><strong>Client:</strong> {{clientName}}</p>
      <p><strong>Invoice:</strong> {{invoiceNumber}}</p>
      <p><strong>Amount:</strong> \${{amount}}</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p><a href="{{siteUrl}}/dashboard/crm/invoices">View Invoices</a></p>
    `.trim(),
    variables: ["clientName", "invoiceNumber", "amount", "reason", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Invoice",
  },
  {
    name: "crm.invoice.paid",
    label: "Invoice Paid",
    category: "CRM",
    priority: "HIGH",
    notifType: "SUCCESS",
    title: "✅ Invoice Paid: {{invoiceNumber}}",
    message: "{{clientName}} — ${{amount}} (paid {{paidDate}})",
    emailSubject: "✅ Invoice Paid — {{invoiceNumber}}",
    emailBody: `
      <h2>Invoice Paid</h2>
      <p><strong>Client:</strong> {{clientName}}</p>
      <p><strong>Invoice:</strong> {{invoiceNumber}}</p>
      <p><strong>Amount:</strong> \${{amount}}</p>
      <p><strong>Paid Date:</strong> {{paidDate}}</p>
      <p><a href="{{siteUrl}}/dashboard/crm/invoices">View Invoices</a></p>
    `.trim(),
    variables: ["clientName", "invoiceNumber", "amount", "paidDate", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Invoice",
  },
  {
    name: "crm.proposal.approved",
    label: "Proposal Approved",
    category: "CRM",
    priority: "HIGH",
    notifType: "SUCCESS",
    title: "Proposal Approved: {{proposalTitle}}",
    message: "Approved by {{clientName}}",
    emailSubject: "Proposal Approved: {{proposalTitle}}",
    emailBody: `
      <h2>Proposal Approved!</h2>
      <p><strong>Proposal:</strong> {{proposalTitle}}</p>
      <p><strong>Client:</strong> {{clientName}}</p>
      <p><a href="{{siteUrl}}/dashboard/crm/proposals">View Proposal</a></p>
    `.trim(),
    variables: ["proposalTitle", "clientName", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Proposal",
  },

  // ─── Contact ──────────────────────────────────────────────────────────
  {
    name: "contact.submission.new",
    label: "New Contact Form Submission",
    category: "CONTACT",
    priority: "MEDIUM",
    notifType: "INFO",
    title: "New Contact: {{name}}",
    message: "{{email}} — {{projectType}}",
    emailSubject: "New Inquiry from {{name}} — {{projectType}}",
    emailBody: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Project Type:</strong> {{projectType}}</p>
      <p><strong>Company:</strong> {{company}}</p>
      <p><a href="{{siteUrl}}/dashboard/contact/submissions">View in Dashboard</a></p>
    `.trim(),
    variables: ["name", "email", "projectType", "company", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Submission",
  },
  {
    name: "contact.service_inquiry",
    label: "New Service Inquiry",
    category: "CONTACT",
    priority: "MEDIUM",
    notifType: "INFO",
    title: "Service Inquiry: {{name}}",
    message: "{{email}} interested in {{serviceName}}",
    emailSubject: "Service Inquiry: {{name}} — {{serviceName}}",
    emailBody: `
      <h2>New Service Inquiry</h2>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Service:</strong> {{serviceName}}</p>
      <p><a href="{{siteUrl}}/dashboard/services/inquiries">View Inquiry</a></p>
    `.trim(),
    variables: ["name", "email", "serviceName", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Inquiry",
  },
  {
    name: "contact.quote_request",
    label: "Quote Request",
    category: "CONTACT",
    priority: "MEDIUM",
    notifType: "INFO",
    title: "Quote Request: {{name}}",
    message: "{{email}} — Budget: {{budget}}",
    emailSubject: "Quote Request from {{name}}",
    emailBody: `
      <h2>Quote Request</h2>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Budget:</strong> {{budget}}</p>
      <p><strong>Details:</strong> {{details}}</p>
      <p><a href="{{siteUrl}}/dashboard/contact/submissions">View Details</a></p>
    `.trim(),
    variables: ["name", "email", "budget", "details", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Request",
  },

  // ─── Calendar / Booking ──────────────────────────────────────────────
  {
    name: "calendar.appointment.booked",
    label: "Appointment Booked",
    category: "CALENDAR",
    priority: "MEDIUM",
    notifType: "INFO",
    title: "New Booking: {{name}}",
    message: "{{meetingType}} on {{date}} — {{email}}",
    emailSubject: "New Booking: {{name}} — {{date}}",
    emailBody: `
      <h2>New Appointment Booked</h2>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Meeting Type:</strong> {{meetingType}}</p>
      <p><strong>Date:</strong> {{date}}</p>
      <p><strong>Time:</strong> {{time}}</p>
      <p><a href="{{siteUrl}}/dashboard/calendar/appointments">View Appointment</a></p>
    `.trim(),
    variables: ["name", "email", "meetingType", "date", "time", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Booking",
  },
  {
    name: "calendar.appointment.cancelled",
    label: "Appointment Cancelled",
    category: "CALENDAR",
    priority: "LOW",
    notifType: "WARNING",
    title: "Booking Cancelled: {{name}}",
    message: "{{date}} — Reason: {{reason}}",
    emailSubject: "Booking Cancelled: {{name}}",
    emailBody: `
      <h2>Appointment Cancelled</h2>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Date:</strong> {{date}}</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p><a href="{{siteUrl}}/dashboard/calendar/appointments">View Appointments</a></p>
    `.trim(),
    variables: ["name", "date", "reason", "siteUrl"],
    channels: ["IN_APP"],
    actionLabel: "View Calendar",
  },
  {
    name: "calendar.appointment.rescheduled",
    label: "Booking Rescheduled",
    category: "CALENDAR",
    priority: "MEDIUM",
    notifType: "WARNING",
    title: "Booking Rescheduled: {{name}}",
    message: "{{email}} — moved from {{oldDate}} to {{newDate}}",
    emailSubject: "Booking Rescheduled: {{name}}",
    emailBody: `
      <h2>Booking Rescheduled</h2>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Old Date:</strong> {{oldDate}}</p>
      <p><strong>New Date:</strong> {{newDate}}</p>
      <p><a href="{{siteUrl}}/dashboard/calendar/appointments">View Appointments</a></p>
    `.trim(),
    variables: ["name", "email", "oldDate", "newDate", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Booking",
  },
  {
    name: "calendar.meeting.completed",
    label: "Meeting Completed",
    category: "CALENDAR",
    priority: "LOW",
    notifType: "INFO",
    title: "Meeting Completed: {{name}}",
    message: "{{meetingType}} has ended",
    channels: ["IN_APP"],
    variables: ["name", "meetingType"],
  },
  {
    name: "calendar.appointment.reminder",
    label: "Appointment Reminder",
    category: "CALENDAR",
    priority: "HIGH",
    notifType: "INFO",
    title: "⏰ Meeting Reminder: {{name}}",
    message: "{{date}} at {{time}}",
    emailSubject: "Reminder: Meeting with {{name}} at {{time}}",
    emailBody: `
      <h2>Meeting Reminder</h2>
      <p><strong>With:</strong> {{name}}</p>
      <p><strong>Date:</strong> {{date}}</p>
      <p><strong>Time:</strong> {{time}}</p>
      <p><strong>Type:</strong> {{meetingType}}</p>
      <p><a href="{{siteUrl}}/dashboard/calendar">View Calendar</a></p>
    `.trim(),
    variables: ["name", "date", "time", "meetingType", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "Open Calendar",
  },
  {
    name: "calendar.meeting.starting_soon",
    label: "Meeting Starting Soon",
    category: "CALENDAR",
    priority: "CRITICAL",
    notifType: "WARNING",
    title: "🔔 Meeting Starting Soon: {{name}}",
    message: "{{meetingType}} starts in 5 minutes",
    emailSubject: "Starting Soon: {{name}}",
    emailBody: `
      <h2>Meeting Starting Now</h2>
      <p><strong>With:</strong> {{name}}</p>
      <p><strong>Type:</strong> {{meetingType}}</p>
      <p><a href="{{meetingLink}}">Join Meeting</a></p>
    `.trim(),
    variables: ["name", "meetingType", "meetingLink"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "Join Meeting",
  },

  // ─── Portfolio ────────────────────────────────────────────────────────
  {
    name: "portfolio.project.published",
    label: "Project Published",
    category: "PORTFOLIO",
    priority: "MEDIUM",
    notifType: "SUCCESS",
    title: "Published: {{projectTitle}}",
    message: "A new project has been published to your portfolio",
    emailSubject: "Portfolio Published: {{projectTitle}}",
    emailBody: `
      <h2>Project Published</h2>
      <p><strong>Project:</strong> {{projectTitle}}</p>
      <p><a href="{{siteUrl}}/dashboard/portfolio">View Portfolio</a></p>
    `.trim(),
    variables: ["projectTitle", "siteUrl"],
    channels: ["IN_APP"],
    actionLabel: "View Project",
  },
  {
    name: "portfolio.project.updated",
    label: "Project Updated",
    category: "PORTFOLIO",
    priority: "LOW",
    notifType: "INFO",
    title: "Updated: {{projectTitle}}",
    message: "Project details have been modified",
    channels: ["IN_APP"],
    variables: ["projectTitle"],
  },
  {
    name: "portfolio.inquiry.received",
    label: "Portfolio Inquiry",
    category: "PORTFOLIO",
    priority: "MEDIUM",
    notifType: "INFO",
    title: "Portfolio Inquiry: {{name}}",
    message: "{{email}} inquired about \"{{projectTitle}}\"",
    emailSubject: "Portfolio Inquiry from {{name}}",
    emailBody: `
      <h2>Portfolio Inquiry</h2>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Project:</strong> {{projectTitle}}</p>
      <p><a href="{{siteUrl}}/dashboard/contact/submissions">View Details</a></p>
    `.trim(),
    variables: ["name", "email", "projectTitle", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Inquiry",
  },

  // ─── Newsletter ───────────────────────────────────────────────────────
  {
    name: "newsletter.subscriber.new",
    label: "New Subscriber",
    category: "NEWSLETTER",
    priority: "LOW",
    notifType: "INFO",
    title: "New Subscriber: {{name}}",
    message: "{{email}} subscribed via {{source}}",
    channels: ["IN_APP"],
    variables: ["name", "email", "source"],
  },
  {
    name: "newsletter.campaign.sent",
    label: "Campaign Sent",
    category: "NEWSLETTER",
    priority: "MEDIUM",
    notifType: "SUCCESS",
    title: "Campaign Sent: {{campaignName}}",
    message: "Delivered to {{count}} subscribers",
    channels: ["IN_APP"],
    variables: ["campaignName", "count"],
    actionLabel: "View Campaign",
  },
  {
    name: "newsletter.campaign.completed",
    label: "Campaign Complete",
    category: "NEWSLETTER",
    priority: "LOW",
    notifType: "SUCCESS",
    title: "Campaign Complete: {{campaignName}}",
    message: "All emails have been delivered",
    channels: ["IN_APP"],
    variables: ["campaignName"],
  },
  {
    name: "newsletter.unsubscribe.request",
    label: "Unsubscribe Request",
    category: "NEWSLETTER",
    priority: "LOW",
    notifType: "WARNING",
    title: "Subscriber Unsubscribed",
    message: "{{email}} — Reason: {{reason}}",
    channels: ["IN_APP"],
    variables: ["email", "reason"],
  },

  // ─── Resume ───────────────────────────────────────────────────────────
  {
    name: "resume.downloaded",
    label: "Resume Downloaded",
    category: "RESUME",
    priority: "LOW",
    notifType: "INFO",
    title: "Resume Downloaded",
    message: "{{visitorName}} downloaded your resume ({{template}})",
    channels: ["IN_APP"],
    variables: ["visitorName", "template"],
  },
  {
    name: "resume.viewed",
    label: "Resume Viewed",
    category: "RESUME",
    priority: "LOW",
    notifType: "INFO",
    title: "Resume Viewed",
    message: "{{visitorName}} viewed your resume",
    channels: ["IN_APP"],
    variables: ["visitorName"],
  },

  // ─── Testimonial ──────────────────────────────────────────────────────
  {
    name: "testimonial.new.submitted",
    label: "New Testimonial",
    category: "TESTIMONIAL",
    priority: "MEDIUM",
    notifType: "INFO",
    title: "New Testimonial from {{name}}",
    message: "Rating: {{rating}}/5",
    emailSubject: "New Testimonial from {{name}}",
    emailBody: `
      <h2>New Testimonial Received</h2>
      <p><strong>From:</strong> {{name}}</p>
      <p><strong>Rating:</strong> {{rating}}/5</p>
      <p><a href="{{siteUrl}}/dashboard/testimonials">Review Testimonial</a></p>
    `.trim(),
    variables: ["name", "rating", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "Review",
  },
  {
    name: "testimonial.approved",
    label: "Testimonial Approved",
    category: "TESTIMONIAL",
    priority: "LOW",
    notifType: "SUCCESS",
    title: "Testimonial Approved: {{name}}",
    message: "Now live on your site",
    channels: ["IN_APP"],
    variables: ["name"],
  },

  // ─── System / Security ────────────────────────────────────────────────
  {
    name: "system.user.login",
    label: "User Login",
    category: "SYSTEM",
    priority: "LOW",
    notifType: "INFO",
    title: "User Login: {{userName}}",
    message: "IP: {{ipAddress}}",
    channels: ["IN_APP"],
    variables: ["userName", "ipAddress"],
  },
  {
    name: "system.security.alert",
    label: "Security Alert",
    category: "SYSTEM",
    priority: "CRITICAL",
    notifType: "ERROR",
    title: "🚨 Security Alert: {{alertType}}",
    message: "{{description}}",
    emailSubject: "🚨 SECURITY ALERT: {{alertType}}",
    emailBody: `
      <h2>🚨 Security Alert</h2>
      <p><strong>Type:</strong> {{alertType}}</p>
      <p><strong>Description:</strong> {{description}}</p>
      <p><strong>Time:</strong> {{time}}</p>
      <p><a href="{{siteUrl}}/dashboard/activity/security">View Security Center</a></p>
    `.trim(),
    variables: ["alertType", "description", "time", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Security",
  },
  {
    name: "system.backup.completed",
    label: "Backup Complete",
    category: "SYSTEM",
    priority: "LOW",
    notifType: "SUCCESS",
    title: "Backup Complete",
    message: "{{backupType}} ({{size}}) completed successfully",
    channels: ["IN_APP"],
    variables: ["backupType", "size"],
  },
  {
    name: "system.storage.warning",
    label: "Storage Warning",
    category: "SYSTEM",
    priority: "HIGH",
    notifType: "WARNING",
    title: "⚠️ Storage Warning",
    message: "{{used}} of {{total}} used ({{percentage}}%)",
    emailSubject: "⚠️ Storage Warning — {{percentage}}% Full",
    emailBody: `
      <h2>Storage Warning</h2>
      <p><strong>Used:</strong> {{used}}</p>
      <p><strong>Total:</strong> {{total}}</p>
      <p><strong>Percentage:</strong> {{percentage}}%</p>
      <p><a href="{{siteUrl}}/dashboard/settings">Manage Storage</a></p>
    `.trim(),
    variables: ["used", "total", "percentage", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "Manage Storage",
  },
  {
    name: "system.error",
    label: "System Error",
    category: "SYSTEM",
    priority: "CRITICAL",
    notifType: "ERROR",
    title: "System Error: {{module}}",
    message: "{{errorMessage}}",
    emailSubject: "🚨 SYSTEM ERROR: {{module}}",
    emailBody: `
      <h2>System Error</h2>
      <p><strong>Module:</strong> {{module}}</p>
      <p><strong>Error:</strong> {{errorMessage}}</p>
      <p><strong>Time:</strong> {{time}}</p>
      <p><a href="{{siteUrl}}/dashboard/activity/logs">View Error Logs</a></p>
    `.trim(),
    variables: ["module", "errorMessage", "time", "siteUrl"],
    channels: ["IN_APP", "EMAIL"],
    actionLabel: "View Logs",
  },
];

async function main() {
  console.log("🌱 Seeding notification templates...\n");

  let created = 0;
  let updated = 0;

  for (const tpl of templates) {
    const existing = await prisma.notificationTemplate.findUnique({
      where: { name: tpl.name },
    });

    if (existing) {
      await prisma.notificationTemplate.update({
        where: { name: tpl.name },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type compat
        data: tpl as any,
      });
      updated++;
    } else {
      await prisma.notificationTemplate.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma create type compat
        data: tpl as any,
      });
      created++;
    }
  }

  console.log(`  ✓ ${created} templates created`);
  console.log(`  ✓ ${updated} templates updated`);
  console.log(`  ✓ ${templates.length} total notification templates\n`);
  console.log("Done!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
