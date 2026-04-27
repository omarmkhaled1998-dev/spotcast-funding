"use server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/transactional";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ── Request password reset ────────────────────────────────────────────────────

export async function requestPasswordReset(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true } });

  // Always return success to avoid email enumeration
  if (!user) return { success: true };

  // Generate a secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Upsert the token — one reset per email at a time
  await db.verificationToken.deleteMany({ where: { identifier: email } });
  await db.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendPasswordResetEmail(email, resetUrl);

  return { success: true };
}

// ── Validate reset token ──────────────────────────────────────────────────────

export async function validateResetToken(
  token: string,
  email: string
): Promise<boolean> {
  const record = await db.verificationToken.findFirst({
    where: {
      token,
      identifier: email.toLowerCase(),
      expires: { gt: new Date() },
    },
  });
  return !!record;
}

// ── Reset password ────────────────────────────────────────────────────────────

export async function resetPassword(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const token = formData.get("token") as string;
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !email) return { error: "Invalid reset link." };
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  // Verify token is still valid
  const record = await db.verificationToken.findFirst({
    where: {
      token,
      identifier: email,
      expires: { gt: new Date() },
    },
  });

  if (!record) return { error: "This reset link has expired or is invalid. Please request a new one." };

  // Update password
  const hashed = await bcrypt.hash(password, 12);
  const updated = await db.user.updateMany({
    where: { email },
    data: { password: hashed },
  });

  if (updated.count === 0) return { error: "Account not found." };

  // Consume the token
  await db.verificationToken.deleteMany({ where: { identifier: email, token } });

  return { success: true };
}
