"use client";
import { useState } from "react";
import { CheckCircle, AlertTriangle, CreditCard, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubscriptionStatus, PlanType } from "@/app/generated/prisma/client";

interface SubInfo {
  status: SubscriptionStatus;
  planType: PlanType;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string;
}

interface Props {
  subscription: SubInfo | null;
  active: boolean;
  onTrial: boolean;
  daysLeft: number | null;
}

const PLAN_DISPLAY: Record<PlanType, string> = {
  BASE: "Base Plan",
  BASE_PLUS_ALERTS: "Base + Alerts Plus",
};

const STATUS_DISPLAY: Record<SubscriptionStatus, string> = {
  TRIALING: "Free Trial",
  ACTIVE: "Active",
  PAST_DUE: "Past Due",
  CANCELED: "Canceled",
  UNPAID: "Unpaid",
  PAUSED: "Paused",
};

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const colors: Record<SubscriptionStatus, string> = {
    TRIALING: "bg-blue-50 text-blue-700 border-blue-200",
    ACTIVE: "bg-green-50 text-green-700 border-green-200",
    PAST_DUE: "bg-amber-50 text-amber-700 border-amber-200",
    CANCELED: "bg-slate-100 text-slate-600 border-slate-200",
    UNPAID: "bg-red-50 text-red-700 border-red-200",
    PAUSED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[status]}`}>
      {STATUS_DISPLAY[status]}
    </span>
  );
}

export function BillingClient({ subscription, active, onTrial, daysLeft }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(plan: "INDIVIDUAL" | "ORG" | "ORG_PLUS_ALERTS") {
    setLoading(plan);
    setError("");
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Failed to create checkout session.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Failed to open billing portal.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  // ── No subscription yet ──────────────────────────────────────────────────
  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">No active subscription</p>
              <p className="text-sm text-amber-700 mt-1">
                Choose a plan below to start your 14-day free trial. No credit card required.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {(["INDIVIDUAL", "ORG", "ORG_PLUS_ALERTS"] as const).map((plan) => {
            const info = {
              INDIVIDUAL: { name: "Individual", price: "$49", desc: "1 user · 3 sources · 20 AI/day" },
              ORG: { name: "Organization", price: "$199", desc: "5 users · 10 sources · 100 AI/day" },
              ORG_PLUS_ALERTS: { name: "Org + Alerts Plus", price: "$298", desc: "Everything + unlimited alerts" },
            }[plan];

            return (
              <div key={plan} className="rounded-xl border border-slate-200 p-6 flex flex-col gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{info.name}</p>
                  <p className="text-2xl font-bold mt-1">{info.price}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                  <p className="text-xs text-slate-500 mt-1">{info.desc}</p>
                </div>
                <Button
                  onClick={() => startCheckout(plan)}
                  isLoading={loading === plan}
                  variant={plan === "ORG" ? "primary" : "outline"}
                  size="sm"
                  className="w-full mt-auto"
                >
                  Start free trial
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Active / trial subscription ──────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Trial banner */}
      {onTrial && daysLeft !== null && (
        <div className={`rounded-xl border p-5 ${daysLeft <= 3 ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
          <div className="flex items-center gap-3">
            <Zap size={18} className={daysLeft <= 3 ? "text-amber-600" : "text-blue-600"} />
            <div>
              <p className={`font-semibold ${daysLeft <= 3 ? "text-amber-800" : "text-blue-800"}`}>
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your free trial
              </p>
              <p className={`text-sm mt-0.5 ${daysLeft <= 3 ? "text-amber-700" : "text-blue-700"}`}>
                Add a payment method to continue after your trial ends.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Canceled warning */}
      {subscription.status === "CANCELED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">
              Your subscription has been canceled. Your data is retained for 7 days after cancellation.
              Resubscribe below to restore full access.
            </p>
          </div>
        </div>
      )}

      {/* Past due warning */}
      {subscription.status === "PAST_DUE" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Your last payment failed. Please update your payment method to avoid service interruption.
            </p>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Current plan</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              {PLAN_DISPLAY[subscription.planType]}
            </p>
            {subscription.currentPeriodEnd && active && (
              <p className="text-sm text-slate-500 mt-1">
                {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </p>
            )}
          </div>
          <StatusBadge status={subscription.status} />
        </div>

        {active && (
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={openPortal}
              isLoading={loading === "portal"}
              className="flex items-center gap-1.5"
            >
              <CreditCard size={14} />
              Manage billing
              <ExternalLink size={12} className="text-slate-400" />
            </Button>
            {subscription.planType === "BASE" && !subscription.cancelAtPeriodEnd && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => startCheckout("ORG_PLUS_ALERTS")}
                isLoading={loading === "ORG_PLUS_ALERTS"}
              >
                Add Alerts Plus (+$99/mo)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Re-subscribe if canceled */}
      {subscription.status === "CANCELED" && (
        <div className="flex items-center gap-3">
          {(["INDIVIDUAL", "ORG"] as const).map((plan) => (
            <Button
              key={plan}
              variant={plan === "ORG" ? "primary" : "outline"}
              onClick={() => startCheckout(plan)}
              isLoading={loading === plan}
            >
              Restart {plan === "INDIVIDUAL" ? "Individual" : "Organization"} plan
            </Button>
          ))}
        </div>
      )}

      {/* Success indicator */}
      {active && !onTrial && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle size={14} />
          Your subscription is active. Thank you!
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
      )}
    </div>
  );
}
