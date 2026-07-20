"use server";

import { prisma } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { getSiteSettings } from "@/lib/get-site-settings";

interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectType: string;
  budget?: string;
  timeline?: string;
  subject: string;
  message: string;
  fileUrl?: string;
  fileName?: string;
}

export async function submitContact(input: ContactInput) {
  const { name, email, phone, company, projectType, budget, timeline, subject, message, fileUrl, fileName } = input;

  const contact = await prisma.contact.create({
    data: {
      fullName: name,
      email,
      phone: phone || null,
      company: company || null,
      projectType,
      budget: budget || null,
      timeline: timeline || null,
      projectDetails: message,
      fileName: fileName || null,
      fileUrl: fileUrl || null,
      status: "NEW",
    },
  });

  try {
    const settings = await getSiteSettings();
    const resend = getResend();
    await resend.emails.send({
      from: `Contact Form <${process.env.RESEND_FROM_EMAIL || "noreply@emmettanthony.dev"}>`,
      to: settings.email,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ""}
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });
  } catch {
    return { success: true, id: contact.id, emailFailed: true };
  }

  return { success: true, id: contact.id };
}
