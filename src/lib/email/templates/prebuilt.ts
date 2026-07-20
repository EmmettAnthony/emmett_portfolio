export interface PrebuiltTemplate {
  name: string;
  description: string;
  category: string;
  content: string;
  isBuiltIn: boolean;
}

// ─── Shared base styles ──────────────────────────────────────────────

const BASE_STYLES = `
body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
body{margin:0;padding:0;width:100%!important;height:100%!important;background-color:#f4f5f7}
.container{padding:20px 0;max-width:600px;margin:0 auto}
.card{background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center}
.header h1{margin:0;font-size:24px;font-weight:700;color:#ffffff}
.header p{margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85)}
.body{padding:32px 40px}
.body h2{margin:0 0 16px;font-size:18px;font-weight:600;color:#1e293b}
.body p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569}
.footer{background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0}
.footer p{margin:0;font-size:12px;color:#94a3b8}
.btn{display:inline-block;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;color:#ffffff!important;background:linear-gradient(135deg,#6366f1,#8b5cf6)}
.btn-secondary{display:inline-block;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;color:#6366f1!important;background:#f0f0ff;border:1px solid #c7d2fe}
.detail-row{padding:12px 16px;border-bottom:1px solid #f1f5f9}
.detail-row:last-child{border-bottom:none}
.detail-label{font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}
.detail-value{font-size:15px;color:#1e293b;margin-top:2px}
.highlight{background:#f0f0ff;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #6366f1}
.highlight p{margin:0;font-size:14px;color:#475569}`;

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${BASE_STYLES}</style></head>
<body style="background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div class="container">
<div class="card">
${content}
</div>
<div class="footer"><p>© ${new Date().getFullYear()} Emmett Anthony. All rights reserved.</p>
<p style="margin-top:4px">If you no longer wish to receive these emails, <a href="{{unsubscribe_url}}" style="color:#6366f1;text-decoration:underline">unsubscribe here</a>.</p>
</div></div></body></html>`;
}

// ─── Pre-built Templates ─────────────────────────────────────────────

export const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
  // ═══ Welcome ═══════════════════════════════════════════════════════
  {
    name: "Welcome Email",
    description: "A warm welcome for new subscribers or users after signup",
    category: "welcome",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Welcome Aboard! 🎉</h1><p>We're thrilled to have you join us</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>Welcome to the community! We're genuinely excited to have you on board. Your journey with us starts now, and we're here to support you every step of the way.</p>
        <div class="highlight">
          <p><strong>Here's what you can do next:</strong><br>
          ✨ Explore our features and see what's possible<br>
          📚 Check out our getting-started guide<br>
          💬 Join our community discussions</p>
        </div>
        <p style="text-align:center;margin:24px 0"><a href="{{dashboard_url}}" class="btn">Get Started</a></p>
        <p>If you have any questions, simply reply to this email. We'd love to hear from you!</p>
        <p style="margin-bottom:0">Best regards,<br><strong>{{company}}</strong></p>
      </div>
    `),
  },

  // ═══ Contact Confirmation ═══════════════════════════════════════════
  {
    name: "Contact Confirmation",
    description: "Auto-reply confirming that we received the contact form submission",
    category: "confirmation",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Message Received ✅</h1><p>We'll get back to you shortly</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>Thank you for reaching out! We've received your message and will respond within 24 hours.</p>
        <div class="highlight">
          <p><strong>Your message details:</strong></p>
          <div class="detail-row"><div class="detail-label">Name</div><div class="detail-value">{{first_name}} {{last_name}}</div></div>
          <div class="detail-row"><div class="detail-label">Email</div><div class="detail-value">{{email}}</div></div>
          <div class="detail-row"><div class="detail-label">Subject</div><div class="detail-value">{{subject}}</div></div>
        </div>
        <p>In the meantime, feel free to explore our <a href="{{portfolio_url}}" style="color:#6366f1">portfolio</a> to see examples of our work.</p>
        <p style="margin-bottom:0">Best regards,<br><strong>Emmett Anthony</strong></p>
      </div>
    `),
  },

  // ═══ Booking Confirmation ═══════════════════════════════════════════
  {
    name: "Booking Confirmation",
    description: "Sent when a consultation or meeting is booked successfully",
    category: "booking",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Booking Confirmed 📅</h1><p>Your meeting has been scheduled</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>Your booking has been confirmed! Here are the details:</p>
        <div class="highlight">
          <div class="detail-row"><div class="detail-label">Date</div><div class="detail-value">{{booking_date}}</div></div>
          <div class="detail-row"><div class="detail-label">Time</div><div class="detail-value">{{booking_time}}</div></div>
          <div class="detail-row"><div class="detail-label">Duration</div><div class="detail-value">{{booking_duration}}</div></div>
          <div class="detail-row"><div class="detail-label">Meeting Type</div><div class="detail-value">{{booking_type}}</div></div>
        </div>
        <p style="text-align:center;margin:24px 0"><a href="{{meeting_link}}" class="btn">Join Meeting</a></p>
        <p>Need to reschedule? <a href="{{reschedule_url}}" style="color:#6366f1">Click here</a> to manage your booking.</p>
        <p style="margin-bottom:0">Looking forward to speaking with you!<br><strong>Emmett Anthony</strong></p>
      </div>
    `),
  },

  // ═══ Meeting Reminder ═══════════════════════════════════════════════
  {
    name: "Meeting Reminder",
    description: "Reminder sent before a scheduled consultation or call",
    category: "reminder",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Meeting Reminder ⏰</h1><p>Your appointment is coming up soon</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>This is a friendly reminder about our upcoming meeting:</p>
        <div class="highlight">
          <div class="detail-row"><div class="detail-label">Date</div><div class="detail-value">{{booking_date}}</div></div>
          <div class="detail-row"><div class="detail-label">Time</div><div class="detail-value">{{booking_time}}</div></div>
          <div class="detail-row"><div class="detail-label">Duration</div><div class="detail-value">{{booking_duration}}</div></div>
        </div>
        <p style="text-align:center;margin:24px 0"><a href="{{meeting_link}}" class="btn">Join Meeting</a></p>
        <p style="font-size:13px;color:#94a3b8">📌 Please ensure you have a stable internet connection and a quiet environment for the call.</p>
        <p style="margin-bottom:0">See you soon!<br><strong>Emmett Anthony</strong></p>
      </div>
    `),
  },

  // ═══ Invoice ════════════════════════════════════════════════════════
  {
    name: "Invoice",
    description: "Professional invoice template for billing clients",
    category: "invoice",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Invoice #{{invoice_number}}</h1><p>Thank you for your business</p></div>
      <div class="body">
        <div style="display:flex;justify-content:space-between;margin-bottom:24px">
          <div><p style="font-size:12px;color:#64748b;margin:0">Bill To:</p><p style="font-weight:600;margin:4px 0 0">{{first_name}} {{last_name}}<br>{{company}}<br>{{email}}</p></div>
          <div style="text-align:right"><p style="font-size:12px;color:#64748b;margin:0">Invoice Date:</p><p style="font-weight:600;margin:4px 0 0">{{invoice_date}}</p></div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f8fafc"><th style="text-align:left;padding:10px 12px;font-size:12px;color:#64748b">Description</th>
          <th style="text-align:right;padding:10px 12px;font-size:12px;color:#64748b">Amount</th></tr>
          <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:12px;font-size:14px;color:#1e293b">{{item_description}}</td>
          <td style="padding:12px;text-align:right;font-size:14px;font-weight:600;color:#1e293b">{{amount}}</td></tr>
        </table>
        <div style="border-top:2px solid #1e293b;padding-top:12px;text-align:right">
          <p style="font-size:12px;color:#64748b;margin:0">Total Due</p>
          <p style="font-size:24px;font-weight:700;color:#1e293b;margin:4px 0 0">{{amount}}</p>
        </div>
        <p style="text-align:center;margin:24px 0"><a href="{{payment_url}}" class="btn">Pay Invoice</a></p>
        <p style="font-size:13px;color:#94a3b8;text-align:center">Payment is due within {{payment_terms}} days. Thank you for your prompt payment.</p>
      </div>
    `),
  },

  // ═══ Receipt ════════════════════════════════════════════════════════
  {
    name: "Payment Receipt",
    description: "Receipt confirming a payment was received",
    category: "confirmation",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Payment Received ✅</h1><p>Thank you for your payment</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>We've successfully received your payment. Here's your receipt:</p>
        <div class="highlight">
          <div class="detail-row"><div class="detail-label">Receipt #</div><div class="detail-value">{{receipt_number}}</div></div>
          <div class="detail-row"><div class="detail-label">Date</div><div class="detail-value">{{payment_date}}</div></div>
          <div class="detail-row"><div class="detail-label">Amount Paid</div><div class="detail-value">{{amount}}</div></div>
          <div class="detail-row"><div class="detail-label">Payment Method</div><div class="detail-value">{{payment_method}}</div></div>
          <div class="detail-row" style="border-bottom:none"><div class="detail-label">Status</div><div class="detail-value" style="color:#10b981;font-weight:600">Paid ✅</div></div>
        </div>
        <p>If you have any questions about this receipt, please contact us at <a href="mailto:{{support_email}}" style="color:#6366f1">{{support_email}}</a>.</p>
        <p style="margin-bottom:0">Thanks again for your business!<br><strong>{{company}}</strong></p>
      </div>
    `),
  },

  // ═══ Payment Confirmation ═══════════════════════════════════════════
  {
    name: "Payment Confirmation",
    description: "Confirmation that a payment was successfully processed",
    category: "confirmation",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Payment Confirmed 💳</h1><p>Your transaction was successful</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>Great news! Your payment of <strong>{{amount}}</strong> has been processed successfully.</p>
        <div class="highlight">
          <div class="detail-row"><div class="detail-label">Transaction ID</div><div class="detail-value">{{transaction_id}}</div></div>
          <div class="detail-row"><div class="detail-label">Project</div><div class="detail-value">{{project_name}}</div></div>
          <div class="detail-row"><div class="detail-label">Date</div><div class="detail-value">{{payment_date}}</div></div>
          <div class="detail-row" style="border-bottom:none"><div class="detail-label">Amount</div><div class="detail-value" style="font-size:18px;font-weight:700;color:#10b981">{{amount}}</div></div>
        </div>
        <p>Your project will continue as planned. We'll keep you updated on progress.</p>
        <p style="margin-bottom:0">Thank you for your trust!<br><strong>{{company}}</strong></p>
      </div>
    `),
  },

  // ═══ Password Reset ═════════════════════════════════════════════════
  {
    name: "Password Reset",
    description: "Secure password reset email for account recovery",
    category: "notification",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Reset Your Password 🔐</h1><p>We received a password reset request</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>We received a request to reset the password for your account associated with <strong>{{email}}</strong>.</p>
        <p style="text-align:center;margin:24px 0"><a href="{{reset_url}}" class="btn">Reset Password</a></p>
        <div class="highlight">
          <p><strong>Security tip:</strong> This link will expire in {{expiry_minutes}} minutes. If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
        </div>
        <p style="font-size:13px;color:#94a3b8">If the button above doesn't work, copy this link into your browser:<br><a href="{{reset_url}}" style="color:#6366f1;word-break:break-all">{{reset_url}}</a></p>
        <p style="margin-bottom:0">— The {{company}} Team</p>
      </div>
    `),
  },

  // ═══ Verify Email ═══════════════════════════════════════════════════
  {
    name: "Email Verification",
    description: "Verify a new email address with a secure link",
    category: "notification",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Verify Your Email ✉️</h1><p>Confirm your email address to get started</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>Thanks for signing up! Please verify your email address by clicking the button below.</p>
        <p style="text-align:center;margin:24px 0"><a href="{{verify_url}}" class="btn">Verify Email Address</a></p>
        <div class="highlight">
          <p>This link will expire in {{expiry_hours}} hours. If you didn't create an account, please ignore this email.</p>
        </div>
        <p style="font-size:13px;color:#94a3b8">Or copy this link: <a href="{{verify_url}}" style="color:#6366f1;word-break:break-all">{{verify_url}}</a></p>
        <p style="margin-bottom:0">Welcome aboard!<br><strong>{{company}}</strong></p>
      </div>
    `),
  },

  // ═══ Magic Link ═════════════════════════════════════════════════════
  {
    name: "Magic Link",
    description: "Passwordless login link sent for quick authentication",
    category: "notification",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Sign In Link 🔗</h1><p>Click the link below to sign in instantly</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>Click the button below to sign in to your account. No password needed!</p>
        <p style="text-align:center;margin:24px 0"><a href="{{magic_link_url}}" class="btn">Sign In to {{company}}</a></p>
        <div class="highlight">
          <p><strong>🔒 Secure login:</strong> This link is valid for {{expiry_minutes}} minutes and can only be used once. If you didn't request this link, please ignore this email.</p>
        </div>
        <p style="font-size:13px;color:#94a3b8">Or copy this link: <a href="{{magic_link_url}}" style="color:#6366f1;word-break:break-all">{{magic_link_url}}</a></p>
        <p style="margin-bottom:0">— The {{company}} Team</p>
      </div>
    `),
  },

  // ═══ Newsletter ═════════════════════════════════════════════════════
  {
    name: "Newsletter Template",
    description: "General purpose newsletter with header, body, and call-to-action",
    category: "newsletter",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>{{newsletter_title}}</h1><p>Stay up to date with the latest</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>Here's what's new this month at {{company}}.</p>
        <div style="margin:24px 0;border-radius:8px;overflow:hidden;background:#f8fafc">
          <div style="padding:20px"><h3 style="margin:0 0 8px;font-size:16px;color:#1e293b">{{article_1_title}}</h3>
          <p style="margin:0;font-size:14px;color:#475569">{{article_1_excerpt}}</p>
          <p style="margin:12px 0 0"><a href="{{article_1_url}}" style="color:#6366f1;font-size:13px;font-weight:600">Read more →</a></p></div>
        </div>
        <div style="margin:24px 0;border-radius:8px;overflow:hidden;background:#f8fafc">
          <div style="padding:20px"><h3 style="margin:0 0 8px;font-size:16px;color:#1e293b">{{article_2_title}}</h3>
          <p style="margin:0;font-size:14px;color:#475569">{{article_2_excerpt}}</p>
          <p style="margin:12px 0 0"><a href="{{article_2_url}}" style="color:#6366f1;font-size:13px;font-weight:600">Read more →</a></p></div>
        </div>
        <p style="text-align:center;margin:24px 0"><a href="{{blog_url}}" class="btn-secondary">View All Articles</a></p>
        <p>Thank you for being a valued reader. If you enjoy our content, please share it with others!</p>
        <p style="margin-bottom:0">Happy reading!<br><strong>The {{company}} Team</strong></p>
      </div>
    `),
  },

  // ═══ Project Started ════════════════════════════════════════════════
  {
    name: "Project Kickoff",
    description: "Notification that a new project has been started",
    category: "notification",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Project Kicked Off 🚀</h1><p>Let's build something great together</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>We're excited to announce that work on your project, <strong>{{project_name}}</strong>, has officially begun!</p>
        <div class="highlight">
          <p><strong>Project Details:</strong><br>
          📋 <strong>Scope:</strong> {{project_scope}}<br>
          📅 <strong>Estimated Completion:</strong> {{estimated_completion}}<br>
          💰 <strong>Budget:</strong> {{project_budget}}</p>
        </div>
        <p>Here's what to expect in the coming days:</p>
        <p>1️⃣ <strong>Discovery Phase</strong> — We'll analyze requirements and finalize the plan<br>
        2️⃣ <strong>Design & Development</strong> — We'll build your solution iteratively<br>
        3️⃣ <strong>Review & Feedback</strong> — You'll have opportunities to provide input<br>
        4️⃣ <strong>Launch</strong> — We'll deploy and optimize together</p>
        <p style="text-align:center;margin:24px 0"><a href="{{project_dashboard_url}}" class="btn">View Project Dashboard</a></p>
        <p>We'll keep you updated with regular progress reports. Let's make this amazing!</p>
        <p style="margin-bottom:0">Best regards,<br><strong>Emmett Anthony</strong></p>
      </div>
    `),
  },

  // ═══ Project Completed ══════════════════════════════════════════════
  {
    name: "Project Complete",
    description: "Notification that a project has been completed successfully",
    category: "notification",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Project Complete! 🎉</h1><p>Your project has been finished</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>We're thrilled to announce that <strong>{{project_name}}</strong> is now complete! 🚀</p>
        <div class="highlight">
          <p><strong>Project Summary:</strong><br>
          ✅ <strong>Completed On:</strong> {{completion_date}}<br>
          ✅ <strong>Total Duration:</strong> {{project_duration}}<br>
          ✅ <strong>Features Delivered:</strong> {{features_count}}<br>
          ✅ <strong>Status:</strong> <span style="color:#10b981">Successfully Delivered</span></p>
        </div>
        <p style="text-align:center;margin:24px 0"><a href="{{project_url}}" class="btn">View Live Project</a></p>
        <p>Thank you for trusting us with your project. We hope you love the result as much as we enjoyed building it!</p>
        <p>If you need any adjustments or have questions, don't hesitate to reach out. We're always here to help.</p>
        <p style="margin-bottom:0">With gratitude,<br><strong>Emmett Anthony</strong></p>
      </div>
    `),
  },

  // ═══ Review Request ═════════════════════════════════════════════════
  {
    name: "Review Request",
    description: "Politely ask clients or users for a review or testimonial",
    category: "notification",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>We'd Love Your Feedback ⭐</h1><p>Your opinion helps us improve</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>Thank you for working with us on <strong>{{project_name}}</strong>. We hope you're delighted with the results!</p>
        <p>We'd be incredibly grateful if you could take a moment to share your experience. Your feedback helps others make informed decisions and helps us continue to improve.</p>
        <div style="text-align:center;margin:24px 0">
          <p style="font-size:14px;color:#64748b;margin-bottom:12px">How was your experience?</p>
          <div style="font-size:32px;letter-spacing:8px;margin-bottom:16px">⭐ ⭐ ⭐ ⭐ ⭐</div>
          <a href="{{review_url}}" class="btn">Leave a Review</a>
        </div>
        <p>It was a pleasure working with you, and we look forward to future collaborations!</p>
        <p style="margin-bottom:0">Warmly,<br><strong>Emmett Anthony</strong></p>
      </div>
    `),
  },

  // ═══ Admin Notification ═════════════════════════════════════════════
  {
    name: "Admin Notification",
    description: "Internal alert for new leads, bookings, or system events",
    category: "notification",
    isBuiltIn: true,
    content: wrap(`
      <div class="header" style="background:linear-gradient(135deg,#f59e0b,#ef4444)"><h1>🔔 New {{event_type}}</h1><p>Action may be required</p></div>
      <div class="body">
        <h2>Admin Alert</h2>
        <p>A new event has occurred that requires your attention:</p>
        <div class="highlight">
          <div class="detail-row"><div class="detail-label">Event Type</div><div class="detail-value">{{event_type}}</div></div>
          <div class="detail-row"><div class="detail-label">From</div><div class="detail-value">{{event_source}}</div></div>
          <div class="detail-row"><div class="detail-label">Details</div><div class="detail-value">{{event_details}}</div></div>
          <div class="detail-row" style="border-bottom:none"><div class="detail-label">Time</div><div class="detail-value">{{event_time}}</div></div>
        </div>
        <p style="text-align:center;margin:24px 0"><a href="{{dashboard_url}}" class="btn">View in Dashboard</a></p>
      </div>
    `),
  },

  // ═══ Follow-up ══════════════════════════════════════════════════════
  {
    name: "Follow-up Email",
    description: "Polished follow-up after a meeting, consultation, or proposal",
    category: "notification",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>Great Connecting! 🤝</h1><p>Here's a quick follow-up</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>Thank you for taking the time to connect with me. I really enjoyed our conversation about {{topic}}.</p>
        <div class="highlight">
          <p><strong>Key points we discussed:</strong><br>
          📌 {{point_1}}<br>
          📌 {{point_2}}<br>
          📌 {{point_3}}</p>
        </div>
        <p>As promised, here are the next steps:</p>
        <p>1️⃣ I'll send over the proposal by {{proposal_date}}<br>
        2️⃣ We'll schedule a follow-up call to review<br>
        3️⃣ Once approved, we'll get started right away</p>
        <p>If anything comes to mind before then, don't hesitate to reach out. I'm here to help!</p>
        <p style="margin-bottom:0">Looking forward to working together,<br><strong>Emmett Anthony</strong></p>
      </div>
    `),
  },

  // ═══ Birthday / Anniversary ═════════════════════════════════════════
  {
    name: "Birthday Greeting",
    description: "Automated birthday email for subscribers or clients",
    category: "marketing",
    isBuiltIn: true,
    content: wrap(`
      <div class="header" style="background:linear-gradient(135deg,#ec4899,#f59e0b)"><h1>🎂 Happy Birthday!</h1><p>Celebrating you today</p></div>
      <div class="body">
        <h2>Happy Birthday, {{first_name}}! 🎉</h2>
        <p>We wanted to take a moment to wish you a fantastic birthday filled with joy, laughter, and great moments.</p>
        <div style="text-align:center;margin:32px 0">
          <div style="font-size:64px;margin-bottom:16px">🎂</div>
          <p style="font-size:18px;color:#1e293b;font-weight:600">As a special gift, enjoy {{birthday_offer}} off your next project! 🎁</p>
          <p style="margin:20px 0"><a href="{{claim_url}}" class="btn">Claim Your Gift</a></p>
          <p style="font-size:13px;color:#94a3b8">Offer expires in {{offer_expiry_days}} days</p>
        </div>
        <p>Thank you for being part of our community. We appreciate you!</p>
        <p style="margin-bottom:0">Warmest wishes,<br><strong>The {{company}} Team</strong></p>
      </div>
    `),
  },

  // ═══ Abandoned Cart / Re-engagement ════════════════════════════════
  {
    name: "Re-engagement Email",
    description: "Re-engage inactive subscribers or follow up on abandoned interest",
    category: "marketing",
    isBuiltIn: true,
    content: wrap(`
      <div class="header"><h1>We Miss You! 👋</h1><p>It's been a while since we last connected</p></div>
      <div class="body">
        <h2>Hi {{first_name}},</h2>
        <p>It's been a while since we last connected, and we wanted to check in. We've got some exciting new updates that we think you'll love!</p>
        <div style="margin:24px 0;text-align:center">
          <p style="font-size:14px;color:#64748b">✨ New features and improvements<br>
          📚 Fresh content and resources<br>
          💬 Active community discussions</p>
        </div>
        <p style="text-align:center;margin:24px 0"><a href="{{rejoin_url}}" class="btn">Come Back & Explore</a></p>
        <p>If you're no longer interested, that's okay too. You can <a href="{{unsubscribe_url}}" style="color:#6366f1">unsubscribe</a> to stop receiving these emails.</p>
        <p style="margin-bottom:0">Hope to see you again,<br><strong>The {{company}} Team</strong></p>
      </div>
    `),
  },
];

// ─── Categories with metadata ────────────────────────────────────────

export const TEMPLATE_CATEGORIES = [
  { value: "welcome", label: "Welcome", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "🎉" },
  { value: "confirmation", label: "Confirmation", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: "✅" },
  { value: "notification", label: "Notification", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "🔔" },
  { value: "newsletter", label: "Newsletter", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", icon: "📰" },
  { value: "invoice", label: "Invoice", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: "📄" },
  { value: "marketing", label: "Marketing", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: "📣" },
  { value: "booking", label: "Booking", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: "📅" },
  { value: "reminder", label: "Reminder", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: "⏰" },
  { value: "custom", label: "Custom", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", icon: "📝" },
] as const;
