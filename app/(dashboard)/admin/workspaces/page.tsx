import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/workspace";
import Link from "next/link";
import { Building2, User, CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminWorkspacesPage() {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/dashboard");
  }

  const workspaces = await db.workspace.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        where: { role: "OWNER" },
        include: { user: { select: { name: true, email: true } } },
        take: 1,
      },
      subscription: {
        select: {
          status: true,
          planType: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          stripeCustomerId: true,
        },
      },
      _count: {
        select: { opportunities: true, applications: true, members: true },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Workspaces</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Users
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Workspace", "Owner", "Type", "Members", "Opps", "Subscription", "Created"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workspaces.map((ws) => {
              const owner = ws.members[0]?.user;
              const sub = ws.subscription;

              return (
                <tr key={ws.id} className="hover:bg-slate-50 transition-colors">
                  {/* Workspace name + slug */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50">
                        {ws.type === "ORG" ? (
                          <Building2 size={13} className="text-indigo-600" />
                        ) : (
                          <User size={13} className="text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{ws.name}</p>
                        <p className="text-xs text-slate-400">/{ws.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-4 py-3">
                    {owner ? (
                      <div>
                        <p className="text-slate-700">{owner.name}</p>
                        <p className="text-xs text-slate-400">{owner.email}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Workspace type */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      ws.type === "ORG"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-sky-50 text-sky-700"
                    }`}>
                      {ws.type === "ORG" ? "Organization" : "Individual"}
                    </span>
                  </td>

                  {/* Member / opp counts */}
                  <td className="px-4 py-3 text-slate-600">{ws._count.members}</td>
                  <td className="px-4 py-3 text-slate-600">{ws._count.opportunities}</td>

                  {/* Subscription */}
                  <td className="px-4 py-3">
                    <SubCell sub={sub} />
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(ws.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {workspaces.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            No workspaces yet.
          </div>
        )}
      </div>
    </div>
  );
}

function SubCell({
  sub,
}: {
  sub: {
    status: string;
    planType: string;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    stripeCustomerId: string;
  } | null;
}) {
  if (!sub) {
    return <span className="text-slate-400 text-xs">No subscription</span>;
  }

  const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    TRIALING: { icon: <Clock size={12} />, color: "text-blue-600" },
    ACTIVE: { icon: <CheckCircle size={12} />, color: "text-green-600" },
    PAST_DUE: { icon: <AlertTriangle size={12} />, color: "text-amber-600" },
    CANCELED: { icon: <XCircle size={12} />, color: "text-slate-400" },
    UNPAID: { icon: <AlertTriangle size={12} />, color: "text-red-600" },
    PAUSED: { icon: <Clock size={12} />, color: "text-slate-400" },
  };

  const cfg = statusConfig[sub.status] ?? statusConfig.CANCELED;
  const planDisplay = sub.planType === "BASE_PLUS_ALERTS" ? "Org+Alerts" : sub.planType;

  const renewDate = sub.currentPeriodEnd ?? sub.trialEndsAt;

  return (
    <div>
      <div className={`flex items-center gap-1 font-medium ${cfg.color}`}>
        {cfg.icon}
        <span className="text-xs">{sub.status}</span>
      </div>
      <p className="text-xs text-slate-400">{planDisplay}</p>
      {renewDate && (
        <p className="text-xs text-slate-400">
          {new Date(renewDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      )}
    </div>
  );
}
