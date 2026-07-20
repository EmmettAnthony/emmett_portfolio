import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPrisma } from "@/lib/db";
import { getResend } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/reset-password?token=${resetToken}`;

    try {
      const resend = getResend();
      await resend.emails.send({
        from: "Emmett Portfolio <onboarding@resend.dev>",
        to: email,
        subject: "Reset your password",
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr />
          <p style="color:#71717a;font-size:12px;">Emmett Portfolio Dashboard</p>
        `,
      });
    } catch {
      // Email sending is optional; token is still generated
    }

    return NextResponse.json({ message: "If an account exists, a reset email has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
