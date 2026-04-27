"use server";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { sendEmail } from "@/lib/email/transactional";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { WorkspaceRole } from "@/app/generated/prisma/client";

const APP_URL = process.env.NEXTAUTH_URL ?? "https://app.spotcast.io";

// Plan member limits
const MEMBER_LIMITS: Record<string, number> = {
  INDIVIDUAL: 1,
  BASE: 5,
  BASE_PLUS_ALERTS: 5,
  DEFAULT: 1,
};

/**
 * Invite a new member by email.
 * Creates a pending WorkspaceMember (acceptedAt = null) + sends invite email.
 */
export async function inviteMember(formData: FormData) {
  const { workspaceId, userId, role } = await getWorkspaceContext();

  // Only OWNER / ADMIN can invite
  if (role !== "OWNER" && role !== "ADMIN") {
    return { error: "You don't have permission to invite members." };
  }

  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const inviteRole = (formData.get("role") as WorkspaceRole) ?? "MEMBER";

  if (!email) return { error: "Email is required." };
  if (!["ADMIN", "MEMBER", "VIEWER"].includes(inviteRole)) {
    return { error: "Invalid role." };
  }

  // Check plan member limit
  const [subscription, currentCount] = await Promise.all([
    db.subscription.findUnique({ where: { workspaceId }, select: { planType: true } }),
    db.workspaceMember.count({ where: { workspaceId } }),
  ]);
  const planType = subscription?.planType ?? "DEFAULT";
  const limit = MEMBER_LIMITS[planType] ?? 1;
  if (currentCount >= limit) {
    return { error: `Your plan allows up to ${limit} member${limit === 1 ? "" : "s"}. Upgrade to add more.` };
  }

  // Check if already a member
  const inviteeUser = await db.user.findUnique({ where: { email } });
  if (inviteeUser) {
    const existing = await db.workspaceMember.findFirst({
      where: { workspaceId, userId: inviteeUser.id },
    });
    if (existing) {
      return { error: "This person is already a member of the workspace." };
    }
  }

  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
  const inviter = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });

  // Create or re-use invite token via VerificationToken
  const token = crypto.randomBytes(32).toString("hex");
  const identifier = `invite:${workspaceId}:${email}`;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Delete any existing invite for this workspace+email
  await db.verificationToken.deleteMany({ where: { identifier } });

  await db.verificationToken.create({
    data: { identifier, token, expires },
  });

  // If the user already exists, create a pending WorkspaceMember now
  // (they'll confirm by clicking the link; for new users the record is created on signup)
  if (inviteeUser) {
    const alreadyPending = await db.workspaceMember.findFirst({
      where: { workspaceId, userId: inviteeUser.id },
    });
    if (!alreadyPending) {
      await db.workspaceMember.create({
        data: {
          workspaceId,
          userId: inviteeUser.id,
          role: inviteRole,
          // acceptedAt left null — pending
        },
      });
    }
  }

  // Send invitation email
  const acceptUrl = `${APP_URL}/api/invites/accept?token=${token}`;
  await sendInviteEmail({
    to: email,
    inviterName: inviter?.name ?? inviter?.email ?? "A teammate",
    workspaceName: workspace?.name ?? "a workspace",
    acceptUrl,
    role: inviteRole,
  });

  revalidatePath("/settings/members");
  return { success: true };
}

/**
 * Remove a member from the workspace.
 */
export async function removeMember(memberId: string) {
  const { workspaceId, role } = await getWorkspaceContext();
  if (role !== "OWNER" && role !== "ADMIN") {
    return { error: "Insufficient permissions." };
  }

  const member = await db.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });
  if (!member) return { error: "Member not found." };
  if (member.role === "OWNER") return { error: "Cannot remove the workspace owner." };

  await db.workspaceMember.delete({ where: { id: memberId } });
  revalidatePath("/settings/members");
  return { success: true };
}

/**
 * Update a member's role.
 */
export async function updateMemberRole(memberId: string, newRole: WorkspaceRole) {
  const { workspaceId, role } = await getWorkspaceContext();
  if (role !== "OWNER") {
    return { error: "Only the workspace owner can change roles." };
  }

  const member = await db.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });
  if (!member) return { error: "Member not found." };
  if (member.role === "OWNER") return { error: "Cannot change the owner's role." };

  await db.workspaceMember.update({ where: { id: memberId }, data: { role: newRole } });
  revalidatePath("/settings/members");
  return { success: true };
}

// ── Invite email ──────────────────────────────────────────────────────────────

async function sendInviteEmail({
  to,
  inviterName,
  workspaceName,
  acceptUrl,
  role,
}: {
  to: string;
  inviterName: string;
  workspaceName: string;
  acceptUrl: string;
  role: string;
}) {
  const roleLabel = role === "ADMIN" ? "Admin" : role === "VIEWER" ? "Viewer" : "Member";

  await sendEmail({
    to,
    subject: `${inviterName} invited you to ${workspaceName} on SpotCast`,
    text: `You've been invited to join ${workspaceName} as a ${roleLabel}.\n\nAccept your invitation: ${acceptUrl}\n\nThis link expires in 7 days.`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:#4f46e5;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:white;">SpotCast</p>
    </div>
    <div style="padding:32px;">
      <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 12px;">You're invited!</h1>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
        <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong>
        on SpotCast as a <strong>${roleLabel}</strong>.
      </p>
      <a href="${acceptUrl}"
         style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">
        Accept invitation
      </a>
      <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;line-height:1.5;">
        This invitation expires in 7 days. If you didn't expect this, you can ignore it.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}
