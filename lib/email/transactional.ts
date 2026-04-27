/**
 * Transactional email sender.
 *
 * Uses nodemailer with SMTP (configurable via env vars).
 * Falls back to console.log in development when SMTP is not configured.
 *
 * In production, point SMTP_HOST at Resend's SMTP endpoint:
 *   Host: smtp.resend.com  Port: 465  User: resend  Pass: <your-api-key>
 */

import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null; // dev fallback
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM = process.env.SMTP_FROM ?? "SpotCast <noreply@spotcast.io>";

export async function sendEmail(opts: EmailOptions): Promise<void> {
  const transport = createTransport();

  if (!transport) {
    // Dev fallback — log to console
    console.log("\n📧 [EMAIL — not sent, SMTP not configured]");
    console.log(`  To:      ${opts.to}`);
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  Body:    ${opts.text ?? opts.html.replace(/<[^>]+>/g, " ")}\n`);
    return;
  }

  await transport.sendMail({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

// ── Password reset email ──────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Reset your SpotCast password",
    text: `Reset your password by visiting this link (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #4f46e5; padding: 24px 32px;">
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: white;">SpotCast</p>
    </div>
    <div style="padding: 32px;">
      <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px;">Reset your password</h1>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        We received a request to reset your password. Click the button below to choose a new one.
        This link expires in <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}"
         style="display: inline-block; background: #4f46e5; color: white; text-decoration: none;
                font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px;">
        Reset password
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0; line-height: 1.5;">
        If you didn&apos;t request this, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}
