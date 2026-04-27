import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { getSubscription, isSubscriptionActive, isOnTrial, trialDaysRemaining } from "@/lib/subscription";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    redirect("/login");
  }

  const sub = await getSubscription(workspaceId);
  const active = isSubscriptionActive(sub);
  const onTrial = isOnTrial(sub);
  const daysLeft = trialDaysRemaining(sub);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Billing & Subscription</h1>
      <p className="text-sm text-slate-500 mb-8">
        Manage your subscription, view usage, and update payment details.
      </p>

      <BillingClient
        subscription={sub
          ? {
              status: sub.status,
              planType: sub.planType,
              trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
              currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
              stripeCustomerId: sub.stripeCustomerId,
            }
          : null}
        active={active}
        onTrial={onTrial}
        daysLeft={daysLeft}
      />
    </div>
  );
}
