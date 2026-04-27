/**
 * Subscription helpers — read/write workspace billing state.
 *
 * All subscription state is sourced from the Subscription table, which is
 * kept in sync by Stripe webhooks (app/api/webhooks/stripe/route.ts).
 */

import { db } from "@/lib/db";
import type { Subscription, SubscriptionStatus, PlanType } from "@/app/generated/prisma/client";

export type { Subscription, SubscriptionStatus, PlanType };

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function getSubscription(workspaceId: string): Promise<Subscription | null> {
  return db.subscription.findUnique({ where: { workspaceId } });
}

// ── Access checks ─────────────────────────────────────────────────────────────

/** Returns true if the workspace has active/trialing subscription (or is in grace period). */
export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  return ["TRIALING", "ACTIVE", "PAST_DUE"].includes(sub.status);
}

/** Returns true during the 7-day post-expiry grace period. */
export function isInGracePeriod(sub: Subscription | null): boolean {
  if (!sub || sub.status !== "CANCELED") return false;
  if (!sub.canceledAt) return false;
  const graceDays = 7;
  const graceEnd = new Date(sub.canceledAt.getTime() + graceDays * 24 * 60 * 60 * 1000);
  return new Date() < graceEnd;
}

/** Returns true if the workspace can access gated features.
 *  null = no Subscription row yet (pre-Stripe, open trial) → allow access. */
export function canAccessDashboard(sub: Subscription | null): boolean {
  if (!sub) return true; // No subscription row = pre-Stripe trial, allow access
  return isSubscriptionActive(sub) || isInGracePeriod(sub);
}

/** Returns true if alerts add-on is active. */
export function hasAlertsAddon(sub: Subscription | null): boolean {
  if (!sub) return false;
  return (
    sub.planType === "BASE_PLUS_ALERTS" &&
    isSubscriptionActive(sub)
  );
}

// ── Trial state ───────────────────────────────────────────────────────────────

export function isOnTrial(sub: Subscription | null): boolean {
  return sub?.status === "TRIALING";
}

export function trialDaysRemaining(sub: Subscription | null): number | null {
  if (!sub?.trialEndsAt || sub.status !== "TRIALING") return null;
  const ms = sub.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// ── Create / upsert from Stripe data ─────────────────────────────────────────

export interface StripeSubData {
  workspaceId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  planType: PlanType;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date | null;
}

export async function upsertSubscription(data: StripeSubData): Promise<Subscription> {
  return db.subscription.upsert({
    where: { workspaceId: data.workspaceId },
    create: data,
    update: {
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status,
      planType: data.planType,
      trialEndsAt: data.trialEndsAt,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      canceledAt: data.canceledAt,
    },
  });
}

/** Find workspace by Stripe subscription ID (used in webhook handler). */
export async function findWorkspaceByStripeSubscription(
  stripeSubscriptionId: string
): Promise<string | null> {
  const sub = await db.subscription.findFirst({
    where: { stripeSubscriptionId },
    select: { workspaceId: true },
  });
  return sub?.workspaceId ?? null;
}

/** Find workspace by Stripe customer ID (used in webhook handler). */
export async function findWorkspaceByStripeCustomer(
  stripeCustomerId: string
): Promise<string | null> {
  const sub = await db.subscription.findFirst({
    where: { stripeCustomerId },
    select: { workspaceId: true },
  });
  return sub?.workspaceId ?? null;
}

// ── Plan type inference from Stripe items ────────────────────────────────────

import { PRICES } from "@/lib/stripe";

export function inferPlanType(priceIds: string[]): PlanType {
  const hasAlerts = priceIds.includes(PRICES.alertsAddonMonthly);
  return hasAlerts ? "BASE_PLUS_ALERTS" : "BASE";
}
