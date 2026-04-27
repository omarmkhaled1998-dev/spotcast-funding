import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { db } from "@/lib/db";
import { AlertsSettingsClient } from "./alerts-settings-client";

export const dynamic = "force-dynamic";

export default async function AlertsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ unsubscribed?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { workspaceId, userId } = await getWorkspaceContext();

  const [alert, subscription] = await Promise.all([
    db.emailAlert.findFirst({
      where: { workspaceId, userId },
      include: {
        logs: { orderBy: { sentAt: "desc" }, take: 5 },
      },
    }),
    db.subscription.findUnique({
      where: { workspaceId },
      select: { planType: true, status: true },
    }),
  ]);

  const sp = await searchParams;
  const justUnsubscribed = sp?.unsubscribed === "1";

  const hasAlertsAddon =
    subscription?.planType === "BASE_PLUS_ALERTS" &&
    ["ACTIVE", "TRIALING"].includes(subscription?.status ?? "");

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Email alerts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Get notified when new high-match opportunities are found or deadlines approach.
        </p>
      </div>

      <AlertsSettingsClient
        existingAlert={
          alert
            ? {
                id: alert.id,
                isActive: alert.isActive,
                frequency: alert.frequency,
                minScore: alert.minScore,
                deadlineAlertDays: alert.deadlineAlertDays,
                emailAddress: alert.emailAddress,
                lastSentAt: alert.lastSentAt?.toISOString() ?? null,
                logs: alert.logs.map((l) => ({
                  id: l.id,
                  type: l.type,
                  subject: l.subject,
                  sentAt: l.sentAt.toISOString(),
                  opportunityCount: l.opportunityCount,
                })),
              }
            : null
        }
        hasAlertsAddon={hasAlertsAddon}
        userEmail={session.user.email ?? ""}
        justUnsubscribed={justUnsubscribed}
      />
    </div>
  );
}
