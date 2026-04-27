/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events to keep the Subscription table in sync.
 * Events processed:
 *   - checkout.session.completed
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 *
 * Idempotency: each event is processed at most once (checked via AdminLog).
 * Stripe retries for 3 days on non-200 responses.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  upsertSubscription,
  findWorkspaceByStripeCustomer,
  findWorkspaceByStripeSubscription,
  inferPlanType,
} from "@/lib/subscription";
import { db } from "@/lib/db";
import type { SubscriptionStatus } from "@/app/generated/prisma/client";

// Raw body needed for Stripe signature verification
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check via AdminLog (reusing for event deduplication)
  const alreadyProcessed = await db.adminLog.findFirst({
    where: { action: `stripe_event:${event.id}` },
  });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, skipped: "duplicate" });
  }

  try {
    await handleEvent(event);

    // Record as processed
    await db.adminLog.create({
      data: {
        adminUserId: "system",
        action: `stripe_event:${event.id}`,
        targetType: event.type,
        targetId: event.id,
        metadata: JSON.stringify({ type: event.type }),
      },
    });
  } catch (err) {
    console.error(`[stripe/webhook] Error processing ${event.type}:`, err);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_succeeded":
      await handleInvoiceSucceeded(event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await handleInvoiceFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      // Unhandled event type — fine, just return
      break;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const workspaceId =
    session.metadata?.workspaceId ??
    (await findWorkspaceByStripeCustomer(session.customer as string));

  if (!workspaceId) {
    console.warn("[stripe/webhook] checkout.session.completed: no workspaceId found");
    return;
  }

  if (!session.subscription) return; // One-time payment (not our use case)

  const sub = await stripe.subscriptions.retrieve(session.subscription as string);
  await syncSubscription(workspaceId, sub);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
  const workspaceId =
    sub.metadata?.workspaceId ??
    (await findWorkspaceByStripeCustomer(sub.customer as string)) ??
    (await findWorkspaceByStripeSubscription(sub.id));

  if (!workspaceId) {
    console.warn(`[stripe/webhook] subscription.updated: no workspace for sub ${sub.id}`);
    return;
  }

  await syncSubscription(workspaceId, sub);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const workspaceId =
    (await findWorkspaceByStripeSubscription(sub.id)) ??
    sub.metadata?.workspaceId;

  if (!workspaceId) {
    console.warn(`[stripe/webhook] subscription.deleted: no workspace for sub ${sub.id}`);
    return;
  }

  await db.subscription.updateMany({
    where: { workspaceId, stripeSubscriptionId: sub.id },
    data: {
      status: "CANCELED",
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : new Date(),
      cancelAtPeriodEnd: false,
    },
  });
}

async function handleInvoiceSucceeded(invoice: Stripe.Invoice): Promise<void> {
  // In Stripe SDK v22 the subscription lives on invoice.parent.subscription_details.subscription
  const subRef = (invoice.parent as Stripe.Invoice.Parent | null)?.subscription_details?.subscription;
  if (!subRef) return;

  const subId = typeof subRef === "string" ? subRef : subRef.id;
  const workspaceId = await findWorkspaceByStripeSubscription(subId);
  if (!workspaceId) return;

  const periodEnd = invoice.lines.data[0]?.period?.end;
  if (periodEnd) {
    await db.subscription.updateMany({
      where: { workspaceId },
      data: {
        status: "ACTIVE",
        currentPeriodEnd: new Date(periodEnd * 1000),
      },
    });
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  const subRef = (invoice.parent as Stripe.Invoice.Parent | null)?.subscription_details?.subscription;
  if (!subRef) return;

  const subId = typeof subRef === "string" ? subRef : subRef.id;
  const workspaceId = await findWorkspaceByStripeSubscription(subId);
  if (!workspaceId) return;

  await db.subscription.updateMany({
    where: { workspaceId },
    data: { status: "PAST_DUE" },
  });

  // TODO: send dunning email via Resend (Phase 3)
  console.warn(`[stripe/webhook] Payment failed for workspace ${workspaceId}`);
}

// ── Sync helper ───────────────────────────────────────────────────────────────

async function syncSubscription(
  workspaceId: string,
  sub: Stripe.Subscription
): Promise<void> {
  const stripeStatus = sub.status; // active | trialing | past_due | canceled | unpaid | paused
  const statusMap: Record<string, SubscriptionStatus> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    paused: "PAUSED",
    incomplete: "PAST_DUE",
    incomplete_expired: "CANCELED",
  };
  const status: SubscriptionStatus = statusMap[stripeStatus] ?? "CANCELED";

  const priceIds = sub.items.data.map((item) => item.price.id);
  const planType = inferPlanType(priceIds);

  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
  const periodEnd =
    sub.items.data[0]?.current_period_end
      ? new Date(sub.items.data[0].current_period_end * 1000)
      : null;

  await upsertSubscription({
    workspaceId,
    stripeCustomerId: sub.customer as string,
    stripeSubscriptionId: sub.id,
    status,
    planType,
    trialEndsAt: trialEnd,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
  });
}
