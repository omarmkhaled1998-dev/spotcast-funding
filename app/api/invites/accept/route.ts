/**
 * Accept workspace invitation.
 *
 * GET /api/invites/accept?token=<token>
 *
 * Flow:
 *  1. Look up VerificationToken with this token value
 *  2. Parse identifier → "invite:<workspaceId>:<email>"
 *  3. If user is logged in: create/update WorkspaceMember (acceptedAt = now)
 *  4. If user is not logged in: redirect to /signup?callbackUrl=this_url
 *     (after signup, they'll be redirected back here)
 *  5. Delete the VerificationToken (single-use)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const APP_URL = process.env.NEXTAUTH_URL ?? "https://app.spotcast.io";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=InvalidInvite", APP_URL));
  }

  // Look up token
  const vt = await db.verificationToken.findUnique({ where: { token } });
  if (!vt || vt.expires < new Date()) {
    return NextResponse.redirect(new URL("/login?error=ExpiredInvite", APP_URL));
  }

  // Parse identifier
  const parts = vt.identifier.split(":");
  if (parts[0] !== "invite" || parts.length !== 3) {
    return NextResponse.redirect(new URL("/login?error=InvalidInvite", APP_URL));
  }
  const [, workspaceId, inviteeEmail] = parts;

  // Check if user is logged in
  const session = await auth();

  if (!session?.user?.id) {
    // Not logged in — redirect to signup/login with callbackUrl
    const callbackUrl = encodeURIComponent(`${APP_URL}/api/invites/accept?token=${token}`);
    return NextResponse.redirect(
      new URL(`/signup?callbackUrl=${callbackUrl}&email=${encodeURIComponent(inviteeEmail)}`, APP_URL)
    );
  }

  const userId = session.user.id;

  // Verify the logged-in user's email matches the invite email
  const dbUser = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (dbUser?.email?.toLowerCase() !== inviteeEmail.toLowerCase()) {
    // Wrong account — show an error
    return NextResponse.redirect(
      new URL(`/dashboard?error=InviteEmailMismatch&expected=${encodeURIComponent(inviteeEmail)}`, APP_URL)
    );
  }

  // Upsert the workspace member record
  const existing = await db.workspaceMember.findFirst({ where: { workspaceId, userId } });
  if (existing) {
    if (!existing.acceptedAt) {
      await db.workspaceMember.update({
        where: { id: existing.id },
        data: { acceptedAt: new Date() },
      });
    }
  } else {
    await db.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role: "MEMBER",
        acceptedAt: new Date(),
      },
    });
  }

  // Delete the used token
  await db.verificationToken.delete({ where: { token } });

  // Redirect to the workspace dashboard
  return NextResponse.redirect(new URL("/dashboard?welcome=1", APP_URL));
}
