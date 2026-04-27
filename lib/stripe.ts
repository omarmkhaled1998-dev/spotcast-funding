/**
 * Stripe client singleton.
 *
 * Usage:  import { stripe } from "@/lib/stripe"
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY     — sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET — whsec_...
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pk_...
 *
 * Price IDs (set in .env):
 *   STRIPE_PRICE_INDIVIDUAL_MONTHLY   — $49/month
 *   STRIPE_PRICE_ORG_MONTHLY          — $199/month
 *   STRIPE_PRICE_ALERTS_ADDON_MONTHLY — $99/month add-on
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set. Stripe calls will fail. " +
    "Set it in .env before enabling billing."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

// ── Price IDs ────────────────────────────────────────────────────────────────

export const PRICES = {
  individualMonthly: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY ?? "",
  orgMonthly: process.env.STRIPE_PRICE_ORG_MONTHLY ?? "",
  alertsAddonMonthly: process.env.STRIPE_PRICE_ALERTS_ADDON_MONTHLY ?? "",
} as const;

// ── Plan metadata ─────────────────────────────────────────────────────────────

export type PlanKey = "INDIVIDUAL" | "ORG" | "ORG_PLUS_ALERTS";

export const PLAN_DETAILS: Record<
  PlanKey,
  { name: string; price: number; description: string }
> = {
  INDIVIDUAL: {
    name: "Individual",
    price: 49,
    description: "For freelancers, journalists, and researchers",
  },
  ORG: {
    name: "Organization",
    price: 199,
    description: "For NGOs, media organizations, and foundations",
  },
  ORG_PLUS_ALERTS: {
    name: "Organization + Alerts Plus",
    price: 298,
    description: "Organization plan with advanced email alert controls",
  },
};
