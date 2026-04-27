/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout Session for the workspace and returns the URL.
 *
 * Body: { plan: "INDIVIDUAL" | "ORG" | "ORG_PLUS_ALERTS" }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { db } from "@/lib/db";
import { stripe, PRICES } from "@/lib/stripe";
import { getSubscription, isSubscriptionActive } from "@/lib/subscription";

export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));
  const plan = (body.plan ?? "ORG") as "INDIVIDUAL" | "ORG" | "ORG_PLUS_ALERTS";

  // Don't create a second checkout if already active
  const existing = await getSubscription(workspaceId);
  if (isSubscriptionActive(existing)) {
    return NextResponse.json({ error: "Workspace already has an active subscription" }, { status: 400 });
  }

  // Get or create a Stripe customer for this workspace
  const workspace = await db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { name: true, members: { where: { role: "OWNER" }, include: { user: true }, take: 1 } },
  });
  const ownerEmail = workspace.members[0]?.user?.email ?? session.user.email ?? "";
  const ownerName = workspace.members[0]?.user?.name ?? session.user.name ?? "";

  let stripeCustomerId = existing?.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: `${workspace.name} (${ownerName})`,
      email: ownerEmail,
      metadata: { workspaceId },
    });
    stripeCustomerId = customer.id;
  }

  // Build line items
  const lineItems: { price: string; quantity: number }[] = [];

  if (plan === "INDIVIDUAL") {
    if (!PRICES.individualMonthly) throw new Error("STRIPE_PRICE_INDIVIDUAL_MONTHLY not set");
    lineItems.push({ price: PRICES.individualMonthly, quantity: 1 });
  } else if (plan === "ORG") {
    if (!PRICES.orgMonthly) throw new Error("STRIPE_PRICE_ORG_MONTHLY not set");
    lineItems.push({ price: PRICES.orgMonthly, quantity: 1 });
  } else if (plan === "ORG_PLUS_ALERTS") {
    if (!PRICES.orgMonthly || !PRICES.alertsAddonMonthly) {
      throw new Error("STRIPE_PRICE_ORG_MONTHLY or STRIPE_PRICE_ALERTS_ADDON_MONTHLY not set");
    }
    lineItems.push({ price: PRICES.orgMonthly, quantity: 1 });
    lineItems.push({ price: PRICES.alertsAddonMonthly, quantity: 1 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: lineItems,
    subscription_data: {
      trial_period_days: 14,
      metadata: { workspaceId, plan },
    },
    success_url: `${baseUrl}/settings/billing?checkout=success`,
    cancel_url: `${baseUrl}/settings/billing?checkout=canceled`,
    metadata: { workspaceId },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
