import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { db } from "@/lib/db";
import { MembersSettingsClient } from "./members-settings-client";

export const dynamic = "force-dynamic";

export default async function MembersSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { workspaceId, role } = await getWorkspaceContext();

  const [workspace, members, subscription] = await Promise.all([
    db.workspace.findUnique({ where: { id: workspaceId }, select: { name: true, type: true } }),
    db.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { invitedAt: "asc" },
    }),
    db.subscription.findUnique({
      where: { workspaceId },
      select: { planType: true, status: true },
    }),
  ]);

  const canManage = role === "OWNER" || role === "ADMIN";

  // Plan member limit
  const limits: Record<string, number> = {
    INDIVIDUAL: 1,
    BASE: 5,
    BASE_PLUS_ALERTS: 5,
    DEFAULT: 1,
  };
  const planType = subscription?.planType ?? "DEFAULT";
  const memberLimit = limits[planType] ?? 1;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Team members</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage who has access to <strong>{workspace?.name}</strong>.
        </p>
      </div>

      <MembersSettingsClient
        members={members.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.user.name ?? m.user.email,
          email: m.user.email,
          role: m.role,
          acceptedAt: m.acceptedAt?.toISOString() ?? null,
          invitedAt: m.invitedAt.toISOString(),
        }))}
        currentUserId={session.user.id}
        canManage={canManage}
        memberLimit={memberLimit}
        planType={planType}
      />
    </div>
  );
}
