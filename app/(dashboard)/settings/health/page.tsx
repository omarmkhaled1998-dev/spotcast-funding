import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { db } from "@/lib/db";
import { HealthDashboardClient } from "./health-dashboard-client";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    redirect("/login");
  }

  const sources = await db.opportunitySource.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      url: true,
      strategy: true,
      isActive: true,
      healthStatus: true,
      healthCheckedAt: true,
      healthError: true,
      consecutiveFailures: true,
      lastScrapedAt: true,
      lastSuccessAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Last 5 ingest logs for activity context
  const recentLogs = await db.ingestLog.findMany({
    where: { workspaceId },
    orderBy: { startedAt: "desc" },
    take: 5,
    select: { status: true, startedAt: true, completedAt: true, imported: true, skipped: true, errors: true, source: true },
  });

  // Stuck job count
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const stuckJobs = await db.ingestLog.count({
    where: { workspaceId, status: "RUNNING", startedAt: { lt: thirtyMinutesAgo } },
  });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Source Health Monitor</h1>
      <p className="text-sm text-slate-500 mb-8">
        Checks run automatically every day at 6 AM. You can also trigger a manual check below.
        Every scenario is tested: connectivity, Cloudflare blocks, auth walls, site structure, and more.
      </p>
      <HealthDashboardClient
        sources={sources.map((s) => ({
          ...s,
          healthCheckedAt: s.healthCheckedAt?.toISOString() ?? null,
          lastScrapedAt: s.lastScrapedAt?.toISOString() ?? null,
          lastSuccessAt: s.lastSuccessAt?.toISOString() ?? null,
        }))}
        recentLogs={recentLogs.map((l) => ({
          status: l.status,
          startedAt: l.startedAt?.toISOString() ?? null,
          completedAt: l.completedAt?.toISOString() ?? null,
          imported: l.imported ?? 0,
          skipped: l.skipped ?? 0,
          source: l.source,
        }))}
        stuckJobs={stuckJobs}
      />
    </div>
  );
}
