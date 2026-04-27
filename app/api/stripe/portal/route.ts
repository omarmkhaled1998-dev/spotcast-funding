/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session for the current workspace owner.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { getSubscription } from "@/lib/subscription";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    return NextResponse.json({ error: "No workspace found" }, { status: 400 });
  }

  const sub = await getSubscription(workspaceId);
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
