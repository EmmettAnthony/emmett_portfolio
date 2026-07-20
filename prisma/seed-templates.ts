import { prisma } from "@/lib/db";

const defaults = [
  {
    name: "contact_owner",
    label: "Contact Form — Owner Notification",
    subject: "[Portfolio Inquiry] {{projectType}} — {{fullName}}",
    htmlBody: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;border-radius:12px 12px 0 0;">
    <h1 style="color:white;margin:0;font-size:24px;">New Project Inquiry</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">From {{fullName}}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;background:#fafafa;padding:24px;">
    {{#fields}}
    <tr>
      <td style="padding:10px 16px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eee;">{{label}}</td>
      <td style="padding:10px 16px;color:#333;border-bottom:1px solid #eee;">{{value}}</td>
    </tr>
    {{/fields}}
  </table>
  <div style="padding:24px;background:white;border-radius:0 0 12px 12px;">
    <h3 style="margin:0 0 8px;color:#333;">Project Details</h3>
    <p style="line-height:1.6;color:#555;">{{projectDetails}}</p>
  </div>
</div>`,
    variables: JSON.stringify(["fullName", "email", "projectType", "company", "phone", "budget", "timeline", "projectDetails"]),
  },
  {
    name: "contact_auto_reply",
    label: "Contact Form — Client Auto-Reply",
    subject: "Thank you for contacting me — {{fullName}}",
    htmlBody: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:24px;">Thank You for Reaching Out!</h1>
  </div>
  <div style="padding:32px;background:white;border-radius:0 0 12px 12px;">
    <p style="font-size:16px;color:#333;line-height:1.6;">Hi {{fullName}},</p>
    <p style="font-size:16px;color:#555;line-height:1.6;">Thank you for contacting me regarding your <strong>{{projectType}}</strong> project. I have received your inquiry and will review it within 24 hours.</p>
    <p style="font-size:16px;color:#555;line-height:1.6;">In the meantime, feel free to browse my portfolio and blog for examples of my work and insights on web development.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="{{siteUrl}}/portfolio" style="display:inline-block;background:#18181b;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">View My Portfolio</a>
    </div>
    <p style="font-size:16px;color:#555;line-height:1.6;">Best regards,<br /><strong>Emmett Anthony</strong><br />Professional Software Developer</p>
  </div>
</div>`,
    variables: JSON.stringify(["fullName", "projectType", "siteUrl"]),
  },
  {
    name: "booking_owner",
    label: "Booking — Owner Notification",
    subject: "[Booking] Consultation request from {{name}}",
    htmlBody: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;border-radius:12px 12px 0 0;">
    <h1 style="color:white;margin:0;font-size:24px;">New Consultation Booking</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">From {{name}}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;background:#fafafa;padding:24px;">
    {{#fields}}
    <tr>
      <td style="padding:10px 16px;font-weight:600;color:#555;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eee;">{{label}}</td>
      <td style="padding:10px 16px;color:#333;border-bottom:1px solid #eee;">{{value}}</td>
    </tr>
    {{/fields}}
  </table>
  {{#message}}<div style="padding:24px;background:white;border-radius:0 0 12px 12px;"><h3 style="margin:0 0 8px;color:#333;">Message</h3><p style="line-height:1.6;color:#555;">{{message}}</p></div>{{/message}}
</div>`,
    variables: JSON.stringify(["name", "email", "phone", "company", "date", "time", "projectType", "message"]),
  },
  {
    name: "booking_auto_reply",
    label: "Booking — Client Auto-Reply",
    subject: "Booking confirmed — {{name}}",
    htmlBody: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:24px;">Booking Request Received!</h1>
  </div>
  <div style="padding:32px;background:white;border-radius:0 0 12px 12px;">
    <p style="font-size:16px;color:#333;line-height:1.6;">Hi {{name}},</p>
    <p style="font-size:16px;color:#555;line-height:1.6;">Thank you for booking a consultation{{#time}} on <strong>{{date}} at {{time}}</strong>{{/time}}{{^time}} on <strong>{{date}}</strong>{{/time}}. I will review your request and send a calendar invitation shortly.</p>
    <div style="margin:24px 0;text-align:center;">
      <a href="{{siteUrl}}/portfolio" style="display:inline-block;background:#18181b;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">View My Portfolio</a>
    </div>
    <p style="font-size:16px;color:#555;line-height:1.6;">Best regards,<br /><strong>Emmett Anthony</strong></p>
  </div>
</div>`,
    variables: JSON.stringify(["name", "date", "time", "siteUrl"]),
  },
];

async function seed() {
  for (const tpl of defaults) {
    await prisma.emailTemplate.upsert({
      where: { name: tpl.name },
      update: { label: tpl.label, subject: tpl.subject, htmlBody: tpl.htmlBody, variables: tpl.variables },
      create: tpl,
    });
    console.log(`  ✓ ${tpl.name}`);
  }
  console.log("Done!");
}

seed().catch(console.error);
